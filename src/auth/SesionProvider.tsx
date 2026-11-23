import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';

import { mensajeDe } from '../api/cliente';
import { useApi } from '../api/useApi';
import { tieneRolAdmin, type Perfil } from '../domain/pedidos';
import { SesionContext, type Sesion } from './sesion';

export default function SesionProvider({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const api = useApi();
  // En una pestaña nueva, accounts llega vacío al principio: se consulta también la instancia.
  const hayCuenta = accounts.length > 0 || instance.getAllAccounts().length > 0;

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!hayCuenta) {
      return;
    }
    let activo = true;
    api
      .obtenerPerfil()
      .then((datos) => {
        if (activo) {
          setPerfil(datos);
          setError('');
        }
      })
      .catch((e: unknown) => {
        if (activo) {
          setError(mensajeDe(e));
        }
      });
    return () => {
      activo = false;
    };
  }, [api, hayCuenta, intento]);

  const valor = useMemo<Sesion>(
    () => ({
      perfil: hayCuenta ? perfil : null,
      esAdmin: hayCuenta && tieneRolAdmin(perfil),
      cargando: hayCuenta && !perfil && !error,
      error,
      recargarPerfil: () => {
        setError('');
        setPerfil(null);
        setIntento((n) => n + 1);
      },
      actualizarPerfil: (nuevo) => {
        setPerfil(nuevo);
        setError('');
      },
      cerrarSesion: async () => {
        const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
        setPerfil(null);
        setError('');
        await instance.logoutPopup({ account });
      },
    }),
    [hayCuenta, perfil, error, instance],
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
