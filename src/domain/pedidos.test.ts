import { describe, expect, it } from 'vitest';

import { estadoAuditoria, limitesEspera, pedidosAtascados, tiempoEsperando, type EstadoPedido, type Pedido } from './pedidos';

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
  it('avisa de un pago sin confirmar después de 1 minuto (valor de la demo)', () => {
    const atascados = pedidosAtascados([pedido(1, 'CREADO', 2), pedido(2, 'CREADO', 0)], fecha, ahora);
    expect(atascados.map((a) => a.pedido.id)).toEqual([1]);
    expect(atascados[0].minutos).toBe(2);
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

describe('estadoAuditoria', () => {
  const base = pedido(1, 'ACEPTADO', 5);

  it('sin confirmación todavía', () => {
    expect(estadoAuditoria(base).tipo).toBe('sin-registro');
  });

  it('al día cuando auditoría confirmó el estado actual', () => {
    const p = { ...base, auditadoEn: '2026-11-26T03:00:01', estadoAuditado: 'ACEPTADO' };
    expect(estadoAuditoria(p).tipo).toBe('al-dia');
  });

  it('pendiente cuando auditoría va un paso atrás, y dice cuál falta', () => {
    const p = { ...base, auditadoEn: '2026-11-26T03:00:01', estadoAuditado: 'CREADO' };
    const r = estadoAuditoria(p);
    expect(r.tipo).toBe('pendiente');
    expect(r.texto).toContain('Creado');
    expect(r.texto).toContain('Aceptado');
  });
});

describe('limitesEspera', () => {
  it('por defecto el pago tiene 1 minuto (demo)', () => {
    expect(limitesEspera(undefined).CREADO).toBe(1);
  });

  it('config.js puede subirlo a un valor real', () => {
    const limites = limitesEspera({ MINUTOS_ALERTA_PAGO: 30 });
    expect(limites.CREADO).toBe(30);
    expect(limites.ACEPTADO).toBe(120); // los otros no cambian
    expect(pedidosAtascados([pedido(1, 'CREADO', 2)], fecha, ahora, limites)).toHaveLength(0);
  });

  it('ignora valores inválidos', () => {
    expect(limitesEspera({ MINUTOS_ALERTA_PAGO: 0 }).CREADO).toBe(1);
  });
});
