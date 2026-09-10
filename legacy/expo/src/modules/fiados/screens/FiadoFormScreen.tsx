import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ClientesStackParamList } from '../../../navigation/types';
import { colors, fontSize, spacing } from '../../../theme';
import { esMontoValido } from '../../../utils/validation';
import { getClienteById } from '../../clientes/services/clientesService';
import { createFiado } from '../services/fiadosService';

type Props = NativeStackScreenProps<ClientesStackParamList, 'FiadoForm'>;

export default function FiadoFormScreen({ route, navigation }: Props) {
  const { clienteId } = route.params;

  const [nombreCliente, setNombreCliente] = useState('');
  const [monto, setMonto]               = useState('');
  const [errorMonto, setErrorMonto]     = useState<string | undefined>(undefined);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    getClienteById(clienteId)
      .then((c) => setNombreCliente(c.nombre))
      .catch(() => {});
  }, [clienteId]);

  const handleGuardar = async () => {
    const err = esMontoValido(monto) ?? undefined;
    setErrorMonto(err);
    if (err) return;

    setLoading(true);
    try {
      await createFiado({ cliente_id: clienteId, monto_total: parseFloat(monto) });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo registrar el fiado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {nombreCliente ? (
          <Text style={styles.cliente}>Cliente: {nombreCliente}</Text>
        ) : null}
        <Input
          label="Monto del fiado *"
          placeholder="0.00"
          value={monto}
          onChangeText={(t) => {
            setMonto(t);
            if (errorMonto) setErrorMonto(esMontoValido(t) ?? undefined);
          }}
          error={errorMonto}
          keyboardType="decimal-pad"
        />
        <Button
          title="Registrar fiado"
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
  cliente: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  btn: { marginTop: spacing.sm },
});
