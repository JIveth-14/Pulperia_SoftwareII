import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const presentationPath = path.join(process.cwd(), 'public', 'presentacion.html');

export function GET() {
  return new NextResponse(readFileSync(presentationPath, 'utf8'), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
