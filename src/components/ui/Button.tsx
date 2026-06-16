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

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: Props) {
  const bg =
    variant === 'danger'
      ? colors.danger
      : variant === 'secondary'
      ? colors.border
      : colors.primary;

  const textColor = variant === 'secondary' ? colors.text : '#fff';

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
