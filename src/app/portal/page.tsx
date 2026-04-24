import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PaymentProofForm } from '@/app/portal/_components/payment-proof-form';
import { QuotationApprovalButton } from '@/app/portal/_components/quotation-approval-button';
import { StatusBadge } from '@/app/portal/_components/status-badge';
import { getPortalClientContext } from '@/lib/customer-portal';
import { getProjectProgressSummary } from '@/lib/project-progress';
import { formatPrice } from '@/lib/utils';

function getStatusTone(value: string): 'default' | 'success' | 'warning' | 'danger' {
  if (['PAID', 'APPROVED', 'ACTIVE', 'COMPLETED'].includes(value)) return 'success';
  if (['OVERDUE', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(value)) return 'danger';
  if (['PARTIAL', 'PAUSED', 'SENT'].includes(value)) return 'warning';
  return 'default';
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

  const { client, quotations, activeProjects, outstandingInvoices, activeSubscriptions, payments } =
    context;
  const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => {
    const paidAmount = invoice.payments.reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0
    );
    return sum + Math.max(Number(invoice.total) - paidAmount, 0);
  }, 0);

  return (
    <div className='space-y-8'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>{client.company ?? client.name}</h1>
        <p className='text-muted-foreground max-w-3xl'>
          Review active delivery work, recurring services, billing documents, and finance updates.
          Customer actions stay in this portal so approvals and payment proofs do not depend on
          email chains.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Active Projects</CardDescription>
            <CardTitle className='text-3xl'>{activeProjects.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Open Quotations</CardDescription>
            <CardTitle className='text-3xl'>
              {quotations.filter((quotation) => quotation.status !== 'REJECTED').length}
            </CardTitle>
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

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Link
          href='/portal/subscriptions'
          className='rounded-xl border p-4 transition-colors hover:bg-muted/40'
        >
          <div className='font-medium'>Subscriptions Workspace</div>
          <div className='text-muted-foreground mt-1 text-sm'>
            Full recurring services page with billing history and next billing.
          </div>
        </Link>
        <Link
          href='/portal/digital-access'
          className='rounded-xl border p-4 transition-colors hover:bg-muted/40'
        >
          <div className='font-medium'>Digital Access</div>
          <div className='text-muted-foreground mt-1 text-sm'>
            Open delivered portals, assets, and digital product access from one page.
          </div>
        </Link>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Quotations</CardTitle>
            <CardDescription>
              Review commercial proposals, open documents, and approve the ones ready to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {quotations.length === 0 ? (
              <div className='text-muted-foreground text-sm'>No quotations available yet.</div>
            ) : (
              quotations.slice(0, 3).map((quotation) => (
                <div key={quotation.id} className='space-y-4 rounded-xl border p-4'>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='space-y-1'>
                      <div className='font-medium'>{quotation.number}</div>
                      <div className='text-muted-foreground text-sm'>
                        {quotation.project?.name ?? 'Not converted to project yet'}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        Total {formatPrice(Number(quotation.total))}
                      </div>
                    </div>
                    <StatusBadge tone={getStatusTone(quotation.status)} value={quotation.status} />
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Link
                      className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                      href={`/portal/quotations/${quotation.id}`}
                    >
                      Open document
                    </Link>
                    <Link
                      className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                      href={`/portal/quotations/${quotation.id}/download`}
                    >
                      Download
                    </Link>
                  </div>
                  {quotation.status !== 'APPROVED' &&
                  quotation.status !== 'REJECTED' &&
                  quotation.status !== 'EXPIRED' ? (
                    <QuotationApprovalButton quotationId={quotation.id} />
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
                <div key={project.id} className='space-y-4 rounded-xl border p-4'>
                  {(() => {
                    const summary = getProjectProgressSummary({
                      id: project.id,
                      name: project.name,
                      clientName: client.company ?? client.name,
                      status: project.status,
                      startDate: project.startDate?.toISOString() ?? null,
                      endDate: project.endDate?.toISOString() ?? null,
                      quotationId: project.quotationId,
                      budget: project.budget ? Number(project.budget) : null
                    });

                    return (
                      <>
                        <div className='flex items-start justify-between gap-4'>
                          <div>
                            <div className='font-medium'>{project.name}</div>
                            <div className='text-muted-foreground mt-1 text-sm'>
                              {summary.phase} · Budget{' '}
                              {project.budget ? formatPrice(Number(project.budget)) : 'not set'}
                            </div>
                          </div>
                          <StatusBadge
                            tone={getStatusTone(project.status)}
                            value={project.status}
                          />
                        </div>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>Delivery progress</span>
                            <span className='font-medium'>{summary.progress}%</span>
                          </div>
                          <Progress value={summary.progress} />
                          <div className='text-muted-foreground text-xs'>{summary.nextStep}</div>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                          <Link
                            className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                            href={`/portal/projects/${project.id}`}
                          >
                            Track progress
                          </Link>
                        </div>
                      </>
                    );
                  })()}
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
            <CardDescription>
              Open billing documents, download them, and submit payment proof.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {client.invoices.length === 0 ? (
              <div className='text-muted-foreground text-sm'>No invoices issued yet.</div>
            ) : (
              client.invoices.slice(0, 4).map((invoice) => {
                const paidAmount = invoice.payments.reduce(
                  (sum, payment) => sum + Number(payment.amount),
                  0
                );
                const balanceDue = Math.max(Number(invoice.total) - paidAmount, 0);

                return (
                  <div key={invoice.id} className='space-y-4 rounded-xl border p-4'>
                    <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                      <div className='space-y-1'>
                        <div className='font-medium'>{invoice.number}</div>
                        <div className='text-muted-foreground text-sm'>
                          {invoice.project?.name ??
                            invoice.subscription?.plan.name ??
                            'General billing'}
                        </div>
                        <div className='text-muted-foreground text-sm'>
                          Total {formatPrice(Number(invoice.total))} · Balance{' '}
                          {formatPrice(balanceDue)}
                        </div>
                      </div>
                      <StatusBadge tone={getStatusTone(invoice.status)} value={invoice.status} />
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <Link
                        className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                        href={`/portal/invoices/${invoice.id}`}
                      >
                        Open document
                      </Link>
                      <Link
                        className='inline-flex rounded-lg border px-3 py-2 text-sm font-medium'
                        href={`/portal/invoices/${invoice.id}/download`}
                      >
                        Download
                      </Link>
                    </div>
                    {balanceDue > 0 ? (
                      <PaymentProofForm
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.number}
                        suggestedAmount={balanceDue}
                      />
                    ) : null}
                  </div>
                );
              })
            )}
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
                <div key={payment.id} className='rounded-xl border p-4'>
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

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions Snapshot</CardTitle>
          <CardDescription>
            Quick snapshot only. Open the full subscriptions workspace for the complete history.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 lg:grid-cols-2'>
          {activeSubscriptions.length === 0 ? (
            <div className='text-muted-foreground text-sm'>No recurring subscriptions yet.</div>
          ) : (
            activeSubscriptions.slice(0, 2).map((subscription) => (
              <div key={subscription.id} className='rounded-xl border p-4'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <div className='font-medium'>{subscription.plan.name}</div>
                    <div className='text-muted-foreground mt-1 text-sm'>
                      Next billing{' '}
                      {subscription.nextBillingDate
                        ? subscription.nextBillingDate.toISOString().slice(0, 10)
                        : 'not scheduled'}
                    </div>
                  </div>
                  <StatusBadge
                    tone={getStatusTone(subscription.status)}
                    value={subscription.status}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
