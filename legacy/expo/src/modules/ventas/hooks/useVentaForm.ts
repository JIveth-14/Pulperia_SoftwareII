import { useCallback, useState } from 'react';
import type { ClienteConSaldo, Fiado, LineaVentaInput, Producto, TipoPago } from '../../../types';
import { clienteService } from '../../clientes/services/clientesService';
import { fiadoService } from '../../fiados/services/fiadosService';
import { pagoService } from '../../pagos/services/pagosService';
import { ventaService } from '../services/ventasService';

export interface LineaLocal {
  producto: Producto;
  cantidad: number;
}

export interface UseVentaFormResult {
  // Estado
  lineas: LineaLocal[];
  productoSel: Producto | null;
  cantidadInput: string;
  errCantidad: string | undefined;
  showProductoModal: boolean;
  clienteSel: ClienteConSaldo | null;
  clientes: ClienteConSaldo[];
  fiadosCliente: Fiado[];
  loadingClientes: boolean;
  showClienteModal: boolean;
  tipoPago: TipoPago;
  pagarDeuda: boolean;
  montoDeuda: string;
  errDeuda: string | undefined;
  loading: boolean;
  errorMsg: string | null;
  // Computed
  stockDisponible: (p: Producto) => number;
  totalVenta: number;
  saldoDeudaTotal: number;
  hayDeudaActiva: boolean;
  // Acciones
  setProductoSel: (p: Producto | null) => void;
  setCantidadInput: (v: string) => void;
  setErrCantidad: (v: string | undefined) => void;
  setShowProductoModal: (v: boolean) => void;
  setShowClienteModal: (v: boolean) => void;
  setPagarDeuda: (v: boolean) => void;
  setMontoDeuda: (v: string) => void;
  setErrDeuda: (v: string | undefined) => void;
  handleAgregarLinea: () => void;
  handleQuitarLinea: (productoId: number) => void;
  handleAbrirModalCliente: () => Promise<void>;
  handleSeleccionarCliente: (cliente: ClienteConSaldo) => Promise<void>;
  handleQuitarCliente: () => void;
  handleCambiarTipoPago: (tipo: TipoPago) => void;
  handleRegistrar: () => Promise<boolean>;
}

/**
 * Hook orquestador del formulario de venta. Encapsula la lógica de negocio y
 * el acceso a los servicios de clientes, fiados, pagos y ventas, de modo que
 * la pantalla dependa de una única interfaz (ISP) en lugar de acoplarse a
 * cuatro servicios distintos.
 */
export function useVentaForm(): UseVentaFormResult {
  // ── Productos ──────────────────────────────────────────────────────────────
  const [lineas, setLineas] = useState<LineaLocal[]>([]);
  const [productoSel, setProductoSel] = useState<Producto | null>(null);
  const [cantidadInput, setCantidadInput] = useState('');
  const [errCantidad, setErrCantidad] = useState<string | undefined>(undefined);
  const [showProductoModal, setShowProductoModal] = useState(false);

  // ── Cliente ────────────────────────────────────────────────────────────────
  const [clienteSel, setClienteSel] = useState<ClienteConSaldo | null>(null);
  const [clientes, setClientes] = useState<ClienteConSaldo[]>([]);
  const [fiadosCliente, setFiadosCliente] = useState<Fiado[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);

  // ── Pago ───────────────────────────────────────────────────────────────────
  const [tipoPago, setTipoPago] = useState<TipoPago>('contado');
  const [pagarDeuda, setPagarDeuda] = useState(false);
  const [montoDeuda, setMontoDeuda] = useState('');
  const [errDeuda, setErrDeuda] = useState<string | undefined>(undefined);

  // ── General ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  const stockDisponible = (p: Producto) =>
    p.stock - (lineas.find((l) => l.producto.id === p.id)?.cantidad ?? 0);

  const totalVenta = lineas.reduce(
    (s, l) => s + Number(l.producto.precio) * l.cantidad,
    0
  );

  const saldoDeudaTotal = fiadosCliente.reduce(
    (s, f) => s + Number(f.saldo_pendiente),
    0
  );

  const hayDeudaActiva = saldoDeudaTotal > 0;

  // ── Handlers: productos ────────────────────────────────────────────────────
  const handleAgregarLinea = () => {
    if (!productoSel) return;
    const cant = parseInt(cantidadInput, 10);
    if (isNaN(cant) || cant <= 0) {
      setErrCantidad('Ingresa una cantidad válida');
      return;
    }
    const disponible = stockDisponible(productoSel);
    if (cant > disponible) {
      setErrCantidad(`Máximo disponible: ${disponible} uds`);
      return;
    }
    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.producto.id === productoSel.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + cant };
        return copia;
      }
      return [...prev, { producto: productoSel, cantidad: cant }];
    });
    setProductoSel(null);
    setCantidadInput('');
    setErrCantidad(undefined);
  };

  const handleQuitarLinea = (productoId: number) => {
    setLineas((prev) => prev.filter((l) => l.producto.id !== productoId));
    if (productoSel?.id === productoId) {
      setProductoSel(null);
      setCantidadInput('');
    }
  };

  // ── Handlers: cliente ──────────────────────────────────────────────────────
  const handleAbrirModalCliente = useCallback(async () => {
    if (clientes.length === 0) {
      setLoadingClientes(true);
      try {
        setClientes(await clienteService.getClientesConSaldo());
      } catch {
        /* silent */
      } finally {
        setLoadingClientes(false);
      }
    }
    setShowClienteModal(true);
  }, [clientes.length]);

  const handleSeleccionarCliente = useCallback(async (cliente: ClienteConSaldo) => {
    setClienteSel(cliente);
    setShowClienteModal(false);
    setTipoPago('contado');
    setPagarDeuda(false);
    setMontoDeuda('');
    setErrDeuda(undefined);

    try {
      const todos = await fiadoService.getFiadosByCliente(cliente.id);
      setFiadosCliente(todos.filter((f) => Number(f.saldo_pendiente) > 0));
    } catch {
      /* silent */
    }
  }, []);

  const handleQuitarCliente = useCallback(() => {
    setClienteSel(null);
    setFiadosCliente([]);
    setTipoPago('contado');
    setPagarDeuda(false);
    setMontoDeuda('');
    setErrDeuda(undefined);
  }, []);

  // ── Handlers: pago ────────────────────────────────────────────────────────
  const handleCambiarTipoPago = useCallback((tipo: TipoPago) => {
    setTipoPago(tipo);
    setPagarDeuda(false);
    setMontoDeuda('');
    setErrDeuda(undefined);
  }, []);

  // ── Registrar venta ────────────────────────────────────────────────────────
  const handleRegistrar = useCallback(async (): Promise<boolean> => {
    if (lineas.length === 0) return false;

    // Validar monto de deuda si aplica
    if (pagarDeuda && clienteSel) {
      const monto = parseFloat(montoDeuda);
      if (isNaN(monto) || monto <= 0) {
        setErrDeuda('Ingresa un monto válido');
        return false;
      }
      if (monto > saldoDeudaTotal) {
        setErrDeuda(`El monto supera la deuda total (L ${saldoDeudaTotal.toFixed(2)})`);
        return false;
      }
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      const lineasInput: LineaVentaInput[] = lineas.map((l) => ({
        producto_id: l.producto.id,
        cantidad: l.cantidad,
      }));

      await ventaService.createVenta(lineasInput, clienteSel?.id, tipoPago);

      if (pagarDeuda && clienteSel && montoDeuda) {
        await pagoService.pagarDeudaCliente(clienteSel.id, parseFloat(montoDeuda));
      }

      return true;
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'No se pudo registrar la venta');
      return false;
    } finally {
      setLoading(false);
    }
  }, [lineas, pagarDeuda, clienteSel, montoDeuda, saldoDeudaTotal, tipoPago]);

  return {
    lineas,
    productoSel,
    cantidadInput,
    errCantidad,
    showProductoModal,
    clienteSel,
    clientes,
    fiadosCliente,
    loadingClientes,
    showClienteModal,
    tipoPago,
    pagarDeuda,
    montoDeuda,
    errDeuda,
    loading,
    errorMsg,
    stockDisponible,
    totalVenta,
    saldoDeudaTotal,
    hayDeudaActiva,
    setProductoSel,
    setCantidadInput,
    setErrCantidad,
    setShowProductoModal,
    setShowClienteModal,
    setPagarDeuda,
    setMontoDeuda,
    setErrDeuda,
    handleAgregarLinea,
    handleQuitarLinea,
    handleAbrirModalCliente,
    handleSeleccionarCliente,
    handleQuitarCliente,
    handleCambiarTipoPago,
    handleRegistrar,
  };
}