describe('VentasService - Sales Management', () => {
  class VentasService {
    private ventas: any[] = [];
    private detalles: any[] = [];
    private productos: any[] = [
      { id: 1, nombre: 'Pan', precio: 1000, stock: 100 },
      { id: 2, nombre: 'Leche', precio: 2500, stock: 50 },
      { id: 3, nombre: 'Arroz', precio: 800, stock: 30 },
    ];

    crearVenta(items: { productoId: number; cantidad: number }[]) {
      if (!items || items.length === 0) {
        throw new Error('Venta debe tener al menos un item');
      }

      let total = 0;
      const detallesVenta = [];

      for (const item of items) {
        const producto = this.productos.find((p) => p.id === item.productoId);
        if (!producto) {
          throw new Error(`Producto ${item.productoId} no existe`);
        }

        if (producto.stock < item.cantidad) {
          throw new Error(
            `Stock insuficiente de ${producto.nombre}. Disponible: ${producto.stock}`
          );
        }

        const subtotal = producto.precio * item.cantidad;
        total += subtotal;

        detallesVenta.push({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: producto.precio,
          subtotal,
        });

        // Descuentar stock
        producto.stock -= item.cantidad;
      }

      const venta = {
        id: this.ventas.length + 1,
        total,
        fecha: new Date(),
        detalles: detallesVenta,
      };

      this.ventas.push(venta);
      return venta;
    }

    obtenerVenta(id: number) {
      return this.ventas.find((v) => v.id === id) || null;
    }

    calcularMontoVenta(items: { precioUnitario: number; cantidad: number }[]) {
      return items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
    }

    aplicarDescuento(monto: number, porcentajeDescuento: number) {
      if (porcentajeDescuento < 0 || porcentajeDescuento > 100) {
        throw new Error('Descuento debe estar entre 0 y 100');
      }

      const descuento = (monto * porcentajeDescuento) / 100;
      return monto - descuento;
    }

    obtenerVentasPorFecha(fecha: Date) {
      return this.ventas.filter((v) => {
        const ventaFecha = new Date(v.fecha).toDateString();
        return ventaFecha === fecha.toDateString();
      });
    }

    obtenerTotalVentasDelDia() {
      const hoy = new Date();
      const ventasHoy = this.obtenerVentasPorFecha(hoy);
      return ventasHoy.reduce((sum, v) => sum + v.total, 0);
    }

    getProductoStock(productoId: number) {
      const producto = this.productos.find((p) => p.id === productoId);
      return producto?.stock || 0;
    }
  }

  let service: VentasService;

  beforeEach(() => {
    service = new VentasService();
  });

  describe('crearVenta', () => {
    it('should create venta with valid items', () => {
      const venta = service.crearVenta([
        { productoId: 1, cantidad: 5 },
        { productoId: 2, cantidad: 2 },
      ]);

      expect(venta).toBeDefined();
      expect(venta.id).toBe(1);
      expect(venta.total).toBe(1000 * 5 + 2500 * 2); // 10000
      expect(venta.detalles).toHaveLength(2);
    });

    it('should throw error when no items', () => {
      expect(() => service.crearVenta([])).toThrow(
        'Venta debe tener al menos un item'
      );
    });

    it('should throw error when producto not found', () => {
      expect(() =>
        service.crearVenta([{ productoId: 999, cantidad: 1 }])
      ).toThrow('Producto 999 no existe');
    });

    it('should throw error when insufficient stock', () => {
      expect(() =>
        service.crearVenta([{ productoId: 1, cantidad: 1000 }])
      ).toThrow('Stock insuficiente');
    });

    it('should decrement stock after venta', () => {
      const initialStock = service.getProductoStock(1);
      service.crearVenta([{ productoId: 1, cantidad: 10 }]);
      const newStock = service.getProductoStock(1);

      expect(newStock).toBe(initialStock - 10);
    });

    it('should calculate correct total for multiple items', () => {
      const venta = service.crearVenta([
        { productoId: 1, cantidad: 2 }, // 1000 * 2 = 2000
        { productoId: 3, cantidad: 5 }, // 800 * 5 = 4000
      ]);

      expect(venta.total).toBe(6000);
    });
  });

  describe('obtenerVenta', () => {
    it('should return venta when found', () => {
      const created = service.crearVenta([{ productoId: 1, cantidad: 1 }]);
      const found = service.obtenerVenta(created.id);

      expect(found).toEqual(created);
    });

    it('should return null when not found', () => {
      expect(service.obtenerVenta(999)).toBeNull();
    });
  });

  describe('calcularMontoVenta', () => {
    it('should calculate total for single item', () => {
      const total = service.calcularMontoVenta([
        { precioUnitario: 1000, cantidad: 5 },
      ]);
      expect(total).toBe(5000);
    });

    it('should calculate total for multiple items', () => {
      const total = service.calcularMontoVenta([
        { precioUnitario: 1000, cantidad: 2 },
        { precioUnitario: 2500, cantidad: 1 },
      ]);
      expect(total).toBe(4500);
    });

    it('should return 0 for empty items', () => {
      expect(service.calcularMontoVenta([])).toBe(0);
    });
  });

  describe('aplicarDescuento', () => {
    it('should apply 10% discount correctly', () => {
      const resultado = service.aplicarDescuento(1000, 10);
      expect(resultado).toBe(900);
    });

    it('should apply 50% discount correctly', () => {
      const resultado = service.aplicarDescuento(1000, 50);
      expect(resultado).toBe(500);
    });

    it('should not apply discount when 0%', () => {
      const resultado = service.aplicarDescuento(1000, 0);
      expect(resultado).toBe(1000);
    });

    it('should throw error for negative discount', () => {
      expect(() => service.aplicarDescuento(1000, -5)).toThrow(
        'Descuento debe estar entre 0 y 100'
      );
    });

    it('should throw error for discount > 100', () => {
      expect(() => service.aplicarDescuento(1000, 150)).toThrow(
        'Descuento debe estar entre 0 y 100'
      );
    });
  });

  describe('obtenerVentasPorFecha', () => {
    it('should return empty array when no ventas for date', () => {
      const fecha = new Date('2026-01-01');
      const result = service.obtenerVentasPorFecha(fecha);
      expect(result).toEqual([]);
    });

    it('should return ventas for today', () => {
      service.crearVenta([{ productoId: 1, cantidad: 1 }]);
      const hoy = new Date();
      const ventas = service.obtenerVentasPorFecha(hoy);

      expect(ventas.length).toBeGreaterThan(0);
    });
  });

  describe('obtenerTotalVentasDelDia', () => {
    it('should return 0 when no ventas today', () => {
      const total = service.obtenerTotalVentasDelDia();
      expect(total).toBe(0);
    });

    it('should sum all ventas from today', () => {
      service.crearVenta([{ productoId: 1, cantidad: 5 }]); // 5000
      service.crearVenta([{ productoId: 2, cantidad: 1 }]); // 2500
      const total = service.obtenerTotalVentasDelDia();

      expect(total).toBe(7500);
    });
  });
});
