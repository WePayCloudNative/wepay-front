import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import Aviso from '../../components/Aviso';
import BadgeEstado from '../../components/BadgeEstado';
import EstadoCarga from '../../components/EstadoCarga';
import {
  ETIQUETA_ESTADO,
  limitesEspera,
  pedidosAtascados,
  tiempoEsperando,
  type EstadoPedido,
  type Pedido,
} from '../../domain/pedidos';
import { usePedidos } from '../../pedidos/usePedidos';
import { acortar, aFecha, formatearFecha, formatearPesos } from '../../utils/formato';

const EN_CURSO: EstadoPedido[] = ['ACEPTADO', 'EN_PREPARACION', 'DESPACHADO'];

function esDeHoy(pedido: Pedido): boolean {
  const fecha = aFecha(pedido.fechaRegistro);
  return fecha.toDateString() === new Date().toDateString();
}

/** Lo que el equipo necesita saber al entrar: qué está esperando acción y cómo va el día. */
export default function Resumen() {
  const { pedidos, error } = usePedidos({ cadaMs: 15_000 });

  useEffect(() => {
    document.title = 'WePay | Resumen';
  }, []);

  if (error && !pedidos) {
    return <Aviso tipo="error">{error}</Aviso>;
  }
  if (!pedidos) {
    return <EstadoCarga texto="Cargando resumen..." />;
  }

  const limites = limitesEspera();
  const atascados = pedidosAtascados(pedidos, (p) => aFecha(p.fechaRegistro), new Date(), limites);
  const porAceptar = pedidos.filter((p) => p.estado === 'CREADO');
  const enCurso = pedidos.filter((p) => EN_CURSO.includes(p.estado));
  const hoy = pedidos.filter(esDeHoy);
  const ventasHoy = hoy
    .filter((p) => p.estado !== 'CREADO' && p.estado !== 'CANCELADO')
    .reduce((suma, p) => suma + p.total, 0);

  return (
    <div className="pila">
      <header className="admin-encabezado">
        <div>
          <h1>Resumen</h1>
          <p className="texto-suave">Calculado con los pedidos actuales. Se actualiza cada 15 segundos.</p>
        </div>
        <Link className="boton boton--primario" to="/admin/pedidos?estado=CREADO">
          Revisar pagos pendientes
        </Link>
      </header>

      {atascados.length > 0 ? (
        <section className="panel atencion" aria-labelledby="titulo-atencion">
          <div className="panel__cabecera">
            <h2 id="titulo-atencion">
              {atascados.length === 1
                ? '1 pedido necesita atención'
                : `${atascados.length} pedidos necesitan atención`}
            </h2>
            <p className="texto-suave">
              Desde la compra: confirmar pago en {tiempoEsperando(limites.CREADO ?? 1)}, preparar en 2 h,
              despachar en 24 h
            </p>
          </div>
          <ul className="atencion__lista">
            {atascados.slice(0, 5).map(({ pedido, minutos }) => (
              <li key={pedido.id}>
                <Link to={`/admin/pedidos?pedido=${pedido.id}`}>#{pedido.id}</Link>
                <span>
                  Sigue en {ETIQUETA_ESTADO[pedido.estado]}, comprado hace {tiempoEsperando(minutos)}
                </span>
                <span className="texto-suave">{formatearPesos(pedido.total)}</span>
              </li>
            ))}
          </ul>
          {atascados.length > 5 ? (
            <p className="nota">Y {atascados.length - 5} más. Revisa la lista de pedidos.</p>
          ) : null}
        </section>
      ) : null}

      <div className="indicadores">
        <div className="indicador indicador--alerta">
          <p className="indicador__nombre">Pagos por confirmar</p>
          <p className="indicador__valor">{porAceptar.length}</p>
          <p className="indicador__nota">Pedidos en estado Creado</p>
        </div>
        <div className="indicador">
          <p className="indicador__nombre">En curso</p>
          <p className="indicador__valor">{enCurso.length}</p>
          <p className="indicador__nota">Aceptados, en preparación o despachados</p>
        </div>
        <div className="indicador">
          <p className="indicador__nombre">Pedidos de hoy</p>
          <p className="indicador__valor">{hoy.length}</p>
          <p className="indicador__nota">{pedidos.length} en total</p>
        </div>
        <div className="indicador">
          <p className="indicador__nombre">Ventas confirmadas hoy</p>
          <p className="indicador__valor">{formatearPesos(ventasHoy)}</p>
          <p className="indicador__nota">Sin contar creados ni cancelados</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel__cabecera">
          <h2>Últimos pedidos</h2>
          <Link className="enlace-subrayado" to="/admin/pedidos">
            Ver todos
          </Link>
        </div>
        {pedidos.length === 0 ? (
          <p className="vacio">Aún no hay pedidos.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th className="num">Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/admin/pedidos?pedido=${p.id}`}>#{p.id}</Link>
                    </td>
                    <td className="mono" title={p.usuarioOid}>
                      {acortar(p.usuarioOid)}
                    </td>
                    <td>{formatearFecha(p.fechaRegistro)}</td>
                    <td className="num">{formatearPesos(p.total)}</td>
                    <td>
                      <BadgeEstado estado={p.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
