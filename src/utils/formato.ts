const pesos = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatearPesos(valor: number): string {
  return pesos.format(valor);
}

/**
 * Los microservicios corren en UTC y envían fechas sin zona horaria
 * (LocalDateTime). Se interpretan como UTC para mostrarlas en hora local.
 */
function aFecha(valor: string | Date): Date {
  if (valor instanceof Date) {
    return valor;
  }
  const tieneZona = /[zZ]|[+-]\d{2}:?\d{2}$/.test(valor);
  return new Date(tieneZona ? valor : `${valor}Z`);
}

export function formatearFecha(valor: string | Date): string {
  const fecha = aFecha(valor);
  return Number.isNaN(fecha.getTime())
    ? '—'
    : fecha.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatearHora(valor: string | Date): string {
  const fecha = aFecha(valor);
  return Number.isNaN(fecha.getTime())
    ? '—'
    : fecha.toLocaleTimeString('es-CL', { timeStyle: 'medium' });
}

export function acortar(texto: string, largo = 8): string {
  return texto.length > largo ? `${texto.slice(0, largo)}…` : texto;
}
