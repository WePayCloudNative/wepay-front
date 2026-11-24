import { describe, expect, it } from 'vitest';

import { completarHoras, formatearMinutos, proporcion } from './reportes';

describe('completarHoras', () => {
  const ahora = new Date('2026-11-24T19:45:00Z');

  it('siempre devuelve 24 barras, la última es la hora actual', () => {
    const barras = completarHoras([], ahora);
    expect(barras).toHaveLength(24);
    expect(barras[23].inicio.toISOString()).toBe('2026-11-24T19:00:00.000Z');
  });

  it('pone cada venta en su hora (llegan en UTC sin zona) y el resto en cero', () => {
    const barras = completarHoras(
      [{ hora: '2026-11-24T17:00', cantidadPedidos: 2, totalVentas: 179980 }],
      ahora,
    );
    const conVentas = barras.filter((b) => b.ventas > 0);
    expect(conVentas).toHaveLength(1);
    expect(conVentas[0].inicio.toISOString()).toBe('2026-11-24T17:00:00.000Z');
    expect(conVentas[0].pedidos).toBe(2);
  });

  it('ignora horas fuera de las últimas 24', () => {
    const barras = completarHoras(
      [{ hora: '2026-11-20T10:00', cantidadPedidos: 1, totalVentas: 1000 }],
      ahora,
    );
    expect(barras.every((b) => b.ventas === 0)).toBe(true);
  });
});

describe('formatearMinutos', () => {
  it.each([
    [0, '—'],
    [42, '42 min'],
    [120, '2 h'],
    [135.4, '2 h 15 min'],
  ])('%s minutos → %s', (minutos, texto) => {
    expect(formatearMinutos(minutos)).toBe(texto);
  });
});

describe('proporcion', () => {
  it('calcula el porcentaje respecto del máximo', () => {
    expect(proporcion(1, 4)).toBe(25);
  });

  it('no divide por cero', () => {
    expect(proporcion(3, 0)).toBe(0);
  });
});
