describe('Validators - Input Validation', () => {
  class Validators {
    static isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    static isValidPhoneNumber(phone: string): boolean {
      const phoneRegex = /^[0-9]{8}$/;
      return phoneRegex.test(phone.replace(/[^\d]/g, ''));
    }

    static isValidCurrency(value: string | number): boolean {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) && num >= 0 && Number.isFinite(num);
    }

    static isValidQuantity(quantity: number): boolean {
      return Number.isInteger(quantity) && quantity > 0;
    }

    static isValidProductName(name: string): boolean {
      return (
        typeof name === 'string' &&
        name.trim().length >= 3 &&
        name.trim().length <= 255
      );
    }

    static validateClienteData(data: any): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!data.nombre || typeof data.nombre !== 'string') {
        errors.push('Nombre es requerido y debe ser string');
      }

      if (data.nombre && data.nombre.trim().length < 2) {
        errors.push('Nombre debe tener al menos 2 caracteres');
      }

      if (!data.telefono || typeof data.telefono !== 'string') {
        errors.push('Teléfono es requerido');
      } else if (!this.isValidPhoneNumber(data.telefono)) {
        errors.push('Teléfono debe tener 8 dígitos');
      }

      if (data.direccion && typeof data.direccion !== 'string') {
        errors.push('Dirección debe ser string si se proporciona');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    }

    static validateProductoData(data: any): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!this.isValidProductName(data.nombre)) {
        errors.push('Nombre del producto debe tener entre 3 y 255 caracteres');
      }

      if (!this.isValidCurrency(data.precio)) {
        errors.push('Precio debe ser un número positivo válido');
      }

      if (!this.isValidQuantity(data.stock)) {
        errors.push('Stock debe ser un número positivo entero');
      }

      if (data.stock_minimo !== undefined) {
        if (!this.isValidQuantity(data.stock_minimo)) {
          errors.push('Stock mínimo debe ser un número positivo entero');
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    }
  }

  describe('isValidEmail', () => {
    it('should validate correct email format', () => {
      expect(Validators.isValidEmail('user@example.com')).toBe(true);
      expect(Validators.isValidEmail('test.user@domain.co.cr')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(Validators.isValidEmail('invalid')).toBe(false);
      expect(Validators.isValidEmail('user@')).toBe(false);
      expect(Validators.isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate 8-digit phone numbers', () => {
      expect(Validators.isValidPhoneNumber('88123456')).toBe(true);
      expect(Validators.isValidPhoneNumber('87654321')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(Validators.isValidPhoneNumber('1234')).toBe(false);
      expect(Validators.isValidPhoneNumber('123456789')).toBe(false);
      expect(Validators.isValidPhoneNumber('abcdefgh')).toBe(false);
    });

    it('should handle formatted phone numbers', () => {
      expect(Validators.isValidPhoneNumber('8812-3456')).toBe(true);
      expect(Validators.isValidPhoneNumber('88123456')).toBe(true);
    });
  });

  describe('isValidCurrency', () => {
    it('should validate positive currency values', () => {
      expect(Validators.isValidCurrency(100)).toBe(true);
      expect(Validators.isValidCurrency('99.99')).toBe(true);
      expect(Validators.isValidCurrency(0)).toBe(true);
    });

    it('should reject negative values', () => {
      expect(Validators.isValidCurrency(-100)).toBe(false);
      expect(Validators.isValidCurrency('-50.00')).toBe(false);
    });

    it('should reject non-numeric values', () => {
      expect(Validators.isValidCurrency('abc')).toBe(false);
      expect(Validators.isValidCurrency(NaN)).toBe(false);
      expect(Validators.isValidCurrency(Infinity)).toBe(false);
    });
  });

  describe('isValidQuantity', () => {
    it('should validate positive integers', () => {
      expect(Validators.isValidQuantity(1)).toBe(true);
      expect(Validators.isValidQuantity(100)).toBe(true);
      expect(Validators.isValidQuantity(9999)).toBe(true);
    });

    it('should reject zero and negative numbers', () => {
      expect(Validators.isValidQuantity(0)).toBe(false);
      expect(Validators.isValidQuantity(-5)).toBe(false);
    });

    it('should reject decimals', () => {
      expect(Validators.isValidQuantity(5.5)).toBe(false);
      expect(Validators.isValidQuantity(10.1)).toBe(false);
    });
  });

  describe('isValidProductName', () => {
    it('should validate names with valid length', () => {
      expect(Validators.isValidProductName('Pan')).toBe(true);
      expect(Validators.isValidProductName('Arroz Largo Grano')).toBe(true);
    });

    it('should reject names too short', () => {
      expect(Validators.isValidProductName('AB')).toBe(false);
      expect(Validators.isValidProductName('')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(Validators.isValidProductName('  Pan  ')).toBe(true);
      expect(Validators.isValidProductName('   ')).toBe(false);
    });
  });

  describe('validateClienteData', () => {
    it('should validate correct cliente data', () => {
      const result = Validators.validateClienteData({
        nombre: 'María García',
        telefono: '88123456',
        direccion: 'San José',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing nombre', () => {
      const result = Validators.validateClienteData({
        telefono: '88123456',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Nombre');
    });

    it('should detect invalid phone', () => {
      const result = Validators.validateClienteData({
        nombre: 'Test',
        telefono: '123',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Teléfono'))).toBe(true);
    });

    it('should detect short nombre', () => {
      const result = Validators.validateClienteData({
        nombre: 'A',
        telefono: '88123456',
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('validateProductoData', () => {
    it('should validate correct producto data', () => {
      const result = Validators.validateProductoData({
        nombre: 'Pan de Trigo',
        precio: '1500.00',
        stock: 50,
        stock_minimo: 5,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid product name', () => {
      const result = Validators.validateProductoData({
        nombre: 'AB',
        precio: 1000,
        stock: 10,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Nombre'))).toBe(true);
    });

    it('should detect invalid price', () => {
      const result = Validators.validateProductoData({
        nombre: 'Producto',
        precio: -100,
        stock: 10,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Precio'))).toBe(true);
    });

    it('should detect invalid stock', () => {
      const result = Validators.validateProductoData({
        nombre: 'Producto',
        precio: 1000,
        stock: 0,
      });

      expect(result.valid).toBe(false);
    });

    it('should validate stock_minimo if provided', () => {
      const result = Validators.validateProductoData({
        nombre: 'Producto',
        precio: 1000,
        stock: 50,
        stock_minimo: -5,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Stock mínimo'))).toBe(true);
    });
  });
});
