import { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { useLocation, useNavigate } from 'react-router-dom';

import { tokenRequest } from '../auth/authConfig';
import Beneficios from '../components/Beneficios';
import Marca from '../components/Marca';
import Portada from '../components/Portada';

const PASOS = [
  { titulo: 'Elige', texto: 'Arma tu bolsa con periféricos, monitores y sillas.' },
  { titulo: 'Paga', texto: 'Confirma la compra con tu cuenta Microsoft, sin crear otra contraseña.' },
  { titulo: 'Sigue tu pedido', texto: 'Ve cada etapa, desde el pago hasta la entrega, y recibe avisos por correo y SMS.' },
];

/** Página pública: presenta la tienda e inicia sesión con Microsoft Entra ID. */
export default function Inicio() {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  // Si llegó aquí desde una página privada sin sesión, vuelve a ella después del login.
  const desde = (location.state as { desde?: string } | null)?.desde;
  const destino = desde && desde !== '/' ? desde : '/app';
  const account = instance.getActiveAccount() ?? accounts[0];
  const ocupado = inProgress !== InteractionStatus.None;

  useEffect(() => {
    document.title = 'WePay | Tienda gamer';
  }, []);

  async function entrar() {
    if (account) {
      navigate(destino);
      return;
    }
    const resultado = await instance.loginPopup({ ...tokenRequest, prompt: 'select_account' });
    instance.setActiveAccount(resultado.account);
    navigate(destino);
  }

  const textoBoton = account ? 'Entrar a la tienda' : 'Ingresar con Microsoft';

  return (
    <div className="sitio">
      <p className="franja">Despacho gratis a todo Chile en todas tus compras</p>
      <header className="cabecera">
        <div className="contenedor cabecera__fila">
          <Marca destino="/" />
          <div className="cabecera__iconos">
            <button className="boton boton--secundario boton--chico" disabled={ocupado} onClick={() => void entrar()}>
              {account ? 'Entrar' : 'Ingresar'}
            </button>
          </div>
        </div>
      </header>

      <main id="contenido">
        <Portada
          acciones={
            <button className="boton boton--claro" disabled={ocupado} onClick={() => void entrar()}>
              {textoBoton}
            </button>
          }
        />

        <section className="seccion">
          <div className="contenedor">
            <h2 className="seccion__titulo">Cómo funciona</h2>
            <ol className="pasos">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="paso">
                  <span className="paso__numero">{i + 1}</span>
                  <h3>{paso.titulo}</h3>
                  <p>{paso.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Beneficios />
      </main>

      <footer className="pie pie--simple">
        <p className="contenedor pie__legal">
          WePay es un proyecto académico de Duoc UC. Los pagos son simulados.
        </p>
      </footer>
    </div>
  );
}
