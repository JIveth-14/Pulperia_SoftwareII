import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, fontSize, spacing } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'secondary';
  style?: ViewStyle;
}

// Mapa de variantes: agregar una variante nueva solo requiere añadir una
// entrada aquí, sin modificar la lógica del componente (OCP).
const VARIANTES: Record<
  NonNullable<Props['variant']>,
  { bg: string; text: string }
> = {
  primary: { bg: colors.primary, text: '#fff' },
  danger: { bg: colors.danger, text: '#fff' },
  secondary: { bg: colors.border, text: colors.text },
};

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: Props) {
  const { bg, text: textColor } = VARIANTES[variant];

  const handlePress = () => {
    try {
      onPress();
    } catch (e: any) {
      console.error('Button onPress error:', e?.message ?? e);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: bg },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  label: { fontSize: fontSize.md, fontWeight: '600' },
});
