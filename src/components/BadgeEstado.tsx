import { ETIQUETA_ESTADO, type EstadoPedido } from '../domain/pedidos';

export default function BadgeEstado({ estado }: { estado: EstadoPedido }) {
  return (
    <span className={`badge badge--${estado.toLowerCase()}`}>
      {ETIQUETA_ESTADO[estado] ?? estado}
    </span>
  );
}
