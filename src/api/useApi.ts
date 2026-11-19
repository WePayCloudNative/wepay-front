import { useMemo } from 'react';
import { useMsal } from '@azure/msal-react';

import type { EstadoPedido, ItemCarrito, Pedido, Perfil, Producto } from '../domain/pedidos';
import { llamarApi } from './cliente';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Endpoints del BFF, ligados a la cuenta activa (cada llamada agrega el JWT). */
export function useApi() {
  const { instance, accounts } = useMsal();
  const cuentaId = (instance.getActiveAccount() ?? accounts[0])?.homeAccountId;

  return useMemo(() => {
    function llamar<T>(endpoint: string, opciones?: RequestInit): Promise<T> {
      const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
      if (!cuentaId || !account) {
        return Promise.reject(new Error('No hay una sesión activa.'));
      }
      return llamarApi<T>(instance, account, endpoint, opciones);
    }

    return {
      obtenerPerfil: () => llamar<Perfil>('/api/perfil'),
      obtenerProductos: () => llamar<Producto[]>('/api/productos'),
      obtenerPedidos: () => llamar<Pedido[]>('/api/pedidos'),
      crearPedido: (items: ItemCarrito[]) =>
        llamar<Pedido>('/api/pedidos', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ items }),
        }),
      /** El cliente cancela su propio pedido (el BFF valida dueño y estado). */
      cancelarPedido: (id: number) =>
        llamar<Pedido>(`/api/pedidos/${id}/cancelar`, { method: 'POST' }),
      cambiarEstado: (id: number, estado: EstadoPedido) =>
        llamar<Pedido>(`/api/pedidos/${id}/status`, {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify({ status: estado }),
        }),
    };
  }, [instance, cuentaId]);
}

export type Api = ReturnType<typeof useApi>;
