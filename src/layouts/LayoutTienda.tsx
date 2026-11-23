import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useSesion } from '../auth/sesion';
import { useCarrito } from '../carrito/carrito';
import CarritoLateral from '../components/CarritoLateral';
import Icono from '../components/Icono';
import Marca from '../components/Marca';

const NAVEGACION = [
  { ruta: '/inicio', texto: 'Inicio' },
  { ruta: '/tienda', texto: 'Tienda' },
  { ruta: '/mis-pedidos', texto: 'Mis pedidos' },
];

/** Estructura de la tienda: franja, encabezado, contenido, pie y bolsa lateral. */
export default function LayoutTienda() {
  const { perfil, esAdmin, cerrarSesion } = useSesion();
  const carrito = useCarrito();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuCuenta, setMenuCuenta] = useState(false);
  const cuentaRef = useRef<HTMLDivElement>(null);

  // Cierra el menú de cuenta al hacer clic fuera.
  useEffect(() => {
    if (!menuCuenta) {
      return;
    }
    const alHacerClic = (evento: MouseEvent) => {
      if (!cuentaRef.current?.contains(evento.target as Node)) {
        setMenuCuenta(false);
      }
    };
    document.addEventListener('mousedown', alHacerClic);
    return () => document.removeEventListener('mousedown', alHacerClic);
  }, [menuCuenta]);

  // Al cambiar de página, vuelve arriba.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  async function salir() {
    setMenuCuenta(false);
    await cerrarSesion();
    navigate('/');
  }

  const nombre = perfil?.nombre?.split(' ')[0] || 'tu cuenta';

  return (
    <div className="sitio">
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <p className="franja">Despacho gratis a todo Chile en todas tus compras</p>

      <header className="cabecera">
        <div className="contenedor cabecera__fila">
          <Marca destino="/inicio" />

          <nav className="cabecera__nav" aria-label="Tienda">
            {NAVEGACION.map((item) => (
              <NavLink key={item.ruta} to={item.ruta} className="cabecera__link">
                {item.texto}
              </NavLink>
            ))}
          </nav>

          <div className="cabecera__iconos">
            <Link className="boton-icono" to="/tienda?buscar=1" aria-label="Buscar productos">
              <Icono nombre="buscar" />
            </Link>

            <div className="cuenta" ref={cuentaRef}>
              <button
                className="boton-icono"
                aria-label="Tu cuenta"
                aria-expanded={menuCuenta}
                onClick={() => setMenuCuenta((v) => !v)}
              >
                <Icono nombre="usuario" />
              </button>
              {menuCuenta ? (
                <div className="cuenta__menu" role="menu">
                  <p className="cuenta__saludo">
                    Hola, {nombre}
                    {esAdmin ? <span className="sello">Administrador</span> : null}
                  </p>
                  <Link role="menuitem" to="/perfil" onClick={() => setMenuCuenta(false)}>
                    Mi perfil
                  </Link>
                  <Link role="menuitem" to="/mis-pedidos" onClick={() => setMenuCuenta(false)}>
                    Mis pedidos
                  </Link>
                  {esAdmin ? (
                    <Link role="menuitem" to="/admin" onClick={() => setMenuCuenta(false)}>
                      Panel de administración
                    </Link>
                  ) : null}
                  <button role="menuitem" onClick={() => void salir()}>
                    Cerrar sesión
                  </button>
                </div>
              ) : null}
            </div>

            <button
              className="boton-icono bolsa"
              onClick={carrito.abrir}
              aria-label={`Abrir bolsa, ${carrito.unidades} productos`}
            >
              <Icono nombre="bolsa" />
              {carrito.unidades > 0 ? <span className="bolsa__contador">{carrito.unidades}</span> : null}
            </button>
          </div>
        </div>
      </header>

      <main id="contenido" className="sitio__contenido">
        <Outlet />
      </main>

      <footer className="pie">
        <div className="contenedor pie__grilla">
          <div>
            <Marca destino="/inicio" />
            <p className="pie__texto">Periféricos, monitores y sillas para jugar y crear.</p>
          </div>
          <div>
            <p className="pie__titulo">Comprar</p>
            <Link to="/tienda">Todos los productos</Link>
            <Link to="/mis-pedidos">Seguimiento de pedidos</Link>
          </div>
          <div>
            <p className="pie__titulo">Ayuda</p>
            <span>soporte@wepay.cl</span>
            <span>Lunes a viernes, 9:00 a 18:00</span>
          </div>
        </div>
        <p className="contenedor pie__legal">
          WePay es un proyecto académico de Duoc UC. Los pagos son simulados.
        </p>
      </footer>

      <CarritoLateral />
    </div>
  );
}
