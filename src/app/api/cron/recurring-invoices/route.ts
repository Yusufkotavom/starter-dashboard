import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runRecurringInvoiceBilling } from '@/lib/recurring-billing';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const result = await runRecurringInvoiceBilling(prisma);

  return NextResponse.json({
    success: true,
    ...result,
    ranAt: new Date().toISOString()
  });
}
