import { NextRequest, NextResponse } from 'next/server';
import { buildInvoicePaymentLink, markInvoiceAsSent } from '@/lib/billing-workflows';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const invoiceId = Number(id);

  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return NextResponse.json({ message: 'Invalid invoice id' }, { status: 400 });
  }

  try {
    const origin = request.nextUrl.origin;
    const result = await markInvoiceAsSent(prisma, invoiceId);
    const payment = await buildInvoicePaymentLink(origin, invoiceId);

    return NextResponse.json({
      success: true,
      ...result,
      paymentLink: payment.paymentLink,
      balanceDue: payment.invoice.balanceDue,
      instructions: payment.instructions
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVOICE_NOT_FOUND') {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Failed to mark invoice as sent' }, { status: 500 });
  }
}
