import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useSesion } from '../../auth/sesion';
import Aviso from '../../components/Aviso';
import BadgeEstado from '../../components/BadgeEstado';
import EstadoCarga from '../../components/EstadoCarga';
import ProgresoPedido from '../../components/ProgresoPedido';
import { colasDestino, routingKey } from '../../domain/mensajeria';
import type { EstadoPedido, Pedido } from '../../domain/pedidos';
import { useRegistroEventos } from '../../mensajeria/registro';
import { formatearFecha, formatearHora, formatearPesos } from '../../utils/formato';

const INTERVALO_MS = 10_000;

// Igual que en el BFF: el cliente solo cancela antes de que entre a preparación
const CANCELABLES: EstadoPedido[] = ['CREADO', 'ACEPTADO'];

export default function MisPedidos() {
  const api = useApi();
  const { perfil } = useSesion();
  const registro = useRegistroEventos();

  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [error, setError] = useState('');
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [automatico, setAutomatico] = useState(true);
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [exito, setExito] = useState('');

  const cargar = useCallback(
    () =>
      api
        .obtenerPedidos()
        .then((lista) => {
          setPedidos(lista);
          setError('');
          setActualizado(new Date());
        })
        .catch((e: unknown) => setError(mensajeDe(e))),
    [api],
  );

  async function cancelar(pedido: Pedido) {
    setCancelando(pedido.id);
    setError('');
    setExito('');
    try {
      await api.cancelarPedido(pedido.id);
      registro.registrar({
        pedidoId: pedido.id,
        desde: pedido.estado,
        hacia: 'CANCELADO',
        routingKey: routingKey('CANCELADO'),
        colas: colasDestino('CANCELADO'),
      });
      setExito(
        pedido.estado === 'ACEPTADO'
          ? `Pedido #${pedido.id} cancelado. Se emitirá una nota de crédito que anula tu boleta.`
          : `Pedido #${pedido.id} cancelado. Como aún no se pagaba, no se genera nota de crédito.`,
      );
      await cargar();
    } catch (e: unknown) {
      setError(mensajeDe(e));
    } finally {
      setCancelando(null);
      setConfirmando(null);
    }
  }

  useEffect(() => {
    document.title = 'Wepay | Mis pedidos';
  }, []);

  useEffect(() => {
    void cargar();
    if (!automatico) {
      return;
    }
    const id = setInterval(() => void cargar(), INTERVALO_MS);
    return () => clearInterval(id);
  }, [cargar, automatico]);

  // El BFF devuelve todos los pedidos a un ADMIN: aquí se muestran solo los propios.
  const propios = (pedidos ?? [])
    .filter((pedido) => !perfil?.oid || pedido.usuarioOid === perfil.oid)
    .sort((a, b) => b.id - a.id);

  return (
    <section className="tarjeta">
      <div className="encabezado">
        <div>
          <p className="eyebrow">Seguimiento</p>
          <h1>Mis pedidos</h1>
        </div>
        <div className="acciones">
          <label className="interruptor">
            <input
              type="checkbox"
              checked={automatico}
              onChange={(e) => setAutomatico(e.target.checked)}
            />
            Actualizar cada 10 s
          </label>
          <button className="boton boton--fantasma" onClick={() => void cargar()}>
            Actualizar
          </button>
        </div>
      </div>

      {actualizado ? (
        <p className="nota">Última actualización: {formatearHora(actualizado)}</p>
      ) : null}
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      {exito ? <Aviso tipo="exito">{exito}</Aviso> : null}
      {!pedidos && !error ? <EstadoCarga texto="Cargando tus pedidos..." /> : null}

      {pedidos && propios.length === 0 ? (
        <p className="vacio">
          Todavía no tienes pedidos. <Link to="/tienda">Ir a la tienda</Link>
        </p>
      ) : null}

      <div className="lista-pedidos">
        {propios.map((pedido) => (
          <article className="pedido" key={pedido.id}>
            <div className="pedido__cabecera">
              <div>
                <strong>Pedido #{pedido.id}</strong>
                <span className="texto-suave">{formatearFecha(pedido.fechaRegistro)}</span>
              </div>
              <div className="pedido__resumen">
                <BadgeEstado estado={pedido.estado} />
                <strong className="precio">{formatearPesos(pedido.total)}</strong>
              </div>
            </div>
            <ProgresoPedido estado={pedido.estado} />
            {CANCELABLES.includes(pedido.estado) ? (
              <div className="pedido__cancelar">
                {confirmando === pedido.id ? (
                  <>
                    <span>
                      {pedido.estado === 'ACEPTADO'
                        ? '¿Cancelar este pedido? Ya está pagado: se generará una nota de crédito.'
                        : '¿Cancelar este pedido?'}
                    </span>
                    <button
                      className="boton boton--peligro boton--chico"
                      disabled={cancelando === pedido.id}
                      onClick={() => void cancelar(pedido)}
                    >
                      {cancelando === pedido.id ? 'Cancelando...' : 'Sí, cancelar'}
                    </button>
                    <button
                      className="boton boton--fantasma boton--chico"
                      disabled={cancelando === pedido.id}
                      onClick={() => setConfirmando(null)}
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    className="boton boton--fantasma boton--chico"
                    onClick={() => {
                      setConfirmando(pedido.id);
                      setExito('');
                    }}
                  >
                    Cancelar pedido
                  </button>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
