import { readFileSync } from 'node:fs';
import path from 'node:path';

import { render, screen } from '@testing-library/react';

import Presentacion from '@/app/presentacion/page';

const presentationPath = path.join(process.cwd(), 'public', 'presentacion.html');
const presentationHtml = readFileSync(presentationPath, 'utf8');

describe('Presentación pública', () => {
  it('es autocontenida e incluye el contenido requerido', () => {
    const plainText = presentationHtml.replace(/<[^>]+>/g, ' ');
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;

    expect(presentationHtml).toContain('id="problema"');
    expect(presentationHtml).toContain('id="solucion"');
    expect(presentationHtml).toContain('id="funcionalidades"');
    expect(presentationHtml).toContain('id="arquitectura"');
    expect(presentationHtml).toContain('id="tecnologias"');
    expect(presentationHtml).toContain('id="manual"');
    expect(presentationHtml).toContain('id="cliente"');
    expect(presentationHtml).toContain('id="autor"');
    expect(presentationHtml.match(/<svg\b/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(wordCount).toBeGreaterThanOrEqual(700);
    expect(presentationHtml).toContain('https://www.iveth.lat/');
    expect(presentationHtml).toContain('https://github.com/JIveth-14/Pulperia_SoftwareII');
    expect(presentationHtml).toContain('LEARN-CAP-09C50C7F');
    expect(presentationHtml).not.toMatch(/<(?:img|script|link)\b[^>]+(?:src|href)=["']https?:\/\//i);
  });

  it('renderiza la ruta /presentacion con las secciones y enlaces esperados', () => {
    const { container } = render(<Presentacion />);

    expect(screen.getByRole('heading', { name: /problema: los desafíos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /solución: pulpería manager/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /funcionalidades principales/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /arquitectura del sistema/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /stack tecnológico moderno/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /manual de uso paso a paso/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sobre el cliente/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sobre el autor/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /app en vivo/i })).toHaveAttribute('href', 'https://www.iveth.lat/');
    expect(screen.getByRole('link', { name: /repositorio github/i })).toHaveAttribute(
      'href',
      'https://github.com/JIveth-14/Pulperia_SoftwareII'
    );
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/learn-cap-09c50c7f/i)).toBeInTheDocument();
  });
});
