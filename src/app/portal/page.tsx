import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPortalOverviewData } from '@/lib/customer-portal';
import { formatPrice } from '@/lib/utils';

export default async function PortalPage() {
  const overview = await getPortalOverviewData();

  if (!overview?.client) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portal access pending</CardTitle>
          <CardDescription>
            Your account is active, but there is no client profile yet linked to this email.
          </CardDescription>
        </CardHeader>
        <CardContent className='text-muted-foreground text-sm'>
          Ask the agency team to register your client profile using this exact sign-in email.
        </CardContent>
      </Card>
    );
  }

  const { client } = overview;

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>{client.company ?? client.name}</h1>
        <p className='text-muted-foreground max-w-3xl'>
          Use this portal to place new orders, review invoices, monitor project delivery, and access
          your products and services without going back to email threads.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Open Quotations</CardDescription>
            <CardTitle className='text-3xl'>{overview.quotationsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Active Projects</CardDescription>
            <CardTitle className='text-3xl'>{overview.activeProjectsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Outstanding Invoices</CardDescription>
            <CardTitle className='text-3xl'>{overview.outstandingInvoicesCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Outstanding Balance</CardDescription>
            <CardTitle className='text-3xl'>{formatPrice(overview.outstandingBalance)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Recent Payments</CardDescription>
            <CardTitle className='text-3xl'>{overview.recentPaymentsCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className='grid gap-4 xl:grid-cols-2'>
        <Card className='border-primary/20 bg-primary/5'>
          <CardHeader>
            <CardTitle>Place a New Order</CardTitle>
            <CardDescription>
              Start a self-serve order for services, subscriptions, or digital products. The portal
              will create the invoice automatically and route you to payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href='/portal/orders'
              className='inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
            >
              Open Order Workspace
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Workspaces</CardTitle>
            <CardDescription>
              The portal is now split into dedicated pages so documents and delivery tracking do not
              pile up in one long screen.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3 md:grid-cols-2'>
            <Link
              href='/portal/invoices'
              className='rounded-2xl border p-4 transition-colors hover:bg-muted/40'
            >
              <div className='font-medium'>Invoices</div>
              <div className='text-muted-foreground mt-1 text-sm'>
                Billing documents and payment proof.
              </div>
            </Link>
            <Link
              href='/portal/quotations'
              className='rounded-2xl border p-4 transition-colors hover:bg-muted/40'
            >
              <div className='font-medium'>Quotations</div>
              <div className='text-muted-foreground mt-1 text-sm'>
                Approvals and commercial documents.
              </div>
            </Link>
            <Link
              href='/portal/projects'
              className='rounded-2xl border p-4 transition-colors hover:bg-muted/40'
            >
              <div className='font-medium'>Projects</div>
              <div className='text-muted-foreground mt-1 text-sm'>
                Track delivery progress and project activity.
              </div>
            </Link>
            <Link
              href='/portal/my-product'
              className='rounded-2xl border p-4 transition-colors hover:bg-muted/40'
            >
              <div className='font-medium'>My Product</div>
              <div className='text-muted-foreground mt-1 text-sm'>
                All products/services from invoice and quotation.
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Snapshot</CardTitle>
          <CardDescription>High-level activity across the portal.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-3'>
          <div className='rounded-2xl border p-4'>
            <div className='text-muted-foreground text-sm'>Recurring Services (via Invoices)</div>
            <div className='mt-2 text-2xl font-semibold'>{overview.activeSubscriptionsCount}</div>
          </div>
          <div className='rounded-2xl border p-4'>
            <div className='text-muted-foreground text-sm'>Digital Access Items</div>
            <div className='mt-2 text-2xl font-semibold'>{overview.digitalAccessCount}</div>
          </div>
          <div className='rounded-2xl border p-4'>
            <div className='text-muted-foreground text-sm'>Client Status</div>
            <div className='mt-2 text-2xl font-semibold'>{client.status}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
