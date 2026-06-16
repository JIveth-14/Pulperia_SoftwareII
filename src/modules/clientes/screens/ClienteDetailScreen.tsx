import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
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
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ClientesStackParamList } from '../../../navigation/types';
import { colors, fontSize, spacing } from '../../../theme';
import type { Cliente, EstadoFiado, Fiado } from '../../../types';
import { getFiadosByCliente } from '../../fiados/services/fiadosService';
import { getClienteById } from '../services/clientesService';

type Props = NativeStackScreenProps<ClientesStackParamList, 'ClienteDetail'>;

const BADGE: Record<EstadoFiado, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#FED7AA', text: '#C2410C', label: 'Pendiente' },
  parcial:   { bg: '#FEF9C3', text: '#A16207', label: 'Parcial' },
  pagado:    { bg: '#D1FAE5', text: '#065F46', label: 'Pagado' },
};

export default function ClienteDetailScreen({ route, navigation }: Props) {
  const { clienteId } = route.params;

  const [cliente, setCliente]   = useState<Cliente | null>(null);
  const [fiados, setFiados]     = useState<Fiado[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const cargar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [c, f] = await Promise.all([
        getClienteById(clienteId),
        getFiadosByCliente(clienteId),
      ]);
      setCliente(c);
      setFiados(f);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clienteId]);

  // Recarga cada vez que la pantalla recupera el foco (p. ej. al volver de
  // PagoForm o FiadoForm), no solo cuando se monta por primera vez.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  useEffect(() => {
    if (!cliente) return;
    navigation.setOptions({
      title: cliente.nombre,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('ClienteForm', { cliente: cliente! })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editBtn}>Editar</Text>
        </TouchableOpacity>
      ),
    });
  }, [cliente, navigation]);

  const saldoTotal = fiados.reduce((s, f) => s + Number(f.saldo_pendiente), 0);

  const handleRegistrarPago = () => {
    const activos = fiados.filter((f) => Number(f.saldo_pendiente) > 0);
    if (activos.length === 0) {
      Alert.alert('Sin deuda', 'Este cliente no tiene fiados con saldo pendiente.');
      return;
    }
    if (activos.length === 1) {
      navigation.navigate('PagoForm', {
        fiadoId: activos[0].id,
        saldoPendiente: Number(activos[0].saldo_pendiente),
      });
      return;
    }
    Alert.alert(
      'Selecciona el fiado',
      'El cliente tiene varios fiados pendientes:',
      activos.map((f) => ({
        text: `Fiado L ${Number(f.monto_total).toFixed(2)} — saldo L ${Number(f.saldo_pendiente).toFixed(2)}`,
        onPress: () =>
          navigation.navigate('PagoForm', {
            fiadoId: f.id,
            saldoPendiente: Number(f.saldo_pendiente),
          }),
      }))
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} />;
  if (!cliente) return null;

  const fiadosActivos = fiados.filter((f) => f.estado !== 'pagado');

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => cargar(true)} />
        }
      >
        {/* Info del cliente */}
        <Card style={styles.infoCard}>
          <Text style={styles.nombre}>{cliente.nombre}</Text>
          <Text style={styles.dato}>{cliente.telefono}</Text>
          {cliente.direccion ? <Text style={styles.dato}>{cliente.direccion}</Text> : null}
          <View style={styles.saldoRow}>
            <Text style={styles.saldoLabel}>Saldo total pendiente</Text>
            <Text style={[styles.saldoMonto, saldoTotal > 0 ? styles.saldoDeuda : styles.saldoOk]}>
              L {saldoTotal.toFixed(2)}
            </Text>
          </View>
        </Card>

        {/* Acciones */}
        <View style={styles.acciones}>
          <Button
            title="Agregar fiado"
            onPress={() => navigation.navigate('FiadoForm', { clienteId })}
            style={styles.btnAccion}
          />
          <Button
            title="Registrar pago"
            onPress={handleRegistrarPago}
            variant="secondary"
            style={styles.btnAccion}
          />
          <Button
            title="Ver historial de pagos"
            onPress={() => navigation.navigate('HistorialPagos', { clienteId })}
            variant="secondary"
            style={styles.btnAccion}
          />
        </View>

        {/* Lista de fiados */}
        <Text style={styles.seccion}>Fiados activos</Text>
        {fiadosActivos.length === 0 ? (
          <EmptyState message="Sin fiados pendientes" />
        ) : (
          fiadosActivos.map((f) => {
            const estado = f.estado ?? 'pendiente';
            const badge = BADGE[estado] ?? BADGE['pendiente'];
            return (
              <Card key={f.id}>
                <View style={styles.fiadoRow}>
                  <View style={styles.fiadoInfo}>
                    <Text style={styles.fiadoMonto}>L {Number(f.monto_total).toFixed(2)}</Text>
                    <Text style={styles.fiadoSaldo}>
                      Saldo pendiente: L {Number(f.saldo_pendiente).toFixed(2)}
                    </Text>
                    <Text style={styles.fiadoFecha}>{f.fecha ?? ''}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  editBtn: { color: colors.primary, fontSize: fontSize.md, marginRight: spacing.sm },
  infoCard: { marginBottom: spacing.md },
  nombre: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  dato: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: 2 },
  saldoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saldoLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  saldoMonto: { fontSize: fontSize.lg, fontWeight: '700' },
  saldoDeuda: { color: colors.danger },
  saldoOk: { color: colors.secondary },
  acciones: { marginBottom: spacing.md },
  btnAccion: { marginBottom: spacing.sm },
  seccion: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  fiadoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fiadoInfo: { flex: 1 },
  fiadoMonto: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  fiadoSaldo: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  fiadoFecha: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: 99, paddingVertical: 4, paddingHorizontal: spacing.sm, marginLeft: spacing.sm },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
});
