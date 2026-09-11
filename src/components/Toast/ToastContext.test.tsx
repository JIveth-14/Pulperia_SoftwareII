import { fireEvent, render, screen } from '@testing-library/react';

import { ToastProvider, useToast } from './ToastContext';

function ToastTrigger() {
  const { showToast } = useToast();

  return (
    <button onClick={() => showToast('Toast seguro', 'success', 0)}>
      Mostrar toast
    </button>
  );
}

describe('ToastProvider', () => {
  it('uses crypto.randomUUID when showing a toast', () => {
    const randomUUIDSpy = jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('toast-id');

    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar toast' }));

    expect(randomUUIDSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Toast seguro')).toBeInTheDocument();

    randomUUIDSpy.mockRestore();
  });
});
