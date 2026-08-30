import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors, fontSize, spacing } from '../../../theme';
import type { Producto } from '../../../types';

interface Props {
  producto: Producto;
  onPress: () => void;
}

export function ProductoCard({ producto, onPress }: Props) {
  const bajStock = producto.stock <= producto.stock_minimo;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={bajStock ? styles.cardAlert : undefined}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.nombre}>{producto.nombre}</Text>
            <Text style={styles.precio}>L {Number(producto.precio).toFixed(2)}</Text>
          </View>
          <View style={[styles.stockBadge, bajStock ? styles.stockBajo : styles.stockOk]}>
            <Text style={[styles.stockText, bajStock ? styles.stockTextBajo : styles.stockTextOk]}>
              {producto.stock} uds
            </Text>
            {bajStock && <Text style={styles.alerta}>⚠ Bajo stock</Text>}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1 },
  nombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  precio: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  cardAlert: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  stockBadge: { alignItems: 'center', borderRadius: 8, padding: spacing.sm },
  stockOk: { backgroundColor: '#D1FAE5' },
  stockBajo: { backgroundColor: '#FEF3C7' },
  stockText: { fontSize: fontSize.sm, fontWeight: '700' },
  stockTextOk: { color: colors.secondary },
  stockTextBajo: { color: colors.warning },
  alerta: { fontSize: fontSize.xs, color: colors.warning, marginTop: 2 },
});
