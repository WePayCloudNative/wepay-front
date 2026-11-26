import Icono, { type NombreIcono } from './Icono';

const BENEFICIOS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: 'camion', titulo: 'Despacho gratis', texto: 'A cualquier región de Chile' },
  { icono: 'escudo', titulo: 'Garantía de 12 meses', texto: 'En todos los productos' },
  { icono: 'retorno', titulo: 'Cambios sin costo', texto: 'Hasta 30 días después de recibir' },
  { icono: 'soporte', titulo: 'Soporte por correo', texto: 'Te respondemos en el día' },
];

export default function Beneficios() {
  return (
    <section className="beneficios" aria-label="Beneficios de comprar en WePay">
      <div className="contenedor beneficios__grilla">
        {BENEFICIOS.map((b) => (
          <div className="beneficio" key={b.titulo}>
            <Icono nombre={b.icono} tamano={22} />
            <p className="beneficio__titulo">{b.titulo}</p>
            <p className="beneficio__texto">{b.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
