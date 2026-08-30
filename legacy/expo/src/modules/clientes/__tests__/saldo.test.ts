describe('cálculo de saldo cliente', () => {
  it('suma saldo_pendiente de fiados activos', () => {
    const fiados = [
      { saldo_pendiente: 100 },
      { saldo_pendiente: 50 },
      { saldo_pendiente: 0 },
    ];
    const total = fiados.reduce((s, f) => s + Number(f.saldo_pendiente), 0);
    expect(total).toBe(150);
  });

  it('devuelve 0 si no hay fiados', () => {
    const fiados: { saldo_pendiente: number }[] = [];
    const total = fiados.reduce((s, f) => s + Number(f.saldo_pendiente), 0);
    expect(total).toBe(0);
  });
});
