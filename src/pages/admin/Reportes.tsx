import { useEffect, useState } from 'react';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useCatalogo } from '../../catalogo/useCatalogo';
import Aviso from '../../components/Aviso';
import EstadoCarga from '../../components/EstadoCarga';
import ImagenProducto from '../../components/ImagenProducto';
import { ETIQUETA_ESTADO, TODOS_LOS_ESTADOS, type EstadoPedido } from '../../domain/pedidos';
import {
  completarHoras,
  formatearMinutos,
  proporcion,
  type BarraHora,
  type ResumenReportes,
} from '../../domain/reportes';
import { formatearPesos } from '../../utils/formato';

const hora = (fecha: Date) =>
  fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/**
 * Indicadores que calcula ms-reportes a partir de los eventos de Kafka.
 * Ventas, tiempo de entrega y más vendidos cuentan solo pedidos entregados.
 */
export default function Reportes() {
  const api = useApi();
  const { productos } = useCatalogo();
  const [datos, setDatos] = useState<ResumenReportes | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [actualizado, setActualizado] = useState<Date | null>(null);

  useEffect(() => {
    document.title = 'WePay | Reportes';
  }, []);

  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    let activo = true;
    api
      .obtenerReportes()
      .then((resumen) => {
        if (activo) {
          setDatos(resumen);
          setActualizado(new Date());
          setError('');
        }
      })
      .catch((e: unknown) => activo && setError(mensajeDe(e)))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [api, recarga]);

  function actualizar() {
    setCargando(true);
    setRecarga((n) => n + 1);
  }

  if (error && !datos) {
    return (
      <div className="pila">
        <h1>Reportes</h1>
        <Aviso tipo="error">
          {error}{' '}
          <button className="enlace-sutil" onClick={actualizar}>
            Reintentar
          </button>
        </Aviso>
      </div>
    );
  }
  if (!datos) {
    return <EstadoCarga texto="Calculando reportes..." />;
  }

  const { kpis, topProductos } = datos;
  const horas = completarHoras(datos.ventasPorHora);
  const imagenDe = (id: number) => productos?.find((p) => p.id === id)?.imagenUrl ?? null;

  return (
    <div className="pila">
      <header className="admin-encabezado">
        <div>
          <h1>Reportes</h1>
          <p className="texto-suave">
            Últimas 24 horas
            {actualizado
              ? `, actualizado a las ${actualizado.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </p>
        </div>
        <button className="boton boton--secundario" disabled={cargando} onClick={actualizar}>
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>
      </header>

      <div className="indicadores indicadores--cinco">
        <div className="indicador indicador--alerta">
          <p className="indicador__nombre">Ventas entregadas</p>
          <p className="indicador__valor">{formatearPesos(kpis.ventasTotales)}</p>
          <p className="indicador__nota">Solo pedidos que llegaron al cliente</p>
        </div>
        <div className="indicador">
          <p className="indicador__nombre">Pedidos</p>
          <p className="indicador__valor">{kpis.totalPedidos}</p>
          <p className="indicador__nota">Creados en las últimas 24 horas</p>
        </div>
        <div className="indicador">
          <p className="indicador__nombre">Activos</p>
          <p className="indicador__valor">{kpis.pedidosActivos}</p>
          <p className="indicador__nota">Ni entregados ni cancelados</p>
        </div>
        <div className="indicador">
          <p className="indicador__nombre">Entregados</p>
          <p className="indicador__valor">{kpis.pedidosEntregados}</p>
          <p className="indicador__nota">
            {kpis.totalPedidos > 0
              ? `${Math.round((kpis.pedidosEntregados / kpis.totalPedidos) * 100)}% del total`
              : 'Sin pedidos aún'}
          </p>
        </div>
        <div className="indicador">
          <p className="indicador__nombre">Tiempo de entrega</p>
          <p className="indicador__valor">{formatearMinutos(kpis.leadTimePromedioMinutos)}</p>
          <p className="indicador__nota">Promedio desde la compra</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel__cabecera">
          <h2>Ventas por hora</h2>
          <p className="texto-suave">Pedidos entregados, en tu hora local</p>
        </div>
        <GraficoHoras barras={horas} />
      </section>

      <div className="reportes__grilla">
        <section className="panel">
          <h2>Pedidos por estado</h2>
          <EstadosEnBarras porEstado={kpis.pedidosPorEstado} total={kpis.totalPedidos} />
        </section>

        <section className="panel">
          <div className="panel__cabecera">
            <h2>Más vendidos</h2>
            <p className="texto-suave">Últimos 7 días</p>
          </div>
          {topProductos.length === 0 ? (
            <p className="vacio">Aún no hay pedidos entregados en los últimos 7 días.</p>
          ) : (
            <ol className="ranking">
              {topProductos.slice(0, 5).map((p) => (
                <li key={p.productoId} className="ranking__fila">
                  <ImagenProducto src={imagenDe(p.productoId)} nombre={p.nombreProducto} tamano="mini" />
                  <div className="ranking__datos">
                    <p className="ranking__nombre">{p.nombreProducto}</p>
                    <span
                      className="barra"
                      style={{ width: `${proporcion(p.cantidadVendida, topProductos[0].cantidadVendida)}%` }}
                    />
                  </div>
                  <div className="ranking__cifras">
                    <p>{p.cantidadVendida} u.</p>
                    <p className="texto-suave">{formatearPesos(p.ingresosTotales)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

/** Columnas de 24 horas. Cada columna tiene su valor en el tooltip y en la tabla oculta. */
function GraficoHoras({ barras }: { barras: BarraHora[] }) {
  const maximo = Math.max(...barras.map((b) => b.ventas));
  const conVentas = barras.filter((b) => b.ventas > 0);

  if (conVentas.length === 0) {
    return <p className="vacio">No hubo entregas en las últimas 24 horas.</p>;
  }

  return (
    <>
      <div className="grafico-horas" aria-hidden="true">
        {barras.map((b, i) => (
          <div
            key={b.inicio.getTime()}
            className="grafico-horas__columna"
            title={`${hora(b.inicio)}: ${formatearPesos(b.ventas)} (${b.pedidos} pedidos)`}
          >
            <span className="grafico-horas__valor">{b.ventas === maximo ? formatearPesos(b.ventas) : ''}</span>
            <span className="grafico-horas__barra" style={{ height: `${proporcion(b.ventas, maximo)}%` }} />
            <span className={`grafico-horas__hora ${i % 6 === 0 ? '' : 'grafico-horas__hora--secundaria'}`}>
              {i % 3 === 0 ? hora(b.inicio) : ''}
            </span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Ventas entregadas por hora</caption>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Pedidos</th>
            <th>Ventas</th>
          </tr>
        </thead>
        <tbody>
          {conVentas.map((b) => (
            <tr key={b.inicio.getTime()}>
              <td>{hora(b.inicio)}</td>
              <td>{b.pedidos}</td>
              <td>{formatearPesos(b.ventas)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function EstadosEnBarras({ porEstado, total }: { porEstado: Record<string, number>; total: number }) {
  if (total === 0) {
    return <p className="vacio">Sin pedidos en las últimas 24 horas.</p>;
  }
  const maximo = Math.max(...Object.values(porEstado));
  return (
    <dl className="barras-estado">
      {TODOS_LOS_ESTADOS.map((estado: EstadoPedido) => {
        const cantidad = porEstado[estado] ?? 0;
        return (
          <div key={estado} className="barras-estado__fila">
            <dt>{ETIQUETA_ESTADO[estado]}</dt>
            <dd>
              <span className="barra" style={{ width: `${proporcion(cantidad, maximo)}%` }} />
              <span className="barras-estado__cifra">{cantidad}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
