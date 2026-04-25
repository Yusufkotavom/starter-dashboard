import { NextResponse } from 'next/server';
import { getWhatsAppSetupStatus } from '@/lib/whatsapp';

export async function GET() {
  const status = await getWhatsAppSetupStatus();
  return NextResponse.json(status);
}
