import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ItemCarrito } from '../domain/pedidos';
import { CarritoContext, MAXIMO_POR_PRODUCTO, type Carrito } from './carrito';

// v2: desde que los items se identifican por productoId
const CLAVE = 'wepay.carrito.v2';

function leerGuardado(): ItemCarrito[] {
  try {
    const texto = sessionStorage.getItem(CLAVE);
    const items = texto ? (JSON.parse(texto) as ItemCarrito[]) : [];
    return Array.isArray(items) ? items.filter((item) => typeof item.productoId === 'number') : [];
  } catch {
    return [];
  }
}

function limitar(cantidad: number): number {
  return Math.max(0, Math.min(cantidad, MAXIMO_POR_PRODUCTO));
}

export default function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(leerGuardado);
  const [abierto, setAbierto] = useState(false);
  // Estables, para que el panel no se reinicie al cambiar cantidades.
  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      // Sin almacenamiento disponible: el carrito sigue funcionando en memoria.
    }
  }, [items]);

  const valor = useMemo<Carrito>(
    () => ({
      items,
      unidades: items.reduce((suma, item) => suma + item.cantidad, 0),
      total: items.reduce((suma, item) => suma + item.precio * item.cantidad, 0),
      abierto,
      abrir,
      cerrar,
      agregar: (producto, cantidad = 1) =>
        setItems((actuales) => {
          const existente = actuales.find((item) => item.productoId === producto.id);
          if (existente) {
            return actuales.map((item) =>
              item.productoId === producto.id
                ? { ...item, cantidad: limitar(item.cantidad + cantidad) }
                : item,
            );
          }
          return [
            ...actuales,
            {
              productoId: producto.id,
              nombre: producto.name,
              precio: producto.price,
              cantidad: limitar(cantidad),
              imagenUrl: producto.imagenUrl,
              categoria: producto.categoria,
            },
          ];
        }),
      cambiarCantidad: (productoId, cantidad) =>
        setItems((actuales) =>
          cantidad <= 0
            ? actuales.filter((item) => item.productoId !== productoId)
            : actuales.map((item) =>
                item.productoId === productoId ? { ...item, cantidad: limitar(cantidad) } : item,
              ),
        ),
      quitar: (productoId) =>
        setItems((actuales) => actuales.filter((item) => item.productoId !== productoId)),
      vaciar: () => setItems([]),
      cantidadDe: (productoId) =>
        items.find((item) => item.productoId === productoId)?.cantidad ?? 0,
    }),
    [items, abierto, abrir, cerrar],
  );

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}
