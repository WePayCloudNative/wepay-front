import { createContext, useContext } from 'react';

import type { Perfil } from '../domain/pedidos';

export type Sesion = {
  perfil: Perfil | null;
  esAdmin: boolean;
  cargando: boolean;
  error: string;
  recargarPerfil: () => void;
  /** Reemplaza el perfil con el que devolvió el BFF (por ejemplo, al guardar la dirección). */
  actualizarPerfil: (perfil: Perfil) => void;
  cerrarSesion: () => Promise<void>;
};

export const SesionContext = createContext<Sesion | null>(null);

/** Perfil y rol del usuario autenticado, consultados una sola vez al BFF. */
export function useSesion(): Sesion {
  const sesion = useContext(SesionContext);
  if (!sesion) {
    throw new Error('useSesion debe usarse dentro de SesionProvider');
  }
  return sesion;
}
