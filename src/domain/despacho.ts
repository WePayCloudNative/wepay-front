export type DatosDespacho = {
  nombre: string;
  direccion: string;
  comuna: string;
  region: string;
  telefono: string;
  medio: string;
};

/** Datos del último pago, solo en este navegador, para mostrarlos en la confirmación. */
export const CLAVE_DESPACHO = 'wepay.ultimoDespacho';

export const NOMBRE_MEDIO: Record<string, string> = {
  credito: 'Tarjeta de crédito',
  debito: 'Tarjeta de débito',
  transferencia: 'Transferencia',
};

export function leerDespacho(): DatosDespacho | null {
  try {
    const texto = sessionStorage.getItem(CLAVE_DESPACHO);
    return texto ? (JSON.parse(texto) as DatosDespacho) : null;
  } catch {
    return null;
  }
}
