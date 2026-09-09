describe('ClientesService - Business Logic', () => {
  // Mock del servicio
  class ClientesService {
    private clientes: any[] = [];

    crearCliente(cliente: {
      nombre: string;
      telefono: string;
      direccion?: string;
    }) {
      if (!cliente.nombre || !cliente.telefono) {
        throw new Error('Nombre y teléfono son requeridos');
      }

      if (this.clientes.some((c) => c.telefono === cliente.telefono)) {
        throw new Error('Teléfono ya registrado');
      }

      const nuevoCliente = {
        id: this.clientes.length + 1,
        ...cliente,
        createdAt: new Date(),
      };

      this.clientes.push(nuevoCliente);
      return nuevoCliente;
    }

    obtenerClientePorId(id: number) {
      return this.clientes.find((c) => c.id === id) || null;
    }

    obtenerTodosClientes() {
      return [...this.clientes];
    }

    actualizarCliente(id: number, datos: Partial<any>) {
      const cliente = this.obtenerClientePorId(id);
      if (!cliente) return null;

      Object.assign(cliente, datos);
      return cliente;
    }

    eliminarCliente(id: number) {
      const index = this.clientes.findIndex((c) => c.id === id);
      if (index === -1) return false;

      this.clientes.splice(index, 1);
      return true;
    }

    calcularSaldoCliente(clienteId: number, fiados: any[]) {
      return fiados
        .filter((f) => f.cliente_id === clienteId)
        .reduce((sum, f) => sum + Number(f.saldo_pendiente), 0);
    }
  }

  let service: ClientesService;

  beforeEach(() => {
    service = new ClientesService();
  });

  describe('crearCliente', () => {
    it('should create a new cliente with valid data', () => {
      const cliente = service.crearCliente({
        nombre: 'María García',
        telefono: '88123456',
        direccion: 'San José, Costa Rica',
      });

      expect(cliente).toBeDefined();
      expect(cliente.nombre).toBe('María García');
      expect(cliente.telefono).toBe('88123456');
      expect(cliente.id).toBe(1);
    });

    it('should throw error when nombre is missing', () => {
      expect(() =>
        service.crearCliente({
          nombre: '',
          telefono: '88123456',
        })
      ).toThrow('Nombre y teléfono son requeridos');
    });

    it('should throw error when telefono is missing', () => {
      expect(() =>
        service.crearCliente({
          nombre: 'Test',
          telefono: '',
        })
      ).toThrow('Nombre y teléfono son requeridos');
    });

    it('should throw error when telefono is duplicated', () => {
      service.crearCliente({ nombre: 'Cliente 1', telefono: '88123456' });

      expect(() =>
        service.crearCliente({ nombre: 'Cliente 2', telefono: '88123456' })
      ).toThrow('Teléfono ya registrado');
    });

    it('should assign incremental IDs', () => {
      const c1 = service.crearCliente({ nombre: 'C1', telefono: '11111111' });
      const c2 = service.crearCliente({ nombre: 'C2', telefono: '22222222' });

      expect(c1.id).toBe(1);
      expect(c2.id).toBe(2);
    });
  });

  describe('obtenerClientePorId', () => {
    it('should return cliente when found', () => {
      const created = service.crearCliente({
        nombre: 'Test',
        telefono: '88123456',
      });
      const found = service.obtenerClientePorId(created.id);

      expect(found).toEqual(created);
    });

    it('should return null when cliente not found', () => {
      expect(service.obtenerClientePorId(999)).toBeNull();
    });
  });

  describe('obtenerTodosClientes', () => {
    it('should return empty array initially', () => {
      expect(service.obtenerTodosClientes()).toEqual([]);
    });

    it('should return all created clientes', () => {
      service.crearCliente({ nombre: 'C1', telefono: '11111111' });
      service.crearCliente({ nombre: 'C2', telefono: '22222222' });

      const todos = service.obtenerTodosClientes();
      expect(todos).toHaveLength(2);
      expect(todos[0].nombre).toBe('C1');
      expect(todos[1].nombre).toBe('C2');
    });

    it('should return a copy of the array', () => {
      service.crearCliente({ nombre: 'C1', telefono: '11111111' });
      const array1 = service.obtenerTodosClientes();
      const array2 = service.obtenerTodosClientes();

      expect(array1).toEqual(array2);
      expect(array1).not.toBe(array2);
    });
  });

  describe('actualizarCliente', () => {
    it('should update cliente properties', () => {
      const created = service.crearCliente({
        nombre: 'Original',
        telefono: '88123456',
      });

      const updated = service.actualizarCliente(created.id, {
        nombre: 'Updated',
      });

      expect(updated?.nombre).toBe('Updated');
      expect(updated?.telefono).toBe('88123456');
    });

    it('should return null if cliente not found', () => {
      const result = service.actualizarCliente(999, { nombre: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('eliminarCliente', () => {
    it('should remove cliente successfully', () => {
      const cliente = service.crearCliente({
        nombre: 'Test',
        telefono: '88123456',
      });

      const deleted = service.eliminarCliente(cliente.id);
      expect(deleted).toBe(true);
      expect(service.obtenerClientePorId(cliente.id)).toBeNull();
    });

    it('should return false if cliente not found', () => {
      const deleted = service.eliminarCliente(999);
      expect(deleted).toBe(false);
    });
  });

  describe('calcularSaldoCliente', () => {
    it('should return 0 when no fiados exist', () => {
      const saldo = service.calcularSaldoCliente(1, []);
      expect(saldo).toBe(0);
    });

    it('should calculate total saldo for cliente', () => {
      const fiados = [
        { cliente_id: 1, saldo_pendiente: '100.00' },
        { cliente_id: 1, saldo_pendiente: '50.00' },
        { cliente_id: 2, saldo_pendiente: '200.00' },
      ];

      const saldo = service.calcularSaldoCliente(1, fiados);
      expect(saldo).toBe(150);
    });

    it('should return 0 for cliente with no fiados', () => {
      const fiados = [{ cliente_id: 1, saldo_pendiente: '100.00' }];

      const saldo = service.calcularSaldoCliente(999, fiados);
      expect(saldo).toBe(0);
    });
  });
});
