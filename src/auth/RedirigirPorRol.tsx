import { Navigate } from 'react-router-dom';

import Aviso from '../components/Aviso';
import EstadoCarga from '../components/EstadoCarga';
import { useSesion } from './sesion';

/** Después del login: el administrador va al backoffice y el cliente a la tienda. */
export default function RedirigirPorRol() {
  const { esAdmin, cargando, error, recargarPerfil } = useSesion();

  if (cargando) {
    return <EstadoCarga texto="Cargando tu perfil..." pantalla />;
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
  return <Navigate replace to={esAdmin ? '/admin' : '/inicio'} />;
}
