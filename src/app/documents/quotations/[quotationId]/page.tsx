import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireDocumentAccess } from '@/lib/documents/access';
import { getQuotationDocumentData, renderQuotationDocumentHtml } from '@/lib/documents/quotations';
import { prisma } from '@/lib/prisma';

type PageProps = {
  params: Promise<{ quotationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function QuotationDocumentPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const quotationId = Number(params.quotationId);
  const token = typeof searchParams.token === 'string' ? searchParams.token : null;
  const autoPrint = searchParams.print === '1';

  await requireDocumentAccess('quotation', quotationId, token);

  const quotation = await getQuotationDocumentData(prisma, quotationId);
  if (!quotation) {
    notFound();
  }

  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') || 'http';
  const origin =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (host ? `${proto}://${host}` : 'http://localhost:3000');

  const html = renderQuotationDocumentHtml(quotation, {
    accessToken: token,
    autoPrint,
    origin
  });

  return (
    <iframe
      className='min-h-screen w-full border-0'
      sandbox='allow-downloads allow-modals allow-scripts'
      srcDoc={html}
      title={`Quotation ${quotation.number}`}
    />
  );
}
