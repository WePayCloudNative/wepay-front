import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useSesion } from '../../auth/sesion';
import Aviso from '../../components/Aviso';
import EstadoCarga from '../../components/EstadoCarga';

export default function Perfil() {
  const { perfil, esAdmin, cargando, error, recargarPerfil } = useSesion();

  useEffect(() => {
    document.title = 'Wepay | Perfil';
  }, []);

  return (
    <section className="tarjeta perfil">
      <p className="eyebrow">Tu cuenta</p>
      <h1>Perfil</h1>

      {cargando ? <EstadoCarga texto="Cargando perfil..." /> : null}
      {error ? (
        <Aviso tipo="error">
          {error}{' '}
          <button className="boton boton--chico" onClick={recargarPerfil}>
            Reintentar
          </button>
        </Aviso>
      ) : null}

      {perfil ? (
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
            <dt>Rol</dt>
            <dd>{esAdmin ? 'Administrador' : 'Cliente'}</dd>
          </div>
          <div>
            <dt>Identificador (OID de Entra ID)</dt>
            <dd className="mono">{perfil.oid}</dd>
          </div>
        </dl>
      ) : null}

      {esAdmin ? (
        <p className="nota">
          Tu cuenta tiene permisos de administración.{' '}
          <Link to="/admin/pedidos">Ir al panel de administración</Link>
        </p>
      ) : null}
    </section>
  );
}
