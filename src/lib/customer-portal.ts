import { currentUser } from '@clerk/nextjs/server';
import type { Prisma } from '@prisma/client';
import { InvoiceStatus, SubscriptionStatus } from '@prisma/client';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const portalClientInclude = {
  projects: {
    orderBy: { updatedAt: 'desc' }
  },
  invoices: {
    include: {
      project: true,
      payments: { select: { amount: true } },
      subscription: { include: { plan: true } }
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
  activeProjects: PortalClientRecord['projects'];
  outstandingInvoices: PortalClientRecord['invoices'];
  activeSubscriptions: PortalClientRecord['subscriptions'];
  payments: PortalPaymentRecord[];
}

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
    activeProjects,
    outstandingInvoices,
    activeSubscriptions,
    payments
  };
}
