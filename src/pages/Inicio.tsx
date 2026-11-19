import { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { useLocation, useNavigate } from 'react-router-dom';

import { tokenRequest } from '../auth/authConfig';

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
    document.title = 'Wepay | Inicio';
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

  return (
    <div className="pagina">
      <header className="topbar">
        <div className="marca">
          <span className="marca__logo">W</span>
          <div>
            <p className="eyebrow">Tienda gamer</p>
            <strong>Wepay</strong>
          </div>
        </div>
        <div className="topbar__acciones">
          <button className="boton boton--fantasma" disabled={ocupado} onClick={() => void entrar()}>
            {account ? 'Entrar' : 'Iniciar sesión'}
          </button>
        </div>
      </header>

      <section className="hero tarjeta">
        <p className="eyebrow">Periféricos, monitores y setups de alto nivel</p>
        <h1>Arma tu setup gamer y sigue tu pedido en tiempo real.</h1>
        <p className="texto-suave">
          Inicia sesión con tu cuenta de Microsoft para comprar y revisar el avance de tus pedidos.
          Si tu cuenta es de administración, entrarás directo al panel de gestión.
        </p>
        <div className="acciones">
          <button className="boton boton--primario" disabled={ocupado} onClick={() => void entrar()}>
            {account ? 'Entrar a la tienda' : 'Iniciar sesión'}
          </button>
        </div>
      </section>
    </div>
  );
}
