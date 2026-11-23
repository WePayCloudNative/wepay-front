import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { MAXIMO_POR_PRODUCTO, useCarrito } from '../../carrito/carrito';
import { useCatalogo } from '../../catalogo/useCatalogo';
import Aviso from '../../components/Aviso';
import EstadoCarga from '../../components/EstadoCarga';
import Icono from '../../components/Icono';
import ImagenProducto from '../../components/ImagenProducto';
import TarjetaProducto from '../../components/TarjetaProducto';
import { categoriaDe, descuentoDe, estaEnOferta } from '../../domain/catalogo';
import { formatearPesos } from '../../utils/formato';

/** La clave reinicia la cantidad elegida al pasar de un producto a otro. */
export default function DetalleProducto() {
  const { id } = useParams();
  return <Ficha key={id} id={id} />;
}

function Ficha({ id }: { id?: string }) {
  const { productos, error, reintentar } = useCatalogo();
  const carrito = useCarrito();
  const [cantidad, setCantidad] = useState(1);

  const producto = productos?.find((p) => String(p.id) === id);

  useEffect(() => {
    document.title = producto ? `WePay | ${producto.name}` : 'WePay | Producto';
  }, [producto]);

  if (error) {
    return (
      <div className="contenedor seccion">
        <Aviso tipo="error">
          {error}{' '}
          <button className="enlace-sutil" onClick={reintentar}>
            Reintentar
          </button>
        </Aviso>
      </div>
    );
  }
  if (!productos) {
    return (
      <div className="contenedor seccion">
        <EstadoCarga texto="Cargando producto..." />
      </div>
    );
  }
  if (!producto) {
    return (
      <div className="contenedor seccion vacio-grande">
        <p>Este producto ya no está disponible.</p>
        <Link className="boton boton--secundario" to="/tienda">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const oferta = estaEnOferta(producto);
  const enCarrito = carrito.cantidadDe(producto.id);
  const disponible = MAXIMO_POR_PRODUCTO - enCarrito;
  const relacionados = productos
    .filter((p) => p.id !== producto.id && categoriaDe(p) === categoriaDe(producto))
    .slice(0, 4);

  return (
    <>
      <div className="contenedor">
        <nav className="migas" aria-label="Ruta">
          <Link to="/tienda">Tienda</Link>
          <Icono nombre="avanzar" tamano={14} />
          <Link to={`/tienda?categoria=${encodeURIComponent(categoriaDe(producto))}`}>
            {categoriaDe(producto)}
          </Link>
        </nav>

        <article className="ficha">
          <div className="ficha__foto">
            <ImagenProducto key={producto.imagenUrl} src={producto.imagenUrl} nombre={producto.name} />
            {oferta ? <span className="etiqueta-oferta">{descuentoDe(producto)}% menos</span> : null}
          </div>

          <div className="ficha__datos">
            <p className="categoria">{categoriaDe(producto)}</p>
            <h1>{producto.name}</h1>
            <p className="precios precios--grande">
              <span className="precio">{formatearPesos(producto.price)}</span>
              {oferta && producto.precioAnterior ? (
                <s className="precio-anterior">{formatearPesos(producto.precioAnterior)}</s>
              ) : null}
            </p>
            <p className="ficha__descripcion">{producto.description}</p>

            <div className="ficha__compra">
              <div className="selector-cantidad selector-cantidad--grande" aria-label="Cantidad">
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  disabled={cantidad <= 1}
                  aria-label="Quitar una unidad"
                >
                  <Icono nombre="menos" tamano={16} />
                </button>
                <span>{cantidad}</span>
                <button
                  onClick={() => setCantidad((c) => Math.min(disponible, c + 1))}
                  disabled={cantidad >= disponible}
                  aria-label="Agregar una unidad"
                >
                  <Icono nombre="mas" tamano={16} />
                </button>
              </div>
              <button
                className="boton boton--primario"
                disabled={disponible <= 0}
                onClick={() => {
                  carrito.agregar(producto, cantidad);
                  setCantidad(1);
                  carrito.abrir();
                }}
              >
                {disponible <= 0 ? 'Máximo por compra alcanzado' : 'Agregar a la bolsa'}
              </button>
            </div>
            {enCarrito > 0 ? (
              <p className="nota">
                Ya tienes {enCarrito} en tu bolsa. Máximo {MAXIMO_POR_PRODUCTO} por producto.
              </p>
            ) : null}

            <ul className="ficha__garantias">
              <li>
                <Icono nombre="camion" tamano={18} /> Despacho gratis a todo Chile
              </li>
              <li>
                <Icono nombre="escudo" tamano={18} /> Garantía de 12 meses
              </li>
              <li>
                <Icono nombre="retorno" tamano={18} /> Cambios sin costo por 30 días
              </li>
            </ul>
          </div>
        </article>
      </div>

      {relacionados.length > 0 ? (
        <section className="seccion">
          <div className="contenedor">
            <h2 className="seccion__titulo">También en {categoriaDe(producto)}</h2>
            <div className="grilla-productos">
              {relacionados.map((p) => (
                <TarjetaProducto key={p.id} producto={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
