import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { MAXIMO_POR_PRODUCTO, useCarrito } from '../carrito/carrito';
import { formatearPesos } from '../utils/formato';
import Icono from './Icono';
import ImagenProducto from './ImagenProducto';

/** Bolsa de compras como panel lateral: se revisa sin salir de la página. */
export default function CarritoLateral() {
  const carrito = useCarrito();
  const navigate = useNavigate();
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const { abierto, cerrar } = carrito;

  useEffect(() => {
    if (!abierto) {
      return;
    }
    cerrarRef.current?.focus();
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        cerrar();
      }
    };
    document.addEventListener('keydown', alPresionar);
    document.body.classList.add('sin-scroll');
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.classList.remove('sin-scroll');
    };
  }, [abierto, cerrar]);

  if (!abierto) {
    return null;
  }

  return (
    <div className="lateral" role="presentation">
      <div className="lateral__fondo" onClick={cerrar} />
      <aside className="lateral__panel" role="dialog" aria-modal="true" aria-labelledby="titulo-bolsa">
        <header className="lateral__cabecera">
          <h2 id="titulo-bolsa">
            Tu bolsa <span className="texto-suave">({carrito.unidades})</span>
          </h2>
          <button ref={cerrarRef} className="boton-icono" onClick={cerrar} aria-label="Cerrar bolsa">
            <Icono nombre="cerrar" />
          </button>
        </header>

        {carrito.items.length === 0 ? (
          <div className="lateral__vacio">
            <Icono nombre="bolsa" tamano={36} />
            <p>Tu bolsa está vacía.</p>
            <button
              className="boton boton--secundario"
              onClick={() => {
                cerrar();
                navigate('/tienda');
              }}
            >
              Ver productos
            </button>
          </div>
        ) : (
          <>
            <ul className="lateral__lista">
              {carrito.items.map((item) => (
                <li className="linea-bolsa" key={item.productoId}>
                  <ImagenProducto src={item.imagenUrl} nombre={item.nombre} tamano="mini" />
                  <div className="linea-bolsa__datos">
                    <p className="linea-bolsa__nombre">{item.nombre}</p>
                    <p className="texto-suave">{formatearPesos(item.precio)}</p>
                    <div className="selector-cantidad" aria-label={`Cantidad de ${item.nombre}`}>
                      <button
                        onClick={() => carrito.cambiarCantidad(item.productoId, item.cantidad - 1)}
                        aria-label="Quitar una unidad"
                      >
                        <Icono nombre="menos" tamano={16} />
                      </button>
                      <span>{item.cantidad}</span>
                      <button
                        onClick={() => carrito.cambiarCantidad(item.productoId, item.cantidad + 1)}
                        disabled={item.cantidad >= MAXIMO_POR_PRODUCTO}
                        aria-label="Agregar una unidad"
                      >
                        <Icono nombre="mas" tamano={16} />
                      </button>
                    </div>
                  </div>
                  <div className="linea-bolsa__final">
                    <strong>{formatearPesos(item.precio * item.cantidad)}</strong>
                    <button className="enlace-sutil" onClick={() => carrito.quitar(item.productoId)}>
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="lateral__pie">
              <div className="fila-total">
                <span>Subtotal</span>
                <strong>{formatearPesos(carrito.total)}</strong>
              </div>
              <p className="nota">Despacho gratis. El total final se confirma al pagar.</p>
              <button
                className="boton boton--primario boton--ancho"
                onClick={() => {
                  cerrar();
                  navigate('/pago');
                }}
              >
                Ir a pagar
              </button>
              <button className="boton boton--secundario boton--ancho" onClick={cerrar}>
                Seguir comprando
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
