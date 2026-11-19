import { createRoot } from 'react-dom/client';
import {
  EventType,
  PublicClientApplication,
  type AuthenticationResult,
} from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { msalConfig } from './auth/authConfig';
import SesionProvider from './auth/SesionProvider';
import CarritoProvider from './carrito/CarritoProvider';
import CapturaErrores from './components/CapturaErrores';
import RegistroEventosProvider from './mensajeria/RegistroEventosProvider';
import './index.css';

const msal = new PublicClientApplication(msalConfig);
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
const root = createRoot(rootElement);

// MSAL debe terminar de inicializarse antes de usarlo. En una pestaña nueva
// que abre directo una ruta privada, usarlo antes dejaba la página en negro.
msal
  .initialize()
  .then(() => {
    // Toma la sesión guardada (localStorage) como cuenta activa.
    const cuentas = msal.getAllAccounts();
    if (!msal.getActiveAccount() && cuentas.length > 0) {
      msal.setActiveAccount(cuentas[0]);
    }
    msal.addEventCallback((evento) => {
      if (evento.eventType === EventType.LOGIN_SUCCESS && evento.payload) {
        msal.setActiveAccount((evento.payload as AuthenticationResult).account);
      }
    });

    root.render(
      <CapturaErrores>
        <MsalProvider instance={msal}>
          <BrowserRouter>
            <SesionProvider>
              <CarritoProvider>
                <RegistroEventosProvider>
                  <App />
                </RegistroEventosProvider>
              </CarritoProvider>
            </SesionProvider>
          </BrowserRouter>
        </MsalProvider>
      </CapturaErrores>,
    );
  })
  .catch((error: unknown) => {
    console.error('No se pudo inicializar MSAL', error);
    root.render(
      <main className="pagina">
        <div className="aviso aviso--error">
          No se pudo iniciar la autenticación con Microsoft. Revisa public/config.js y recarga la
          página.
        </div>
      </main>,
    );
  });
