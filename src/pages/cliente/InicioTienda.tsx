import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useSesion } from '../../auth/sesion';
import { useCatalogo } from '../../catalogo/useCatalogo';
import Aviso from '../../components/Aviso';
import Beneficios from '../../components/Beneficios';
import EstadoCarga from '../../components/EstadoCarga';
import Portada from '../../components/Portada';
import TarjetaProducto from '../../components/TarjetaProducto';
import { destacados } from '../../domain/catalogo';

const RAZONES = [
  { titulo: 'Un solo inicio de sesión', texto: 'Entras con tu cuenta Microsoft; no guardamos contraseñas.' },
  { titulo: 'Seguimiento al minuto', texto: 'Cada cambio de tu pedido se refleja en Mis pedidos.' },
  { titulo: 'Boleta electrónica', texto: 'Se emite apenas confirmamos el pago, y se anula si cancelas.' },
];

export default function InicioTienda() {
  const { perfil } = useSesion();
  const { productos, error, reintentar } = useCatalogo();

  useEffect(() => {
    document.title = 'WePay | Inicio';
  }, []);

  return (
    <>
      <Portada
        acciones={
          <>
            <Link className="boton boton--claro" to="/tienda">
              Ver productos
            </Link>
            <Link className="boton boton--contorno-claro" to="/mis-pedidos">
              Mis pedidos
            </Link>
          </>
        }
      />

      <section className="seccion">
        <div className="contenedor">
          <div className="seccion__encabezado">
            <div>
              <h2 className="seccion__titulo">
                {perfil?.nombre ? `Elegidos para ti, ${perfil.nombre.split(' ')[0]}` : 'Destacados'}
              </h2>
              <p className="seccion__bajada">Las ofertas de la semana y lo más pedido.</p>
            </div>
            <Link className="enlace-subrayado" to="/tienda">
              Ver todos
            </Link>
          </div>

          {error ? (
            <Aviso tipo="error">
              {error}{' '}
              <button className="enlace-sutil" onClick={reintentar}>
                Reintentar
              </button>
            </Aviso>
          ) : null}
          {!productos && !error ? <EstadoCarga texto="Cargando productos..." /> : null}
          {productos ? (
            <div className="grilla-productos">
              {destacados(productos).map((producto) => (
                <TarjetaProducto key={producto.id} producto={producto} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <Beneficios />

      <section className="historia">
        <div className="historia__foto" aria-hidden="true" />
        <div className="historia__texto">
          <h2>Hecho para sesiones largas</h2>
          <p>
            Elegimos cada producto pensando en las horas que pasas frente a la pantalla: comodidad,
            precisión y que dure. Si algo no te convence, lo cambias sin costo.
          </p>
          <dl className="historia__datos">
            {RAZONES.map((r) => (
              <div key={r.titulo}>
                <dt>{r.titulo}</dt>
                <dd>{r.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
