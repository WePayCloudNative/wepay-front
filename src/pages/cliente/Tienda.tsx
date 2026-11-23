import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useCatalogo } from '../../catalogo/useCatalogo';
import Aviso from '../../components/Aviso';
import EstadoCarga from '../../components/EstadoCarga';
import Icono from '../../components/Icono';
import TarjetaProducto from '../../components/TarjetaProducto';
import { categoriaDe, categoriasDe, coincideBusqueda } from '../../domain/catalogo';

type Orden = 'destacados' | 'menor' | 'mayor';

export default function Tienda() {
  const { productos, error, reintentar } = useCatalogo();
  const [parametros, setParametros] = useSearchParams();
  const buscadorRef = useRef<HTMLInputElement>(null);

  const categoria = parametros.get('categoria') ?? '';
  const busqueda = parametros.get('q') ?? '';
  const orden = (parametros.get('orden') as Orden | null) ?? 'destacados';

  useEffect(() => {
    document.title = 'WePay | Tienda';
  }, []);

  // El ícono de búsqueda del encabezado llega con ?buscar=1
  useEffect(() => {
    if (parametros.get('buscar')) {
      buscadorRef.current?.focus();
    }
  }, [parametros]);

  function cambiar(clave: string, valor: string) {
    const siguientes = new URLSearchParams(parametros);
    siguientes.delete('buscar');
    if (valor) {
      siguientes.set(clave, valor);
    } else {
      siguientes.delete(clave);
    }
    setParametros(siguientes, { replace: true });
  }

  const categorias = useMemo(() => categoriasDe(productos ?? []), [productos]);

  const visibles = useMemo(() => {
    const filtrados = (productos ?? []).filter(
      (p) => (!categoria || categoriaDe(p) === categoria) && coincideBusqueda(p, busqueda),
    );
    if (orden === 'menor') return [...filtrados].sort((a, b) => a.price - b.price);
    if (orden === 'mayor') return [...filtrados].sort((a, b) => b.price - a.price);
    return filtrados;
  }, [productos, categoria, busqueda, orden]);

  return (
    <>
      <header className="cabecera-pagina">
        <h1>Nuestros productos</h1>
        <p>Todo lo que necesitas para tu escritorio, con despacho gratis.</p>
      </header>

      <div className="barra-filtros">
        <div className="contenedor barra-filtros__fila">
          <div className="pestanas" role="tablist" aria-label="Categorías">
            {['', ...categorias].map((c) => (
              <button
                key={c || 'todas'}
                role="tab"
                aria-selected={categoria === c}
                className={`pestana ${categoria === c ? 'pestana--activa' : ''}`}
                onClick={() => cambiar('categoria', c)}
              >
                {c || 'Todos'}
              </button>
            ))}
          </div>

          <div className="barra-filtros__herramientas">
            <label className="buscador">
              <Icono nombre="buscar" tamano={16} />
              <span className="sr-only">Buscar productos</span>
              <input
                ref={buscadorRef}
                type="search"
                placeholder="Buscar"
                value={busqueda}
                onChange={(e) => cambiar('q', e.target.value)}
              />
            </label>
            <label className="selector">
              <span className="sr-only">Ordenar</span>
              <select value={orden} onChange={(e) => cambiar('orden', e.target.value === 'destacados' ? '' : e.target.value)}>
                <option value="destacados">Destacados</option>
                <option value="menor">Menor precio</option>
                <option value="mayor">Mayor precio</option>
              </select>
            </label>
            {productos ? (
              <span className="contador">
                {visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <section className="seccion seccion--ajustada">
        <div className="contenedor">
          {error ? (
            <Aviso tipo="error">
              {error}{' '}
              <button className="enlace-sutil" onClick={reintentar}>
                Reintentar
              </button>
            </Aviso>
          ) : null}
          {!productos && !error ? <EstadoCarga texto="Cargando productos..." /> : null}

          {productos && visibles.length === 0 ? (
            <div className="vacio-grande">
              <p>No encontramos productos{busqueda ? ` para "${busqueda}"` : ''}.</p>
              <button
                className="boton boton--secundario"
                onClick={() => setParametros(new URLSearchParams(), { replace: true })}
              >
                Ver todos los productos
              </button>
            </div>
          ) : null}

          {visibles.length > 0 ? (
            <div className="grilla-productos">
              {visibles.map((producto) => (
                <TarjetaProducto key={producto.id} producto={producto} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
