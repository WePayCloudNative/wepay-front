import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { EventoPublicado } from '../domain/mensajeria';
import { RegistroEventosContext, type RegistroEventos } from './registro';

const CLAVE = 'wepay.eventos';
const MAXIMO = 50;

function leerGuardado(): EventoPublicado[] {
  try {
    const texto = sessionStorage.getItem(CLAVE);
    return texto ? (JSON.parse(texto) as EventoPublicado[]) : [];
  } catch {
    return [];
  }
}

export default function RegistroEventosProvider({ children }: { children: ReactNode }) {
  const [eventos, setEventos] = useState<EventoPublicado[]>(leerGuardado);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(eventos));
    } catch {
      // Sin almacenamiento disponible: el registro sigue en memoria.
    }
  }, [eventos]);

  const valor = useMemo<RegistroEventos>(
    () => ({
      eventos,
      registrar: (evento) =>
        setEventos((actuales) =>
          [
            { ...evento, id: crypto.randomUUID(), fecha: new Date().toISOString() },
            ...actuales,
          ].slice(0, MAXIMO),
        ),
      limpiar: () => setEventos([]),
    }),
    [eventos],
  );

  return (
    <RegistroEventosContext.Provider value={valor}>{children}</RegistroEventosContext.Provider>
  );
}
