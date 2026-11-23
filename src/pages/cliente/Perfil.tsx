import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useSesion } from '../../auth/sesion';
import Aviso from '../../components/Aviso';
import EstadoCarga from '../../components/EstadoCarga';
import FormularioDireccion from '../../components/FormularioDireccion';
import Icono from '../../components/Icono';
import {
  aDireccionGuardada,
  borradorDesde,
  formatearTelefono,
  validarDireccion,
  type BorradorDireccion,
} from '../../domain/direccion';

export default function Perfil() {
  const api = useApi();
  const { perfil, esAdmin, cargando, error, recargarPerfil, actualizarPerfil } = useSesion();

  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState<BorradorDireccion | null>(null);
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    document.title = 'WePay | Mi perfil';
  }, []);

  const guardada = perfil?.direccion ?? null;
  const valor = borrador ?? borradorDesde(guardada);
  const errores = intento ? validarDireccion(valor) : {};

  function empezarEdicion() {
    setBorrador(borradorDesde(guardada));
    setIntento(false);
    setAviso(null);
    setEditando(true);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setIntento(true);
    if (Object.keys(validarDireccion(valor)).length > 0) {
      return;
    }
    setGuardando(true);
    try {
      actualizarPerfil(await api.guardarDireccion(aDireccionGuardada(valor)));
      setEditando(false);
      setBorrador(null);
      setAviso({ tipo: 'exito', texto: 'Guardamos tu dirección. La usaremos en tus próximas compras.' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: mensajeDe(e) });
    } finally {
      setGuardando(false);
    }
  }

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
        <div className="pila-perfil">
          <section className="panel">
            <h2>Cuenta</h2>
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
              Tu nombre y correo vienen de tu cuenta Microsoft; se cambian allí.
            </p>
          </section>

          <section className="panel">
            <div className="panel__cabecera">
              <h2>Dirección de despacho</h2>
              {!editando && guardada ? (
                <button className="enlace-sutil" onClick={empezarEdicion}>
                  Cambiar
                </button>
              ) : null}
            </div>

            {aviso ? (
              <Aviso tipo={aviso.tipo} onCerrar={() => setAviso(null)}>
                {aviso.texto}
              </Aviso>
            ) : null}

            {editando ? (
              <form className="bloque-formulario" noValidate onSubmit={(e) => void guardar(e)}>
                <FormularioDireccion valor={valor} onCambiar={setBorrador} errores={errores} />
                <div className="acciones campo--ancho">
                  <button className="boton boton--primario" type="submit" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar dirección'}
                  </button>
                  <button
                    className="boton boton--secundario"
                    type="button"
                    disabled={guardando}
                    onClick={() => {
                      setEditando(false);
                      setBorrador(null);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : guardada ? (
              <div className="tarjeta-direccion">
                <Icono nombre="camion" tamano={22} />
                <div>
                  <p className="tarjeta-direccion__titulo">{guardada.direccion}</p>
                  <p>
                    {guardada.comuna}, {guardada.region}
                  </p>
                  <p className="texto-suave">{formatearTelefono(guardada.telefono)}</p>
                </div>
              </div>
            ) : (
              <div className="acciones">
                <p className="texto-suave">
                  Aún no guardas una dirección. Guárdala para no escribirla en cada compra.
                </p>
                <button className="boton boton--secundario" onClick={empezarEdicion}>
                  Agregar dirección
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {esAdmin ? (
        <p className="nota">
          Tienes permisos de administración. <Link to="/admin">Ir al panel de administración</Link>
        </p>
      ) : null}
    </div>
  );
}
