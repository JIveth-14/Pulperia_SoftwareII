import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ProductosStackParamList } from '../../../navigation/types';
import { colors, spacing } from '../../../theme';
import { ProductoCard } from '../components/ProductoCard';
import { useProductos } from '../hooks/useProductos';

type Props = NativeStackScreenProps<ProductosStackParamList, 'ProductosList'>;

export default function ProductosScreen({ navigation }: Props) {
  const { productos, loading, error, refetch } = useProductos();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (loading && productos.length === 0) return <LoadingSpinner />;

  return (
    <ScreenContainer style={styles.container}>
      {error && <ErrorMessage message={error} />}

      <FlatList
        data={productos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductoCard
            producto={item}
            onPress={() => navigation.navigate('ProductoForm', { productoId: item.id })}
          />
        )}
        ListEmptyComponent={<EmptyState message="No hay productos registrados" />}
        onRefresh={refetch}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProductoForm', {})}
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
