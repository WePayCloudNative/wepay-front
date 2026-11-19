import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';

import { obtenerToken } from '../auth/token';

/** Error de una llamada al BFF, con el código HTTP y un mensaje listo para mostrar. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

function urlBase(): string {
  const base = window.RUNTIME_CONFIG.VITE_BFF_BASE_URL?.replace(/\/$/, '');
  if (!base) {
    throw new Error('VITE_BFF_BASE_URL no está configurada en public/config.js');
  }
  return base;
}

function mensajeDeError(status: number, texto: string): string {
  let detalle = '';
  try {
    const cuerpo = JSON.parse(texto) as Record<string, unknown>;
    const candidato = cuerpo.mensaje ?? cuerpo.message ?? cuerpo.detail;
    if (typeof candidato === 'string') {
      detalle = candidato;
    }
  } catch {
    // La respuesta no era JSON: se usa el mensaje genérico.
  }

  if (status === 401) return 'Tu sesión expiró. Cierra sesión y vuelve a entrar.';
  if (status === 403) return 'No tienes permisos para esta acción.';
  if (status === 409) return detalle || 'La operación no es válida para el estado actual.';
  if (status >= 500) {
    return detalle
      ? `Error del servidor: ${detalle}`
      : 'El servidor no pudo completar la operación. Revisa los logs de los microservicios.';
  }
  return detalle || `Error ${status}`;
}

/** Llama al BFF con el JWT de la sesión y devuelve el cuerpo ya convertido desde JSON. */
export async function llamarApi<T>(
  instance: IPublicClientApplication,
  account: AccountInfo,
  endpoint: string,
  opciones: RequestInit = {},
): Promise<T> {
  const token = await obtenerToken(instance, account);
  if (!token.accessToken) {
    throw new Error('No se obtuvo el access token');
  }

  const headers = new Headers(opciones.headers);
  headers.set('Authorization', `Bearer ${token.accessToken}`);
  const ruta = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${urlBase()}${ruta}`, { ...opciones, headers });
  } catch {
    throw new ApiError(
      0,
      'No se pudo conectar con el servidor. Revisa que el laboratorio de AWS esté encendido.',
    );
  }

  const texto = await respuesta.text();
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, mensajeDeError(respuesta.status, texto));
  }
  return (texto ? JSON.parse(texto) : undefined) as T;
}

export function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
