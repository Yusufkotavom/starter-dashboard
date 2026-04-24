import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPortalClientContext } from '@/lib/customer-portal';
import { formatPrice } from '@/lib/utils';

function statusBadge(value: string) {
  return (
    <span className='rounded-full border px-2 py-1 text-xs font-medium tracking-wide'>
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export default async function PortalPage() {
  const context = await getPortalClientContext();

  if (!context?.client) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portal access pending</CardTitle>
          <CardDescription>
            Your Clerk account is active, but there is no client record yet matching this email.
          </CardDescription>
        </CardHeader>
        <CardContent className='text-muted-foreground text-sm'>
          Ask the agency team to register your client profile using the same email address you use
          to sign in.
        </CardContent>
      </Card>
    );
  }

  const { client, activeProjects, outstandingInvoices, activeSubscriptions, payments } = context;
  const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => {
    const paidAmount = invoice.payments.reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0
    );
    return sum + Math.max(Number(invoice.total) - paidAmount, 0);
  }, 0);

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-semibold tracking-tight'>{client.company ?? client.name}</h1>
        <p className='text-muted-foreground mt-2'>
          Review your active delivery work, invoices, payments, and recurring retainers in one
          place.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Active Projects</CardDescription>
            <CardTitle className='text-3xl'>{activeProjects.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Outstanding Invoices</CardDescription>
            <CardTitle className='text-3xl'>{outstandingInvoices.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Outstanding Balance</CardDescription>
            <CardTitle className='text-3xl'>{formatPrice(outstandingTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Recurring Subscriptions</CardDescription>
            <CardTitle className='text-3xl'>{activeSubscriptions.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Delivery work currently in progress for your account.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {activeProjects.length === 0 ? (
              <div className='text-muted-foreground text-sm'>No active projects right now.</div>
            ) : (
              activeProjects.map((project) => (
                <div
                  key={project.id}
                  className='flex items-center justify-between rounded-lg border p-4'
                >
                  <div>
                    <div className='font-medium'>{project.name}</div>
                    <div className='text-muted-foreground mt-1 text-sm'>
                      Budget {project.budget ? formatPrice(Number(project.budget)) : 'not set'}
                    </div>
                  </div>
                  {statusBadge(project.status)}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring Subscriptions</CardTitle>
            <CardDescription>
              Retainers and recurring services billed on a schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {activeSubscriptions.length === 0 ? (
              <div className='text-muted-foreground text-sm'>No recurring subscriptions yet.</div>
            ) : (
              activeSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className='flex items-center justify-between rounded-lg border p-4'
                >
                  <div>
                    <div className='font-medium'>{subscription.plan.name}</div>
                    <div className='text-muted-foreground mt-1 text-sm'>
                      Next billing{' '}
                      {subscription.nextBillingDate
                        ? subscription.nextBillingDate.toISOString().slice(0, 10)
                        : 'not scheduled'}
                    </div>
                    <div className='text-muted-foreground mt-1 text-sm'>
                      {formatPrice(Number(subscription.priceOverride ?? subscription.plan.price))} /{' '}
                      {subscription.plan.interval.toLowerCase()}
                    </div>
                  </div>
                  {statusBadge(subscription.status)}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Latest billing documents and current balance status.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {client.invoices.slice(0, 8).map((invoice) => {
              const paidAmount = invoice.payments.reduce(
                (sum, payment) => sum + Number(payment.amount),
                0
              );
              const balanceDue = Math.max(Number(invoice.total) - paidAmount, 0);

              return (
                <div key={invoice.id} className='rounded-lg border p-4'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <div className='font-medium'>{invoice.number}</div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {invoice.project?.name ??
                          invoice.subscription?.plan.name ??
                          'General billing'}
                      </div>
                    </div>
                    {statusBadge(invoice.status)}
                  </div>
                  <div className='text-muted-foreground mt-3 text-sm'>
                    Total {formatPrice(Number(invoice.total))} · Paid {formatPrice(paidAmount)} ·
                    Balance {formatPrice(balanceDue)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Last recorded settlements received for your account.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {payments.length === 0 ? (
              <div className='text-muted-foreground text-sm'>No payments recorded yet.</div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className='rounded-lg border p-4'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <div className='font-medium'>{payment.invoice.number}</div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {payment.method ?? 'BANK_TRANSFER'} · {payment.reference ?? 'No reference'}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-medium'>{formatPrice(Number(payment.amount))}</div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {payment.paidAt.toISOString().slice(0, 10)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
