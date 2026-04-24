import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, saveAppSettings } from '@/lib/app-settings';

export async function GET() {
  const settings = await getAppSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as Awaited<ReturnType<typeof getAppSettings>>;
  const settings = await saveAppSettings(body);
  return NextResponse.json(settings);
}
