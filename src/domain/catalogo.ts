import type { Producto } from './pedidos';

export const SIN_CATEGORIA = 'General';

export function categoriaDe(producto: Pick<Producto, 'categoria'>): string {
  return producto.categoria?.trim() || SIN_CATEGORIA;
}

/** Categorías presentes en el catálogo, en orden alfabético. */
export function categoriasDe(productos: Producto[]): string[] {
  return [...new Set(productos.map(categoriaDe))].sort((a, b) => a.localeCompare(b, 'es'));
}

export function estaEnOferta(producto: Producto): boolean {
  return producto.precioAnterior != null && producto.precioAnterior > producto.price;
}

export function descuentoDe(producto: Producto): number {
  if (!estaEnOferta(producto) || !producto.precioAnterior) {
    return 0;
  }
  return Math.round((1 - producto.price / producto.precioAnterior) * 100);
}

/** Destacados de la portada: primero las ofertas, luego el resto, hasta 4. */
export function destacados(productos: Producto[]): Producto[] {
  const ofertas = productos.filter(estaEnOferta);
  const resto = productos.filter((p) => !estaEnOferta(p));
  return [...ofertas, ...resto].slice(0, 4);
}

/** Quita tildes y mayúsculas para buscar sin importar cómo se escriba. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function coincideBusqueda(producto: Producto, busqueda: string): boolean {
  const termino = normalizar(busqueda);
  if (!termino) {
    return true;
  }
  return normalizar(`${producto.name} ${producto.description} ${categoriaDe(producto)}`).includes(
    termino,
  );
}
