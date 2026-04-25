import type { PrismaClient } from '@prisma/client';
import { getDefaultAppSettings } from '@/lib/app-settings';
import { escapeHtml } from './shared';
import {
  buildDocumentLayout,
  type DocumentRenderOptions,
  formatDocumentAmount,
  formatDocumentDate
} from './shared';

export interface InvoiceDocumentPayment {
  amount: number;
  method: string | null;
  reference: string | null;
  paidAt: string;
}

export interface InvoiceDocumentData {
  id: number;
  number: string;
  status: string;
  createdAt: string;
  dueDate: string | null;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string;
  clientPhone: string | null;
  clientAddress: string | null;
  projectName: string | null;
  subscriptionName: string | null;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  notes: string | null;
  payments: InvoiceDocumentPayment[];
  issuerName: string;
  issuerEmail: string;
  paymentBankName: string | null;
  paymentAccountName: string | null;
  paymentAccountNumber: string | null;
}

export async function getInvoiceDocumentData(
  db: PrismaClient,
  id: number
): Promise<InvoiceDocumentData | null> {
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
      subscription: {
        include: {
          plan: true
        }
      },
      payments: true
    }
  });

  if (!invoice) {
    return null;
  }

  const appSettings =
    (await db.appSettings.findUnique({
      where: { id: 1 }
    })) || getDefaultAppSettings();

  const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const total = Number(invoice.total);

  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    clientName: invoice.client.name,
    clientCompany: invoice.client.company,
    clientEmail: invoice.client.email,
    clientPhone: invoice.client.phone,
    clientAddress: invoice.client.address,
    projectName: invoice.project?.name ?? null,
    subscriptionName: invoice.subscription?.plan.name ?? null,
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.tax),
    total,
    paidAmount,
    balanceDue: Math.max(total - paidAmount, 0),
    notes: invoice.notes,
    issuerName: appSettings.companyName,
    issuerEmail: appSettings.companyEmail,
    paymentBankName: 'paymentBankName' in appSettings ? appSettings.paymentBankName : null,
    paymentAccountName: 'paymentAccountName' in appSettings ? appSettings.paymentAccountName : null,
    paymentAccountNumber:
      'paymentAccountNumber' in appSettings ? appSettings.paymentAccountNumber : null,
    payments: invoice.payments
      .toSorted((a, b) => a.paidAt.getTime() - b.paidAt.getTime())
      .map((payment) => ({
        amount: Number(payment.amount),
        method: payment.method,
        reference: payment.reference,
        paidAt: payment.paidAt.toISOString()
      }))
  };
}

function renderPaymentsTable(payments: InvoiceDocumentPayment[]): string {
  if (payments.length === 0) {
    return '<p>No payment has been recorded yet.</p>';
  }

  return `<table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Method</th>
        <th>Reference</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${payments
        .map(
          (payment) => `
        <tr>
          <td>${escapeHtml(formatDocumentDate(payment.paidAt))}</td>
          <td>${escapeHtml(payment.method || '-')}</td>
          <td>${escapeHtml(payment.reference || '-')}</td>
          <td class="amount">${escapeHtml(formatDocumentAmount(payment.amount))}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>`;
}

export function renderInvoiceDocumentHtml(
  invoice: InvoiceDocumentData,
  options: DocumentRenderOptions
): string {
  const issuerLines = [
    invoice.issuerName,
    invoice.issuerEmail,
    invoice.paymentBankName ? `Bank: ${invoice.paymentBankName}` : null,
    invoice.paymentAccountName ? `A/N: ${invoice.paymentAccountName}` : null,
    invoice.paymentAccountNumber ? `No. Rek: ${invoice.paymentAccountNumber}` : null
  ].filter(Boolean) as string[];

  const partyLines = [
    invoice.clientCompany || invoice.clientName,
    invoice.clientEmail,
    invoice.clientPhone || '-',
    invoice.clientAddress || '-'
  ];

  return buildDocumentLayout({
    kind: 'invoice',
    title: 'Invoice',
    number: invoice.number,
    status: invoice.status,
    issuerTitle: 'Issued By',
    issuerLines,
    metaRows: [
      { label: 'Issued Date', value: formatDocumentDate(invoice.createdAt) },
      { label: 'Due Date', value: formatDocumentDate(invoice.dueDate) },
      { label: 'Project', value: invoice.projectName || '-' },
      { label: 'Subscription', value: invoice.subscriptionName || '-' }
    ],
    partyTitle: 'Billed To',
    partyLines,
    summaryRows: [
      { label: 'Subtotal', value: formatDocumentAmount(invoice.subtotal) },
      { label: 'Tax', value: formatDocumentAmount(invoice.tax) },
      { label: 'Total', value: formatDocumentAmount(invoice.total) },
      { label: 'Paid', value: formatDocumentAmount(invoice.paidAmount) },
      { label: 'Balance Due', value: formatDocumentAmount(invoice.balanceDue) }
    ],
    lineItemsTitle: 'Payment Activity',
    lineItemsTable: renderPaymentsTable(invoice.payments),
    notes: invoice.notes,
    paymentNote:
      invoice.balanceDue > 0
        ? `Please settle the remaining balance of ${formatDocumentAmount(invoice.balanceDue)} before the due date.${
            invoice.paymentBankName && invoice.paymentAccountNumber
              ? ` Payment destination: ${invoice.paymentBankName} / ${invoice.paymentAccountNumber}${
                  invoice.paymentAccountName ? ` (${invoice.paymentAccountName})` : ''
                }.`
              : ''
          }`
        : 'This invoice has been fully settled.',
    footerTitle: 'Billing Contact',
    footerLines: [
      invoice.issuerName,
      invoice.issuerEmail,
      invoice.paymentBankName && invoice.paymentAccountNumber
        ? `${invoice.paymentBankName} • ${invoice.paymentAccountNumber}`
        : 'Managed from the agency dashboard'
    ],
    signatureBlocks: [
      {
        title: 'Issued By',
        lines: [invoice.issuerName, invoice.issuerEmail]
      },
      {
        title: 'Received By',
        lines: [invoice.clientCompany || invoice.clientName, invoice.clientEmail]
      }
    ],
    options,
    id: invoice.id
  });
}
