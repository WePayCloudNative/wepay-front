import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import Aviso from '../components/Aviso';
import EstadoCarga from '../components/EstadoCarga';
import { useSesion } from './sesion';

/** Solo deja pasar a usuarios con rol ADMIN. El resto vuelve a la tienda. */
export default function RutaAdmin({ children }: { children: ReactNode }) {
  const { esAdmin, cargando, error, recargarPerfil } = useSesion();

  if (cargando) {
    return <EstadoCarga texto="Verificando permisos..." pantalla />;
  }
  if (error) {
    return (
      <main className="contenedor seccion">
        <Aviso tipo="error">
          No se pudo cargar tu perfil: {error}{' '}
          <button className="enlace-sutil" onClick={recargarPerfil}>
            Reintentar
          </button>
        </Aviso>
      </main>
    );
  }
  if (!esAdmin) {
    return <Navigate replace to="/inicio" />;
  }
  return <>{children}</>;
}
