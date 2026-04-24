import { NextResponse } from 'next/server';
import { markInvoiceAsPaid } from '@/lib/billing-workflows';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const invoiceId = Number(id);

  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return NextResponse.json({ message: 'Invalid invoice id' }, { status: 400 });
  }

  try {
    const result = await markInvoiceAsPaid(prisma, invoiceId);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVOICE_NOT_FOUND') {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Failed to mark invoice as paid' }, { status: 500 });
  }
}
