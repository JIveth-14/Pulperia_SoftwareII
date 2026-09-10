import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ClientesStackParamList } from '../../../navigation/types';
import { colors, fontSize, spacing } from '../../../theme';
import { esMontoValido } from '../../../utils/validation';
import { createPago } from '../services/pagosService';

type Props = NativeStackScreenProps<ClientesStackParamList, 'PagoForm'>;

export default function PagoFormScreen({ route, navigation }: Props) {
  const { fiadoId, saldoPendiente } = route.params;

  const [monto, setMonto]           = useState('');
  const [errorMonto, setErrorMonto] = useState<string | undefined>(undefined);
  const [loading, setLoading]       = useState(false);

  const validar = (valor: string): string | undefined => {
    const base = esMontoValido(valor);
    if (base) return base;
    if (parseFloat(valor) > saldoPendiente) return 'El monto supera el saldo pendiente';
    return undefined;
  };

  const handleGuardar = async () => {
    const err = validar(monto);
    setErrorMonto(err);
    if (err) return;

    setLoading(true);
    try {
      await createPago({ fiado_id: fiadoId, monto_pagado: parseFloat(monto) });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.saldo}>
          Saldo disponible:{' '}
          <Text style={styles.saldoMonto}>L {saldoPendiente.toFixed(2)}</Text>
        </Text>
        <Input
          label="Monto a pagar *"
          placeholder="0.00"
          value={monto}
          onChangeText={(t) => {
            setMonto(t);
            if (errorMonto) setErrorMonto(validar(t));
          }}
          error={errorMonto}
          keyboardType="decimal-pad"
        />
        <Button
          title="Registrar pago"
          onPress={handleGuardar}
          loading={loading}
          style={styles.btn}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: 32 },
  saldo: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.md },
  saldoMonto: { color: colors.primary, fontWeight: '700' },
  btn: { marginTop: spacing.sm },
});
