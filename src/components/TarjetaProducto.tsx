import { Link } from 'react-router-dom';

import { useCarrito } from '../carrito/carrito';
import { categoriaDe, estaEnOferta } from '../domain/catalogo';
import type { Producto } from '../domain/pedidos';
import { formatearPesos } from '../utils/formato';
import ImagenProducto from './ImagenProducto';

export default function TarjetaProducto({ producto }: { producto: Producto }) {
  const carrito = useCarrito();
  const enCarrito = carrito.cantidadDe(producto.id);
  const oferta = estaEnOferta(producto);

  return (
    <article className="tarjeta-producto">
      <Link className="tarjeta-producto__enlace" to={`/tienda/${producto.id}`}>
        <div className="tarjeta-producto__foto">
          <ImagenProducto src={producto.imagenUrl} nombre={producto.name} />
          {oferta ? <span className="etiqueta-oferta">Oferta</span> : null}
        </div>
        <p className="categoria">{categoriaDe(producto)}</p>
        <h3 className="tarjeta-producto__nombre">{producto.name}</h3>
      </Link>
      <p className="precios">
        <span className="precio">{formatearPesos(producto.price)}</span>
        {oferta && producto.precioAnterior ? (
          <s className="precio-anterior">{formatearPesos(producto.precioAnterior)}</s>
        ) : null}
      </p>
      <button
        className="enlace-accion"
        onClick={() => {
          carrito.agregar(producto);
          carrito.abrir();
        }}
      >
        {enCarrito > 0 ? `Agregar otro (${enCarrito} en tu bolsa)` : 'Agregar a la bolsa'}
      </button>
    </article>
  );
}
