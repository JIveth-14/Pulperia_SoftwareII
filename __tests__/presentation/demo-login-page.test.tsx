import { render, screen } from '@testing-library/react';

import DemoLoginPage from '@/app/(demo)/demo/login/page';

describe('DemoLoginPage', () => {
  it('renders the home navigation link with the expected href', async () => {
    render(await DemoLoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });
});
