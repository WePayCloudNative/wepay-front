import { ETIQUETA_ESTADO, FLUJO_PEDIDO, type EstadoPedido } from '../domain/pedidos';

/** Línea de avance del pedido. Las fechas de cada paso llegarán desde ms-auditoria. */
export default function ProgresoPedido({
  estado,
  compacto = false,
}: {
  estado: EstadoPedido;
  compacto?: boolean;
}) {
  if (estado === 'CANCELADO') {
    return <p className="progreso-cancelado">Este pedido fue cancelado y ya no avanzará.</p>;
  }

  const actual = FLUJO_PEDIDO.indexOf(estado);

  return (
    <ol className={`progreso ${compacto ? 'progreso--compacto' : ''}`} aria-label="Avance del pedido">
      {FLUJO_PEDIDO.map((paso, i) => {
        const clase = i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente';
        return (
          <li
            key={paso}
            className={`progreso__paso progreso__paso--${clase}`}
            aria-current={i === actual ? 'step' : undefined}
          >
            <span className="progreso__marca" aria-hidden="true" />
            <span className="progreso__texto">{ETIQUETA_ESTADO[paso]}</span>
          </li>
        );
      })}
    </ol>
  );
}
