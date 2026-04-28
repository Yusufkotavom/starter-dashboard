import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'File is required' }, { status: 400 });
  }

  const pathname = `company-logo/${randomUUID()}-${sanitizeFilename(file.name || 'logo.bin')}`;
  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: false
  });

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname
  });
}
