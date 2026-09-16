import {
  CARRITO_VACIO,
  agregar,
  coincide,
  fijarCantidad,
  lineasDelCarrito,
  quitar,
  totalDelCarrito,
} from '@/components/formularios/carrito'

const arroz = { id: 1, nombre: 'Arroz 1lb', precio: 15, stock: 2 }
const cafe = { id: 2, nombre: 'Café 250g', precio: '42.50' as unknown as number, stock: 10 }

describe('carrito de venta', () => {
  it('agrega sin pasar del stock disponible', () => {
    let c = agregar(CARRITO_VACIO, arroz)
    c = agregar(c, arroz)
    c = agregar(c, arroz)
    expect(c).toEqual({ 1: 2 })
  })

  it('fija cantidades acotadas y quita con 0', () => {
    expect(fijarCantidad(CARRITO_VACIO, cafe, 3.7)).toEqual({ 2: 3 })
    expect(fijarCantidad({ 2: 3 }, cafe, 99)).toEqual({ 2: 10 })
    expect(fijarCantidad({ 2: 3 }, cafe, -1)).toEqual({})
    expect(fijarCantidad({ 2: 3 }, cafe, NaN)).toEqual({})
    expect(quitar({ 1: 1, 2: 3 }, cafe)).toEqual({ 1: 1 })
  })

  it('calcula líneas y total (precios como string incluidos)', () => {
    const c = { 1: 2, 2: 1 }
    expect(lineasDelCarrito(c)).toEqual([
      { producto_id: 1, cantidad: 2 },
      { producto_id: 2, cantidad: 1 },
    ])
    expect(totalDelCarrito(c, [arroz, cafe])).toBe(72.5)
  })

  it('busca sin acentos ni mayúsculas', () => {
    expect(coincide('Café 250g', 'cafe')).toBe(true)
    expect(coincide('Arroz 1lb', 'ARROZ')).toBe(true)
    expect(coincide('Arroz 1lb', 'frijol')).toBe(false)
  })
})
