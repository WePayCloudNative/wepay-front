import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';

import EstadoCarga from '../components/EstadoCarga';

/**
 * Solo deja pasar a usuarios con sesión iniciada.
 * En una pestaña nueva, MsalProvider arranca con la lista de cuentas vacía y
 * la completa al terminar su verificación inicial: mientras tanto se espera,
 * en vez de mandar al usuario al inicio.
 */
export default function RutaProtegida({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const location = useLocation();
  const haySesion = accounts.length > 0 || instance.getAllAccounts().length > 0;

  if (!haySesion && inProgress !== InteractionStatus.None) {
    return <EstadoCarga texto="Recuperando tu sesión..." />;
  }

  if (!haySesion) {
    return <Navigate replace to="/" state={{ desde: location.pathname }} />;
  }

  return <>{children}</>;
}
