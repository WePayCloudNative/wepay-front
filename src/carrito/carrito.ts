import { createContext, useContext } from 'react';

import type { ItemCarrito, Producto } from '../domain/pedidos';

export type Carrito = {
  items: ItemCarrito[];
  unidades: number;
  total: number;
  agregar: (producto: Producto) => void;
  cambiarCantidad: (nombre: string, cantidad: number) => void;
  quitar: (nombre: string) => void;
  vaciar: () => void;
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
