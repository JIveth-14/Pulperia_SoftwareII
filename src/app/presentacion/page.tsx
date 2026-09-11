import { readFileSync } from 'node:fs';
import path from 'node:path';

const presentationHtml = readFileSync(
  path.join(process.cwd(), 'public', 'presentacion.html'),
  'utf8'
);

function extractSection(tag: string) {
  const match = presentationHtml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));

  if (!match) {
    throw new Error(`Missing <${tag}> in public/presentacion.html`);
  }

  return match[1].trim();
}

export const metadata = {
  title: 'Pulpería Manager - Sistema de Gestión para Tiendas de Barrio',
  description: 'Pulpería Manager - Sistema integral de gestión para tiendas de barrio',
  authors: [{ name: 'Jessica Iveth P. Dubón' }],
  other: {
    'verification-code': 'LEARN-CAP-09C50C7F',
  },
};

export default function Presentacion() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: extractSection('style') }} />
      <div dangerouslySetInnerHTML={{ __html: extractSection('body') }} />
    </>
  );
}
