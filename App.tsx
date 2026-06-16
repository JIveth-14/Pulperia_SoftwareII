import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </ToastProvider>
  );
}
