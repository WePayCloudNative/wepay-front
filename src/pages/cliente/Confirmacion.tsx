import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useSesion } from '../../auth/sesion';
import Aviso from '../../components/Aviso';
import EstadoCarga from '../../components/EstadoCarga';
import Icono from '../../components/Icono';
import ListaDetalle from '../../components/ListaDetalle';
import ProgresoPedido from '../../components/ProgresoPedido';
import { leerDespacho, NOMBRE_MEDIO } from '../../domain/despacho';
import { colasDestino, routingKey } from '../../domain/mensajeria';
import type { Pedido } from '../../domain/pedidos';
import { formatearFecha } from '../../utils/formato';

/**
 * Pantalla después de pagar. El cliente ve una confirmación de compra;
 * si quien compra es administrador, además ve qué pasó en el backend.
 */
export default function Confirmacion() {
  const { id } = useParams();
  const location = useLocation();
  const api = useApi();
  const { perfil, esAdmin } = useSesion();

  const desdePago = (location.state as { pedido?: Pedido } | null)?.pedido;
  const [pedido, setPedido] = useState<Pedido | null>(
    desdePago && String(desdePago.id) === id ? desdePago : null,
  );
  const [error, setError] = useState('');
  const [despacho] = useState(leerDespacho);

  useEffect(() => {
    document.title = `WePay | Pedido #${id ?? ''} recibido`;
  }, [id]);

  // Si se recargó la página, el pedido se busca de nuevo.
  useEffect(() => {
    if (pedido) {
      return;
    }
    let activo = true;
    api
      .obtenerPedidos()
      .then((lista) => {
        if (!activo) return;
        const encontrado = lista.find((p) => String(p.id) === id);
        if (encontrado) setPedido(encontrado);
        else setError('No encontramos este pedido en tu cuenta.');
      })
      .catch((e: unknown) => {
        if (activo) setError(mensajeDe(e));
      });
    return () => {
      activo = false;
    };
  }, [api, id, pedido]);

  if (error) {
    return (
      <div className="contenedor seccion">
        <Aviso tipo="error">{error}</Aviso>
        <Link className="boton boton--secundario" to="/mis-pedidos">
          Ver mis pedidos
        </Link>
      </div>
    );
  }
  if (!pedido) {
    return (
      <div className="contenedor seccion">
        <EstadoCarga texto="Cargando tu pedido..." />
      </div>
    );
  }

  const nombre = perfil?.nombre?.split(' ')[0];

  return (
    <div className="contenedor seccion confirmacion">
      <header className="confirmacion__encabezado">
        <span className="confirmacion__sello" aria-hidden="true">
          <Icono nombre="check" tamano={28} />
        </span>
        <h1>{nombre ? `Gracias, ${nombre}` : 'Gracias por tu compra'}</h1>
        <p>
          Recibimos tu pedido <strong>#{pedido.id}</strong>. Te escribiremos a{' '}
          {perfil?.email ? <strong>{perfil.email}</strong> : 'tu correo'} apenas confirmemos el pago.
        </p>
      </header>

      <div className="confirmacion__grilla">
        <section className="panel">
          <h2>Tu compra</h2>
          <ListaDetalle pedido={pedido} etiquetaTotal="Total" />
        </section>

        <section className="panel">
          <h2>Datos del pedido</h2>
          <dl className="datos">
            <div>
              <dt>Número</dt>
              <dd>#{pedido.id}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{formatearFecha(pedido.fechaRegistro)}</dd>
            </div>
            {despacho ? (
              <>
                <div>
                  <dt>Despacho a</dt>
                  <dd>
                    {despacho.nombre}
                    <br />
                    {despacho.direccion}, {despacho.comuna}, {despacho.region}
                  </dd>
                </div>
                <div>
                  <dt>Medio de pago</dt>
                  <dd>{NOMBRE_MEDIO[despacho.medio] ?? despacho.medio}</dd>
                </div>
              </>
            ) : null}
          </dl>
        </section>
      </div>

      <section className="panel">
        <h2>Qué sigue</h2>
        <ProgresoPedido estado={pedido.estado} />
        <p className="nota">
          Cuando confirmemos el pago recibirás la boleta por correo, y un SMS cuando el pedido salga
          a despacho.
        </p>
      </section>

      {esAdmin ? (
        <section className="panel panel--tecnico" aria-label="Detalle técnico para administración">
          <h2>Vista de administración</h2>
          <p>
            El pedido quedó en <strong>CREADO</strong>. ms-pedidos publicó el evento{' '}
            <code>OrderCreated</code> en Kafka (<code>orders.events</code>) para auditoría y reportes.
            RabbitMQ no recibe este estado.
          </p>
          <p>
            Al aceptarlo se publicará <code>{routingKey('ACEPTADO')}</code> en <code>ex.pedidos</code>{' '}
            y llegará a {colasDestino('ACEPTADO').map((c, i) => (
              <span key={c}>
                {i > 0 ? ' y ' : ''}
                <code>{c}</code>
              </span>
            ))}
            , donde se emite la boleta.
          </p>
          <Link className="boton boton--secundario" to={`/admin/pedidos?pedido=${pedido.id}`}>
            Gestionar este pedido
          </Link>
        </section>
      ) : null}

      <div className="acciones-centradas">
        <Link className="boton boton--primario" to={`/mis-pedidos/${pedido.id}`}>
          Seguir mi pedido
        </Link>
        <Link className="boton boton--secundario" to="/tienda">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
