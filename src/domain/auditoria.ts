import type { EstadoPedido } from './pedidos';

/** Un evento guardado por ms-auditoria (vista del admin). Fechas en UTC, sin zona. */
export type EventoAuditoria = {
  id: number;
  usuarioOid: string;
  tipoEvento: string;
  entidadId: string;
  fechaEvento: string;
  origen: string;
  /** El JSON completo que viajó por Kafka (orders.events). */
  payload: string;
};

/** Lo que ve el cliente del historial de su pedido. */
export type EventoPedido = {
  tipoEvento: string;
  fecha: string;
};

/** Nombres que publica ms-pedidos en Kafka, en el orden del flujo. */
export const TIPOS_EVENTO = [
  'OrderCreated',
  'OrderAccepted',
  'OrderPreparing',
  'OrderDispatched',
  'OrderDelivered',
  'OrderCancelled',
] as const;

export type TipoEvento = (typeof TIPOS_EVENTO)[number];

/** A qué estado deja el pedido cada evento. */
export const ESTADO_DE_EVENTO: Record<TipoEvento, EstadoPedido> = {
  OrderCreated: 'CREADO',
  OrderAccepted: 'ACEPTADO',
  OrderPreparing: 'EN_PREPARACION',
  OrderDispatched: 'DESPACHADO',
  OrderDelivered: 'ENTREGADO',
  OrderCancelled: 'CANCELADO',
};

export function esTipoConocido(tipo: string): tipo is TipoEvento {
  return (TIPOS_EVENTO as readonly string[]).includes(tipo);
}

/** Estado al que corresponde un evento, o null si es un tipo que el front no conoce. */
export function estadoDeEvento(tipo: string): EstadoPedido | null {
  return esTipoConocido(tipo) ? ESTADO_DE_EVENTO[tipo] : null;
}

export type Periodo = 'hoy' | '7d' | '30d' | 'todo';

export const PERIODOS: { id: Periodo; texto: string }[] = [
  { id: 'hoy', texto: 'Hoy' },
  { id: '7d', texto: '7 días' },
  { id: '30d', texto: '30 días' },
  { id: 'todo', texto: 'Todo' },
];

/** Fecha en el formato que espera ms-auditoria: ISO en UTC sin la Z (2026-11-24T03:00:00). */
export function aIsoUtc(fecha: Date): string {
  return fecha.toISOString().slice(0, 19);
}

/**
 * Convierte el período elegido en el rango desde/hasta (UTC).
 * "Hoy" parte a medianoche de la hora local del navegador.
 */
export function rangoDe(periodo: Periodo, ahora: Date = new Date()): { desde: string; hasta: string } | null {
  if (periodo === 'todo') {
    return null;
  }
  const desde = new Date(ahora);
  if (periodo === 'hoy') {
    desde.setHours(0, 0, 0, 0);
  } else {
    desde.setDate(desde.getDate() - (periodo === '7d' ? 7 : 30));
  }
  return { desde: aIsoUtc(desde), hasta: aIsoUtc(ahora) };
}

/** El payload es texto JSON: se muestra ordenado, o tal cual si no se puede leer. */
export function payloadLegible(payload: string): string {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}
