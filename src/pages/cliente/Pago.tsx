import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useSesion } from '../../auth/sesion';
import { useCarrito } from '../../carrito/carrito';
import Aviso from '../../components/Aviso';
import Icono from '../../components/Icono';
import ImagenProducto from '../../components/ImagenProducto';
import { CLAVE_DESPACHO, type DatosDespacho } from '../../domain/despacho';
import { formatearPesos } from '../../utils/formato';

const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
  'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos',
  'Los Lagos', 'Aysén', 'Magallanes',
];

const MEDIOS = [
  { id: 'credito', titulo: 'Tarjeta de crédito', texto: 'Hasta 3 cuotas sin interés' },
  { id: 'debito', titulo: 'Tarjeta de débito', texto: 'Cargo inmediato' },
  { id: 'transferencia', titulo: 'Transferencia', texto: 'Se confirma al recibir el pago' },
];


export default function Pago() {
  const api = useApi();
  const { perfil } = useSesion();
  const carrito = useCarrito();
  const navigate = useNavigate();

  // El nombre parte con el del perfil, que puede llegar después de abrir la página.
  const [nombreEditado, setNombreEditado] = useState<string | null>(null);
  const nombre = nombreEditado ?? perfil?.nombre ?? '';
  const [datos, setDatos] = useState<Omit<DatosDespacho, 'nombre'>>({
    direccion: '',
    comuna: '',
    region: 'Metropolitana',
    telefono: '',
    medio: 'credito',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'WePay | Pago';
  }, []);

  function cambiar<K extends keyof typeof datos>(campo: K, valor: (typeof datos)[K]) {
    setDatos((d) => ({ ...d, [campo]: valor }));
  }

  async function pagar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const pedido = await api.crearPedido(
        carrito.items.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad })),
      );
      try {
        const despacho: DatosDespacho = { ...datos, nombre };
        sessionStorage.setItem(CLAVE_DESPACHO, JSON.stringify(despacho));
      } catch {
        // La confirmación funciona igual sin la dirección guardada.
      }
      carrito.vaciar();
      navigate(`/pedido/${pedido.id}/confirmado`, { replace: true, state: { pedido } });
    } catch (e) {
      setError(mensajeDe(e));
      setEnviando(false);
    }
  }

  if (carrito.items.length === 0) {
    return (
      <div className="contenedor seccion vacio-grande">
        <h1 className="titulo-pagina">Tu bolsa está vacía</h1>
        <p>Agrega productos para continuar con el pago.</p>
        <Link className="boton boton--primario" to="/tienda">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="contenedor seccion">
      <Link className="volver" to="/tienda">
        <Icono nombre="volver" tamano={16} /> Seguir comprando
      </Link>
      <h1 className="titulo-pagina">Pago</h1>

      <form className="pago" onSubmit={(e) => void pagar(e)}>
        <div className="pago__formulario">
          <fieldset className="bloque-formulario">
            <legend>Despacho</legend>
            <label className="campo campo--ancho">
              <span>Nombre de quien recibe</span>
              <input
                required
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombreEditado(e.target.value)}
              />
            </label>
            <label className="campo campo--ancho">
              <span>Dirección</span>
              <input
                required
                autoComplete="street-address"
                placeholder="Calle, número, depto."
                value={datos.direccion}
                onChange={(e) => cambiar('direccion', e.target.value)}
              />
            </label>
            <label className="campo">
              <span>Comuna</span>
              <input required value={datos.comuna} onChange={(e) => cambiar('comuna', e.target.value)} />
            </label>
            <label className="campo">
              <span>Región</span>
              <select value={datos.region} onChange={(e) => cambiar('region', e.target.value)}>
                {REGIONES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Teléfono para el aviso de despacho</span>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+56 9 1234 5678"
                value={datos.telefono}
                onChange={(e) => cambiar('telefono', e.target.value)}
              />
            </label>
          </fieldset>

          <fieldset className="bloque-formulario">
            <legend>Medio de pago</legend>
            <div className="medios">
              {MEDIOS.map((m) => (
                <label key={m.id} className={`medio ${datos.medio === m.id ? 'medio--elegido' : ''}`}>
                  <input
                    type="radio"
                    name="medio"
                    value={m.id}
                    checked={datos.medio === m.id}
                    onChange={() => cambiar('medio', m.id)}
                  />
                  <span className="medio__titulo">{m.titulo}</span>
                  <span className="medio__texto">{m.texto}</span>
                </label>
              ))}
            </div>
            <p className="nota">
              <Icono nombre="candado" tamano={14} /> Pago simulado: no te pediremos datos de tarjeta y
              no se realiza ningún cobro.
            </p>
          </fieldset>
        </div>

        <aside className="resumen">
          <h2>Resumen</h2>
          <ul className="resumen__lista">
            {carrito.items.map((item) => (
              <li key={item.productoId}>
                <ImagenProducto src={item.imagenUrl} nombre={item.nombre} tamano="mini" />
                <span className="resumen__nombre">
                  {item.nombre}
                  <span className="texto-suave"> × {item.cantidad}</span>
                </span>
                <span>{formatearPesos(item.precio * item.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="fila-total fila-total--suave">
            <span>Subtotal</span>
            <span>{formatearPesos(carrito.total)}</span>
          </div>
          <div className="fila-total fila-total--suave">
            <span>Despacho</span>
            <span>Gratis</span>
          </div>
          <div className="fila-total">
            <span>Total</span>
            <strong>{formatearPesos(carrito.total)}</strong>
          </div>

          {error ? <Aviso tipo="error">{error}</Aviso> : null}

          <button className="boton boton--primario boton--ancho" type="submit" disabled={enviando}>
            {enviando ? 'Procesando pago...' : `Pagar ${formatearPesos(carrito.total)}`}
          </button>
          <p className="nota">Los precios se confirman con el catálogo al momento de pagar.</p>
        </aside>
      </form>
    </div>
  );
}
