import type { ReactNode } from 'react';

type AvisoProps = {
  tipo: 'error' | 'exito' | 'info';
  children: ReactNode;
  onCerrar?: () => void;
};

export default function Aviso({ tipo, children, onCerrar }: AvisoProps) {
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <div className="aviso__contenido">{children}</div>
      {onCerrar ? (
        <button className="aviso__cerrar" onClick={onCerrar} aria-label="Cerrar aviso">
          ×
        </button>
      ) : null}
    </div>
  );
}
