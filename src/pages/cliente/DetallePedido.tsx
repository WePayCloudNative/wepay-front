import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useSesion } from '../../auth/sesion';
import Aviso from '../../components/Aviso';
import BadgeEstado from '../../components/BadgeEstado';
import EstadoCarga from '../../components/EstadoCarga';
import HistorialPedido from '../../components/HistorialPedido';
import Icono from '../../components/Icono';
import ListaDetalle from '../../components/ListaDetalle';
import ProgresoPedido from '../../components/ProgresoPedido';
import { colasDestino, routingKey } from '../../domain/mensajeria';
import {
  CANCELABLES_POR_CLIENTE,
  ESTADO_PARA_CLIENTE,
  ESTADOS_CON_BOLETA,
} from '../../domain/pedidos';
import { useRegistroEventos } from '../../mensajeria/registro';
import { usePedidos } from '../../pedidos/usePedidos';
import { formatearFecha } from '../../utils/formato';

export default function DetallePedido() {
  const { id } = useParams();
  const api = useApi();
  const { perfil } = useSesion();
  const registro = useRegistroEventos();
  const { pedidos, error, recargar } = usePedidos({ soloDe: perfil?.oid });

  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    document.title = `WePay | Pedido #${id ?? ''}`;
  }, [id]);

  const pedido = pedidos?.find((p) => String(p.id) === id);

  async function cancelar() {
    if (!pedido) return;
    setCancelando(true);
    setResultado(null);
    const estabaPagado = pedido.estado === 'ACEPTADO';
    try {
      await api.cancelarPedido(pedido.id);
      registro.registrar({
        pedidoId: pedido.id,
        desde: pedido.estado,
        hacia: 'CANCELADO',
        routingKey: routingKey('CANCELADO'),
        colas: colasDestino('CANCELADO'),
      });
      setResultado({
        tipo: 'exito',
        texto: estabaPagado
          ? 'Cancelamos tu pedido. Emitiremos una nota de crédito que anula tu boleta y te la enviaremos por correo.'
          : 'Cancelamos tu pedido. Como el pago aún no se confirmaba, no se generó ningún cobro.',
      });
      await recargar();
    } catch (e) {
      setResultado({ tipo: 'error', texto: mensajeDe(e) });
    } finally {
      setCancelando(false);
      setConfirmando(false);
    }
  }

  if (error && !pedidos) {
    return (
      <div className="contenedor seccion">
        <Aviso tipo="error">{error}</Aviso>
      </div>
    );
  }
  if (!pedidos) {
    return (
      <div className="contenedor seccion">
        <EstadoCarga texto="Cargando tu pedido..." />
      </div>
    );
  }
  if (!pedido) {
    return (
      <div className="contenedor seccion vacio-grande">
        <p>No encontramos este pedido en tu cuenta.</p>
        <Link className="boton boton--secundario" to="/mis-pedidos">
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  const estado = ESTADO_PARA_CLIENTE[pedido.estado];
  const puedeCancelar = CANCELABLES_POR_CLIENTE.includes(pedido.estado);
  const conBoleta = ESTADOS_CON_BOLETA.includes(pedido.estado);

  return (
    <div className="contenedor seccion detalle-pedido">
      <Link className="volver" to="/mis-pedidos">
        <Icono nombre="volver" tamano={16} /> Mis pedidos
      </Link>

      <header className="detalle-pedido__encabezado">
        <div>
          <h1 className="titulo-pagina">Pedido #{pedido.id}</h1>
          <p className="texto-suave">Realizado el {formatearFecha(pedido.fechaRegistro)}</p>
        </div>
        <BadgeEstado estado={pedido.estado} />
      </header>

      {resultado ? (
        <Aviso tipo={resultado.tipo} onCerrar={() => setResultado(null)}>
          {resultado.texto}
        </Aviso>
      ) : null}

      <section className="panel">
        <h2>{estado.titulo}</h2>
        <p className="texto-suave">{estado.detalle}</p>
        <ProgresoPedido estado={pedido.estado} />
      </section>

      <HistorialPedido pedidoId={pedido.id} estado={pedido.estado} />

      <div className="detalle-pedido__grilla">
        <section className="panel">
          <h2>Productos</h2>
          <ListaDetalle pedido={pedido} />
        </section>

        <section className="panel">
          <h2>Documentos</h2>
          {conBoleta ? (
            <p className="documento">
              <Icono nombre="documento" /> Boleta electrónica emitida y enviada a tu correo.
            </p>
          ) : pedido.estado === 'CANCELADO' ? (
            <p className="documento">
              <Icono nombre="documento" /> Si el pago ya estaba confirmado, emitimos una nota de crédito
              que anula la boleta.
            </p>
          ) : (
            <p className="texto-suave">La boleta se emite cuando confirmemos el pago.</p>
          )}

          {puedeCancelar ? (
            <div className="cancelar">
              {confirmando ? (
                <>
                  <p>
                    {pedido.estado === 'ACEPTADO'
                      ? '¿Cancelar el pedido? Ya está pagado: anularemos la boleta con una nota de crédito.'
                      : '¿Cancelar el pedido?'}
                  </p>
                  <div className="acciones">
                    <button
                      className="boton boton--peligro boton--chico"
                      disabled={cancelando}
                      onClick={() => void cancelar()}
                    >
                      {cancelando ? 'Cancelando...' : 'Sí, cancelar pedido'}
                    </button>
                    <button
                      className="boton boton--secundario boton--chico"
                      disabled={cancelando}
                      onClick={() => setConfirmando(false)}
                    >
                      No, mantenerlo
                    </button>
                  </div>
                </>
              ) : (
                <button className="enlace-sutil" onClick={() => setConfirmando(true)}>
                  Cancelar pedido
                </button>
              )}
              <p className="nota">Puedes cancelar hasta que empecemos a preparar tu pedido.</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
