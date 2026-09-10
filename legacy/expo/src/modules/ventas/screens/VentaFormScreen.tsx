import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { VentasStackParamList } from '../../../navigation/types';
import { borderRadius, colors, fontSize, spacing } from '../../../theme';
import type { TipoPago } from '../../../types';
import { useProductos } from '../../productos/hooks/useProductos';
import { useVentaForm } from '../hooks/useVentaForm';

type Props = NativeStackScreenProps<VentasStackParamList, 'VentaForm'>;

export default function VentaFormScreen({ navigation }: Props) {
  const { productos, loading: loadingProductos } = useProductos();
  const {
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
  } = useVentaForm();

  // ── Registrar venta ────────────────────────────────────────────────────────
  const onRegistrar = async () => {
    if (lineas.length === 0) {
      Alert.alert('Sin productos', 'Agrega al menos un producto a la venta.');
      return;
    }
    const ok = await handleRegistrar();
    if (ok) navigation.goBack();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── SECCIÓN 1: Cliente (opcional) ───────────────────────────── */}
        <Card style={styles.seccionCard}>
          <Text style={styles.seccionTitulo}>Cliente</Text>
          <Text style={styles.seccionAyuda}>
            Asocia un cliente si la venta puede quedar fiada.
          </Text>

          {!clienteSel ? (
            <Button
              title="Asociar cliente (opcional)"
              onPress={handleAbrirModalCliente}
              variant="secondary"
            />
          ) : (
            <>
              <View style={styles.clienteRow}>
                <View style={styles.clienteInfo}>
                  <Text style={styles.clienteNombre}>{clienteSel.nombre}</Text>
                  <Text style={styles.clienteTel}>{clienteSel.telefono}</Text>
                </View>
                <View style={styles.clienteAcciones}>
                  <TouchableOpacity onPress={handleAbrirModalCliente} style={styles.linkBtn}>
                    <Text style={styles.linkText}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleQuitarCliente} style={styles.linkBtn}>
                    <Text style={[styles.linkText, styles.linkDanger]}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {hayDeudaActiva && (
                <View style={styles.deudaBanner}>
                  <Text style={styles.deudaBannerText}>
                    ⚠ Deuda pendiente: L {saldoDeudaTotal.toFixed(2)}
                  </Text>
                </View>
              )}
            </>
          )}
        </Card>

        {/* ── SECCIÓN 2: Forma de pago ─────────────────────────────────── */}
        {clienteSel && (
          <Card style={styles.seccionCard}>
            <Text style={styles.seccionTitulo}>Forma de pago</Text>

            <View style={styles.tipoPagoRow}>
              {(['contado', 'fiado'] as TipoPago[]).map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.tipoBtn, tipoPago === tipo && styles.tipoBtnActivo]}
                  onPress={() => handleCambiarTipoPago(tipo)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tipoBtnText, tipoPago === tipo && styles.tipoBtnTextActivo]}>
                    {tipo === 'contado' ? '💵 Contado' : '📋 Fiado'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {tipoPago === 'fiado' && (
              <Text style={styles.fiadoNota}>
                Se creará un fiado de L {totalVenta.toFixed(2)} para {clienteSel.nombre}.
              </Text>
            )}

            {/* Cobrar deuda existente (solo contado + hay deuda) */}
            {tipoPago === 'contado' && hayDeudaActiva && (
              <View style={styles.deudaSection}>
                <View style={styles.deudaToggleRow}>
                  <Text style={styles.deudaLabel}>
                    ¿Cobrar deuda pendiente?
                  </Text>
                  <TouchableOpacity
                    style={[styles.toggle, pagarDeuda && styles.toggleActivo]}
                    onPress={() => {
                      setPagarDeuda(!pagarDeuda);
                      setMontoDeuda('');
                      setErrDeuda(undefined);
                    }}
                  >
                    <View style={[styles.toggleCircle, pagarDeuda && styles.toggleCircleActivo]} />
                  </TouchableOpacity>
                </View>

                {pagarDeuda && (
                  <Input
                    label={`Monto a cobrar (deuda total: L ${saldoDeudaTotal.toFixed(2)})`}
                    placeholder={`Máx L ${saldoDeudaTotal.toFixed(2)}`}
                    value={montoDeuda}
                    onChangeText={(t) => {
                      setMontoDeuda(t);
                      if (errDeuda) setErrDeuda(undefined);
                    }}
                    error={errDeuda}
                    keyboardType="decimal-pad"
                  />
                )}
              </View>
            )}
          </Card>
        )}

        {/* ── SECCIÓN 3: Agregar producto ─────────────────────────────── */}
        <Card style={styles.seccionCard}>
          <Text style={styles.seccionTitulo}>Agregar producto</Text>

          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => setShowProductoModal(true)}
            activeOpacity={0.8}
          >
            <Text style={productoSel ? styles.selectorText : styles.selectorPlaceholder}>
              {productoSel ? productoSel.nombre : 'Seleccionar producto...'}
            </Text>
          </TouchableOpacity>

          {productoSel && (
            <Text style={styles.stockInfo}>
              Disponible: {stockDisponible(productoSel)} uds · L {Number(productoSel.precio).toFixed(2)} c/u
            </Text>
          )}

          <Input
            label="Cantidad"
            placeholder="0"
            value={cantidadInput}
            onChangeText={(t) => { setCantidadInput(t); if (errCantidad) setErrCantidad(undefined); }}
            error={errCantidad}
            keyboardType="number-pad"
            editable={!!productoSel}
          />

          <Button
            title="Agregar a la venta"
            onPress={handleAgregarLinea}
            disabled={!productoSel || !cantidadInput}
            variant="secondary"
          />
        </Card>

        {/* ── LÍNEAS AGREGADAS ────────────────────────────────────────── */}
        {lineas.length > 0 && (
          <Text style={styles.subTitulo}>Productos en la venta</Text>
        )}

        {lineas.map((item) => (
          <Card key={item.producto.id}>
            <View style={styles.lineaRow}>
              <View style={styles.lineaInfo}>
                <Text style={styles.lineaNombre}>{item.producto.nombre}</Text>
                <Text style={styles.lineaSub}>
                  {item.cantidad} × L {Number(item.producto.precio).toFixed(2)}
                </Text>
              </View>
              <View style={styles.lineaDer}>
                <Text style={styles.lineaSubtotal}>
                  L {(item.cantidad * Number(item.producto.precio)).toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleQuitarLinea(item.producto.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.quitar}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}

        {lineas.length === 0 && (
          <EmptyState message="Selecciona productos para armar la venta" />
        )}

        {/* ── FOOTER: total + registrar ────────────────────────────────── */}
        {lineas.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total venta</Text>
              <Text style={styles.totalMonto}>L {totalVenta.toFixed(2)}</Text>
            </View>

            {pagarDeuda && montoDeuda ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelSub}>+ Cobro de deuda</Text>
                <Text style={styles.totalMontoSub}>L {parseFloat(montoDeuda || '0').toFixed(2)}</Text>
              </View>
            ) : null}

            {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}

            <Button
              title="Registrar venta"
              onPress={onRegistrar}
              loading={loading}
            />
          </View>
        )}
      </ScrollView>

      {/* ── MODAL: Selector de producto ─────────────────────────────────── */}
      <Modal visible={showProductoModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitulo}>Seleccionar producto</Text>
              <TouchableOpacity onPress={() => setShowProductoModal(false)}>
                <Text style={styles.sheetCerrar}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            {loadingProductos ? (
              <LoadingSpinner />
            ) : (
              <FlatList
                data={productos.filter((p) => stockDisponible(p) > 0)}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setProductoSel(item);
                      setCantidadInput('');
                      setErrCantidad(undefined);
                      setShowProductoModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalItemNombre}>{item.nombre}</Text>
                    <Text style={styles.modalItemInfo}>
                      L {Number(item.precio).toFixed(2)} · stock: {stockDisponible(item)} uds
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separador} />}
                ListEmptyComponent={<EmptyState message="Sin productos con stock disponible" />}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL: Selector de cliente ───────────────────────────────────── */}
      <Modal visible={showClienteModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitulo}>Seleccionar cliente</Text>
              <TouchableOpacity onPress={() => setShowClienteModal(false)}>
                <Text style={styles.sheetCerrar}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            {loadingClientes ? (
              <LoadingSpinner />
            ) : (
              <FlatList
                data={clientes}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleSeleccionarCliente(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalItemNombre}>{item.nombre}</Text>
                    <Text style={styles.modalItemInfo}>
                      {item.telefono}
                      {item.saldo > 0
                        ? `  ·  Deuda: L ${Number(item.saldo).toFixed(2)}`
                        : '  ·  Sin deuda'}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separador} />}
                ListEmptyComponent={<EmptyState message="No hay clientes registrados" />}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 0 },
  scroll: { padding: spacing.md, paddingBottom: 48 },

  // Secciones
  seccionCard: { marginBottom: spacing.md },
  seccionTitulo: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  seccionAyuda: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  subTitulo: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },

  // Selector de producto
  selectorBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  selectorText: { fontSize: fontSize.md, color: colors.text },
  selectorPlaceholder: { fontSize: fontSize.md, color: colors.textSecondary },
  stockInfo: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm },

  // Líneas de venta
  lineaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineaInfo: { flex: 1 },
  lineaNombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  lineaSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  lineaDer: { alignItems: 'flex-end' },
  lineaSubtotal: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  quitar: { color: colors.danger, fontSize: fontSize.md, marginTop: spacing.xs },

  // Cliente
  clienteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clienteInfo: { flex: 1 },
  clienteNombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  clienteTel: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  clienteAcciones: { flexDirection: 'row' },
  linkBtn: { marginLeft: spacing.md, paddingVertical: 2 },
  linkText: { fontSize: fontSize.sm, color: colors.primary },
  linkDanger: { color: colors.danger },
  deudaBanner: {
    marginTop: spacing.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  deudaBannerText: { fontSize: fontSize.sm, color: '#92400E', fontWeight: '600' },

  // Tipo de pago
  tipoPagoRow: { flexDirection: 'row', marginBottom: spacing.sm },
  tipoBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  tipoBtnActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  tipoBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  tipoBtnTextActivo: { color: '#fff' },
  fiadoNota: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  // Cobrar deuda
  deudaSection: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  deudaToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  deudaLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500', flex: 1 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActivo: { backgroundColor: colors.secondary },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActivo: { alignSelf: 'flex-end' },

  // Footer
  footer: { marginTop: spacing.md },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  totalMonto: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  totalLabelSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  totalMontoSub: { fontSize: fontSize.sm, color: colors.secondary, fontWeight: '600' },
  errorMsg: { color: colors.danger, fontSize: fontSize.sm, marginVertical: spacing.sm, textAlign: 'center' },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '72%',
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitulo: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  sheetCerrar: { fontSize: fontSize.md, color: colors.primary },
  modalItem: { padding: spacing.md },
  modalItemNombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  modalItemInfo: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  separador: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
});
