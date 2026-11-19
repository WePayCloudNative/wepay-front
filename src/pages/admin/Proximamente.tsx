import { useEffect } from 'react';

type ProximamenteProps = {
  titulo: string;
  descripcion: string;
  servicio: string;
  endpoints: string[];
};

/** Sección reservada para los microservicios con Kafka (auditoría y reportes). */
export default function Proximamente({ titulo, descripcion, servicio, endpoints }: ProximamenteProps) {
  useEffect(() => {
    document.title = `Wepay | ${titulo}`;
  }, [titulo]);

  return (
    <section className="tarjeta">
      <p className="eyebrow">Próximamente · Kafka</p>
      <h1>{titulo}</h1>
      <p className="texto-suave">{descripcion}</p>
      <dl className="datos">
        <div>
          <dt>Microservicio</dt>
          <dd className="mono">{servicio}</dd>
        </div>
        <div>
          <dt>Endpoints disponibles</dt>
          <dd className="mono">{endpoints.join(' · ')}</dd>
        </div>
        <div>
          <dt>Falta</dt>
          <dd>Exponer estos endpoints en el BFF para consultarlos desde aquí.</dd>
        </div>
      </dl>
    </section>
  );
}
