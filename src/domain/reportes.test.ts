import { describe, expect, it } from 'vitest';

import { formatearMinutos, pasoEtiquetas, proporcion, rangoReporte, variacion } from './reportes';

describe('rangoReporte', () => {
  const ahora = new Date('2026-11-24T19:30:00Z');

  it('"hoy" parte a medianoche local y termina ahora', () => {
    const { desde, hasta } = rangoReporte('hoy', ahora);
    const inicio = new Date(`${desde}Z`);
    expect(inicio.getHours()).toBe(0);
    expect(inicio.getDate()).toBe(ahora.getDate());
    expect(hasta).toBe('2026-11-24T19:30:00');
  });

  it('"7 días" retrocede una semana exacta', () => {
    expect(rangoReporte('7d', ahora).desde).toBe('2026-11-17T19:30:00');
  });

  it('"este mes" parte el día 1 a medianoche local', () => {
    const inicio = new Date(`${rangoReporte('mes', ahora).desde}Z`);
    expect(inicio.getDate()).toBe(1);
    expect(inicio.getHours()).toBe(0);
  });

  it('justo a medianoche el rango igual dura al menos un minuto', () => {
    const medianoche = new Date(2026, 10, 24, 0, 0, 0);
    const { desde, hasta } = rangoReporte('hoy', medianoche);
    expect(new Date(`${hasta}Z`).getTime() - new Date(`${desde}Z`).getTime()).toBe(60_000);
  });
});

describe('variacion', () => {
  it('calcula el cambio porcentual', () => {
    expect(variacion(118, 100)).toBe(18);
    expect(variacion(50, 100)).toBe(-50);
  });

  it('sin período anterior no hay comparación', () => {
    expect(variacion(10, 0)).toBeNull();
  });
});

describe('pasoEtiquetas', () => {
  it('24 horas → una etiqueta cada 3', () => {
    expect(pasoEtiquetas(24)).toBe(3);
  });

  it('7 días → todas', () => {
    expect(pasoEtiquetas(7)).toBe(1);
  });

  it('30 días → una cada 4', () => {
    expect(pasoEtiquetas(30)).toBe(4);
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
