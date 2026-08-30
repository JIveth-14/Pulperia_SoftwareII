describe('detección de bajo stock', () => {
  it('filtra productos con stock <= stock_minimo', () => {
    const productos = [
      { nombre: 'A', stock: 3, stock_minimo: 5 },
      { nombre: 'B', stock: 10, stock_minimo: 5 },
      { nombre: 'C', stock: 5, stock_minimo: 5 },
    ];
    const bajos = productos.filter(p => p.stock <= p.stock_minimo);
    expect(bajos.length).toBe(2);
    expect(bajos.map(p => p.nombre)).toEqual(['A', 'C']);
  });
});
