import { NextRequest, NextResponse } from 'next/server';
import { buildInvoicePaymentLink, markInvoiceAsSent } from '@/lib/billing-workflows';
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
  const payment = await buildInvoicePaymentLink(origin, invoice.id);
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
    paymentLink: payment.paymentLink,
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

  const statusResult = await markInvoiceAsSent(prisma, invoice.id);

  return NextResponse.json({
    success: true,
    provider: result.provider,
    messageId: result.id,
    status: statusResult.status,
    documentUrl,
    paymentLink: payment.paymentLink
  });
}
