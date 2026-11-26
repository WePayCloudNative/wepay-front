import { Link } from 'react-router-dom';

/** Logo de WePay: dos trazos que forman una W, en hueso y latón. */
export default function Marca({ destino = '/', subtitulo }: { destino?: string; subtitulo?: string }) {
  return (
    <Link className="marca" to={destino} aria-label="WePay, ir al inicio">
      <svg className="marca__simbolo" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M3 6l5 16 6-12" fill="none" stroke="var(--hueso)" strokeWidth="2.4" />
        <path d="M14 10l6 12 5-16" fill="none" stroke="var(--laton)" strokeWidth="2.4" />
      </svg>
      <span className="marca__nombre">WePay</span>
      {subtitulo ? <span className="marca__subtitulo">{subtitulo}</span> : null}
    </Link>
  );
}
