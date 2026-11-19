import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useSesion } from '../../auth/sesion';
import Aviso from '../../components/Aviso';
import BadgeEstado from '../../components/BadgeEstado';
import EstadoCarga from '../../components/EstadoCarga';
import { colasDestino, EXCHANGE_PEDIDOS, routingKey } from '../../domain/mensajeria';
import {
  ACCION_HACIA,
  ETIQUETA_ESTADO,
  estadosSiguientes,
  TODOS_LOS_ESTADOS,
  type EstadoPedido,
  type Pedido,
} from '../../domain/pedidos';
import { useRegistroEventos } from '../../mensajeria/registro';
import { acortar, formatearFecha, formatearPesos } from '../../utils/formato';

type Filtro = EstadoPedido | 'TODOS';
type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null;

export default function AdminPedidos() {
  const api = useApi();
  const { perfil } = useSesion();
  const registro = useRegistroEventos();

  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [procesando, setProcesando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  const cargar = useCallback(
    () =>
      api
        .obtenerPedidos()
        .then((lista) => {
          setPedidos(lista);
          setErrorCarga('');
        })
        .catch((e: unknown) => setErrorCarga(mensajeDe(e))),
    [api],
  );

  useEffect(() => {
    document.title = 'Wepay | Administración de pedidos';
    void cargar();
  }, [cargar]);

  async function cambiarEstado(pedido: Pedido, nuevo: EstadoPedido) {
    setProcesando(pedido.id);
    setMensaje(null);
    try {
      await api.cambiarEstado(pedido.id, nuevo);
      const colas = colasDestino(nuevo);
      const clave = routingKey(nuevo);
      registro.registrar({
        pedidoId: pedido.id,
        desde: pedido.estado,
        hacia: nuevo,
        routingKey: clave,
        colas,
      });
      setMensaje({
        tipo: 'exito',
        texto:
          `Pedido #${pedido.id}: ${ETIQUETA_ESTADO[pedido.estado]} → ${ETIQUETA_ESTADO[nuevo]}. ` +
          `Publicado en ${EXCHANGE_PEDIDOS} con ${clave} → ${colas.join(', ')}.`,
      });
      await cargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: `Pedido #${pedido.id}: ${mensajeDe(e)}` });
    } finally {
      setProcesando(null);
    }
  }

  const lista = (pedidos ?? []).slice().sort((a, b) => b.id - a.id);
  const visibles = filtro === 'TODOS' ? lista : lista.filter((p) => p.estado === filtro);
  const contar = (estado: EstadoPedido) => lista.filter((p) => p.estado === estado).length;

  return (
    <section className="tarjeta">
      <div className="encabezado">
        <div>
          <p className="eyebrow">Gestión</p>
          <h1>Pedidos</h1>
          <p className="texto-suave">
            Cada cambio de estado publica un evento en RabbitMQ. Revisa a dónde llega en{' '}
            <Link to="/admin/mensajeria">Mensajería</Link>.
          </p>
        </div>
        <button className="boton boton--fantasma" onClick={() => void cargar()}>
          Actualizar
        </button>
      </div>

      <div className="filtros" role="group" aria-label="Filtrar por estado">
        <button
          className={`chip ${filtro === 'TODOS' ? 'chip--activo' : ''}`}
          onClick={() => setFiltro('TODOS')}
        >
          Todos <span>{lista.length}</span>
        </button>
        {TODOS_LOS_ESTADOS.map((estado) => (
          <button
            key={estado}
            className={`chip ${filtro === estado ? 'chip--activo' : ''}`}
            onClick={() => setFiltro(estado)}
          >
            {ETIQUETA_ESTADO[estado]} <span>{contar(estado)}</span>
          </button>
        ))}
      </div>

      {mensaje ? (
        <Aviso tipo={mensaje.tipo} onCerrar={() => setMensaje(null)}>
          {mensaje.texto}
        </Aviso>
      ) : null}
      {errorCarga ? <Aviso tipo="error">{errorCarga}</Aviso> : null}
      {!pedidos && !errorCarga ? <EstadoCarga texto="Cargando pedidos..." /> : null}
      {pedidos && visibles.length === 0 ? (
        <p className="vacio">No hay pedidos en este estado.</p>
      ) : null}

      {visibles.length > 0 ? (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th className="num">Total</th>
                <th>Estado</th>
                <th>Siguiente paso</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((pedido) => {
                const siguientes = estadosSiguientes(pedido.estado);
                return (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td className="mono" title={pedido.usuarioOid}>
                      {acortar(pedido.usuarioOid)}
                      {pedido.usuarioOid === perfil?.oid ? ' (tú)' : ''}
                    </td>
                    <td>{formatearFecha(pedido.fechaRegistro)}</td>
                    <td className="num">{formatearPesos(pedido.total)}</td>
                    <td>
                      <BadgeEstado estado={pedido.estado} />
                    </td>
                    <td>
                      {siguientes.length === 0 ? (
                        <span className="texto-suave">Estado final</span>
                      ) : (
                        <div className="acciones">
                          {siguientes.map((nuevo) => (
                            <button
                              key={nuevo}
                              className={`boton boton--chico ${
                                nuevo === 'CANCELADO' ? 'boton--peligro' : 'boton--primario'
                              }`}
                              disabled={procesando !== null}
                              title={`${routingKey(nuevo)} → ${colasDestino(nuevo).join(', ')}`}
                              onClick={() => void cambiarEstado(pedido, nuevo)}
                            >
                              {procesando === pedido.id ? '...' : ACCION_HACIA[nuevo]}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
