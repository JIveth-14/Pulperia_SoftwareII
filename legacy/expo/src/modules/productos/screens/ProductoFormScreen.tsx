import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ProductosStackParamList } from '../../../navigation/types';
import {
  esEnteroPositivo,
  esNumeroPositivo,
  requerido,
} from '../../../utils/validation';
import { createProducto, getProductoById, updateProducto } from '../services/productosService';

type Props = NativeStackScreenProps<ProductosStackParamList, 'ProductoForm'>;

export default function ProductoFormScreen({ route, navigation }: Props) {
  const { productoId } = route.params ?? {};
  const esEdicion = !!productoId;

  const [nombre, setNombre]           = useState('');
  const [precio, setPrecio]           = useState('');
  const [stock, setStock]             = useState('0');
  const [stockMinimo, setStockMinimo] = useState('5');

  const [errNombre, setErrNombre]     = useState<string | undefined>(undefined);
  const [errPrecio, setErrPrecio]     = useState<string | undefined>(undefined);
  const [errStock, setErrStock]       = useState<string | undefined>(undefined);
  const [errStockMin, setErrStockMin] = useState<string | undefined>(undefined);

  const [loading, setLoading]   = useState(false);
  const [cargando, setCargando] = useState(esEdicion);

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar producto' : 'Nuevo producto' });
  }, [esEdicion, navigation]);

  useEffect(() => {
    if (!productoId) return;
    getProductoById(productoId)
      .then((p) => {
        setNombre(p.nombre);
        setPrecio(String(p.precio));
        setStock(String(p.stock));
        setStockMinimo(String(p.stock_minimo));
      })
      .catch((e) => {
        Alert.alert('Error', e?.message ?? 'No se pudo cargar el producto');
        navigation.goBack();
      })
      .finally(() => setCargando(false));
  }, [productoId, navigation]);

  const handleGuardar = async () => {
    const eN  = requerido(nombre) ?? undefined;
    const eP  = esNumeroPositivo(precio) ?? undefined;
    const eS  = esEnteroPositivo(stock) ?? undefined;
    const eSM = esEnteroPositivo(stockMinimo) ?? undefined;

    setErrNombre(eN);
    setErrPrecio(eP);
    setErrStock(eS);
    setErrStockMin(eSM);

    if (eN || eP || eS || eSM) return;

    setLoading(true);
    try {
      const datos = {
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        stock: parseInt(stock, 10),
        stock_minimo: parseInt(stockMinimo, 10),
      };
      if (esEdicion && productoId) {
        await updateProducto(productoId, datos);
      } else {
        await createProducto(datos);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (cargando) return <LoadingSpinner />;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input
          label="Nombre *"
          placeholder="Nombre del producto"
          value={nombre}
          onChangeText={(t) => {
            setNombre(t);
            if (errNombre) setErrNombre(requerido(t) ?? undefined);
          }}
          error={errNombre}
          autoCapitalize="sentences"
        />
        <Input
          label="Precio (L) *"
          placeholder="0.00"
          value={precio}
          onChangeText={(t) => {
            setPrecio(t);
            if (errPrecio) setErrPrecio(esNumeroPositivo(t) ?? undefined);
          }}
          error={errPrecio}
          keyboardType="decimal-pad"
        />
        <Input
          label="Stock actual"
          placeholder="0"
          value={stock}
          onChangeText={(t) => {
            setStock(t);
            if (errStock) setErrStock(esEnteroPositivo(t) ?? undefined);
          }}
          error={errStock}
          keyboardType="number-pad"
        />
        <Input
          label="Stock mínimo"
          placeholder="5"
          value={stockMinimo}
          onChangeText={(t) => {
            setStockMinimo(t);
            if (errStockMin) setErrStockMin(esEnteroPositivo(t) ?? undefined);
          }}
          error={errStockMin}
          keyboardType="number-pad"
        />
        <Button
          title={esEdicion ? 'Guardar cambios' : 'Registrar producto'}
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
