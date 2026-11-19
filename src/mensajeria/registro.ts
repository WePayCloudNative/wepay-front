import { createContext, useContext } from 'react';

import type { EventoPublicado } from '../domain/mensajeria';

export type RegistroEventos = {
  eventos: EventoPublicado[];
  registrar: (evento: Omit<EventoPublicado, 'id' | 'fecha'>) => void;
  limpiar: () => void;
};

export const RegistroEventosContext = createContext<RegistroEventos | null>(null);

/** Cambios de estado hechos desde este navegador y los eventos que publicaron en RabbitMQ. */
export function useRegistroEventos(): RegistroEventos {
  const registro = useContext(RegistroEventosContext);
  if (!registro) {
    throw new Error('useRegistroEventos debe usarse dentro de RegistroEventosProvider');
  }
  return registro;
}
