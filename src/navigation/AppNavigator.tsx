import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import DashboardScreen from '../modules/dashboard/screens/DashboardScreen';
import ClientesScreen from '../modules/clientes/screens/ClientesScreen';
import ProductosScreen from '../modules/productos/screens/ProductosScreen';
import FiadosScreen from '../modules/fiados/screens/FiadosScreen';
import VentasScreen from '../modules/ventas/screens/VentasScreen';

export type AppTabParamList = {
  Dashboard: undefined;
  Clientes: undefined;
  Productos: undefined;
  Fiados: undefined;
  Ventas: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Clientes" component={ClientesScreen} />
      <Tab.Screen name="Productos" component={ProductosScreen} />
      <Tab.Screen name="Fiados" component={FiadosScreen} />
      <Tab.Screen name="Ventas" component={VentasScreen} />
    </Tab.Navigator>
  );
}
