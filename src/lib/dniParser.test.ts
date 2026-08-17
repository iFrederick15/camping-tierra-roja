import { describe, expect, it } from 'vitest';
import { parseDniPdf417 } from './dniParser';

// Datos sintéticos, ficticios — no corresponden a ninguna persona real.
const SCAN_VALIDO =
  '00011122233@GOMEZ PEREZ@JUAN CARLOS@M@40123456@A@01/01/1990@01/01/2015@111';

describe('parseDniPdf417', () => {
  it('parsea un string bien formado con separador @ y confianza alta', () => {
    expect(parseDniPdf417(SCAN_VALIDO)).toEqual({
      apellido: 'GOMEZ PEREZ',
      nombre: 'JUAN CARLOS',
      dni: '40123456',
      confianza: 'alta',
    });
  });

  it('devuelve null si tiene menos campos de los esperados', () => {
    const incompleto = '00011122233@GOMEZ PEREZ@JUAN CARLOS@M';
    expect(parseDniPdf417(incompleto)).toBeNull();
  });

  it('parsea la variante con separador " como confianza baja', () => {
    const conComillas =
      '00011122233"GOMEZ PEREZ"JUAN CARLOS"M"40123456"A"01/01/1990"01/01/2015"111';
    expect(parseDniPdf417(conComillas)).toEqual({
      apellido: 'GOMEZ PEREZ',
      nombre: 'JUAN CARLOS',
      dni: '40123456',
      confianza: 'baja',
    });
  });

  it('devuelve null si el campo DNI no es numérico', () => {
    const dniInvalido =
      '00011122233@GOMEZ PEREZ@JUAN CARLOS@M@ABC12345@A@01/01/1990@01/01/2015@111';
    expect(parseDniPdf417(dniInvalido)).toBeNull();
  });

  it('devuelve null si el campo DNI tiene una longitud fuera de 7-8 dígitos', () => {
    const dniCorto = '00011122233@GOMEZ PEREZ@JUAN CARLOS@M@123456@A@01/01/1990@01/01/2015@111';
    expect(parseDniPdf417(dniCorto)).toBeNull();
  });

  it('devuelve null para un string vacío', () => {
    expect(parseDniPdf417('')).toBeNull();
  });

  it('devuelve null para un string completamente malformado sin excepción', () => {
    expect(() => parseDniPdf417('esto no es un scan de dni')).not.toThrow();
    expect(parseDniPdf417('esto no es un scan de dni')).toBeNull();
  });

  it('devuelve null para un string con solo espacios en blanco', () => {
    expect(parseDniPdf417('   ')).toBeNull();
  });
});
