import { currentUser } from '@clerk/nextjs/server';
import { InvoiceStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const portalClientInclude = {
  quotations: {
    include: {
      items: {
        include: {
          product: true
        }
      },
      project: true
    },
    orderBy: { createdAt: 'desc' }
  },
  projects: {
    orderBy: { updatedAt: 'desc' }
  },
  invoices: {
    include: {
      project: {
        include: {
          quotation: {
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      },
      payments: { select: { amount: true } },
      subscription: {
        include: {
          plan: {
            include: {
              service: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  },
  subscriptions: {
    include: {
      plan: {
        include: {
          service: true
        }
      },
      project: true,
      invoices: {
        include: { payments: { select: { amount: true } } },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  }
} satisfies Prisma.ClientInclude;

type PortalClientRecord = Prisma.ClientGetPayload<{
  include: typeof portalClientInclude;
}>;

type PortalPaymentRecord = Prisma.PaymentGetPayload<{
  include: {
    invoice: {
      select: {
        id: true;
        number: true;
        total: true;
        status: true;
      };
    };
  };
}>;

export interface PortalClientContext {
  user: Awaited<ReturnType<typeof currentUser>>;
  email: string;
  client: PortalClientRecord | null;
  quotations: PortalClientRecord['quotations'];
  activeProjects: PortalClientRecord['projects'];
  outstandingInvoices: PortalClientRecord['invoices'];
  activeSubscriptions: PortalClientRecord['subscriptions'];
  payments: PortalPaymentRecord[];
}

const portalQuotationInclude = {
  client: true,
  project: true,
  items: {
    include: {
      product: true
    }
  }
} satisfies Prisma.QuotationInclude;

const portalInvoiceInclude = {
  client: true,
  project: {
    include: {
      quotation: {
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }
    }
  },
  subscription: {
    include: {
      plan: {
        include: {
          service: true
        }
      }
    }
  },
  payments: {
    orderBy: { paidAt: 'desc' }
  }
} satisfies Prisma.InvoiceInclude;

const portalProjectInclude = {
  client: true,
  quotation: true,
  invoices: {
    include: {
      payments: true
    },
    orderBy: { createdAt: 'desc' }
  },
  subscriptions: {
    include: {
      plan: {
        include: {
          service: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  }
} satisfies Prisma.ProjectInclude;

export type PortalQuotationDocument = Prisma.QuotationGetPayload<{
  include: typeof portalQuotationInclude;
}>;

export type PortalInvoiceDocument = Prisma.InvoiceGetPayload<{
  include: typeof portalInvoiceInclude;
}>;

export type PortalProjectDocument = Prisma.ProjectGetPayload<{
  include: typeof portalProjectInclude;
}>;

export async function getPortalClientContext(): Promise<PortalClientContext | null> {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const email =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ?? '';

  if (!email) {
    return null;
  }

  const client = await prisma.client.findUnique({
    where: { email },
    include: portalClientInclude
  });

  if (!client) {
    return {
      user,
      email,
      client: null,
      quotations: [],
      activeProjects: [],
      outstandingInvoices: [],
      activeSubscriptions: [],
      payments: []
    };
  }

  const payments = await prisma.payment.findMany({
    where: { invoice: { clientId: client.id } },
    include: {
      invoice: {
        select: {
          id: true,
          number: true,
          total: true,
          status: true
        }
      }
    },
    orderBy: { paidAt: 'desc' },
    take: 10
  });

  const activeProjects = client.projects.filter((project) => project.status === 'ACTIVE');
  const outstandingStatuses: InvoiceStatus[] = [
    InvoiceStatus.SENT,
    InvoiceStatus.PARTIAL,
    InvoiceStatus.OVERDUE
  ];
  const outstandingInvoices = client.invoices.filter((invoice) =>
    outstandingStatuses.includes(invoice.status)
  );
  const activeSubscriptions = client.subscriptions.filter(
    (subscription) => subscription.status === SubscriptionStatus.ACTIVE
  );

  return {
    user,
    email,
    client,
    quotations: client.quotations,
    activeProjects,
    outstandingInvoices,
    activeSubscriptions,
    payments
  };
}

async function getPortalIdentity(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>;
  email: string;
}> {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const email =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ?? '';

  if (!email) {
    redirect('/portal');
  }

  return { user, email };
}

export async function getPortalClientOrThrow() {
  const identity = await getPortalIdentity();
  const client = await prisma.client.findUnique({
    where: { email: identity.email }
  });

  if (!client) {
    redirect('/portal');
  }

  return {
    ...identity,
    client
  };
}

export async function getPortalQuotationDocument(
  quotationId: number
): Promise<PortalQuotationDocument | null> {
  const { client } = await getPortalClientOrThrow();

  return prisma.quotation.findFirst({
    where: {
      id: quotationId,
      clientId: client.id
    },
    include: portalQuotationInclude
  });
}

export async function getPortalInvoiceDocument(
  invoiceId: number
): Promise<PortalInvoiceDocument | null> {
  const { client } = await getPortalClientOrThrow();

  return prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      clientId: client.id
    },
    include: portalInvoiceInclude
  });
}

export async function getPortalProjectDocument(
  projectId: number
): Promise<PortalProjectDocument | null> {
  const { client } = await getPortalClientOrThrow();

  return prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: client.id
    },
    include: portalProjectInclude
  });
}

export function formatPortalDate(value?: Date | null): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(value);
}

export function formatPortalDateTime(value?: Date | null): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

export function appendPortalNote(existing: string | null | undefined, entry: string): string {
  const trimmed = existing?.trim();
  return trimmed ? `${trimmed}\n\n${entry}` : entry;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderQuotationDocumentHtml(quotation: PortalQuotationDocument): string {
  const itemRows = quotation.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.product?.name ?? 'Custom line')}</td>
          <td>${Number(item.qty).toFixed(2)}</td>
          <td>${escapeHtml(item.unitPrice.toString())}</td>
          <td>${escapeHtml(item.amount.toString())}</td>
        </tr>
      `
    )
    .join('');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(quotation.number)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
        h1, h2, h3, p { margin: 0; }
        .muted { color: #6b7280; }
        .header, .section { margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f9fafb; }
        .totals { margin-top: 16px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Quotation ${escapeHtml(quotation.number)}</h1>
        <p class="muted">Status: ${escapeHtml(quotation.status)}</p>
      </div>
      <div class="grid section">
        <div>
          <h3>Client</h3>
          <p>${escapeHtml(quotation.client.company ?? quotation.client.name)}</p>
          <p class="muted">${escapeHtml(quotation.client.email)}</p>
        </div>
        <div>
          <h3>Document</h3>
          <p>Created: ${escapeHtml(formatPortalDate(quotation.createdAt))}</p>
          <p>Valid until: ${escapeHtml(formatPortalDate(quotation.validUntil))}</p>
        </div>
      </div>
      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Service</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
      <div class="totals">
        <p>Subtotal: ${escapeHtml(quotation.subtotal.toString())}</p>
        <p>Tax: ${escapeHtml(quotation.tax.toString())}</p>
        <p>Discount: ${escapeHtml(quotation.discount.toString())}</p>
        <p><strong>Total: ${escapeHtml(quotation.total.toString())}</strong></p>
      </div>
      ${
        quotation.notes
          ? `<div class="section"><h3>Notes</h3><p>${escapeHtml(quotation.notes)}</p></div>`
          : ''
      }
    </body>
  </html>`;
}

export function renderInvoiceDocumentHtml(invoice: PortalInvoiceDocument): string {
  const sourceItems = invoice.project?.quotation?.items
    ? invoice.project.quotation.items
    : invoice.subscription?.plan.service
      ? [
          {
            id: 0,
            description: invoice.subscription.plan.name,
            product: invoice.subscription.plan.service,
            qty: 1,
            unitPrice: Number(invoice.total),
            amount: Number(invoice.total),
            createdAt: invoice.createdAt,
            quotationId: invoice.project?.quotation?.id ?? 0,
            productId: invoice.subscription.plan.serviceId ?? null
          }
        ]
      : [];

  const itemRows = sourceItems
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.product?.name ?? 'General billing')}</td>
          <td>${Number(item.qty).toFixed(2)}</td>
          <td>${escapeHtml(item.unitPrice.toString())}</td>
          <td>${escapeHtml(item.amount.toString())}</td>
        </tr>
      `
    )
    .join('');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(invoice.number)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
        h1, h2, h3, p { margin: 0; }
        .muted { color: #6b7280; }
        .header, .section { margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f9fafb; }
        .totals { margin-top: 16px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Invoice ${escapeHtml(invoice.number)}</h1>
        <p class="muted">Status: ${escapeHtml(invoice.status)}</p>
      </div>
      <div class="grid section">
        <div>
          <h3>Client</h3>
          <p>${escapeHtml(invoice.client.company ?? invoice.client.name)}</p>
          <p class="muted">${escapeHtml(invoice.client.email)}</p>
        </div>
        <div>
          <h3>Document</h3>
          <p>Created: ${escapeHtml(formatPortalDate(invoice.createdAt))}</p>
          <p>Due date: ${escapeHtml(formatPortalDate(invoice.dueDate))}</p>
        </div>
      </div>
      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Service</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
      <div class="totals">
        <p>Subtotal: ${escapeHtml(invoice.subtotal.toString())}</p>
        <p>Tax: ${escapeHtml(invoice.tax.toString())}</p>
        <p><strong>Total: ${escapeHtml(invoice.total.toString())}</strong></p>
      </div>
      ${
        invoice.notes
          ? `<div class="section"><h3>Notes</h3><p>${escapeHtml(invoice.notes)}</p></div>`
          : ''
      }
    </body>
  </html>`;
}
