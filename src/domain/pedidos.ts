export type EstadoPedido =
  | 'CREADO'
  | 'ACEPTADO'
  | 'EN_PREPARACION'
  | 'DESPACHADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type Pedido = {
  id: number;
  usuarioOid: string;
  total: number;
  fechaRegistro: string;
  estado: EstadoPedido;
};

export type Producto = {
  name: string;
  description: string;
  price: number;
};

export type ItemCarrito = {
  nombre: string;
  precio: number;
  cantidad: number;
};

export type Perfil = {
  oid: string;
  nombre: string;
  email: string;
  rol: string;
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

/** Texto del botón que lleva un pedido a cada estado (vista de administración). */
export const ACCION_HACIA: Record<EstadoPedido, string> = {
  CREADO: 'Crear',
  ACEPTADO: 'Aceptar',
  EN_PREPARACION: 'Preparar',
  DESPACHADO: 'Despachar',
  ENTREGADO: 'Entregar',
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

export function estadosSiguientes(actual: EstadoPedido): EstadoPedido[] {
  return TRANSICIONES[actual] ?? [];
}

export function esEstadoFinal(estado: EstadoPedido): boolean {
  return estadosSiguientes(estado).length === 0;
}

/** ms-clientes devuelve el rol en minúsculas ("admin" / "user"). */
export function tieneRolAdmin(perfil: Perfil | null): boolean {
  return perfil?.rol?.toUpperCase() === 'ADMIN';
}
