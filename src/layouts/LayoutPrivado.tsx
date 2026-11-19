import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useSesion } from '../auth/sesion';
import { useCarrito } from '../carrito/carrito';

type Zona = 'cliente' | 'admin';

const NAVEGACION: Record<Zona, { ruta: string; texto: string }[]> = {
  cliente: [
    { ruta: '/tienda', texto: 'Tienda' },
    { ruta: '/mis-pedidos', texto: 'Mis pedidos' },
    { ruta: '/perfil', texto: 'Perfil' },
  ],
  admin: [
    { ruta: '/admin/pedidos', texto: 'Pedidos' },
    { ruta: '/admin/mensajeria', texto: 'Mensajería' },
    { ruta: '/admin/auditoria', texto: 'Auditoría' },
    { ruta: '/admin/reportes', texto: 'Reportes' },
  ],
};

/** Estructura común de las páginas privadas: barra superior, navegación de la zona y contenido. */
export default function LayoutPrivado({ zona }: { zona: Zona }) {
  const { perfil, esAdmin, cerrarSesion } = useSesion();
  const { unidades } = useCarrito();
  const navigate = useNavigate();

  async function salir() {
    await cerrarSesion();
    navigate('/');
  }

  return (
    <div className={`pagina pagina--${zona}`}>
      <header className="topbar">
        <div className="marca">
          <span className="marca__logo">W</span>
          <div>
            <p className="eyebrow">{zona === 'admin' ? 'Administración' : 'Tienda gamer'}</p>
            <strong>Wepay</strong>
          </div>
        </div>

        <div className="topbar__acciones">
          <span className="usuario">
            {perfil?.nombre || perfil?.email || 'Usuario'}
            <span className={`pill ${esAdmin ? 'pill--admin' : ''}`}>
              {esAdmin ? 'Admin' : 'Cliente'}
            </span>
          </span>
          {esAdmin ? (
            <NavLink className="boton boton--fantasma" to={zona === 'admin' ? '/tienda' : '/admin/pedidos'}>
              {zona === 'admin' ? 'Ver tienda' : 'Ir a administración'}
            </NavLink>
          ) : null}
          <button className="boton boton--fantasma" onClick={() => void salir()}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="nav-zona" aria-label={zona === 'admin' ? 'Administración' : 'Tienda'}>
        {NAVEGACION[zona].map((item) => (
          <NavLink key={item.ruta} className="nav-zona__link" to={item.ruta}>
            {item.texto}
            {item.ruta === '/tienda' && unidades > 0 ? (
              <span className="nav-zona__contador">{unidades}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
