import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getInvoiceDocumentData, renderInvoiceDocumentHtml } from '@/lib/documents/invoices';
import { requireDocumentAccess } from '@/lib/documents/access';
import { prisma } from '@/lib/prisma';

type PageProps = {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvoiceDocumentPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const invoiceId = Number(params.invoiceId);
  const token = typeof searchParams.token === 'string' ? searchParams.token : null;
  const autoPrint = searchParams.print === '1';

  await requireDocumentAccess('invoice', invoiceId, token);

  const invoice = await getInvoiceDocumentData(prisma, invoiceId);
  if (!invoice) {
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

  const html = renderInvoiceDocumentHtml(invoice, {
    accessToken: token,
    autoPrint,
    origin
  });

  return (
    <iframe
      className='min-h-screen w-full border-0'
      sandbox='allow-downloads allow-modals allow-scripts'
      srcDoc={html}
      title={`Invoice ${invoice.number}`}
    />
  );
}
