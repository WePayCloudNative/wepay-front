import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { mensajeDe } from '../../api/cliente';
import { useApi } from '../../api/useApi';
import { useSesion } from '../../auth/sesion';
import { useCarrito } from '../../carrito/carrito';
import Aviso from '../../components/Aviso';
import FormularioDireccion from '../../components/FormularioDireccion';
import Icono from '../../components/Icono';
import ImagenProducto from '../../components/ImagenProducto';
import { CLAVE_DESPACHO, type DatosDespacho } from '../../domain/despacho';
import {
  aDireccionGuardada,
  borradorDesde,
  formatearTelefono,
  validarDireccion,
  type BorradorDireccion,
} from '../../domain/direccion';
import { formatearPesos } from '../../utils/formato';

const MEDIOS = [
  { id: 'credito', titulo: 'Tarjeta de crédito', texto: 'Hasta 3 cuotas sin interés' },
  { id: 'debito', titulo: 'Tarjeta de débito', texto: 'Cargo inmediato' },
  { id: 'transferencia', titulo: 'Transferencia', texto: 'Se confirma al recibir el pago' },
];

export default function Pago() {
  const api = useApi();
  const { perfil, actualizarPerfil } = useSesion();
  const carrito = useCarrito();
  const navigate = useNavigate();

  const guardada = perfil?.direccion ?? null;
  const [editando, setEditando] = useState(false);
  const mostrarFormulario = !guardada || editando;

  // El perfil puede llegar después de abrir la página: mientras no se edite, se usa lo guardado.
  const [borradorEditado, setBorradorEditado] = useState<BorradorDireccion | null>(null);
  const borrador = borradorEditado ?? borradorDesde(guardada);
  const [nombreEditado, setNombreEditado] = useState<string | null>(null);
  const nombre = nombreEditado ?? perfil?.nombre ?? '';

  const [guardarDireccion, setGuardarDireccion] = useState(true);
  const [medio, setMedio] = useState('credito');
  const [intentoPagar, setIntentoPagar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const errores = intentoPagar && mostrarFormulario ? validarDireccion(borrador) : {};
  const errorNombre = intentoPagar && nombre.trim().length < 2 ? 'Escribe quién recibe el pedido.' : '';

  useEffect(() => {
    document.title = 'WePay | Pago';
  }, []);

  async function pagar(evento: FormEvent) {
    evento.preventDefault();
    setIntentoPagar(true);
    setError('');

    const problemas = mostrarFormulario ? validarDireccion(borrador) : {};
    if (Object.keys(problemas).length > 0 || nombre.trim().length < 2) {
      setError('Revisa los datos de despacho marcados.');
      return;
    }

    setEnviando(true);
    try {
      const direccion = mostrarFormulario ? aDireccionGuardada(borrador) : guardada;
      if (!direccion) {
        throw new Error('Falta la dirección de despacho.');
      }

      if (mostrarFormulario && guardarDireccion) {
        const actualizado = await api.guardarDireccion(direccion);
        actualizarPerfil(actualizado);
      }

      const pedido = await api.crearPedido(
        carrito.items.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad })),
      );

      try {
        const despacho: DatosDespacho = { ...direccion, nombre: nombre.trim(), medio };
        sessionStorage.setItem(CLAVE_DESPACHO, JSON.stringify(despacho));
      } catch {
        // La confirmación funciona igual sin estos datos.
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

      <form className="pago" noValidate onSubmit={(e) => void pagar(e)}>
        <div className="pago__formulario">
          <fieldset className="bloque-formulario">
            <legend>Despacho</legend>

            {mostrarFormulario ? (
              <>
                <label className="campo campo--ancho">
                  <span>Nombre de quien recibe</span>
                  <input
                    autoComplete="name"
                    value={nombre}
                    aria-invalid={Boolean(errorNombre)}
                    onChange={(e) => setNombreEditado(e.target.value)}
                  />
                  {errorNombre ? <span className="campo__error">{errorNombre}</span> : null}
                </label>
                <FormularioDireccion
                  valor={borrador}
                  onCambiar={setBorradorEditado}
                  errores={errores}
                />
                <label className="casilla campo--ancho">
                  <input
                    type="checkbox"
                    checked={guardarDireccion}
                    onChange={(e) => setGuardarDireccion(e.target.checked)}
                  />
                  {guardada
                    ? 'Reemplazar mi dirección guardada con esta'
                    : 'Guardar esta dirección para mis próximas compras'}
                </label>
                {guardada ? (
                  <button
                    type="button"
                    className="enlace-sutil campo--ancho alinear-inicio"
                    onClick={() => {
                      setEditando(false);
                      setBorradorEditado(null);
                      setIntentoPagar(false);
                    }}
                  >
                    Usar mi dirección guardada
                  </button>
                ) : null}
              </>
            ) : (
              <div className="tarjeta-direccion campo--ancho">
                <Icono nombre="camion" tamano={22} />
                <div>
                  <p className="tarjeta-direccion__titulo">{nombre}</p>
                  <p>{guardada.direccion}</p>
                  <p>
                    {guardada.comuna}, {guardada.region}
                  </p>
                  <p className="texto-suave">{formatearTelefono(guardada.telefono)}</p>
                </div>
                <button type="button" className="enlace-sutil" onClick={() => setEditando(true)}>
                  Cambiar
                </button>
              </div>
            )}
          </fieldset>

          <fieldset className="bloque-formulario">
            <legend>Medio de pago</legend>
            <div className="medios">
              {MEDIOS.map((m) => (
                <label key={m.id} className={`medio ${medio === m.id ? 'medio--elegido' : ''}`}>
                  <input
                    type="radio"
                    name="medio"
                    value={m.id}
                    checked={medio === m.id}
                    onChange={() => setMedio(m.id)}
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
