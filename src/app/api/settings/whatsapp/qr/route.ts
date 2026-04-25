import { NextResponse } from 'next/server';
import { getWhatsAppQrScreenshot } from '@/lib/whatsapp';

export async function GET() {
  try {
    const screenshot = await getWhatsAppQrScreenshot();

    return new NextResponse(screenshot.body, {
      status: 200,
      headers: {
        'Content-Type': screenshot.contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to load WhatsApp QR'
      },
      { status: 400 }
    );
  }
}
