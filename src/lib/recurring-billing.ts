import {
  InvoiceStatus,
  SubscriptionInterval,
  SubscriptionStatus,
  type Prisma
} from '@prisma/client';
import { isDocumentNumberConflict } from '@/lib/agency-workflows';
import { getAppSettings } from '@/lib/app-settings';
import { prisma } from '@/lib/prisma';

type DbClient = typeof prisma | Prisma.TransactionClient;

function addInterval(date: Date, interval: SubscriptionInterval): Date {
  const next = new Date(date);

  if (interval === SubscriptionInterval.ONE_TIME || interval === SubscriptionInterval.LIFETIME) {
    return next;
  }

  if (interval === SubscriptionInterval.WEEKLY) {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }

  if (interval === SubscriptionInterval.QUARTERLY) {
    next.setUTCMonth(next.getUTCMonth() + 3);
    return next;
  }

  if (interval === SubscriptionInterval.YEARLY) {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
    return next;
  }

  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

async function generateInvoiceNumber(db: DbClient): Promise<string> {
  const year = new Date().getUTCFullYear();
  const settings = await getAppSettings();
  const prefix = `${settings.invoicePrefix}-${year}-`;
  const latest = await db.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
    select: { number: true }
  });
  const currentSequence = latest?.number
    ? Number.parseInt(latest.number.split('-').at(-1) ?? '0', 10)
    : 0;
  const nextSequence = Number.isFinite(currentSequence) ? currentSequence + 1 : 1;

  return `INV-${year}-${String(nextSequence).padStart(4, '0')}`;
}

export interface RecurringInvoiceRunResult {
  createdInvoices: number;
  billedSubscriptions: number;
  skippedSubscriptions: number;
}

export async function runRecurringInvoiceBilling(
  db: DbClient,
  runDate = new Date()
): Promise<RecurringInvoiceRunResult> {
  const dueSubscriptions = await db.clientSubscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate: { lte: runDate },
      plan: {
        interval: {
          notIn: [SubscriptionInterval.ONE_TIME, SubscriptionInterval.LIFETIME]
        }
      }
    },
    include: {
      client: true,
      plan: true,
      project: true
    }
  });

  let createdInvoices = 0;

  for (const subscription of dueSubscriptions) {
    const currentBillingDate = subscription.nextBillingDate ?? runDate;
    const existingInvoice = await db.invoice.findFirst({
      where: {
        subscriptionId: subscription.id,
        dueDate: currentBillingDate
      },
      select: { id: true }
    });

    const nextBillingDate = addInterval(currentBillingDate, subscription.plan.interval);

    if (existingInvoice) {
      await db.clientSubscription.update({
        where: { id: subscription.id },
        data: { nextBillingDate }
      });
      continue;
    }

    const total = subscription.priceOverride ?? subscription.plan.price;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const invoiceNumber = await generateInvoiceNumber(db);

        const invoiceData: Prisma.InvoiceUncheckedCreateInput = {
          organizationId:
            (subscription as { organizationId?: string | null }).organizationId ?? null,
          number: invoiceNumber,
          clientId: subscription.clientId,
          projectId: subscription.projectId,
          subscriptionId: subscription.id,
          status: InvoiceStatus.SENT,
          subtotal: total,
          tax: 0,
          total,
          dueDate: currentBillingDate,
          notes: `${subscription.plan.name} recurring billing`
        };

        await db.invoice.create({
          data: invoiceData
        });

        break;
      } catch (error) {
        if (!isDocumentNumberConflict(error) || attempt === 4) {
          throw error;
        }
      }
    }

    await db.clientSubscription.update({
      where: { id: subscription.id },
      data: { nextBillingDate }
    });

    createdInvoices += 1;
  }

  return {
    createdInvoices,
    billedSubscriptions: dueSubscriptions.length,
    skippedSubscriptions: Math.max(dueSubscriptions.length - createdInvoices, 0)
  };
}
