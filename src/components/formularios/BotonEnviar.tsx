'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonVariant } from '@/components/ui';

/** Botón de envío que se deshabilita mientras la Server Action corre. */
export function BotonEnviar({
  children,
  variant = 'primary',
  fullWidth,
  disabled,
  pendiente,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  /** Para formularios enviados con `onSubmit` (useFormStatus no los detecta). */
  pendiente?: boolean;
}) {
  const { pending } = useFormStatus();
  const cargando = pendiente ?? pending;
  return (
    <Button type="submit" variant={variant} loading={cargando} disabled={disabled} fullWidth={fullWidth}>
      {children}
    </Button>
  );
}
