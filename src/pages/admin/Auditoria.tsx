import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi, type FiltrosAuditoria } from '../../api/useApi';
import Aviso from '../../components/Aviso';
import BadgeEstado from '../../components/BadgeEstado';
import EstadoCarga from '../../components/EstadoCarga';
import Icono from '../../components/Icono';
import {
  estadoDeEvento,
  payloadLegible,
  PERIODOS,
  rangoDe,
  ROL_ACTOR,
  TIPOS_EVENTO,
  type EventoAuditoria,
  type Periodo,
} from '../../domain/auditoria';
import { ETIQUETA_ESTADO, type EstadoPedido } from '../../domain/pedidos';
import { acortar, formatearFecha } from '../../utils/formato';

const POR_PAGINA = 15;

/**
 * Bitácora de ms-auditoria: cada evento que ms-pedidos publicó en Kafka (orders.events).
 * Los filtros viven en la URL para poder compartir o recargar la misma vista.
 */
export default function Auditoria() {
  const api = useApi();
  const [parametros, setParametros] = useSearchParams();

  const pedidoTexto = parametros.get('pedido') ?? '';
  const tipo = parametros.get('tipo') ?? '';
  const periodo = (parametros.get('periodo') as Periodo | null) ?? '7d';

  const [eventos, setEventos] = useState<EventoAuditoria[] | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState(pedidoTexto);

  useEffect(() => {
    document.title = 'WePay | Auditoría';
  }, []);

  const pedidoId = /^\d+$/.test(pedidoTexto) ? Number(pedidoTexto) : undefined;

  // Cada vez que cambian los filtros (o se pide actualizar) se consulta de nuevo
  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    let activo = true;
    // Con un pedido elegido se muestra su historia completa, sin recortar por fecha
    const rango = pedidoId === undefined ? rangoDe(periodo) : null;
    const filtros: FiltrosAuditoria = { pedidoId, tipoEvento: tipo || undefined, ...(rango ?? {}) };
    api
      .obtenerAuditoria(filtros)
      .then((lista) => {
        if (activo) {
          setEventos(lista);
          setError('');
        }
      })
      .catch((e: unknown) => activo && setError(mensajeDe(e)))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [api, pedidoId, tipo, periodo, recarga]);

  function actualizar() {
    setCargando(true);
    setRecarga((n) => n + 1);
  }

  function cambiar(clave: string, valor: string | null) {
    const siguientes = new URLSearchParams(parametros);
    if (valor) siguientes.set(clave, valor);
    else siguientes.delete(clave);
    setParametros(siguientes, { replace: true });
    setPagina(1);
    setAbierto(null);
  }

  const lista = useMemo(() => eventos ?? [], [eventos]);
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = lista.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  return (
    <div className="pila">
      <header className="admin-encabezado">
        <div>
          <h1>Auditoría</h1>
          <p className="texto-suave">
            Cada cambio de un pedido, tal como lo registró ms-auditoria desde Kafka.
          </p>
        </div>
        <button className="boton boton--secundario" disabled={cargando} onClick={actualizar}>
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>
      </header>

      <div className="herramientas">
        <form
          className="buscador buscador--caja"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            cambiar('pedido', busqueda.trim().replace(/^#/, '') || null);
          }}
        >
          <Icono nombre="buscar" tamano={16} />
          <label className="sr-only" htmlFor="buscar-pedido">
            Número de pedido
          </label>
          <input
            id="buscar-pedido"
            type="search"
            inputMode="numeric"
            placeholder="Número de pedido y Enter"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              if (e.target.value === '') cambiar('pedido', null);
            }}
          />
        </form>

        {pedidoId === undefined ? (
          <div className="chips" role="group" aria-label="Período">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                className={`chip ${periodo === p.id ? 'chip--activo' : ''}`}
                aria-pressed={periodo === p.id}
                onClick={() => cambiar('periodo', p.id === '7d' ? null : p.id)}
              >
                {p.texto}
              </button>
            ))}
          </div>
        ) : (
          <p className="texto-suave">
            Historia completa del pedido #{pedidoId}.{' '}
            <button className="enlace-sutil" onClick={() => { setBusqueda(''); cambiar('pedido', null); }}>
              Ver todos
            </button>
          </p>
        )}
      </div>

      <div className="chips" role="group" aria-label="Tipo de evento">
        <button className={`chip ${!tipo ? 'chip--activo' : ''}`} aria-pressed={!tipo} onClick={() => cambiar('tipo', null)}>
          Todos los eventos
        </button>
        {TIPOS_EVENTO.map((t) => (
          <button
            key={t}
            className={`chip ${tipo === t ? 'chip--activo' : ''}`}
            aria-pressed={tipo === t}
            onClick={() => cambiar('tipo', t)}
          >
            {ETIQUETA_ESTADO[estadoDeEvento(t) ?? 'CREADO']}
          </button>
        ))}
      </div>

      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      {!eventos && !error ? <EstadoCarga texto="Cargando la bitácora..." /> : null}

      {eventos ? (
        <section className="panel panel--tabla">
          {lista.length === 0 ? (
            <p className="vacio">
              {pedidoId !== undefined
                ? `No hay eventos registrados para el pedido #${pedidoId}.`
                : 'No hay eventos con estos filtros. Prueba con un período más amplio.'}
            </p>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Pedido</th>
                    <th>Cambio</th>
                    <th>Hecho por</th>
                    <th>Cliente</th>
                    <th>
                      <span className="sr-only">Datos</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((e) => {
                    const estado = estadoDeEvento(e.tipoEvento);
                    const expandido = abierto === e.id;
                    return (
                      <Fragment key={e.id}>
                        <tr className={expandido ? 'fila--elegida' : ''}>
                          <td>{formatearFecha(e.fechaEvento)}</td>
                          <td>
                            <Link to={`/admin/pedidos?pedido=${e.entidadId}`}>#{e.entidadId}</Link>
                          </td>
                          <td>
                            <span className="cambio-estado">
                              {e.estadoAnterior ? (
                                <>
                                  <span className="texto-suave">
                                    {ETIQUETA_ESTADO[e.estadoAnterior as EstadoPedido] ?? e.estadoAnterior}
                                  </span>
                                  <span aria-label="pasa a">→</span>
                                </>
                              ) : null}
                              {estado ? <BadgeEstado estado={estado} /> : e.tipoEvento}
                            </span>
                          </td>
                          <td>
                            {e.actorRol === 'SISTEMA' ? (
                              <span className="texto-suave">Sistema</span>
                            ) : e.actorRol ? (
                              <span className="persona">
                                <span title={e.actorOid ?? undefined}>
                                  {e.actorNombre ?? acortar(e.actorOid ?? '')}
                                </span>
                                <span className={`rol rol--${e.actorRol.toLowerCase()}`}>
                                  {ROL_ACTOR[e.actorRol] ?? e.actorRol}
                                </span>
                              </span>
                            ) : (
                              <span className="texto-suave" title="Evento anterior a registrar quién hace cada cambio">
                                Sin registro
                              </span>
                            )}
                          </td>
                          <td title={e.usuarioOid}>
                            {e.clienteNombre ?? <span className="mono">{acortar(e.usuarioOid ?? '')}</span>}
                          </td>
                          <td className="num">
                            <button
                              className="enlace-sutil"
                              aria-expanded={expandido}
                              onClick={() => setAbierto(expandido ? null : e.id)}
                            >
                              {expandido ? 'Ocultar' : 'Ver mensaje'}
                            </button>
                          </td>
                        </tr>
                        {expandido ? (
                          <tr className="fila-payload">
                            <td colSpan={6}>
                              <p className="nota">
                                Evento <span className="mono">{e.tipoEvento}</span>. Publicado por <span className="mono">{e.origen}</span> en el tópico{' '}
                                <span className="mono">orders.events</span>
                              </p>
                              <pre className="payload">{payloadLegible(e.payload)}</pre>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPaginas > 1 ? (
            <nav className="paginacion" aria-label="Páginas">
              <button
                className="boton boton--secundario boton--chico"
                disabled={paginaActual <= 1}
                onClick={() => setPagina(paginaActual - 1)}
              >
                Anterior
              </button>
              <span>
                Página {paginaActual} de {totalPaginas} ({lista.length} eventos)
              </span>
              <button
                className="boton boton--secundario boton--chico"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
              >
                Siguiente
              </button>
            </nav>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
