import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ItemCarrito } from '../domain/pedidos';
import { CarritoContext, type Carrito } from './carrito';

const CLAVE = 'wepay.carrito';
const MAXIMO_POR_PRODUCTO = 10;

function leerGuardado(): ItemCarrito[] {
  try {
    const texto = sessionStorage.getItem(CLAVE);
    return texto ? (JSON.parse(texto) as ItemCarrito[]) : [];
  } catch {
    return [];
  }
}

export default function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(leerGuardado);

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
      agregar: (producto) =>
        setItems((actuales) => {
          const existente = actuales.find((item) => item.nombre === producto.name);
          if (existente) {
            return actuales.map((item) =>
              item.nombre === producto.name
                ? { ...item, cantidad: Math.min(item.cantidad + 1, MAXIMO_POR_PRODUCTO) }
                : item,
            );
          }
          return [...actuales, { nombre: producto.name, precio: producto.price, cantidad: 1 }];
        }),
      cambiarCantidad: (nombre, cantidad) =>
        setItems((actuales) =>
          cantidad <= 0
            ? actuales.filter((item) => item.nombre !== nombre)
            : actuales.map((item) =>
                item.nombre === nombre
                  ? { ...item, cantidad: Math.min(cantidad, MAXIMO_POR_PRODUCTO) }
                  : item,
              ),
        ),
      quitar: (nombre) => setItems((actuales) => actuales.filter((item) => item.nombre !== nombre)),
      vaciar: () => setItems([]),
    }),
    [items],
  );

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}
