import { useEffect, useState } from 'react';

import { useApi } from '../api/useApi';
import { estadoDeEvento, tituloParaCliente, type EventoPedido } from '../domain/auditoria';
import { ESTADO_PARA_CLIENTE } from '../domain/pedidos';
import { formatearFecha } from '../utils/formato';

/**
 * Qué pasó con el pedido y cuándo, con las fechas que registró ms-auditoria.
 * Si auditoría no responde, la sección simplemente no aparece: no bloquea el detalle.
 * Se vuelve a pedir cuando cambia el estado (por ejemplo, al cancelar).
 */
export default function HistorialPedido({ pedidoId, estado }: { pedidoId: number; estado: string }) {
  const api = useApi();
  const [eventos, setEventos] = useState<EventoPedido[] | null>(null);

  useEffect(() => {
    let activo = true;
    api
      .historialPedido(pedidoId)
      .then((lista) => activo && setEventos(lista))
      .catch(() => activo && setEventos(null));
    return () => {
      activo = false;
    };
  }, [api, pedidoId, estado]);

  const conocidos = (eventos ?? []).filter((e) => estadoDeEvento(e.tipoEvento));
  if (conocidos.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <h2>Historial</h2>
      <ol className="historial">
        {conocidos.map((e, i) => {
          const estadoEvento = estadoDeEvento(e.tipoEvento)!;
          return (
            <li key={`${e.tipoEvento}-${e.fecha}-${i}`} className="historial__paso">
              <p className="historial__titulo">
                {tituloParaCliente(e, ESTADO_PARA_CLIENTE[estadoEvento].titulo)}
              </p>
              <p className="texto-suave">{formatearFecha(e.fecha)}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
