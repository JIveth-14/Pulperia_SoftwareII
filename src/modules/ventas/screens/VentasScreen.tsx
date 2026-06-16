import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { VentasStackParamList } from '../../../navigation/types';
import { colors, fontSize, spacing } from '../../../theme';
import { useVentas } from '../hooks/useVentas';

type Props = NativeStackScreenProps<VentasStackParamList, 'VentasList'>;

export default function VentasScreen({ navigation }: Props) {
  const { ventas, loading, error, refetch } = useVentas();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const hoy = new Date().toISOString().split('T')[0];

  const { totalHoy, cantidadHoy } = useMemo(() => {
    const deHoy = ventas.filter((v) => v.fecha === hoy);
    return {
      cantidadHoy: deHoy.length,
      totalHoy: deHoy.reduce((s, v) => s + Number(v.total), 0),
    };
  }, [ventas, hoy]);

  if (loading && ventas.length === 0) return <LoadingSpinner />;

  return (
    <ScreenContainer style={styles.container}>
      {error && <ErrorMessage message={error} />}

      <FlatList
        data={ventas}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}
        onRefresh={refetch}
        refreshing={loading}
        ListHeaderComponent={
          <Card style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Ventas de hoy</Text>
            <Text style={styles.resumenMonto}>L {totalHoy.toFixed(2)}</Text>
            <Text style={styles.resumenSub}>
              {cantidadHoy} venta{cantidadHoy !== 1 ? 's' : ''}
            </Text>
          </Card>
        }
        renderItem={({ item }) => {
          const esFiado = item.tipo_pago === 'fiado';
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('VentaDetail', { ventaId: item.id })}
              activeOpacity={0.8}
            >
              <Card>
                <View style={styles.ventaRow}>
                  <View style={styles.ventaInfo}>
                    <Text style={styles.ventaFecha}>{item.fecha ?? '—'}</Text>
                    {esFiado && (
                      <View style={styles.fiadoBadge}>
                        <Text style={styles.fiadoBadgeText}>Fiado</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.ventaTotal}>L {Number(item.total).toFixed(2)}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<EmptyState message="No hay ventas registradas" />}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('VentaForm')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 0 },
  lista: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  resumenCard: { marginBottom: spacing.sm },
  resumenLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  resumenMonto: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.secondary, marginTop: spacing.xs },
  resumenSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  ventaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ventaInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ventaFecha: { fontSize: fontSize.md, color: colors.textSecondary },
  fiadoBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 99,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  fiadoBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: '#92400E' },
  ventaTotal: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
