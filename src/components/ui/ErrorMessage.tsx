import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, fontSize, spacing } from '../../theme';

interface Props {
  message: string;
}

export function ErrorMessage({ message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.md,
  },
  text: { color: colors.danger, fontSize: fontSize.sm },
});
