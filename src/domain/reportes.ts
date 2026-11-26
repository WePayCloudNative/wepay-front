import { aIsoUtc } from './auditoria';

/** Indicadores de un período (ms-reportes). "Confirmados" = pago aceptado en adelante. */
export type Indicadores = {
  totalPedidos: number;
  pedidosConfirmados: number;
  pedidosEntregados: number;
  pedidosActivos: number;
  pedidosCancelados: number;
  ventasConfirmadas: number;
  ventasEntregadas: number;
  montoCancelado: number;
  ticketPromedio: number;
  /** Porcentaje 0-100 */
  tasaCancelacion: number;
  leadTimePromedioMinutos: number;
};

export type TopProducto = {
  productoId: number;
  nombreProducto: string;
  cantidadVendida: number;
  ingresosTotales: number;
};

/** inicio en UTC sin zona ("2026-11-24T03:00"); el tramo es una hora o un día de Chile. */
export type VentasPorTramo = {
  inicio: string;
  pedidos: number;
  ventas: number;
};

export type ResumenReportes = {
  desde: string;
  hasta: string;
  agrupacion: 'hora' | 'dia';
  actual: Indicadores;
  /** El período de igual largo justo antes, para comparar. */
  anterior: Indicadores;
  pedidosPorEstado: Record<string, number>;
  topProductos: TopProducto[];
  ventasPorTramo: VentasPorTramo[];
};

export type PeriodoReporte = 'hoy' | '7d' | '30d' | 'mes';

export const PERIODOS_REPORTE: { id: PeriodoReporte; texto: string; comparacion: string }[] = [
  { id: 'hoy', texto: 'Hoy', comparacion: 'que ayer a esta hora' },
  { id: '7d', texto: '7 días', comparacion: 'que los 7 días anteriores' },
  { id: '30d', texto: '30 días', comparacion: 'que los 30 días anteriores' },
  { id: 'mes', texto: 'Este mes', comparacion: 'que el período anterior' },
];

/**
 * Rango desde/hasta (UTC, sin zona) para cada período, contado en la hora local.
 * "Hoy" parte a medianoche y "Este mes" el día 1 a medianoche.
 */
export function rangoReporte(periodo: PeriodoReporte, ahora: Date = new Date()): { desde: string; hasta: string } {
  const desde = new Date(ahora);
  if (periodo === 'hoy') {
    desde.setHours(0, 0, 0, 0);
  } else if (periodo === 'mes') {
    desde.setDate(1);
    desde.setHours(0, 0, 0, 0);
  } else {
    desde.setDate(desde.getDate() - (periodo === '7d' ? 7 : 30));
  }
  // El primer minuto del día o del mes deja un rango vacío: se asegura al menos 1 minuto
  const hasta = ahora.getTime() - desde.getTime() < 60_000 ? new Date(desde.getTime() + 60_000) : ahora;
  return { desde: aIsoUtc(desde), hasta: aIsoUtc(hasta) };
}

/** Variación porcentual redondeada; null si antes no había nada con qué comparar. */
export function variacion(actual: number, anterior: number): number | null {
  if (!Number.isFinite(anterior) || anterior <= 0) {
    return null;
  }
  return Math.round(((actual - anterior) / anterior) * 100);
}

/** Cada cuántos tramos poner una etiqueta para que no se monten (máximo ~8). */
export function pasoEtiquetas(cantidad: number, maximo = 8): number {
  return Math.max(1, Math.ceil(cantidad / maximo));
}

/** 0 → "—", 42 → "42 min", 135 → "2 h 15 min" */
export function formatearMinutos(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos <= 0) {
    return '—';
  }
  const total = Math.round(minutos);
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) {
    return `${resto} min`;
  }
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** Porcentaje de una barra respecto del máximo (0 si no hay datos). */
export function proporcion(valor: number, maximo: number): number {
  return maximo > 0 ? Math.round((valor / maximo) * 1000) / 10 : 0;
}
