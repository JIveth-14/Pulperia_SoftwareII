import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ClientesStackParamList } from '../../../navigation/types';
import { colors, fontSize } from '../../../theme';
import type { Pago } from '../../../types';
import { getPagosByCliente } from '../services/pagosService';

type Props = NativeStackScreenProps<ClientesStackParamList, 'HistorialPagos'>;

export default function HistorialPagosScreen({ route }: Props) {
  const { clienteId } = route.params;

  const [pagos, setPagos]     = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPagos(await getPagosByCliente(clienteId));
    } catch (e: any) {
      setError(e.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  if (loading && pagos.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ScreenContainer>
      <FlatList
        data={pagos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.monto}>L {Number(item.monto_pagado).toFixed(2)}</Text>
              <Text style={styles.fecha}>{item.fecha_pago ?? ''}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState message="Sin pagos registrados" />}
        onRefresh={cargar}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lista: { paddingBottom: 32 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monto: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  fecha: { fontSize: fontSize.sm, color: colors.textSecondary },
});
