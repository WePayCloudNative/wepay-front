import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useSesion } from '../auth/sesion';
import Icono, { type NombreIcono } from '../components/Icono';
import Marca from '../components/Marca';

const SECCIONES: { ruta: string; texto: string; icono: NombreIcono; fin?: boolean }[] = [
  { ruta: '/admin', texto: 'Resumen', icono: 'resumen', fin: true },
  { ruta: '/admin/pedidos', texto: 'Pedidos', icono: 'lista' },
  { ruta: '/admin/laboratorio', texto: 'Laboratorio RabbitMQ', icono: 'mensajes' },
  { ruta: '/admin/auditoria', texto: 'Auditoría', icono: 'historial' },
  { ruta: '/admin/reportes', texto: 'Reportes', icono: 'grafico' },
];

/** Backoffice: barra lateral fija y contenido a la derecha. */
export default function LayoutAdmin() {
  const { perfil, cerrarSesion } = useSesion();
  const navigate = useNavigate();

  async function salir() {
    await cerrarSesion();
    navigate('/');
  }

  return (
    <div className="backoffice">
      <aside className="backoffice__lateral">
        <Marca destino="/admin" subtitulo="Backoffice" />

        <nav className="backoffice__nav" aria-label="Administración">
          {SECCIONES.map((s) => (
            <NavLink key={s.ruta} to={s.ruta} end={s.fin} className="backoffice__link">
              <Icono nombre={s.icono} tamano={18} />
              {s.texto}
            </NavLink>
          ))}
        </nav>

        <div className="backoffice__pie">
          <NavLink to="/inicio" className="backoffice__link">
            <Icono nombre="tienda" tamano={18} />
            Ver la tienda
          </NavLink>
          <div className="backoffice__usuario">
            <p>{perfil?.nombre || perfil?.email || 'Administrador'}</p>
            <p className="texto-suave">{perfil?.email}</p>
          </div>
          <button className="backoffice__link" onClick={() => void salir()}>
            <Icono nombre="salir" tamano={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="backoffice__contenido">
        <Outlet />
      </main>
    </div>
  );
}
