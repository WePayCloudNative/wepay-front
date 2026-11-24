import { describe, expect, it } from 'vitest';

import { aIsoUtc, estadoDeEvento, payloadLegible, rangoDe } from './auditoria';

describe('estadoDeEvento', () => {
  it('traduce el nombre de Kafka al estado del pedido', () => {
    expect(estadoDeEvento('OrderDispatched')).toBe('DESPACHADO');
    expect(estadoDeEvento('OrderCancelled')).toBe('CANCELADO');
  });

  it('devuelve null para un tipo desconocido', () => {
    expect(estadoDeEvento('PaymentRefunded')).toBeNull();
  });
});

describe('rangoDe', () => {
  const ahora = new Date('2026-11-24T19:30:00Z');

  it('"todo" no envía fechas', () => {
    expect(rangoDe('todo', ahora)).toBeNull();
  });

  it('7 días termina ahora y parte una semana antes, en UTC sin zona', () => {
    expect(rangoDe('7d', ahora)).toEqual({ desde: '2026-11-17T19:30:00', hasta: '2026-11-24T19:30:00' });
  });

  it('"hoy" parte a medianoche local', () => {
    const rango = rangoDe('hoy', ahora)!;
    const inicio = new Date(`${rango.desde}Z`);
    expect(inicio.getHours()).toBe(0);
    expect(inicio.getMinutes()).toBe(0);
  });

  it('aIsoUtc quita milisegundos y la Z', () => {
    expect(aIsoUtc(new Date('2026-01-02T03:04:05.678Z'))).toBe('2026-01-02T03:04:05');
  });
});

describe('payloadLegible', () => {
  it('ordena el JSON con sangría', () => {
    expect(payloadLegible('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it('si no es JSON lo deja igual', () => {
    expect(payloadLegible('no es json')).toBe('no es json');
  });
});
