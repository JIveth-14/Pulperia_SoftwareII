import React, { createContext, useCallback, useContext, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fontSize, spacing } from '../theme';

interface ToastCtx { showError: (msg: string) => void; }
const ToastContext = createContext<ToastCtx>({ showError: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);

  const showError = useCallback((m: string) => {
    setMsg(m);
    setVisible(true);
    setTimeout(() => setVisible(false), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      {visible && (
        <Text style={styles.toast}>{msg}</Text>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 80,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.danger,
    color: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    fontSize: fontSize.sm,
    textAlign: 'center',
    zIndex: 9999,
  },
});
