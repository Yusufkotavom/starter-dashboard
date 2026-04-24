import { InvoiceStatus, QuotationStatus, Prisma, type PrismaClient } from '@prisma/client';
import { buildInvoiceDocument } from '@/lib/agency-workflows';
import { getAppSettings } from '@/lib/app-settings';
import { prisma } from '@/lib/prisma';
import {
  createSettlementPayment,
  getInvoicePaymentSnapshot,
  type InvoicePaymentSnapshot
} from '@/lib/payment-workflows';

const QUOTATION_SOURCE_PREFIX = '[Source quotation]';

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface PaymentInstructions {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  qrisUrl: string | null;
}

export async function getPaymentInstructions() {
  const settings = await getAppSettings();
  return {
    bankName: settings.paymentBankName,
    accountName: settings.paymentAccountName,
    accountNumber: settings.paymentAccountNumber,
    qrisUrl: settings.paymentQrisUrl
  } satisfies PaymentInstructions;
}

export function buildQuotationSourceTag(quotationId: number, quotationNumber: string): string {
  return `${QUOTATION_SOURCE_PREFIX} #${quotationId} ${quotationNumber}`;
}

function appendNote(existing: string | null | undefined, entry: string): string {
  const trimmed = existing?.trim();
  return trimmed ? `${trimmed}\n\n${entry}` : entry;
}

async function createDefaultDueDate() {
  const settings = await getAppSettings();
  const dueDate = new Date();
  dueDate.setUTCDate(dueDate.getUTCDate() + settings.paymentTermsDays);
  return dueDate;
}

function buildPortalPaymentUrl(origin: string, invoiceId: number): string {
  return new URL(`/portal/invoices/${invoiceId}`, origin).toString();
}

export async function buildInvoicePaymentLink(
  origin: string,
  invoiceId: number
): Promise<{
  paymentLink: string;
  invoice: InvoicePaymentSnapshot;
  instructions: PaymentInstructions;
}> {
  const invoice = await getInvoicePaymentSnapshot(prisma, invoiceId);
  if (!invoice) {
    throw new Error('INVOICE_NOT_FOUND');
  }

  const instructions = await getPaymentInstructions();

  return {
    paymentLink: buildPortalPaymentUrl(origin, invoiceId),
    invoice,
    instructions
  };
}

export async function approveQuotationAndCreateInvoice(
  db: typeof prisma,
  quotationId: number
): Promise<{
  quotationId: number;
  quotationNumber: string;
  invoiceId: number;
  invoiceNumber: string;
}> {
  return db.$transaction(async (tx) => {
    const quotation = await tx.quotation.findUnique({
      where: { id: quotationId },
      include: {
        project: true
      }
    });

    if (!quotation) {
      throw new Error('QUOTATION_NOT_FOUND');
    }

    if (
      quotation.status === QuotationStatus.REJECTED ||
      quotation.status === QuotationStatus.EXPIRED
    ) {
      throw new Error('QUOTATION_NOT_APPROVABLE');
    }

    const sourceTag = buildQuotationSourceTag(quotation.id, quotation.number);
    const existingInvoice = await tx.invoice.findFirst({
      where: {
        OR: [
          quotation.project?.id
            ? {
                projectId: quotation.project.id
              }
            : undefined,
          {
            notes: {
              contains: sourceTag,
              mode: 'insensitive'
            }
          }
        ].filter(Boolean) as Prisma.InvoiceWhereInput[]
      }
    });

    if (quotation.status !== QuotationStatus.APPROVED) {
      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: QuotationStatus.APPROVED }
      });
    }

    if (existingInvoice) {
      return {
        quotationId: quotation.id,
        quotationNumber: quotation.number,
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.number
      };
    }

    const invoice = await tx.invoice.create({
      data: await buildInvoiceDocument(tx, {
        clientId: quotation.clientId,
        projectId: quotation.project?.id ?? null,
        status: InvoiceStatus.DRAFT,
        total: Number(quotation.total),
        dueDate: (await createDefaultDueDate()).toISOString(),
        notes: appendNote(
          quotation.notes,
          `Auto-generated draft invoice from approved quotation.\n${sourceTag}`
        )
      }),
      select: {
        id: true,
        number: true
      }
    });

    return {
      quotationId: quotation.id,
      quotationNumber: quotation.number,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number
    };
  });
}

export async function markInvoiceAsSent(
  db: DbClient,
  invoiceId: number
): Promise<{ invoiceId: number; status: InvoiceStatus }> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, status: true }
  });

  if (!invoice) {
    throw new Error('INVOICE_NOT_FOUND');
  }

  const status = invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : invoice.status;

  if (status !== invoice.status) {
    await db.invoice.update({
      where: { id: invoice.id },
      data: { status }
    });
  }

  return {
    invoiceId: invoice.id,
    status
  };
}

export async function markInvoiceAsPaid(
  db: typeof prisma,
  invoiceId: number
): Promise<{
  invoiceId: number;
  paymentId: number | null;
}> {
  return db.$transaction(async (tx) => {
    const payment = await createSettlementPayment(tx, invoiceId, {
      notes: 'Marked as paid from invoice automation menu'
    });

    return {
      invoiceId,
      paymentId: payment?.id ?? null
    };
  });
}
