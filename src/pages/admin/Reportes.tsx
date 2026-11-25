import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useCatalogo } from '../../catalogo/useCatalogo';
import Aviso from '../../components/Aviso';
import EstadoCarga from '../../components/EstadoCarga';
import ImagenProducto from '../../components/ImagenProducto';
import { ETIQUETA_ESTADO, TODOS_LOS_ESTADOS } from '../../domain/pedidos';
import {
  formatearMinutos,
  pasoEtiquetas,
  PERIODOS_REPORTE,
  proporcion,
  rangoReporte,
  variacion,
  type PeriodoReporte,
  type ResumenReportes,
  type VentasPorTramo,
} from '../../domain/reportes';
import { aFecha, formatearPesos } from '../../utils/formato';

/**
 * Indicadores que calcula ms-reportes a partir de los eventos de Kafka.
 * La venta se cuenta cuando se confirma el pago (no al entregar).
 */
export default function Reportes() {
  const api = useApi();
  const { productos } = useCatalogo();
  const [parametros, setParametros] = useSearchParams();
  const periodo = (parametros.get('periodo') as PeriodoReporte | null) ?? 'hoy';
  const infoPeriodo = PERIODOS_REPORTE.find((p) => p.id === periodo) ?? PERIODOS_REPORTE[0];

  const [datos, setDatos] = useState<ResumenReportes | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    document.title = 'WePay | Reportes';
  }, []);

  useEffect(() => {
    let activo = true;
    const { desde, hasta } = rangoReporte(infoPeriodo.id);
    api
      .obtenerReportes(desde, hasta)
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
  }, [api, infoPeriodo.id, recarga]);

  function actualizar() {
    setCargando(true);
    setRecarga((n) => n + 1);
  }

  function elegir(id: PeriodoReporte) {
    setCargando(true);
    setParametros(id === 'hoy' ? {} : { periodo: id }, { replace: true });
  }

  const imagenDe = (id: number) => productos?.find((p) => p.id === id)?.imagenUrl ?? null;

  return (
    <div className="pila">
      <header className="admin-encabezado">
        <div>
          <h1>Reportes</h1>
          <p className="texto-suave">
            {actualizado
              ? `Actualizado a las ${actualizado.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`
              : 'Cargando...'}
          </p>
        </div>
        <button className="boton boton--secundario" disabled={cargando} onClick={actualizar}>
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>
      </header>

      <div className="chips" role="group" aria-label="Período">
        {PERIODOS_REPORTE.map((p) => (
          <button
            key={p.id}
            className={`chip ${periodo === p.id ? 'chip--activo' : ''}`}
            aria-pressed={periodo === p.id}
            onClick={() => elegir(p.id)}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {error ? (
        <Aviso tipo="error">
          {error}{' '}
          <button className="enlace-sutil" onClick={actualizar}>
            Reintentar
          </button>
        </Aviso>
      ) : null}
      {!datos && !error ? <EstadoCarga texto="Calculando reportes..." /> : null}

      {datos ? (
        <div className={`pila ${cargando ? 'cargando-suave' : ''}`}>
          <Indicadores datos={datos} comparacion={infoPeriodo.comparacion} />

          <section className="panel">
            <div className="panel__cabecera">
              <h2>{datos.agrupacion === 'hora' ? 'Ventas por hora' : 'Ventas por día'}</h2>
              <p className="texto-suave">Pagos confirmados, en hora de Chile</p>
            </div>
            <GraficoVentas tramos={datos.ventasPorTramo} agrupacion={datos.agrupacion} />
          </section>

          <div className="reportes__grilla">
            <section className="panel">
              <h2>Pedidos por estado</h2>
              <EstadosEnBarras porEstado={datos.pedidosPorEstado} total={datos.actual.totalPedidos} />
            </section>

            <section className="panel">
              <h2>Más vendidos</h2>
              {datos.topProductos.length === 0 ? (
                <p className="vacio">Aún no hay ventas confirmadas en este período.</p>
              ) : (
                <ol className="ranking">
                  {datos.topProductos.map((p) => (
                    <li key={p.productoId} className="ranking__fila">
                      <ImagenProducto src={imagenDe(p.productoId)} nombre={p.nombreProducto} tamano="mini" />
                      <div className="ranking__datos">
                        <p className="ranking__nombre">{p.nombreProducto}</p>
                        <span
                          className="barra"
                          style={{ width: `${proporcion(p.cantidadVendida, datos.topProductos[0].cantidadVendida)}%` }}
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
      ) : null}
    </div>
  );
}

/** "18% más que ayer a esta hora" / "sin datos para comparar" */
function Comparacion({ actual, anterior, texto }: { actual: number; anterior: number; texto: string }) {
  const cambio = variacion(actual, anterior);
  if (cambio === null) {
    return <p className="indicador__nota">Sin datos previos para comparar</p>;
  }
  if (cambio === 0) {
    return <p className="indicador__nota">Igual {texto}</p>;
  }
  return (
    <p className="indicador__nota">
      <span className={cambio > 0 ? 'cambio cambio--sube' : 'cambio cambio--baja'}>
        {cambio > 0 ? '↑' : '↓'} {Math.abs(cambio)}%
      </span>{' '}
      {cambio > 0 ? 'más' : 'menos'} {texto}
    </p>
  );
}

function Indicadores({ datos, comparacion }: { datos: ResumenReportes; comparacion: string }) {
  const { actual, anterior } = datos;
  return (
    <div className="indicadores indicadores--cinco">
      <div className="indicador indicador--alerta">
        <p className="indicador__nombre">Ventas confirmadas</p>
        <p className="indicador__valor">{formatearPesos(actual.ventasConfirmadas)}</p>
        <Comparacion actual={actual.ventasConfirmadas} anterior={anterior.ventasConfirmadas} texto={comparacion} />
      </div>
      <div className="indicador">
        <p className="indicador__nombre">Pedidos</p>
        <p className="indicador__valor">{actual.totalPedidos}</p>
        <Comparacion actual={actual.totalPedidos} anterior={anterior.totalPedidos} texto={comparacion} />
      </div>
      <div className="indicador">
        <p className="indicador__nombre">Ticket promedio</p>
        <p className="indicador__valor">{actual.ticketPromedio > 0 ? formatearPesos(actual.ticketPromedio) : '—'}</p>
        <p className="indicador__nota">
          Ya entregado: {formatearPesos(actual.ventasEntregadas)}
        </p>
      </div>
      <div className="indicador">
        <p className="indicador__nombre">Cancelaciones</p>
        <p className="indicador__valor">{actual.tasaCancelacion.toLocaleString('es-CL')}%</p>
        <p className="indicador__nota">
          {actual.pedidosCancelados === 0
            ? 'Ningún pedido cancelado'
            : `${actual.pedidosCancelados} ${actual.pedidosCancelados === 1 ? 'pedido' : 'pedidos'}, ${formatearPesos(actual.montoCancelado)}`}
        </p>
      </div>
      <div className="indicador">
        <p className="indicador__nombre">Tiempo de entrega</p>
        <p className="indicador__valor">{formatearMinutos(actual.leadTimePromedioMinutos)}</p>
        <p className="indicador__nota">Promedio desde la compra</p>
      </div>
    </div>
  );
}

function etiquetaTramo(inicio: string, agrupacion: 'hora' | 'dia'): string {
  const fecha = aFecha(inicio);
  return agrupacion === 'hora'
    ? fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    : fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

/** Columnas por hora o día. Valor exacto en el tooltip y en la tabla para lectores de pantalla. */
function GraficoVentas({ tramos, agrupacion }: { tramos: VentasPorTramo[]; agrupacion: 'hora' | 'dia' }) {
  const maximo = Math.max(0, ...tramos.map((t) => t.ventas));
  const paso = pasoEtiquetas(tramos.length);

  if (maximo === 0) {
    return <p className="vacio">Sin ventas confirmadas en este período.</p>;
  }

  return (
    <>
      <div
        className="grafico-horas"
        style={{ gridTemplateColumns: `repeat(${tramos.length}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {tramos.map((t, i) => {
          const etiqueta = etiquetaTramo(t.inicio, agrupacion);
          return (
            <div
              key={t.inicio}
              className="grafico-horas__columna"
              title={`${etiqueta}: ${formatearPesos(t.ventas)} (${t.pedidos} ${t.pedidos === 1 ? 'pedido' : 'pedidos'})`}
            >
              <span className="grafico-horas__valor">{t.ventas === maximo ? formatearPesos(t.ventas) : ''}</span>
              <span className="grafico-horas__barra" style={{ height: `${proporcion(t.ventas, maximo)}%` }} />
              <span
                className={`grafico-horas__hora ${i % (paso * 2) === 0 ? '' : 'grafico-horas__hora--secundaria'}`}
              >
                {i % paso === 0 ? etiqueta : ''}
              </span>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>Ventas confirmadas por {agrupacion === 'hora' ? 'hora' : 'día'}</caption>
        <thead>
          <tr>
            <th>{agrupacion === 'hora' ? 'Hora' : 'Día'}</th>
            <th>Pedidos</th>
            <th>Ventas</th>
          </tr>
        </thead>
        <tbody>
          {tramos
            .filter((t) => t.ventas > 0)
            .map((t) => (
              <tr key={t.inicio}>
                <td>{etiquetaTramo(t.inicio, agrupacion)}</td>
                <td>{t.pedidos}</td>
                <td>{formatearPesos(t.ventas)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}

function EstadosEnBarras({ porEstado, total }: { porEstado: Record<string, number>; total: number }) {
  if (total === 0) {
    return <p className="vacio">Sin pedidos en este período.</p>;
  }
  const maximo = Math.max(...Object.values(porEstado));
  return (
    <dl className="barras-estado">
      {TODOS_LOS_ESTADOS.map((estado) => {
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
