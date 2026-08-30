import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors, fontSize, spacing } from '../../../theme';
import type { ClienteConSaldo } from '../../../types';

interface Props {
  cliente: ClienteConSaldo;
  onPress: () => void;
}

export function ClienteCard({ cliente, onPress }: Props) {
  const tieneSaldo = cliente.saldo > 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.nombre} numberOfLines={1}>
              {cliente.nombre}
            </Text>
            <Text style={styles.telefono}>{cliente.telefono}</Text>
          </View>
          <View style={[styles.badge, tieneSaldo ? styles.badgeDeuda : styles.badgeOk]}>
            <Text style={[styles.badgeText, tieneSaldo ? styles.textDeuda : styles.textOk]}>
              L {Number(cliente.saldo).toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: { flex: 1, marginRight: spacing.sm },
  nombre: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  telefono: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  badgeDeuda: { backgroundColor: '#FEE2E2' },
  badgeOk: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  textDeuda: { color: colors.danger },
  textOk: { color: colors.secondary },
});
