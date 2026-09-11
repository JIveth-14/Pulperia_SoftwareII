import { readFileSync } from 'node:fs';
import path from 'node:path';

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
});
