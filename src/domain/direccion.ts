import { comunasDe } from './territorio';

/** Dirección de despacho tal como la guarda ms-clientes. Teléfono: +569XXXXXXXX. */
export type DireccionGuardada = {
  direccion: string;
  comuna: string;
  region: string;
  telefono: string;
};

/** Lo que se edita en el formulario. El teléfono son solo los 8 dígitos después de +56 9. */
export type BorradorDireccion = {
  direccion: string;
  region: string;
  comuna: string;
  digitos: string;
};

export type ErroresDireccion = Partial<Record<keyof BorradorDireccion, string>>;

export const BORRADOR_VACIO: BorradorDireccion = { direccion: '', region: '', comuna: '', digitos: '' };

export function borradorDesde(guardada: DireccionGuardada | null | undefined): BorradorDireccion {
  if (!guardada) {
    return BORRADOR_VACIO;
  }
  return {
    direccion: guardada.direccion,
    region: guardada.region,
    comuna: guardada.comuna,
    digitos: guardada.telefono.replace(/\D/g, '').replace(/^569/, '').slice(0, 8),
  };
}

/** Deja solo dígitos y como máximo 8 (lo que va después de +56 9). */
export function limpiarDigitos(texto: string): string {
  const digitos = texto.replace(/\D/g, '');
  // Si pegan el número completo (+56 9 1234 5678), se quita el prefijo.
  const sinPrefijo = digitos.length > 8 ? digitos.replace(/^569/, '') : digitos;
  return sinPrefijo.slice(0, 8);
}

/** "12345678" → "1234 5678" */
export function agruparDigitos(digitos: string): string {
  return digitos.length > 4 ? `${digitos.slice(0, 4)} ${digitos.slice(4)}` : digitos;
}

/** "+56912345678" → "+56 9 1234 5678" */
export function formatearTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '').replace(/^569/, '');
  return digitos.length === 8 ? `+56 9 ${agruparDigitos(digitos)}` : telefono;
}

export function validarDireccion(b: BorradorDireccion): ErroresDireccion {
  const errores: ErroresDireccion = {};
  const direccion = b.direccion.trim();
  if (direccion.length < 5) {
    errores.direccion = 'Escribe calle y número (mínimo 5 caracteres).';
  } else if (direccion.length > 120) {
    errores.direccion = 'Máximo 120 caracteres.';
  }
  if (!b.region) {
    errores.region = 'Elige una región.';
  }
  if (!b.comuna || !comunasDe(b.region).includes(b.comuna)) {
    errores.comuna = 'Elige una comuna de la región.';
  }
  if (!/^\d{8}$/.test(b.digitos)) {
    errores.digitos = 'Faltan dígitos: son 8 después de +56 9.';
  }
  return errores;
}

export function aDireccionGuardada(b: BorradorDireccion): DireccionGuardada {
  return {
    direccion: b.direccion.trim(),
    region: b.region,
    comuna: b.comuna,
    telefono: `+569${b.digitos}`,
  };
}
