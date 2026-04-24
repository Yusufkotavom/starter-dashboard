import { NextRequest, NextResponse } from 'next/server';
import { requireDocumentAccess } from '@/lib/documents/access';
import { getInvoiceDocumentData } from '@/lib/documents/invoices';
import { generateInvoicePdf } from '@/lib/documents/pdf';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const invoiceId = Number(id);
  const token = request.nextUrl.searchParams.get('token');

  await requireDocumentAccess('invoice', invoiceId, token);

  const invoice = await getInvoiceDocumentData(prisma, invoiceId);
  if (!invoice) {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }

  const pdf = await generateInvoicePdf(invoice);

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.number}.pdf"`
    }
  });
}
