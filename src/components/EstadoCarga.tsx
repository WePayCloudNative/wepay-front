export default function EstadoCarga({
  texto = 'Cargando...',
  pantalla = false,
}: {
  texto?: string;
  /** Ocupa toda la pantalla (mientras se verifica la sesión) */
  pantalla?: boolean;
}) {
  return (
    <div className={`carga ${pantalla ? 'carga--pantalla' : ''}`} role="status">
      <span className="carga__punto" />
      <span>{texto}</span>
    </div>
  );
}
