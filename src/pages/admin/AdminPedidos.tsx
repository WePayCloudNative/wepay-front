import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useSesion } from '../../auth/sesion';
import Aviso from '../../components/Aviso';
import BadgeEstado from '../../components/BadgeEstado';
import EstadoCarga from '../../components/EstadoCarga';
import Icono from '../../components/Icono';
import ListaDetalle from '../../components/ListaDetalle';
import ProgresoPedido from '../../components/ProgresoPedido';
import { colasDestino, EXCHANGE_PEDIDOS, routingKey } from '../../domain/mensajeria';
import {
  ACCION_HACIA,
  ETIQUETA_ESTADO,
  estadosSiguientes,
  TODOS_LOS_ESTADOS,
  unidadesDe,
  type EstadoPedido,
  type Pedido,
} from '../../domain/pedidos';
import { useRegistroEventos } from '../../mensajeria/registro';
import { usePedidos } from '../../pedidos/usePedidos';
import { acortar, formatearFecha, formatearPesos } from '../../utils/formato';

const POR_PAGINA = 10;

/** Lo que se le muestra al admin después de cambiar un estado: qué pasó y a dónde fue el evento. */
type CambioAplicado = {
  pedidoId: number;
  desde: EstadoPedido;
  hacia: EstadoPedido;
  routingKey: string;
  colas: string[];
};

export default function AdminPedidos() {
  const api = useApi();
  const { perfil } = useSesion();
  const registro = useRegistroEventos();
  const { pedidos, error, actualizado, recargar } = usePedidos({ cadaMs: 15_000 });
  const [parametros, setParametros] = useSearchParams();

  const filtro = (parametros.get('estado') as EstadoPedido | null) ?? null;
  const busqueda = parametros.get('q') ?? '';
  const seleccionado = parametros.get('pedido');
  const [pagina, setPagina] = useState(1);

  const [procesando, setProcesando] = useState(false);
  const [cambio, setCambio] = useState<CambioAplicado | null>(null);
  const [errorCambio, setErrorCambio] = useState('');

  useEffect(() => {
    document.title = 'WePay | Pedidos';
  }, []);

  function cambiarParametro(clave: string, valor: string | null) {
    const siguientes = new URLSearchParams(parametros);
    if (valor) siguientes.set(clave, valor);
    else siguientes.delete(clave);
    setParametros(siguientes, { replace: clave !== 'pedido' });
    if (clave !== 'pedido') setPagina(1);
  }

  function abrir(id: number | null) {
    setCambio(null);
    setErrorCambio('');
    cambiarParametro('pedido', id === null ? null : String(id));
  }

  const lista = useMemo(() => pedidos ?? [], [pedidos]);
  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase().replace(/^#/, '');
    return lista.filter(
      (p) =>
        (!filtro || p.estado === filtro) &&
        (!termino ||
          String(p.id) === termino ||
          p.usuarioOid.toLowerCase().includes(termino) ||
          (p.detalles ?? []).some((d) => d.nombreProducto.toLowerCase().includes(termino))),
    );
  }, [lista, filtro, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);
  const pedidoAbierto = lista.find((p) => String(p.id) === seleccionado) ?? null;

  async function cambiarEstado(pedido: Pedido, nuevo: EstadoPedido) {
    setProcesando(true);
    setCambio(null);
    setErrorCambio('');
    try {
      await api.cambiarEstado(pedido.id, nuevo);
      const aplicado = {
        pedidoId: pedido.id,
        desde: pedido.estado,
        hacia: nuevo,
        routingKey: routingKey(nuevo),
        colas: colasDestino(nuevo),
      };
      registro.registrar(aplicado);
      setCambio(aplicado);
      await recargar();
    } catch (e) {
      setErrorCambio(mensajeDe(e));
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="pila">
      <header className="admin-encabezado">
        <div>
          <h1>Pedidos</h1>
          <p className="texto-suave">
            {actualizado
              ? `Actualizado a las ${actualizado.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Cargando...'}
          </p>
        </div>
        <button className="boton boton--secundario" onClick={() => void recargar()}>
          Actualizar
        </button>
      </header>

      <div className="herramientas">
        <label className="buscador buscador--caja">
          <Icono nombre="buscar" tamano={16} />
          <span className="sr-only">Buscar pedidos</span>
          <input
            type="search"
            placeholder="Buscar por número, cliente o producto"
            value={busqueda}
            onChange={(e) => cambiarParametro('q', e.target.value)}
          />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por estado">
          <button
            className={`chip ${!filtro ? 'chip--activo' : ''}`}
            onClick={() => cambiarParametro('estado', null)}
          >
            Todos <span>{lista.length}</span>
          </button>
          {TODOS_LOS_ESTADOS.map((estado) => (
            <button
              key={estado}
              className={`chip ${filtro === estado ? 'chip--activo' : ''}`}
              onClick={() => cambiarParametro('estado', estado)}
            >
              {ETIQUETA_ESTADO[estado]} <span>{lista.filter((p) => p.estado === estado).length}</span>
            </button>
          ))}
        </div>
      </div>

      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      {!pedidos && !error ? <EstadoCarga texto="Cargando pedidos..." /> : null}

      {pedidos ? (
        <section className="panel panel--tabla">
          {filtrados.length === 0 ? (
            <p className="vacio">No hay pedidos con estos filtros.</p>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla tabla--clic">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th className="num">Unidades</th>
                    <th className="num">Total</th>
                    <th>Estado</th>
                    <th>
                      <span className="sr-only">Abrir</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((p) => (
                    <tr
                      key={p.id}
                      className={String(p.id) === seleccionado ? 'fila--elegida' : ''}
                      onClick={() => abrir(p.id)}
                    >
                      <td>#{p.id}</td>
                      <td className="mono" title={p.usuarioOid}>
                        {acortar(p.usuarioOid)}
                        {p.usuarioOid === perfil?.oid ? <span className="texto-suave"> (tú)</span> : null}
                      </td>
                      <td>{formatearFecha(p.fechaRegistro)}</td>
                      <td className="num">{unidadesDe(p) || '—'}</td>
                      <td className="num">{formatearPesos(p.total)}</td>
                      <td>
                        <BadgeEstado estado={p.estado} />
                      </td>
                      <td className="num">
                        <button
                          className="boton-icono"
                          aria-label={`Abrir pedido ${p.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrir(p.id);
                          }}
                        >
                          <Icono nombre="avanzar" tamano={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
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
                Página {paginaActual} de {totalPaginas}
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

      {pedidoAbierto ? (
        <PanelPedido
          pedido={pedidoAbierto}
          esPropio={pedidoAbierto.usuarioOid === perfil?.oid}
          procesando={procesando}
          cambio={cambio?.pedidoId === pedidoAbierto.id ? cambio : null}
          error={errorCambio}
          onCambiar={(nuevo) => void cambiarEstado(pedidoAbierto, nuevo)}
          onCerrar={() => abrir(null)}
        />
      ) : null}
    </div>
  );
}

function PanelPedido({
  pedido,
  esPropio,
  procesando,
  cambio,
  error,
  onCambiar,
  onCerrar,
}: {
  pedido: Pedido;
  esPropio: boolean;
  procesando: boolean;
  cambio: CambioAplicado | null;
  error: string;
  onCambiar: (nuevo: EstadoPedido) => void;
  onCerrar: () => void;
}) {
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const alCerrarRef = useRef(onCerrar);
  const siguientes = estadosSiguientes(pedido.estado);

  useEffect(() => {
    alCerrarRef.current = onCerrar;
  }, [onCerrar]);

  // Solo al abrir: foco en cerrar y Escape para salir (no se repite con cada actualización).
  useEffect(() => {
    cerrarRef.current?.focus();
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrarRef.current();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, []);

  return (
    <div className="lateral" role="presentation">
      <div className="lateral__fondo" onClick={onCerrar} />
      <aside className="lateral__panel lateral__panel--ancho" role="dialog" aria-modal="true" aria-labelledby="titulo-pedido">
        <header className="lateral__cabecera">
          <div>
            <h2 id="titulo-pedido">Pedido #{pedido.id}</h2>
            <p className="texto-suave">{formatearFecha(pedido.fechaRegistro)}</p>
          </div>
          <button ref={cerrarRef} className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>

        <div className="lateral__cuerpo">
          {cambio ? (
            <div className="confirmacion-admin" role="status">
              <p className="confirmacion-admin__titulo">
                <Icono nombre="check" tamano={18} /> {ETIQUETA_ESTADO[cambio.desde]} →{' '}
                {ETIQUETA_ESTADO[cambio.hacia]}
              </p>
              {cambio.colas.length > 0 ? (
                <dl className="datos datos--compacto">
                  <div>
                    <dt>Exchange</dt>
                    <dd className="mono">{EXCHANGE_PEDIDOS}</dd>
                  </div>
                  <div>
                    <dt>Routing key</dt>
                    <dd className="mono">{cambio.routingKey}</dd>
                  </div>
                  <div>
                    <dt>Colas</dt>
                    <dd className="mono">{cambio.colas.join(', ')}</dd>
                  </div>
                </dl>
              ) : (
                <p className="texto-suave">Este estado no se publica en RabbitMQ.</p>
              )}
              <p className="nota">
                También se publicó en Kafka (orders.events). <Link to="/admin/laboratorio">Ver en el laboratorio</Link>
              </p>
            </div>
          ) : null}
          {error ? <Aviso tipo="error">{error}</Aviso> : null}

          <div className="panel-pedido__estado">
            <BadgeEstado estado={pedido.estado} />
            <ProgresoPedido estado={pedido.estado} compacto />
          </div>

          <h3>Acciones</h3>
          {siguientes.length === 0 ? (
            <p className="texto-suave">Estado final: no hay más acciones.</p>
          ) : (
            <div className="acciones acciones--columna">
              {siguientes.map((nuevo) => (
                <button
                  key={nuevo}
                  className={`boton ${nuevo === 'CANCELADO' ? 'boton--peligro' : 'boton--primario'}`}
                  disabled={procesando}
                  onClick={() => onCambiar(nuevo)}
                >
                  {procesando ? 'Aplicando...' : ACCION_HACIA[nuevo]}
                  <span className="boton__detalle">
                    {colasDestino(nuevo).length > 0 ? colasDestino(nuevo).join(', ') : 'sin colas'}
                  </span>
                </button>
              ))}
            </div>
          )}

          <h3>Cliente</h3>
          <p className="mono texto-quebrado">
            {pedido.usuarioOid}
            {esPropio ? <span className="texto-suave"> (tú)</span> : null}
          </p>

          <h3>Productos</h3>
          <ListaDetalle pedido={pedido} />
        </div>
      </aside>
    </div>
  );
}
