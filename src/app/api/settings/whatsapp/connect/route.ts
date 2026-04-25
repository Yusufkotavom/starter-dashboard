import { NextResponse } from 'next/server';
import { ensureWhatsAppSession } from '@/lib/whatsapp';

export async function POST() {
  try {
    const status = await ensureWhatsAppSession();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to prepare WhatsApp session'
      },
      { status: 400 }
    );
  }
}
