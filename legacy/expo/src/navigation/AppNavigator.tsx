import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text } from 'react-native';
import ClienteDetailScreen from '../modules/clientes/screens/ClienteDetailScreen';
import ClienteFormScreen from '../modules/clientes/screens/ClienteFormScreen';
import ClientesScreen from '../modules/clientes/screens/ClientesScreen';
import DashboardScreen from '../modules/dashboard/screens/DashboardScreen';
import FiadoFormScreen from '../modules/fiados/screens/FiadoFormScreen';
import HistorialPagosScreen from '../modules/pagos/screens/HistorialPagosScreen';
import PagoFormScreen from '../modules/pagos/screens/PagoFormScreen';
import ProductoFormScreen from '../modules/productos/screens/ProductoFormScreen';
import ProductosScreen from '../modules/productos/screens/ProductosScreen';
import VentaDetailScreen from '../modules/ventas/screens/VentaDetailScreen';
import VentaFormScreen from '../modules/ventas/screens/VentaFormScreen';
import VentasScreen from '../modules/ventas/screens/VentasScreen';
import type {
  ClientesStackParamList,
  ProductosStackParamList,
  VentasStackParamList,
} from './types';

// ── Clientes Stack ────────────────────────────────────────────────────────────

const ClientesStack = createNativeStackNavigator<ClientesStackParamList>();

function ClientesNavigator() {
  return (
    <ClientesStack.Navigator>
      <ClientesStack.Screen
        name="ClientesList"
        component={ClientesScreen}
        options={{ title: 'Clientes' }}
      />
      <ClientesStack.Screen name="ClienteForm" component={ClienteFormScreen} />
      <ClientesStack.Screen
        name="ClienteDetail"
        component={ClienteDetailScreen}
        options={{ title: 'Detalle' }}
      />
      <ClientesStack.Screen
        name="FiadoForm"
        component={FiadoFormScreen}
        options={{ title: 'Nuevo fiado' }}
      />
      <ClientesStack.Screen
        name="PagoForm"
        component={PagoFormScreen}
        options={{ title: 'Registrar pago' }}
      />
      <ClientesStack.Screen
        name="HistorialPagos"
        component={HistorialPagosScreen}
        options={{ title: 'Historial de pagos' }}
      />
    </ClientesStack.Navigator>
  );
}

// ── Productos Stack ───────────────────────────────────────────────────────────

const ProductosStack = createNativeStackNavigator<ProductosStackParamList>();

function ProductosNavigator() {
  return (
    <ProductosStack.Navigator>
      <ProductosStack.Screen
        name="ProductosList"
        component={ProductosScreen}
        options={{ title: 'Productos' }}
      />
      <ProductosStack.Screen name="ProductoForm" component={ProductoFormScreen} />
    </ProductosStack.Navigator>
  );
}

// ── Ventas Stack ──────────────────────────────────────────────────────────────

const VentasStack = createNativeStackNavigator<VentasStackParamList>();

function VentasNavigator() {
  return (
    <VentasStack.Navigator>
      <VentasStack.Screen
        name="VentasList"
        component={VentasScreen}
        options={{ title: 'Ventas' }}
      />
      <VentasStack.Screen
        name="VentaForm"
        component={VentaFormScreen}
        options={{ title: 'Nueva venta' }}
      />
      <VentasStack.Screen
        name="VentaDetail"
        component={VentaDetailScreen}
        options={{ title: 'Detalle de venta' }}
      />
    </VentasStack.Navigator>
  );
}

// ── Bottom Tabs ───────────────────────────────────────────────────────────────

export type AppTabParamList = {
  Dashboard: undefined;
  Clientes: undefined;
  Productos: undefined;
  Ventas: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: () => <Text>📊</Text> }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientesNavigator}
        options={{ tabBarLabel: 'Clientes', tabBarIcon: () => <Text>👥</Text> }}
      />
      <Tab.Screen
        name="Productos"
        component={ProductosNavigator}
        options={{ tabBarLabel: 'Productos', tabBarIcon: () => <Text>📦</Text> }}
      />
      <Tab.Screen
        name="Ventas"
        component={VentasNavigator}
        options={{ tabBarLabel: 'Ventas', tabBarIcon: () => <Text>🛒</Text> }}
      />
    </Tab.Navigator>
  );
}
