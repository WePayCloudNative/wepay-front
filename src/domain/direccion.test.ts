import { describe, expect, it } from 'vitest';

import {
  aDireccionGuardada,
  borradorDesde,
  formatearTelefono,
  limpiarDigitos,
  validarDireccion,
  type BorradorDireccion,
} from './direccion';

const valida: BorradorDireccion = {
  direccion: 'Av. Colón 1234, depto 56',
  region: 'Biobío',
  comuna: 'Talcahuano',
  digitos: '12345678',
};

describe('validarDireccion', () => {
  it('acepta una dirección completa', () => {
    expect(validarDireccion(valida)).toEqual({});
  });

  it('pide calle y número con al menos 5 caracteres', () => {
    expect(validarDireccion({ ...valida, direccion: '  Av ' }).direccion).toBeDefined();
  });

  it('rechaza una comuna que no es de la región elegida', () => {
    expect(validarDireccion({ ...valida, comuna: 'Providencia' }).comuna).toBeDefined();
  });

  it('exige exactamente 8 dígitos de celular', () => {
    expect(validarDireccion({ ...valida, digitos: '1234567' }).digitos).toBeDefined();
  });
});

describe('limpiarDigitos', () => {
  it('deja solo números y como máximo 8', () => {
    expect(limpiarDigitos('12a34-5678 99')).toBe('12345678');
  });

  it('quita el prefijo cuando pegan el número completo', () => {
    expect(limpiarDigitos('+56 9 8765 4321')).toBe('87654321');
  });
});

describe('teléfono guardado', () => {
  it('se guarda con el formato que valida ms-clientes (+569 y 8 dígitos)', () => {
    expect(aDireccionGuardada(valida).telefono).toMatch(/^\+569\d{8}$/);
  });

  it('se muestra con espacios', () => {
    expect(formatearTelefono('+56912345678')).toBe('+56 9 1234 5678');
  });

  it('vuelve a los 8 dígitos al editar una dirección guardada', () => {
    expect(borradorDesde(aDireccionGuardada(valida))).toEqual(valida);
  });
});
