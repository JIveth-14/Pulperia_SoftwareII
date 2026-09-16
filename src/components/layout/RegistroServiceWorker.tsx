'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker solo en producción: en desarrollo cachearía
 * archivos que cambian a cada guardado.
 */
export function RegistroServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[PWA] No se pudo registrar el service worker:', error);
    });
  }, []);

  return null;
}
