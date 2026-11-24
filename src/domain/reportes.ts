import { aFecha } from '../utils/formato';

/** KPIs de las últimas 24 horas (ms-reportes). Ventas y tiempo cuentan solo pedidos entregados. */
export type Kpis = {
  totalPedidos: number;
  pedidosEntregados: number;
  pedidosActivos: number;
  ventasTotales: number;
  leadTimePromedioMinutos: number;
  pedidosPorEstado: Record<string, number>;
};

export type TopProducto = {
  productoId: number;
  nombreProducto: string;
  cantidadVendida: number;
  ingresosTotales: number;
};

/** hora viene en UTC sin zona, truncada a la hora: "2026-11-24T19:00". */
export type VentasPorHora = {
  hora: string;
  cantidadPedidos: number;
  totalVentas: number;
};

export type ResumenReportes = {
  kpis: Kpis;
  topProductos: TopProducto[];
  ventasPorHora: VentasPorHora[];
};

export type BarraHora = {
  inicio: Date;
  pedidos: number;
  ventas: number;
};

/**
 * Arma las 24 barras de la última jornada (una por hora, en hora local).
 * ms-reportes solo envía las horas con ventas; las demás quedan en cero.
 */
export function completarHoras(datos: VentasPorHora[], ahora: Date = new Date()): BarraHora[] {
  const porHora = new Map<number, VentasPorHora>();
  for (const d of datos) {
    const inicio = aFecha(d.hora);
    if (!Number.isNaN(inicio.getTime())) {
      porHora.set(inicio.getTime(), d);
    }
  }

  const ultima = new Date(ahora);
  ultima.setMinutes(0, 0, 0);
  const barras: BarraHora[] = [];
  for (let i = 23; i >= 0; i--) {
    const inicio = new Date(ultima.getTime() - i * 3_600_000);
    const dato = porHora.get(inicio.getTime());
    barras.push({
      inicio,
      pedidos: dato?.cantidadPedidos ?? 0,
      ventas: dato?.totalVentas ?? 0,
    });
  }
  return barras;
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
