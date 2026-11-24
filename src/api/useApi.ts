import { useMemo } from 'react';
import { useMsal } from '@azure/msal-react';

import type { EventoAuditoria, EventoPedido } from '../domain/auditoria';
import type { DireccionGuardada } from '../domain/direccion';
import type { ResumenReportes } from '../domain/reportes';
import type { EstadoPedido, Pedido, Perfil, Producto } from '../domain/pedidos';
import { llamarApi } from './cliente';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Lo que se envía al comprar: solo producto y cantidad. El BFF pone nombre y precio desde el catálogo. */
export type ItemCompra = { productoId: number; cantidad: number };

/** Filtros de la bitácora; todos opcionales. desde/hasta van juntos, en UTC. */
export type FiltrosAuditoria = {
  pedidoId?: number;
  tipoEvento?: string;
  desde?: string;
  hasta?: string;
};

function aConsulta(filtros: FiltrosAuditoria): string {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '') {
      parametros.set(clave, String(valor));
    }
  }
  const texto = parametros.toString();
  return texto ? `?${texto}` : '';
}

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
      guardarDireccion: (direccion: DireccionGuardada) =>
        llamar<Perfil>('/api/perfil/direccion', {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify(direccion),
        }),
      obtenerProductos: () => llamar<Producto[]>('/api/productos'),
      obtenerPedidos: () => llamar<Pedido[]>('/api/pedidos'),
      crearPedido: (items: ItemCompra[]) =>
        llamar<Pedido>('/api/pedidos', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ items }),
        }),
      cambiarEstado: (id: number, estado: EstadoPedido) =>
        llamar<Pedido>(`/api/pedidos/${id}/status`, {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify({ status: estado }),
        }),
      /** El cliente cancela su propio pedido (el BFF valida dueño y estado). */
      cancelarPedido: (id: number) =>
        llamar<Pedido>(`/api/pedidos/${id}/cancelar`, { method: 'POST' }),
      /** Qué pasó con un pedido y cuándo (el cliente solo ve los suyos). */
      historialPedido: (id: number) => llamar<EventoPedido[]>(`/api/pedidos/${id}/historial`),
      /** Solo admin: bitácora de ms-auditoria. */
      obtenerAuditoria: (filtros: FiltrosAuditoria = {}) =>
        llamar<EventoAuditoria[]>(`/api/auditoria${aConsulta(filtros)}`),
      /** Solo admin: KPIs, más vendidos y ventas por hora de ms-reportes. */
      obtenerReportes: () => llamar<ResumenReportes>('/api/reportes'),
    };
  }, [instance, cuentaId]);
}

export type Api = ReturnType<typeof useApi>;
