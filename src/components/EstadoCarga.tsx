export default function EstadoCarga({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <div className="carga" role="status">
      <span className="carga__punto" />
      <span>{texto}</span>
    </div>
  );
}
