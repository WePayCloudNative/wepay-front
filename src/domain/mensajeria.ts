import type { EstadoPedido } from './pedidos';

export const EXCHANGE_PEDIDOS = 'ex.pedidos';
export const EXCHANGE_DLX = 'ex.pedidos.dlx';

export type ColaRabbit = {
  nombre: string;
  dominio: string;
  nodo: string;
  bindings: string[];
  regla: string;
  dlq: string;
};

/** Topología desplegada en el clúster (RabbitMQConfig.java y crear-colas.sh). */
export const COLAS: ColaRabbit[] = [
  {
    nombre: 'q.cmd.email',
    dominio: 'Correo al cliente',
    nodo: 'rabbit@rabbitmq',
    bindings: ['pedido.estado.*'],
    regla: 'Sin TTL: el mensaje espera hasta que vuelva el consumidor',
    dlq: 'q.cmd.email.dlq',
  },
  {
    nombre: 'q.cmd.sms',
    dominio: 'SMS al cliente',
    nodo: 'rabbit@rabbitmq',
    bindings: ['pedido.estado.despachado', 'pedido.estado.cancelado'],
    regla: 'TTL de 60 s: si nadie lo procesa a tiempo, expira y va a su DLQ',
    dlq: 'q.cmd.sms.dlq',
  },
  {
    nombre: 'q.cmd.facturacion',
    dominio: 'Facturación',
    nodo: 'rabbit@rabbitmq2',
    bindings: ['pedido.estado.aceptado', 'pedido.estado.cancelado'],
    regla:
      'Boleta al aceptar (pago aprobado) y nota de crédito al cancelar un pedido facturado. Máximo 100 mensajes',
    dlq: 'q.cmd.facturacion.dlq',
  },
];

export function routingKey(estado: EstadoPedido): string {
  return `pedido.estado.${estado.toLowerCase()}`;
}

/** Un binding topic con '*' coincide con exactamente una palabra. */
function coincide(binding: string, clave: string): boolean {
  const partesBinding = binding.split('.');
  const partesClave = clave.split('.');
  return (
    partesBinding.length === partesClave.length &&
    partesBinding.every((parte, i) => parte === '*' || parte === partesClave[i])
  );
}

/** Colas que reciben el evento de un estado. CREADO no se publica en RabbitMQ (solo en Kafka). */
export function colasDestino(estado: EstadoPedido): string[] {
  if (estado === 'CREADO') {
    return [];
  }
  const clave = routingKey(estado);
  return COLAS.filter((cola) => cola.bindings.some((b) => coincide(b, clave))).map(
    (cola) => cola.nombre,
  );
}

export type EventoPublicado = {
  id: string;
  pedidoId: number;
  desde: EstadoPedido;
  hacia: EstadoPedido;
  routingKey: string;
  colas: string[];
  fecha: string;
};
