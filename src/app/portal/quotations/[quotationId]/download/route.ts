import { notFound } from 'next/navigation';
import { generateQuotationPdf } from '@/lib/documents/pdf';
import { getQuotationDocumentData } from '@/lib/documents/quotations';
import { getPortalClientOrThrow } from '@/lib/customer-portal';
import { prisma } from '@/lib/prisma';

interface PortalQuotationDownloadRouteProps {
  params: Promise<{
    quotationId: string;
  }>;
}

export async function GET(_request: Request, { params }: PortalQuotationDownloadRouteProps) {
  const { quotationId } = await params;
  const { client } = await getPortalClientOrThrow();
  const quotation = await prisma.quotation.findFirst({
    where: {
      id: Number(quotationId),
      clientId: client.id
    },
    select: { id: true, number: true }
  });

  if (!quotation) {
    notFound();
  }

  const document = await getQuotationDocumentData(prisma, quotation.id);
  if (!document) {
    notFound();
  }

  const pdf = await generateQuotationPdf(document);

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quotation.number.toLowerCase()}.pdf"`
    }
  });
}
