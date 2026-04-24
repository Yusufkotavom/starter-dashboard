import { NextRequest, NextResponse } from 'next/server';
import { requireDocumentAccess } from '@/lib/documents/access';
import { generateQuotationPdf } from '@/lib/documents/pdf';
import { getQuotationDocumentData } from '@/lib/documents/quotations';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const quotationId = Number(id);
  const token = request.nextUrl.searchParams.get('token');

  await requireDocumentAccess('quotation', quotationId, token);

  const quotation = await getQuotationDocumentData(prisma, quotationId);
  if (!quotation) {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }

  const pdf = await generateQuotationPdf(quotation);

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quotation-${quotation.number}.pdf"`
    }
  });
}
