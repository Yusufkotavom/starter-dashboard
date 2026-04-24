import { notFound } from 'next/navigation';
import { generateInvoicePdf } from '@/lib/documents/pdf';
import { getInvoiceDocumentData } from '@/lib/documents/invoices';
import { getPortalClientOrThrow } from '@/lib/customer-portal';
import { prisma } from '@/lib/prisma';

interface PortalInvoiceDownloadRouteProps {
  params: Promise<{
    invoiceId: string;
  }>;
}

export async function GET(_request: Request, { params }: PortalInvoiceDownloadRouteProps) {
  const { invoiceId } = await params;
  const { client } = await getPortalClientOrThrow();
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: Number(invoiceId),
      clientId: client.id
    },
    select: { id: true, number: true }
  });

  if (!invoice) {
    notFound();
  }

  const document = await getInvoiceDocumentData(prisma, invoice.id);
  if (!document) {
    notFound();
  }

  const pdf = await generateInvoicePdf(document);

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.number.toLowerCase()}.pdf"`
    }
  });
}
