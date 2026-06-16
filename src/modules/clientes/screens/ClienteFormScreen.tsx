import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ClientesStackParamList } from '../../../navigation/types';
import { createCliente, updateCliente } from '../services/clientesService';
import { requerido } from '../../../utils/validation';

type Props = NativeStackScreenProps<ClientesStackParamList, 'ClienteForm'>;

export default function ClienteFormScreen({ route, navigation }: Props) {
  const clienteExistente = route.params?.cliente;
  const esEdicion = !!clienteExistente;

  const [nombre, setNombre] = useState(clienteExistente?.nombre ?? '');
  const [telefono, setTelefono] = useState(clienteExistente?.telefono ?? '');
  const [direccion, setDireccion] = useState(clienteExistente?.direccion ?? '');
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: esEdicion ? 'Editar cliente' : 'Nuevo cliente',
    });
  }, [esEdicion, navigation]);

  const handleGuardar = async () => {
    const errorN = requerido(nombre);
    setErrorNombre(errorN);
    if (errorN) return;

    setLoading(true);
    try {
      if (esEdicion && clienteExistente) {
        await updateCliente(clienteExistente.id, {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim() || null,
        });
      } else {
        await createCliente({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input
          label="Nombre *"
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={(t) => {
            setNombre(t);
            if (errorNombre) setErrorNombre(requerido(t));
          }}
          error={errorNombre}
          autoCapitalize="words"
        />
        <Input
          label="Teléfono"
          placeholder="Número de teléfono"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />
        <Input
          label="Dirección"
          placeholder="Dirección (opcional)"
          value={direccion}
          onChangeText={setDireccion}
          autoCapitalize="sentences"
          multiline
        />
        <Button
          title={esEdicion ? 'Guardar cambios' : 'Registrar cliente'}
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
  btn: { marginTop: 8 },
});
