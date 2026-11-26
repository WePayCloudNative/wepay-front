import { useEffect, useState, type ReactNode } from 'react';

type Diapositiva = {
  imagen: string;
  titulo: string;
  texto: string;
};

/** Fotos en public/img/portada. Si falta una, se ve el fondo oscuro con el texto igual. */
const DIAPOSITIVAS: Diapositiva[] = [
  {
    imagen: '/img/portada/setup.jpg',
    titulo: 'Tu setup, a otro nivel',
    texto: 'Teclados, mouse, monitores y sillas elegidos para jugar y crear durante horas.',
  },
  {
    imagen: '/img/portada/perifericos.jpg',
    titulo: 'Precisión en cada clic',
    texto: 'Switches ópticos y sensores de 16.000 DPI para que nada se pierda entre tu mano y la pantalla.',
  },
  {
    imagen: '/img/portada/streaming.jpg',
    titulo: 'Que te escuchen claro',
    texto: 'Micrófonos, cámaras y audífonos para transmitir y jugar en equipo.',
  },
];

const INTERVALO_MS = 7000;

/** Banner principal a todo el ancho, con fotos que rotan solas y puntos para elegir. */
export default function Portada({ acciones }: { acciones: ReactNode }) {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (pausado || sinMovimiento) {
      return;
    }
    const id = window.setInterval(
      () => setActual((i) => (i + 1) % DIAPOSITIVAS.length),
      INTERVALO_MS,
    );
    return () => window.clearInterval(id);
  }, [pausado]);

  const diapositiva = DIAPOSITIVAS[actual];

  return (
    <section
      className="portada"
      aria-roledescription="carrusel"
      aria-label="Destacados de WePay"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {DIAPOSITIVAS.map((d, i) => (
        <div
          key={d.imagen}
          className={`portada__foto ${i === actual ? 'portada__foto--visible' : ''}`}
          style={{ backgroundImage: `url(${d.imagen})` }}
          aria-hidden="true"
        />
      ))}
      <div className="portada__velo" aria-hidden="true" />

      <div className="portada__texto" aria-live="polite">
        <h1 key={diapositiva.titulo}>{diapositiva.titulo}</h1>
        <p>{diapositiva.texto}</p>
        <div className="portada__acciones">{acciones}</div>
      </div>

      <div className="portada__puntos" role="group" aria-label="Elegir imagen">
        {DIAPOSITIVAS.map((d, i) => (
          <button
            key={d.imagen}
            className={`portada__punto ${i === actual ? 'portada__punto--activo' : ''}`}
            aria-label={`Ver: ${d.titulo}`}
            aria-current={i === actual}
            onClick={() => setActual(i)}
          />
        ))}
      </div>
    </section>
  );
}
