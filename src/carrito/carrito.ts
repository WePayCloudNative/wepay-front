import { createContext, useContext } from 'react';

import type { ItemCarrito, Producto } from '../domain/pedidos';

export const MAXIMO_POR_PRODUCTO = 10;

export type Carrito = {
  items: ItemCarrito[];
  unidades: number;
  total: number;
  /** Panel lateral del carrito */
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  agregar: (producto: Producto, cantidad?: number) => void;
  cambiarCantidad: (productoId: number, cantidad: number) => void;
  quitar: (productoId: number) => void;
  vaciar: () => void;
  cantidadDe: (productoId: number) => number;
};

export const CarritoContext = createContext<Carrito | null>(null);

/** El carrito vive solo en el navegador: nada llega al backend hasta confirmar la compra. */
export function useCarrito(): Carrito {
  const carrito = useContext(CarritoContext);
  if (!carrito) {
    throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  }
  return carrito;
}
