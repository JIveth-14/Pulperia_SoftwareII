import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ClientesStackParamList } from '../../../navigation/types';
import { colors, fontSize, spacing } from '../../../theme';
import type { ClienteConSaldo } from '../../../types';
import { ClienteCard } from '../components/ClienteCard';
import { useClientes } from '../hooks/useClientes';

type Props = NativeStackScreenProps<ClientesStackParamList, 'ClientesList'>;

export default function ClientesScreen({ navigation }: Props) {
  const { clientes, loading, error, refetch } = useClientes();
  const [busqueda, setBusqueda] = useState('');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSeleccionar = (cliente: ClienteConSaldo) => {
    navigation.navigate('ClienteDetail', { clienteId: cliente.id });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScreenContainer style={styles.container}>
      {error && <ErrorMessage message={error} />}

      <TextInput
        style={styles.buscador}
        placeholder="Buscar cliente por nombre..."
        placeholderTextColor={colors.textSecondary}
        value={busqueda}
        onChangeText={setBusqueda}
      />

      <FlatList
        data={clientesFiltrados}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ClienteCard
            cliente={item}
            onPress={() => handleSeleccionar(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            message={
              busqueda
                ? 'No se encontraron clientes con ese nombre'
                : 'No hay clientes registrados'
            }
          />
        }
        onRefresh={refetch}
        refreshing={loading}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ClienteForm', {})}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 0 },
  buscador: {
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  lista: { paddingHorizontal: spacing.md, paddingBottom: 100 },
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
