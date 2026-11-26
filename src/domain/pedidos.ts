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
  /** Cuándo confirmó ms-auditoria (vía audit.timeline) el último evento, y en qué estado. */
  auditadoEn?: string | null;
  estadoAuditado?: string | null;
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

/**
 * Minutos que un pedido puede llevar en cada estado antes de pedir atención.
 * Se mide desde la compra (fechaRegistro), que es la fecha que entrega ms-pedidos.
 *
 * CREADO (pago sin confirmar) está en 1 minuto a propósito, para poder mostrar la alerta en la
 * demostración. En una tienda real serían unos 30: se cambia con MINUTOS_ALERTA_PAGO en config.js.
 */
export const LIMITE_ESPERA_MINUTOS: Partial<Record<EstadoPedido, number>> = {
  CREADO: 1,
  ACEPTADO: 2 * 60,
  EN_PREPARACION: 24 * 60,
};

type Limites = Partial<Record<EstadoPedido, number>>;

/**
 * Límites efectivos. El de pago se puede cambiar en public/config.js con MINUTOS_ALERTA_PAGO
 * (por ejemplo 30 en producción), sin tocar el código; si no está o no es válido, se usa 1 minuto.
 */
export function limitesEspera(
  config: { MINUTOS_ALERTA_PAGO?: number } | undefined = typeof window !== 'undefined'
    ? window.RUNTIME_CONFIG
    : undefined,
): Limites {
  const pago = Number(config?.MINUTOS_ALERTA_PAGO);
  return Number.isFinite(pago) && pago > 0 ? { ...LIMITE_ESPERA_MINUTOS, CREADO: pago } : LIMITE_ESPERA_MINUTOS;
}

export type PedidoAtascado = { pedido: Pedido; minutos: number };

/** Pedidos que superaron el límite de su estado, los más antiguos primero. */
export function pedidosAtascados(
  pedidos: Pedido[],
  aFechaPedido: (p: Pedido) => Date,
  ahora: Date = new Date(),
  limites: Limites = LIMITE_ESPERA_MINUTOS,
): PedidoAtascado[] {
  return pedidos
    .map((pedido) => ({
      pedido,
      minutos: Math.floor((ahora.getTime() - aFechaPedido(pedido).getTime()) / 60_000),
    }))
    .filter(({ pedido, minutos }) => {
      const limite = limites[pedido.estado];
      return limite !== undefined && minutos > limite;
    })
    .sort((a, b) => b.minutos - a.minutos);
}

/** 45 → "45 min", 150 → "2 h", 3000 → "2 días" */
export function tiempoEsperando(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? '1 día' : `${dias} días`;
}

export type EstadoAuditoria = {
  tipo: 'al-dia' | 'pendiente' | 'sin-registro';
  texto: string;
};

/**
 * Compara el estado del pedido con el último que auditoría confirmó.
 * "Pendiente" es normal por unos segundos después de un cambio; si dura, auditoría está atrasada.
 */
export function estadoAuditoria(pedido: Pedido): EstadoAuditoria {
  if (!pedido.auditadoEn) {
    return { tipo: 'sin-registro', texto: 'Auditoría aún no confirma este pedido' };
  }
  if (pedido.estadoAuditado === pedido.estado) {
    return { tipo: 'al-dia', texto: 'Registrado en auditoría' };
  }
  const auditado = ETIQUETA_ESTADO[pedido.estadoAuditado as EstadoPedido] ?? pedido.estadoAuditado;
  return {
    tipo: 'pendiente',
    texto: `Auditoría confirmó hasta "${auditado}"; falta registrar el cambio a "${ETIQUETA_ESTADO[pedido.estado]}"`,
  };
}
