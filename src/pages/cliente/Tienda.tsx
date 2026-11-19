import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useCarrito } from '../../carrito/carrito';
import Aviso from '../../components/Aviso';
import EstadoCarga from '../../components/EstadoCarga';
import type { Pedido, Producto } from '../../domain/pedidos';
import { formatearPesos } from '../../utils/formato';

export default function Tienda() {
  const api = useApi();
  const carrito = useCarrito();

  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorCompra, setErrorCompra] = useState('');
  const [pedidoCreado, setPedidoCreado] = useState<Pedido | null>(null);

  useEffect(() => {
    document.title = 'Wepay | Tienda';
    let activo = true;
    api
      .obtenerProductos()
      .then((lista) => {
        if (activo) setProductos(lista);
      })
      .catch((e: unknown) => {
        if (activo) setErrorCatalogo(mensajeDe(e));
      });
    return () => {
      activo = false;
    };
  }, [api]);

  async function confirmarCompra() {
    setEnviando(true);
    setErrorCompra('');
    try {
      const pedido = await api.crearPedido(carrito.items);
      carrito.vaciar();
      setPedidoCreado(pedido);
    } catch (e) {
      setErrorCompra(mensajeDe(e));
    } finally {
      setEnviando(false);
    }
  }

  function cantidadEnCarrito(producto: Producto) {
    return carrito.items.find((item) => item.nombre === producto.name)?.cantidad ?? 0;
  }

  return (
    <div className="tienda">
      <section className="tarjeta">
        <div className="encabezado">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h1>Productos disponibles</h1>
          </div>
        </div>

        {errorCatalogo ? <Aviso tipo="error">{errorCatalogo}</Aviso> : null}
        {!productos && !errorCatalogo ? <EstadoCarga texto="Cargando catálogo..." /> : null}

        {productos ? (
          <div className="grilla-productos">
            {productos.map((producto) => {
              const enCarrito = cantidadEnCarrito(producto);
              return (
                <article className="producto" key={producto.name}>
                  <h2>{producto.name}</h2>
                  <p className="texto-suave">{producto.description}</p>
                  <div className="producto__pie">
                    <strong className="precio">{formatearPesos(producto.price)}</strong>
                    <button
                      className="boton boton--chico boton--primario"
                      onClick={() => {
                        setPedidoCreado(null);
                        carrito.agregar(producto);
                      }}
                    >
                      {enCarrito > 0 ? `Agregar otro (${enCarrito})` : 'Agregar'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <aside className="tarjeta carrito">
        <p className="eyebrow">Tu compra</p>
        <h2>Carrito</h2>

        {pedidoCreado ? (
          <Aviso tipo="exito">
            Pedido <strong>#{pedidoCreado.id}</strong> creado por{' '}
            <strong>{formatearPesos(pedidoCreado.total)}</strong>. Puedes seguir su avance en{' '}
            <Link to="/mis-pedidos">Mis pedidos</Link>.
          </Aviso>
        ) : null}
        {errorCompra ? <Aviso tipo="error">{errorCompra}</Aviso> : null}

        {carrito.items.length === 0 ? (
          <p className="vacio">Aún no agregas productos.</p>
        ) : (
          <>
            <ul className="carrito__lista">
              {carrito.items.map((item) => (
                <li className="carrito__item" key={item.nombre}>
                  <div>
                    <strong>{item.nombre}</strong>
                    <span className="texto-suave">{formatearPesos(item.precio)} c/u</span>
                  </div>
                  <div className="cantidad">
                    <button
                      className="boton boton--chico"
                      aria-label={`Quitar una unidad de ${item.nombre}`}
                      onClick={() => carrito.cambiarCantidad(item.nombre, item.cantidad - 1)}
                    >
                      −
                    </button>
                    <span>{item.cantidad}</span>
                    <button
                      className="boton boton--chico"
                      aria-label={`Agregar una unidad de ${item.nombre}`}
                      onClick={() => carrito.cambiarCantidad(item.nombre, item.cantidad + 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="carrito__total">
              <span>Total</span>
              <strong className="precio">{formatearPesos(carrito.total)}</strong>
            </div>

            <button
              className="boton boton--primario boton--ancho"
              disabled={enviando}
              onClick={() => void confirmarCompra()}
            >
              {enviando ? 'Confirmando...' : 'Confirmar compra'}
            </button>
            <p className="nota">
              Pago simulado: no se cobra nada. Al confirmar se crea el pedido en estado Creado.
            </p>
            <button className="boton boton--fantasma boton--ancho" onClick={carrito.vaciar}>
              Vaciar carrito
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
