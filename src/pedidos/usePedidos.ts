import { useCallback, useEffect, useState } from 'react';

import { mensajeDe } from '../api/cliente';
import { useApi } from '../api/useApi';
import type { Pedido } from '../domain/pedidos';

/**
 * Pedidos del BFF, actualizados cada cierto tiempo mientras la página está abierta.
 * El BFF devuelve todos a un ADMIN; con soloDe se filtran los de un usuario.
 */
export function usePedidos({ soloDe, cadaMs = 10_000 }: { soloDe?: string | null; cadaMs?: number } = {}) {
  const api = useApi();
  const [todos, setTodos] = useState<Pedido[] | null>(null);
  const [error, setError] = useState('');
  const [actualizado, setActualizado] = useState<Date | null>(null);

  const cargar = useCallback(
    () =>
      api
        .obtenerPedidos()
        .then((lista) => {
          setTodos(lista);
          setError('');
          setActualizado(new Date());
        })
        .catch((e: unknown) => setError(mensajeDe(e))),
    [api],
  );

  useEffect(() => {
    void cargar();
    if (!cadaMs) {
      return;
    }
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void cargar();
      }
    }, cadaMs);
    return () => window.clearInterval(id);
  }, [cargar, cadaMs]);

  const pedidos =
    todos === null
      ? null
      : todos
          .filter((p) => !soloDe || p.usuarioOid === soloDe)
          .sort((a, b) => b.id - a.id);

  return { pedidos, error, actualizado, recargar: cargar };
}
