import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useSesion } from '../../auth/sesion';
import Aviso from '../../components/Aviso';
import EstadoCarga from '../../components/EstadoCarga';

export default function Perfil() {
  const { perfil, esAdmin, cargando, error, recargarPerfil } = useSesion();

  useEffect(() => {
    document.title = 'WePay | Mi perfil';
  }, []);

  return (
    <div className="contenedor seccion perfil">
      <h1 className="titulo-pagina">Mi perfil</h1>

      {cargando ? <EstadoCarga texto="Cargando perfil..." /> : null}
      {error ? (
        <Aviso tipo="error">
          {error}{' '}
          <button className="enlace-sutil" onClick={recargarPerfil}>
            Reintentar
          </button>
        </Aviso>
      ) : null}

      {perfil ? (
        <section className="panel">
          <dl className="datos">
            <div>
              <dt>Nombre</dt>
              <dd>{perfil.nombre || '—'}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{perfil.email || '—'}</dd>
            </div>
            <div>
              <dt>Tipo de cuenta</dt>
              <dd>{esAdmin ? 'Administrador' : 'Cliente'}</dd>
            </div>
          </dl>
          <p className="nota">
            Tu cuenta se administra con Microsoft. Para cambiar tu nombre o correo, hazlo en tu cuenta
            Microsoft.
          </p>
        </section>
      ) : null}

      {esAdmin ? (
        <p className="nota">
          Tienes permisos de administración. <Link to="/admin">Ir al panel de administración</Link>
        </p>
      ) : null}
    </div>
  );
}
