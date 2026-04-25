import type { PrismaClient } from '@prisma/client';
import { getDefaultAppSettings } from '@/lib/app-settings';
import { escapeHtml } from './shared';
import {
  buildDocumentLayout,
  type DocumentRenderOptions,
  formatDocumentAmount,
  formatDocumentDate
} from './shared';

export interface QuotationDocumentItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface QuotationDocumentData {
  id: number;
  number: string;
  status: string;
  createdAt: string;
  validUntil: string | null;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string;
  clientPhone: string | null;
  clientAddress: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
  items: QuotationDocumentItem[];
  issuerName: string;
  issuerEmail: string;
}

export async function getQuotationDocumentData(
  db: PrismaClient,
  id: number
): Promise<QuotationDocumentData | null> {
  const quotation = await db.quotation.findUnique({
    where: { id },
    include: {
      client: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!quotation) {
    return null;
  }

  const appSettings =
    (await db.appSettings.findUnique({
      where: { id: 1 }
    })) || getDefaultAppSettings();

  return {
    id: quotation.id,
    number: quotation.number,
    status: quotation.status,
    createdAt: quotation.createdAt.toISOString(),
    validUntil: quotation.validUntil?.toISOString() ?? null,
    clientName: quotation.client.name,
    clientCompany: quotation.client.company,
    clientEmail: quotation.client.email,
    clientPhone: quotation.client.phone,
    clientAddress: quotation.client.address,
    subtotal: Number(quotation.subtotal),
    tax: Number(quotation.tax),
    discount: Number(quotation.discount),
    total: Number(quotation.total),
    notes: quotation.notes,
    issuerName: appSettings.companyName,
    issuerEmail: appSettings.companyEmail,
    items: quotation.items.map((item) => ({
      description: item.product?.name ?? item.description,
      qty: Number(item.qty),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount)
    }))
  };
}

function renderItemsTable(items: QuotationDocumentItem[]): string {
  if (items.length === 0) {
    return '<p>No linked line items.</p>';
  }

  return `<table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount">Qty</th>
        <th class="amount">Unit Price</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td class="amount">${escapeHtml(item.qty.toLocaleString('id-ID'))}</td>
          <td class="amount">${escapeHtml(formatDocumentAmount(item.unitPrice))}</td>
          <td class="amount">${escapeHtml(formatDocumentAmount(item.amount))}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>`;
}

export function renderQuotationDocumentHtml(
  quotation: QuotationDocumentData,
  options: DocumentRenderOptions
): string {
  const issuerLines = [quotation.issuerName, quotation.issuerEmail];
  const partyLines = [
    quotation.clientCompany || quotation.clientName,
    quotation.clientEmail,
    quotation.clientPhone || '-',
    quotation.clientAddress || '-'
  ];

  return buildDocumentLayout({
    kind: 'quotation',
    title: 'Quotation',
    number: quotation.number,
    status: quotation.status,
    issuerTitle: 'Prepared By',
    issuerLines,
    metaRows: [
      { label: 'Issued Date', value: formatDocumentDate(quotation.createdAt) },
      { label: 'Valid Until', value: formatDocumentDate(quotation.validUntil) },
      { label: 'Line Items', value: quotation.items.length.toLocaleString('id-ID') },
      { label: 'Client', value: quotation.clientCompany || quotation.clientName }
    ],
    partyTitle: 'Prepared For',
    partyLines,
    summaryRows: [
      { label: 'Subtotal', value: formatDocumentAmount(quotation.subtotal) },
      { label: 'Tax', value: formatDocumentAmount(quotation.tax) },
      { label: 'Discount', value: formatDocumentAmount(quotation.discount) },
      { label: 'Grand Total', value: formatDocumentAmount(quotation.total) }
    ],
    lineItemsTitle: 'Quoted Scope',
    lineItemsTable: renderItemsTable(quotation.items),
    notes: quotation.notes,
    paymentNote: `This quotation remains valid until ${formatDocumentDate(quotation.validUntil)}. Any scope or pricing revision should be reconfirmed before approval.`,
    footerTitle: 'Commercial Contact',
    footerLines: [
      quotation.issuerName,
      quotation.issuerEmail,
      'Quotation generated from the agency dashboard'
    ],
    signatureBlocks: [
      {
        title: 'Prepared By',
        lines: [quotation.issuerName, quotation.issuerEmail]
      },
      {
        title: 'Approval',
        lines: [quotation.clientCompany || quotation.clientName, 'Name, title, and signature']
      }
    ],
    options,
    id: quotation.id
  });
}
