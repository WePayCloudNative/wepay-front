import type { DireccionGuardada } from './direccion';

export type EstadoPedido =
  | 'CREADO'
  | 'ACEPTADO'
  | 'EN_PREPARACION'
  | 'DESPACHADO'
  | 'ENTREGADO'
  | 'CANCELADO';

/** Un producto dentro de un pedido (ms-pedidos lo guarda con el precio del momento de la compra). */
export type DetallePedido = {
  productoId: number | null;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
};

export type Pedido = {
  id: number;
  usuarioOid: string;
  total: number;
  fechaRegistro: string;
  estado: EstadoPedido;
  /** Puede faltar si el BFF o ms-pedidos desplegados aún no la envían. */
  detalles?: DetallePedido[] | null;
};

export type Producto = {
  id: number;
  name: string;
  description: string;
  price: number;
  categoria?: string | null;
  imagenUrl?: string | null;
  /** Precio antes de la oferta; null si el producto no está en oferta. */
  precioAnterior?: number | null;
};

export type ItemCarrito = {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagenUrl?: string | null;
  categoria?: string | null;
};

export type Perfil = {
  oid: string;
  nombre: string;
  email: string;
  rol: string;
  /** Dirección guardada en ms-clientes; null si aún no la guarda. */
  direccion?: DireccionGuardada | null;
};

/** Camino normal de un pedido, en orden. CANCELADO queda fuera porque corta el flujo. */
export const FLUJO_PEDIDO: EstadoPedido[] = [
  'CREADO',
  'ACEPTADO',
  'EN_PREPARACION',
  'DESPACHADO',
  'ENTREGADO',
];

export const TODOS_LOS_ESTADOS: EstadoPedido[] = [...FLUJO_PEDIDO, 'CANCELADO'];

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  CREADO: 'Creado',
  ACEPTADO: 'Aceptado',
  EN_PREPARACION: 'En preparación',
  DESPACHADO: 'Despachado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

/** Cómo se le explica cada estado al cliente, sin lenguaje técnico. */
export const ESTADO_PARA_CLIENTE: Record<EstadoPedido, { titulo: string; detalle: string }> = {
  CREADO: {
    titulo: 'Recibimos tu pedido',
    detalle: 'Estamos validando el pago. Te avisaremos apenas se confirme.',
  },
  ACEPTADO: {
    titulo: 'Pago confirmado',
    detalle: 'Generamos tu boleta y el pedido pasó a la fila de preparación.',
  },
  EN_PREPARACION: {
    titulo: 'Preparando tu pedido',
    detalle: 'Estamos reuniendo y embalando tus productos.',
  },
  DESPACHADO: {
    titulo: 'En camino',
    detalle: 'Tu pedido salió de nuestra bodega. Te enviamos un SMS con el aviso.',
  },
  ENTREGADO: {
    titulo: 'Entregado',
    detalle: 'Tu pedido llegó. Que lo disfrutes.',
  },
  CANCELADO: {
    titulo: 'Pedido cancelado',
    detalle: 'Este pedido no seguirá avanzando.',
  },
};

/** Texto del botón que lleva un pedido a cada estado (vista de administración). */
export const ACCION_HACIA: Record<EstadoPedido, string> = {
  CREADO: 'Crear',
  ACEPTADO: 'Aceptar pago',
  EN_PREPARACION: 'Pasar a preparación',
  DESPACHADO: 'Despachar',
  ENTREGADO: 'Marcar entregado',
  CANCELADO: 'Cancelar',
};

/**
 * Máquina de estados. Es una copia de validarTransicion() en ms-pedidos:
 * si cambia en el backend, hay que actualizarla aquí.
 */
export const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  CREADO: ['ACEPTADO', 'CANCELADO'],
  ACEPTADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['DESPACHADO', 'CANCELADO'],
  DESPACHADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

/** El cliente solo puede cancelar antes de que el pedido entre a preparación (igual que el BFF). */
export const CANCELABLES_POR_CLIENTE: EstadoPedido[] = ['CREADO', 'ACEPTADO'];

/** Estados en que el pedido ya tiene boleta emitida (se factura al aceptar). */
export const ESTADOS_CON_BOLETA: EstadoPedido[] = [
  'ACEPTADO',
  'EN_PREPARACION',
  'DESPACHADO',
  'ENTREGADO',
];

export function estadosSiguientes(actual: EstadoPedido): EstadoPedido[] {
  return TRANSICIONES[actual] ?? [];
}

export function esEstadoFinal(estado: EstadoPedido): boolean {
  return estadosSiguientes(estado).length === 0;
}

export function unidadesDe(pedido: Pedido): number {
  return (pedido.detalles ?? []).reduce((suma, d) => suma + d.cantidad, 0);
}

/** ms-clientes devuelve el rol en minúsculas ("admin" / "user"). */
export function tieneRolAdmin(perfil: Perfil | null): boolean {
  return perfil?.rol?.toUpperCase() === 'ADMIN';
}
