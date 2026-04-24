import { NextRequest, NextResponse } from 'next/server';
import { InvoiceStatus } from '@prisma/client';
import {
  buildDocumentUrl,
  createAttachmentContent,
  createDocumentToken,
  getDocumentOrigin
} from '@/lib/documents/shared';
import { getInvoiceDocumentData } from '@/lib/documents/invoices';
import { generateInvoicePdf } from '@/lib/documents/pdf';
import { prisma } from '@/lib/prisma';
import { renderInvoiceEmail, sendMail } from '@/lib/mailer';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const invoiceId = Number(id);
  const invoice = await getInvoiceDocumentData(prisma, invoiceId);

  if (!invoice) {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }

  const origin = getDocumentOrigin(request);
  const documentToken = createDocumentToken('invoice', invoice.id);
  const documentUrl = buildDocumentUrl(origin, 'invoice', invoice.id, documentToken);
  const documentPdf = await generateInvoicePdf(invoice);
  const attachmentLabel = `invoice-${invoice.number}.pdf`;

  const mail = renderInvoiceEmail({
    number: invoice.number,
    clientName: invoice.clientName,
    company: invoice.clientCompany,
    total: invoice.total,
    paidAmount: invoice.paidAmount,
    balanceDue: invoice.balanceDue,
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    projectName: invoice.projectName,
    documentUrl,
    attachmentLabel
  });

  const result = await sendMail({
    ...mail,
    to: invoice.clientEmail,
    attachments: [
      {
        content: createAttachmentContent(documentPdf),
        contentType: 'application/pdf',
        filename: attachmentLabel
      }
    ]
  });

  const nextStatus: InvoiceStatus =
    invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : (invoice.status as InvoiceStatus);
  if (nextStatus !== invoice.status) {
    await prisma.invoice.update({
      where: { id: invoice.id },
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
