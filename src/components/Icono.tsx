const TRAZOS = {
  buscar: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21',
  usuario: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9c.8-4 4-6 8-6s7.2 2 8 6',
  bolsa: 'M5 8h14l-1 13H6L5 8Zm4 0V6.5a3 3 0 0 1 6 0V8',
  camion: 'M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5v3h-7M6.5 19a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm11 0a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z',
  escudo: 'M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6L12 3Zm-3 9 2.2 2.2L15.5 10',
  retorno: 'M4 9h11a5 5 0 0 1 0 10H8M4 9l4-4M4 9l4 4',
  soporte: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Zm-3 2c0 2.5-2 4-5 4',
  cerrar: 'M6 6l12 12M18 6 6 18',
  mas: 'M12 5v14M5 12h14',
  menos: 'M5 12h14',
  volver: 'M15 5l-7 7 7 7',
  avanzar: 'M9 5l7 7-7 7',
  check: 'M5 12.5 10 17l9-10',
  candado: 'M6.5 11h11v9h-11zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  salir: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  resumen: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  lista: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  mensajes: 'M4 6h16v10H8l-4 4V6Z',
  historial: 'M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4',
  grafico: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  tienda: 'M4 9.5 5.5 4h13L20 9.5M4 9.5v10.5h16V9.5M4 9.5c0 1.5 1.2 2.5 2.7 2.5s2.6-1 2.6-2.5c0 1.5 1.2 2.5 2.7 2.5s2.7-1 2.7-2.5c0 1.5 1.1 2.5 2.6 2.5S20 11 20 9.5M10 20v-5h4v5',
  documento: 'M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h5M9.5 16h5',
} as const;

export type NombreIcono = keyof typeof TRAZOS;

/** Íconos de línea propios (SVG en línea, sin dependencias). */
export default function Icono({
  nombre,
  tamano = 20,
  titulo,
}: {
  nombre: NombreIcono;
  tamano?: number;
  titulo?: string;
}) {
  return (
    <svg
      className="icono"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={titulo ? 'img' : undefined}
      aria-hidden={titulo ? undefined : true}
      aria-label={titulo}
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
