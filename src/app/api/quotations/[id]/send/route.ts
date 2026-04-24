import { NextRequest, NextResponse } from 'next/server';
import { QuotationStatus } from '@prisma/client';
import {
  buildDocumentUrl,
  createAttachmentContent,
  createDocumentToken,
  getDocumentOrigin
} from '@/lib/documents/shared';
import { generateQuotationPdf } from '@/lib/documents/pdf';
import { getQuotationDocumentData } from '@/lib/documents/quotations';
import { prisma } from '@/lib/prisma';
import { renderQuotationEmail, sendMail } from '@/lib/mailer';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const quotationId = Number(id);
  const quotation = await getQuotationDocumentData(prisma, quotationId);

  if (!quotation) {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }

  const origin = getDocumentOrigin(request);
  const documentToken = createDocumentToken('quotation', quotation.id);
  const documentUrl = buildDocumentUrl(origin, 'quotation', quotation.id, documentToken);
  const documentPdf = await generateQuotationPdf(quotation);
  const attachmentLabel = `quotation-${quotation.number}.pdf`;
  const services = quotation.items.map((item) => item.description).filter(Boolean);

  const mail = renderQuotationEmail({
    number: quotation.number,
    clientName: quotation.clientName,
    company: quotation.clientCompany,
    total: quotation.total,
    validUntil: quotation.validUntil,
    notes: quotation.notes,
    services,
    documentUrl,
    attachmentLabel
  });

  const result = await sendMail({
    ...mail,
    to: quotation.clientEmail,
    attachments: [
      {
        content: createAttachmentContent(documentPdf),
        contentType: 'application/pdf',
        filename: attachmentLabel
      }
    ]
  });

  const nextStatus: QuotationStatus =
    quotation.status === QuotationStatus.DRAFT
      ? QuotationStatus.SENT
      : (quotation.status as QuotationStatus);
  if (nextStatus !== quotation.status) {
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: nextStatus }
    });
  }

  return NextResponse.json({
    success: true,
    provider: result.provider,
    messageId: result.id,
    status: nextStatus,
    documentUrl
  });
}
