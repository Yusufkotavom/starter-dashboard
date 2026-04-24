import { InvoiceStatus, Prisma, type PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface InvoicePaymentSnapshot {
  invoiceId: number;
  number: string;
  status: InvoiceStatus;
  total: number;
  paidAmount: number;
  balanceDue: number;
}

export async function syncInvoicePaymentState(
  tx: Prisma.TransactionClient,
  invoiceId: number
): Promise<void> {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { select: { amount: true, paidAt: true } } }
  });

  if (!invoice) return;

  const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const total = Number(invoice.total);
  const latestPaidAt =
    invoice.payments.length > 0
      ? invoice.payments
          .map((payment) => payment.paidAt)
          .toSorted((a, b) => b.getTime() - a.getTime())[0]
      : null;
  const isOverdue = !!invoice.dueDate && invoice.dueDate.getTime() < Date.now();

  let status: InvoiceStatus = invoice.status;
  if (invoice.status !== InvoiceStatus.CANCELLED) {
    if (paidAmount >= total && total > 0) {
      status = InvoiceStatus.PAID;
    } else if (paidAmount > 0) {
      status = InvoiceStatus.PARTIAL;
    } else if (isOverdue) {
      status = InvoiceStatus.OVERDUE;
    } else if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.PARTIAL ||
      invoice.status === InvoiceStatus.OVERDUE
    ) {
      status = InvoiceStatus.SENT;
    }
  }

  await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      paidAt: status === InvoiceStatus.PAID ? latestPaidAt : null
    }
  });
}

export async function getInvoicePaymentSnapshot(
  db: DbClient,
  invoiceId: number
): Promise<InvoicePaymentSnapshot | null> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { select: { amount: true } } }
  });

  if (!invoice) {
    return null;
  }

  const total = Number(invoice.total);
  const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return {
    invoiceId: invoice.id,
    number: invoice.number,
    status: invoice.status,
    total,
    paidAmount,
    balanceDue: Math.max(total - paidAmount, 0)
  };
}

export async function createSettlementPayment(
  tx: Prisma.TransactionClient,
  invoiceId: number,
  options?: {
    method?: string;
    reference?: string | null;
    notes?: string | null;
    paidAt?: Date;
  }
) {
  const snapshot = await getInvoicePaymentSnapshot(tx, invoiceId);
  if (!snapshot) {
    throw new Error('INVOICE_NOT_FOUND');
  }

  if (snapshot.balanceDue <= 0) {
    return null;
  }

  const payment = await tx.payment.create({
    data: {
      invoiceId,
      amount: new Prisma.Decimal(snapshot.balanceDue),
      method: options?.method ?? 'BANK_TRANSFER',
      reference: options?.reference?.trim() || null,
      notes: options?.notes?.trim() || 'Recorded automatically from invoice workflow',
      paidAt: options?.paidAt ?? new Date()
    }
  });

  await syncInvoicePaymentState(tx, invoiceId);

  return payment;
}
