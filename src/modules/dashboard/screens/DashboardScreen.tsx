import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { colors, fontSize, spacing } from '../../../theme';
import type { ClienteConSaldo } from '../../../types';
import { getClientesConSaldo } from '../../clientes/services/clientesService';
import { useProductosBajoStock } from '../../productos/hooks/useProductosBajoStock';
import { useVentasDelDia } from '../../ventas/hooks/useVentasDelDia';

export default function DashboardScreen() {
  const [clientes, setClientes]         = useState<ClienteConSaldo[]>([]);
  const [loadClientes, setLoadClientes] = useState(true);
  const [errClientes, setErrClientes]   = useState<string | null>(null);

  const { productos: bajoStock, loading: loadProd, error: errProd, refetch: refetchProd }   = useProductosBajoStock();
  const { ventas, loading: loadVentas, error: errVentas, refetch: refetchVentas }           = useVentasDelDia();

  const cargarClientes = useCallback(() => {
    setLoadClientes(true);
    getClientesConSaldo()
      .then(setClientes)
      .catch((e) => setErrClientes(e.message ?? 'Error al cargar clientes'))
      .finally(() => setLoadClientes(false));
  }, []);

  // Recarga las tres tarjetas cada vez que el Dashboard recupera el foco,
  // para reflejar pagos, ventas o cambios de stock hechos en otras pantallas.
  useFocusEffect(
    useCallback(() => {
      cargarClientes();
      refetchProd();
      refetchVentas();
    }, [cargarClientes, refetchProd, refetchVentas])
  );

  const clientesConDeuda = clientes.filter((c) => c.saldo > 0);
  const totalDeuda       = clientesConDeuda.reduce((s, c) => s + c.saldo, 0);
  const totalVentasHoy   = ventas.reduce((s, v) => s + Number(v.total), 0);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Resumen del día</Text>

        {/* Clientes con deuda */}
        <Card>
          <Text style={styles.cardTitulo}>Clientes con deuda</Text>
          {loadClientes ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : errClientes ? (
            <ErrorMessage message={errClientes} />
          ) : (
            <>
              <Text style={styles.numero}>{clientesConDeuda.length}</Text>
              <Text style={styles.subtexto}>
                Total adeudado:{' '}
                <Text style={styles.colorDeuda}>L {totalDeuda.toFixed(2)}</Text>
              </Text>
            </>
          )}
        </Card>

        {/* Bajo stock */}
        <Card>
          <Text style={styles.cardTitulo}>Productos con bajo stock</Text>
          {loadProd ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : errProd ? (
            <ErrorMessage message={errProd} />
          ) : bajoStock.length === 0 ? (
            <Text style={styles.ok}>Todos los productos tienen stock suficiente ✓</Text>
          ) : (
            bajoStock.slice(0, 5).map((p) => (
              <View key={p.id} style={styles.productoRow}>
                <Text style={styles.productoNombre}>{p.nombre}</Text>
                <Text style={styles.productoBajoStock}>{p.stock} uds</Text>
              </View>
            ))
          )}
        </Card>

        {/* Ventas del día */}
        <Card>
          <Text style={styles.cardTitulo}>Ventas de hoy</Text>
          {loadVentas ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : errVentas ? (
            <ErrorMessage message={errVentas} />
          ) : (
            <>
              <Text style={styles.numero}>
                {ventas.length} venta{ventas.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.subtexto}>
                Total:{' '}
                <Text style={styles.colorVentas}>L {totalVentasHoy.toFixed(2)}</Text>
              </Text>
            </>
          )}
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardTitulo: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  numero: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  subtexto: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  colorDeuda: { color: colors.danger, fontWeight: '600' },
  colorVentas: { color: colors.secondary, fontWeight: '600' },
  ok: { fontSize: fontSize.sm, color: colors.secondary },
  spinner: { paddingVertical: spacing.md },
  productoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productoNombre: { fontSize: fontSize.sm, color: colors.text },
  productoBajoStock: { fontSize: fontSize.sm, color: colors.warning, fontWeight: '700' },
});
