import { useCallback, useEffect, useState } from 'react';

import { mensajeDe } from '../api/cliente';
import { useApi } from '../api/useApi';
import type { Producto } from '../domain/pedidos';

// El catálogo se pide una vez y se comparte entre páginas (portada, tienda, producto).
let enMemoria: Producto[] | null = null;
let enCurso: Promise<Producto[]> | null = null;

/** Catálogo del BFF. Se ignoran productos sin id (versión antigua del BFF). */
export function useCatalogo() {
  const api = useApi();
  const [productos, setProductos] = useState<Producto[] | null>(enMemoria);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (enMemoria) {
      return;
    }
    let activo = true;
    enCurso ??= api.obtenerProductos().then((lista) => lista.filter((p) => p.id != null));
    enCurso
      .then((lista) => {
        enMemoria = lista;
        if (activo) {
          setProductos(lista);
          setError('');
        }
      })
      .catch((e: unknown) => {
        enCurso = null;
        if (activo) {
          setError(mensajeDe(e));
        }
      });
    return () => {
      activo = false;
    };
  }, [api, intento]);

  const reintentar = useCallback(() => {
    enMemoria = null;
    enCurso = null;
    setError('');
    setIntento((n) => n + 1);
  }, []);

  return { productos, error, reintentar };
}
