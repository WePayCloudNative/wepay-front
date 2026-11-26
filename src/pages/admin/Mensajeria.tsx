import { useEffect } from 'react';

import BadgeEstado from '../../components/BadgeEstado';
import Comando from '../../components/Comando';
import {
  COLAS,
  colasDestino,
  EXCHANGE_DLX,
  EXCHANGE_PEDIDOS,
  routingKey,
} from '../../domain/mensajeria';
import { ETIQUETA_ESTADO, TODOS_LOS_ESTADOS } from '../../domain/pedidos';
import { useRegistroEventos } from '../../mensajeria/registro';
import { formatearHora } from '../../utils/formato';

const PRUEBAS = [
  {
    titulo: 'Consumidor caído',
    objetivo: 'Los mensajes esperan en su cola y se entregan cuando el servicio vuelve.',
    pasos: [
      { texto: 'Detén ms-notificaciones en ec2-microservicios (~/wepay):', comando: 'docker compose stop ms-notificaciones' },
      { texto: 'En Pedidos, cancela un pedido. Revisa el panel de RabbitMQ: q.cmd.email y q.cmd.sms quedan con Ready 1.' },
      { texto: 'Antes de 60 segundos, vuelve a levantarlo y revisa el log:', comando: 'docker compose start ms-notificaciones\nsleep 15\ndocker compose logs ms-notificaciones --tail 15' },
    ],
  },
  {
    titulo: 'TTL hacia la DLQ',
    objetivo: 'Un SMS que nadie procesa en 60 segundos expira y pasa a q.cmd.sms.dlq.',
    pasos: [
      { texto: 'Detén ms-notificaciones:', comando: 'docker compose stop ms-notificaciones' },
      { texto: 'Despacha o cancela un pedido y espera más de 60 segundos.' },
      { texto: 'En el panel: q.cmd.sms vuelve a 0 y q.cmd.sms.dlq queda con Ready 1 (x-death: expired). El correo sigue esperando en q.cmd.email.' },
      { texto: 'Vuelve a levantarlo:', comando: 'docker compose start ms-notificaciones' },
    ],
  },
  {
    titulo: 'Boleta y nota de crédito',
    objetivo: 'Al aceptar se emite la boleta; al cancelar un pedido ya aceptado, la nota de crédito.',
    pasos: [
      { texto: 'Acepta un pedido. En el log aparece la boleta:', comando: 'docker compose logs ms-notificaciones --tail 10 | grep FACTURACION' },
      { texto: 'Cancela ese mismo pedido. Aparece la nota de crédito que anula la boleta.' },
      { texto: 'Cancela un pedido que siga en Creado: facturación lo recibe, pero no emite nota de crédito porque no tenía boleta.' },
    ],
  },
  {
    titulo: 'Cancelación por el cliente',
    objetivo: 'El cliente cancela su propio pedido solo en Creado o Aceptado; el BFF valida dueño y estado.',
    pasos: [
      { texto: 'Como cliente, en Mis pedidos cancela un pedido Aceptado: llegan email y SMS, y facturación emite la nota de crédito.' },
      { texto: 'Cancela otro que siga en Creado: facturación responde que no tenía boleta.' },
      { texto: 'Cuando el admin lo pasa a En preparación, el botón desaparece. Forzarlo por API responde 409:', comando: 'curl -i -X POST -H "Authorization: Bearer $TOKEN" $API/api/pedidos/<id>/cancelar' },
      { texto: 'Un pedido de otro usuario responde 404, sin revelar que existe.' },
    ],
  },
  {
    titulo: 'Reintentos de facturación',
    objetivo: 'Una falla se reintenta 3 veces (esperas de 1 s y 2 s) y luego va a q.cmd.facturacion.dlq.',
    pasos: [
      { texto: 'Activa la falla simulada:', comando: 'APP_FALLA_FACTURACION=true docker compose up -d ms-notificaciones' },
      { texto: 'Acepta un pedido y revisa los 3 intentos en el log:', comando: 'docker compose logs ms-notificaciones --tail 40 | grep -E "FACTURACION|Retries"' },
      { texto: 'Quita la falla, y en el panel usa Move messages desde q.cmd.facturacion.dlq hacia q.cmd.facturacion:', comando: 'docker compose up -d ms-notificaciones' },
    ],
  },
];

export default function Mensajeria() {
  const { eventos, limpiar } = useRegistroEventos();

  useEffect(() => {
    document.title = 'WePay | Laboratorio RabbitMQ';
  }, []);

  return (
    <div className="pila">
      <section className="tarjeta">
        <p className="eyebrow">Laboratorio RabbitMQ</p>
        <h1>Cómo viaja un cambio de estado</h1>
        <div className="flujo" aria-label="Recorrido de un evento">
          <div className="flujo__caja">
            <strong>ms-pedidos</strong>
            <span>publica pedido.estado.&lt;estado&gt;</span>
          </div>
          <span className="flujo__flecha" aria-hidden="true">→</span>
          <div className="flujo__caja flujo__caja--exchange">
            <strong>{EXCHANGE_PEDIDOS}</strong>
            <span>exchange topic</span>
          </div>
          <span className="flujo__flecha" aria-hidden="true">→</span>
          <div className="flujo__caja">
            <strong>3 colas</strong>
            <span>según sus bindings</span>
          </div>
          <span className="flujo__flecha" aria-hidden="true">→</span>
          <div className="flujo__caja">
            <strong>ms-notificaciones</strong>
            <span>email, sms y facturación</span>
          </div>
        </div>
        <p className="nota">
          Si un mensaje falla, expira o no cabe, la cola lo envía a {EXCHANGE_DLX}, que lo deja en
          su DLQ. Las colas viven en un clúster de 2 nodos de RabbitMQ.
        </p>
      </section>

      <section className="tarjeta">
        <h2>Colas del clúster</h2>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cola</th>
                <th>Nodo</th>
                <th>Recibe (bindings)</th>
                <th>Regla</th>
                <th>DLQ</th>
              </tr>
            </thead>
            <tbody>
              {COLAS.map((cola) => (
                <tr key={cola.nombre}>
                  <td>
                    <strong className="mono">{cola.nombre}</strong>
                    <span className="texto-suave bloque">{cola.dominio}</span>
                  </td>
                  <td className="mono">{cola.nodo}</td>
                  <td className="mono">{cola.bindings.join(', ')}</td>
                  <td>{cola.regla}</td>
                  <td className="mono">{cola.dlq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tarjeta">
        <h2>Qué estado llega a qué cola</h2>
        <div className="tabla-scroll">
          <table className="tabla tabla--matriz">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Routing key</th>
                {COLAS.map((cola) => (
                  <th key={cola.nombre} className="centro">
                    {cola.dominio}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TODOS_LOS_ESTADOS.map((estado) => {
                const destino = colasDestino(estado);
                return (
                  <tr key={estado}>
                    <td>
                      <BadgeEstado estado={estado} />
                    </td>
                    <td className="mono">
                      {estado === 'CREADO' ? 'no se publica en RabbitMQ' : routingKey(estado)}
                    </td>
                    {COLAS.map((cola) => (
                      <td key={cola.nombre} className="centro">
                        {destino.includes(cola.nombre) ? (
                          <span className="marca-si" aria-label="Sí">✓</span>
                        ) : (
                          <span className="texto-suave" aria-label="No">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="nota">
          La creación de un pedido solo se publica en Kafka (OrderCreated), para auditoría y
          reportes.
        </p>
      </section>

      <section className="tarjeta">
        <div className="encabezado">
          <div>
            <h2>Eventos publicados desde este navegador</h2>
            <p className="texto-suave">
              Cada cambio de estado hecho en Pedidos. Compáralos con el panel de RabbitMQ y los
              logs de ms-notificaciones.
            </p>
          </div>
          {eventos.length > 0 ? (
            <button className="boton boton--fantasma" onClick={limpiar}>
              Limpiar
            </button>
          ) : null}
        </div>
        {eventos.length === 0 ? (
          <p className="vacio">Todavía no cambias el estado de ningún pedido en esta sesión.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Pedido</th>
                  <th>Cambio</th>
                  <th>Routing key</th>
                  <th>Colas</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td>{formatearHora(evento.fecha)}</td>
                    <td>#{evento.pedidoId}</td>
                    <td>
                      {ETIQUETA_ESTADO[evento.desde]} → {ETIQUETA_ESTADO[evento.hacia]}
                    </td>
                    <td className="mono">{evento.routingKey}</td>
                    <td className="mono">{evento.colas.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="tarjeta">
        <h2>Pruebas de RabbitMQ</h2>
        <p className="texto-suave">
          Los comandos se ejecutan en ec2-microservicios, dentro de ~/wepay. El panel de RabbitMQ
          está en http://&lt;IP pública de ec2-rabbitmq&gt;:15672.
        </p>
        <div className="grilla-pruebas">
          {PRUEBAS.map((prueba) => (
            <article className="prueba" key={prueba.titulo}>
              <h3>{prueba.titulo}</h3>
              <p className="texto-suave">{prueba.objetivo}</p>
              <ol>
                {prueba.pasos.map((paso) => (
                  <li key={paso.texto}>
                    <p>{paso.texto}</p>
                    {paso.comando ? <Comando texto={paso.comando} /> : null}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
