import type { Cliente, Fiado } from '../types';

export type ClientesStackParamList = {
  ClientesList: undefined;
  ClienteForm: { cliente?: Cliente };
  ClienteDetail: { clienteId: number };
  FiadoForm: { clienteId: number };
  PagoForm: { fiadoId: number; saldoPendiente: number };
  HistorialPagos: { clienteId: number };
};

export type ProductosStackParamList = {
  ProductosList: undefined;
  ProductoForm: { productoId?: number };
};

export type VentasStackParamList = {
  VentasList: undefined;
  VentaForm: undefined;
  VentaDetail: { ventaId: number };
};
