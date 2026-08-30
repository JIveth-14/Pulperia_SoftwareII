import { requerido, esNumeroPositivo, esEnteroPositivo, esMontoValido } from '../validation';

describe('requerido', () => {
  it('devuelve error con cadena vacía', () => expect(requerido('')).toBeTruthy());
  it('devuelve error con solo espacios', () => expect(requerido('   ')).toBeTruthy());
  it('devuelve null con valor válido', () => expect(requerido('Juan')).toBeNull());
});

describe('esNumeroPositivo', () => {
  it('error con número negativo', () => expect(esNumeroPositivo('-1')).toBeTruthy());
  it('error con texto', () => expect(esNumeroPositivo('abc')).toBeTruthy());
  it('null con 0', () => expect(esNumeroPositivo('0')).toBeNull());
  it('null con número positivo', () => expect(esNumeroPositivo('25.5')).toBeNull());
});

describe('esMontoValido', () => {
  it('error con 0', () => expect(esMontoValido('0')).toBeTruthy());
  it('error con texto', () => expect(esMontoValido('abc')).toBeTruthy());
  it('null con número positivo', () => expect(esMontoValido('100.5')).toBeNull());
});

describe('esEnteroPositivo', () => {
  it('error con decimal', () => expect(esEnteroPositivo('1.5')).toBeTruthy());
  it('null con entero 0', () => expect(esEnteroPositivo('0')).toBeNull());
  it('null con entero positivo', () => expect(esEnteroPositivo('5')).toBeNull());
});
