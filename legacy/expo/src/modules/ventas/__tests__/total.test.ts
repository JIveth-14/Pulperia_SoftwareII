describe('cálculo de total de venta', () => {
  it('calcula subtotal por línea', () => {
    const lineas = [
      { precio: 20, cantidad: 3 },
      { precio: 15, cantidad: 2 },
    ];
    const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
    expect(total).toBe(90);
  });

  it('devuelve 0 sin líneas', () => {
    const lineas: { precio: number; cantidad: number }[] = [];
    const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
    expect(total).toBe(0);
  });
});
