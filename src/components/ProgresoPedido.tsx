import { ETIQUETA_ESTADO, FLUJO_PEDIDO, type EstadoPedido } from '../domain/pedidos';

/** Línea de avance del pedido. El historial con fechas llegará desde ms-auditoria. */
export default function ProgresoPedido({ estado }: { estado: EstadoPedido }) {
  if (estado === 'CANCELADO') {
    return (
      <p className="progreso-cancelado">
        Este pedido fue cancelado y ya no avanzará.
      </p>
    );
  }

  const actual = FLUJO_PEDIDO.indexOf(estado);

  return (
    <ol className="progreso" aria-label="Avance del pedido">
      {FLUJO_PEDIDO.map((paso, i) => {
        const clase =
          i < actual ? 'progreso__paso--hecho' : i === actual ? 'progreso__paso--actual' : '';
        return (
          <li key={paso} className={`progreso__paso ${clase}`}>
            <span className="progreso__marca" aria-hidden="true">
              {i < actual ? '✓' : i + 1}
            </span>
            <span className="progreso__texto">{ETIQUETA_ESTADO[paso]}</span>
          </li>
        );
      })}
    </ol>
  );
}
