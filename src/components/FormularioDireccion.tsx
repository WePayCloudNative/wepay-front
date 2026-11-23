import {
  agruparDigitos,
  limpiarDigitos,
  type BorradorDireccion,
  type ErroresDireccion,
} from '../domain/direccion';
import { comunasDe, REGIONES } from '../domain/territorio';

/**
 * Campos de dirección de despacho: región primero, luego solo las comunas de esa región,
 * y el celular con el prefijo +56 9 fijo.
 */
export default function FormularioDireccion({
  valor,
  onCambiar,
  errores,
}: {
  valor: BorradorDireccion;
  onCambiar: (valor: BorradorDireccion) => void;
  /** Solo se muestran después de intentar enviar */
  errores: ErroresDireccion;
}) {
  const comunas = comunasDe(valor.region);

  function cambiar<K extends keyof BorradorDireccion>(campo: K, nuevo: BorradorDireccion[K]) {
    onCambiar({ ...valor, [campo]: nuevo });
  }

  return (
    <>
      <label className="campo campo--ancho">
        <span>Dirección</span>
        <input
          autoComplete="street-address"
          placeholder="Calle, número, depto."
          maxLength={120}
          value={valor.direccion}
          aria-invalid={Boolean(errores.direccion)}
          onChange={(e) => cambiar('direccion', e.target.value)}
        />
        {errores.direccion ? <span className="campo__error">{errores.direccion}</span> : null}
      </label>

      <label className="campo">
        <span>Región</span>
        <select
          value={valor.region}
          aria-invalid={Boolean(errores.region)}
          onChange={(e) => onCambiar({ ...valor, region: e.target.value, comuna: '' })}
        >
          <option value="" disabled>
            Elige una región
          </option>
          {REGIONES.map((r) => (
            <option key={r.region} value={r.region}>
              {r.region}
            </option>
          ))}
        </select>
        {errores.region ? <span className="campo__error">{errores.region}</span> : null}
      </label>

      <label className="campo">
        <span>Comuna</span>
        <select
          value={valor.comuna}
          disabled={!valor.region}
          aria-invalid={Boolean(errores.comuna)}
          onChange={(e) => cambiar('comuna', e.target.value)}
        >
          <option value="" disabled>
            {valor.region ? 'Elige una comuna' : 'Primero elige la región'}
          </option>
          {comunas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errores.comuna ? <span className="campo__error">{errores.comuna}</span> : null}
      </label>

      <label className="campo">
        <span>Celular para el aviso de despacho</span>
        <span className={`campo-telefono ${errores.digitos ? 'campo-telefono--error' : ''}`}>
          <span className="campo-telefono__prefijo">+56 9</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-local"
            placeholder="1234 5678"
            value={agruparDigitos(valor.digitos)}
            aria-invalid={Boolean(errores.digitos)}
            onChange={(e) => cambiar('digitos', limpiarDigitos(e.target.value))}
          />
        </span>
        {errores.digitos ? <span className="campo__error">{errores.digitos}</span> : null}
      </label>
    </>
  );
}
