import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { VentasStackParamList } from '../../../navigation/types';
import { colors, fontSize, spacing } from '../../../theme';
import type { VentaConDetalle } from '../../../types';
import { getVentaConDetalle } from '../services/ventasService';

type Props = NativeStackScreenProps<VentasStackParamList, 'VentaDetail'>;

export default function VentaDetailScreen({ route }: Props) {
  const { ventaId } = route.params;

  const [venta, setVenta]     = useState<VentaConDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVenta(await getVentaConDetalle(ventaId));
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar la venta');
    } finally {
      setLoading(false);
    }
  }, [ventaId]);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} />;
  if (!venta)  return null;

  const esFiado = venta.tipo_pago === 'fiado';

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Encabezado */}
        <Card style={styles.encabezado}>
          <View style={styles.fechaRow}>
            <Text style={styles.fecha}>Fecha: {venta.fecha ?? '—'}</Text>
            <View style={[styles.tipoBadge, esFiado ? styles.tipoBadgeFiado : styles.tipoBadgeContado]}>
              <Text style={[styles.tipoBadgeText, esFiado ? styles.tipoBadgeTextFiado : styles.tipoBadgeTextContado]}>
                {esFiado ? 'Fiado' : 'Contado'}
              </Text>
            </View>
          </View>

          {venta.cliente && (
            <View style={styles.clienteRow}>
              <Text style={styles.clienteLabel}>Cliente: </Text>
              <Text style={styles.clienteNombre}>{venta.cliente.nombre}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalMonto}>L {Number(venta.total).toFixed(2)}</Text>
          </View>
        </Card>

        {/* Líneas */}
        <Text style={styles.seccion}>Productos ({venta.detalles.length})</Text>

        {venta.detalles.map((d) => (
          <Card key={d.id}>
            <View style={styles.detalleRow}>
              <View style={styles.detalleInfo}>
                <Text style={styles.detalleNombre}>{d.producto?.nombre ?? '—'}</Text>
                <Text style={styles.detalleSub}>
                  {d.cantidad} uds × L {Number(d.precio_unitario).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.detalleSubtotal}>
                L {Number(d.subtotal).toFixed(2)}
              </Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  encabezado: { marginBottom: spacing.md },
  fechaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  fecha: { fontSize: fontSize.sm, color: colors.textSecondary },
  tipoBadge: { borderRadius: 99, paddingVertical: 3, paddingHorizontal: spacing.sm },
  tipoBadgeContado: { backgroundColor: '#D1FAE5' },
  tipoBadgeFiado: { backgroundColor: '#FEF3C7' },
  tipoBadgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  tipoBadgeTextContado: { color: '#065F46' },
  tipoBadgeTextFiado: { color: '#92400E' },
  clienteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  clienteLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  clienteNombre: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  totalMonto: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  seccion: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detalleInfo: { flex: 1 },
  detalleNombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  detalleSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  detalleSubtotal: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
});
