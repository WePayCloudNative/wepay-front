import type { Pedido } from '../domain/pedidos';
import { formatearPesos } from '../utils/formato';

/** Productos de un pedido con su subtotal, y el total al final. */
export default function ListaDetalle({
  pedido,
  etiquetaTotal = 'Total',
}: {
  pedido: Pedido;
  etiquetaTotal?: string;
}) {
  const detalles = pedido.detalles ?? [];

  return (
    <>
      {detalles.length === 0 ? (
        <p className="nota">El detalle de productos no está disponible para este pedido.</p>
      ) : (
        <ul className="resumen__lista">
          {detalles.map((d, i) => (
            <li key={`${d.productoId ?? 'p'}-${i}`}>
              <span className="resumen__nombre">
                {d.nombreProducto}
                <span className="texto-suave">
                  {' '}
                  × {d.cantidad} · {formatearPesos(d.precioUnitario)} c/u
                </span>
              </span>
              <span>{formatearPesos(d.precioUnitario * d.cantidad)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="fila-total">
        <span>{etiquetaTotal}</span>
        <strong>{formatearPesos(pedido.total)}</strong>
      </div>
    </>
  );
}
