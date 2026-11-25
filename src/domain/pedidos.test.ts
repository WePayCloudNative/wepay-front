import { describe, expect, it } from 'vitest';

import { pedidosAtascados, tiempoEsperando, type EstadoPedido, type Pedido } from './pedidos';

const ahora = new Date('2026-11-24T20:00:00Z');

function pedido(id: number, estado: EstadoPedido, minutosAtras: number): Pedido {
  return {
    id,
    usuarioOid: 'oid',
    total: 1000,
    estado,
    fechaRegistro: new Date(ahora.getTime() - minutosAtras * 60_000).toISOString(),
  };
}

const fecha = (p: Pedido) => new Date(p.fechaRegistro);

describe('pedidosAtascados', () => {
  it('avisa de un pago sin confirmar después de 30 minutos', () => {
    const atascados = pedidosAtascados([pedido(1, 'CREADO', 31), pedido(2, 'CREADO', 10)], fecha, ahora);
    expect(atascados.map((a) => a.pedido.id)).toEqual([1]);
    expect(atascados[0].minutos).toBe(31);
  });

  it('cada estado tiene su propio límite', () => {
    const atascados = pedidosAtascados(
      [pedido(1, 'ACEPTADO', 90), pedido(2, 'ACEPTADO', 150), pedido(3, 'EN_PREPARACION', 600)],
      fecha,
      ahora,
    );
    expect(atascados.map((a) => a.pedido.id)).toEqual([2]);
  });

  it('nunca avisa de pedidos despachados, entregados o cancelados', () => {
    const viejos = (['DESPACHADO', 'ENTREGADO', 'CANCELADO'] as EstadoPedido[]).map((e, i) => pedido(i, e, 99_999));
    expect(pedidosAtascados(viejos, fecha, ahora)).toEqual([]);
  });

  it('ordena del más antiguo al más reciente', () => {
    const atascados = pedidosAtascados([pedido(1, 'CREADO', 40), pedido(2, 'CREADO', 400)], fecha, ahora);
    expect(atascados.map((a) => a.pedido.id)).toEqual([2, 1]);
  });
});

describe('tiempoEsperando', () => {
  it.each([
    [45, '45 min'],
    [150, '2 h'],
    [1500, '1 día'],
    [3000, '2 días'],
  ])('%s minutos → %s', (minutos, texto) => {
    expect(tiempoEsperando(minutos)).toBe(texto);
  });
});
