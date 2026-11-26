import { useState } from 'react';

/**
 * Foto del producto (la ruta viene del catálogo). Si la foto no existe o no carga,
 * muestra una placa con las iniciales para que la grilla no quede rota.
 */
export default function ImagenProducto({
  src,
  nombre,
  tamano = 'normal',
}: {
  src?: string | null;
  nombre: string;
  tamano?: 'normal' | 'mini';
}) {
  const [fallo, setFallo] = useState(false);
  const iniciales = nombre
    .split(/\s+/)
    .filter((palabra) => /^\p{L}/u.test(palabra))
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('');

  return (
    <div
      className={`imagen-producto imagen-producto--${tamano} ${src && !fallo ? 'imagen-producto--foto' : ''}`}
    >
      {src && !fallo ? (
        <img src={src} alt={nombre} loading="lazy" onError={() => setFallo(true)} />
      ) : (
        <span className="imagen-producto__placa" aria-label={nombre} role="img">
          {iniciales}
        </span>
      )}
    </div>
  );
}
