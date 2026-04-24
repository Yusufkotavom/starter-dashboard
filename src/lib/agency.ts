import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Client, ClientStatus } from '@/features/clients/api/types';
import type { Project } from '@/features/projects/api/types';
import type { Quotation } from '@/features/quotations/api/types';
import type { Invoice } from '@/features/invoices/api/types';
import type { Payment, PaymentMethod } from '@/features/payments/api/types';
import type { Expense } from '@/features/expenses/api/types';

type ClientRecord = Prisma.ClientGetPayload<Record<string, never>>;
type ProjectRecord = Prisma.ProjectGetPayload<{
  include: { client: true; quotation: true };
}>;
type QuotationRecord = Prisma.QuotationGetPayload<{
  include: {
    client: true;
    _count: { select: { items: true } };
    items: { include: { product: true } };
  };
}>;
type InvoiceRecord = Prisma.InvoiceGetPayload<{
  include: { client: true; project: true; payments: { select: { amount: true } } };
}>;
type PaymentRecord = Prisma.PaymentGetPayload<{
  include: { invoice: { include: { client: true; payments: { select: { amount: true } } } } };
}>;
type ExpenseRecord = Prisma.ExpenseGetPayload<{
  include: { project: true };
}>;

export function mapClientRecord(record: ClientRecord): Client {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    company: record.company,
    address: record.address,
    status: record.status as ClientStatus,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapProjectRecord(record: ProjectRecord): Project {
  return {
    id: record.id,
    name: record.name,
    clientId: record.clientId,
    clientName: record.client.name,
    clientCompany: record.client.company,
    quotationId: record.quotationId,
    quotationNumber: record.quotation?.number ?? null,
    quotationTotal: record.quotation ? Number(record.quotation.total) : null,
    status: record.status,
    startDate: record.startDate?.toISOString() ?? null,
    endDate: record.endDate?.toISOString() ?? null,
    budget: record.budget ? Number(record.budget) : null,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapQuotationRecord(record: QuotationRecord): Quotation {
  const linkedServices = record.items.filter((item) => item.productId && item.product);
  return {
    id: record.id,
    number: record.number,
    clientId: record.clientId,
    clientName: record.client.name,
    clientCompany: record.client.company,
    serviceIds: linkedServices.map((item) => item.productId as number),
    serviceNames: linkedServices.map((item) => item.product?.name ?? item.description),
    status: record.status,
    total: Number(record.total),
    validUntil: record.validUntil?.toISOString() ?? null,
    notes: record.notes,
    itemsCount: record._count.items,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapInvoiceRecord(record: InvoiceRecord): Invoice {
  const paidAmount = record.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const total = Number(record.total);
  return {
    id: record.id,
    number: record.number,
    clientId: record.clientId,
    clientName: record.client.name,
    projectId: record.projectId,
    projectName: record.project?.name ?? null,
    status: record.status,
    total,
    paidAmount,
    balanceDue: Math.max(total - paidAmount, 0),
    dueDate: record.dueDate?.toISOString() ?? null,
    paidAt: record.paidAt?.toISOString() ?? null,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapPaymentRecord(record: PaymentRecord): Payment {
  const invoicePaidAmount = record.invoice.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
  const invoiceTotal = Number(record.invoice.total);
  return {
    id: record.id,
    invoiceId: record.invoiceId,
    invoiceNumber: record.invoice.number,
    clientName: record.invoice.client.name,
    invoiceTotal,
    invoicePaidAmount,
    invoiceBalanceDue: Math.max(invoiceTotal - invoicePaidAmount, 0),
    invoiceStatus: record.invoice.status,
    amount: Number(record.amount),
    method: ((record.method || 'BANK_TRANSFER').toUpperCase() as PaymentMethod) ?? 'BANK_TRANSFER',
    reference: record.reference,
    paidAt: record.paidAt.toISOString(),
    notes: record.notes,
    createdAt: record.createdAt.toISOString()
  };
}

export function mapExpenseRecord(record: ExpenseRecord): Expense {
  return {
    id: record.id,
    projectId: record.projectId,
    projectName: record.project?.name ?? null,
    category: record.category,
    vendor: record.vendor,
    amount: Number(record.amount),
    date: record.date.toISOString(),
    notes: record.notes,
    createdAt: record.createdAt.toISOString()
  };
}

type SortItem = { id: string; desc: boolean };

function parseSort(sort?: string): SortItem[] {
  if (!sort) return [];

  try {
    return JSON.parse(sort) as SortItem[];
  } catch {
    return [];
  }
}

export function buildClientOrderBy(sort?: string): Prisma.ClientOrderByWithRelationInput[] {
  const sortItems = parseSort(sort);
  if (sortItems.length === 0) return [{ createdAt: 'desc' }];

  return sortItems.map((item) => {
    const direction = item.desc ? 'desc' : 'asc';
    if (
      item.id === 'name' ||
      item.id === 'email' ||
      item.id === 'status' ||
      item.id === 'createdAt'
    ) {
      return { [item.id]: direction } as Prisma.ClientOrderByWithRelationInput;
    }
    return { createdAt: 'desc' };
  });
}

export function buildProjectOrderBy(sort?: string): Prisma.ProjectOrderByWithRelationInput[] {
  const sortItems = parseSort(sort);
  if (sortItems.length === 0) return [{ updatedAt: 'desc' }];

  return sortItems.map((item) => {
    const direction = item.desc ? 'desc' : 'asc';
    if (
      item.id === 'name' ||
      item.id === 'status' ||
      item.id === 'createdAt' ||
      item.id === 'budget'
    ) {
      return {
        [item.id === 'createdAt' ? 'createdAt' : item.id]: direction
      } as Prisma.ProjectOrderByWithRelationInput;
    }
    return { updatedAt: 'desc' };
  });
}

export function buildQuotationOrderBy(sort?: string): Prisma.QuotationOrderByWithRelationInput[] {
  const sortItems = parseSort(sort);
  if (sortItems.length === 0) return [{ createdAt: 'desc' }];

  return sortItems.map((item) => {
    const direction = item.desc ? 'desc' : 'asc';
    if (
      item.id === 'number' ||
      item.id === 'status' ||
      item.id === 'total' ||
      item.id === 'createdAt'
    ) {
      return { [item.id]: direction } as Prisma.QuotationOrderByWithRelationInput;
    }
    return { createdAt: 'desc' };
  });
}

export function buildInvoiceOrderBy(sort?: string): Prisma.InvoiceOrderByWithRelationInput[] {
  const sortItems = parseSort(sort);
  if (sortItems.length === 0) return [{ createdAt: 'desc' }];

  return sortItems.map((item) => {
    const direction = item.desc ? 'desc' : 'asc';
    if (
      item.id === 'number' ||
      item.id === 'status' ||
      item.id === 'total' ||
      item.id === 'dueDate'
    ) {
      return { [item.id]: direction } as Prisma.InvoiceOrderByWithRelationInput;
    }
    return { createdAt: 'desc' };
  });
}

export function buildPaymentOrderBy(sort?: string): Prisma.PaymentOrderByWithRelationInput[] {
  const sortItems = parseSort(sort);
  if (sortItems.length === 0) return [{ paidAt: 'desc' }];

  return sortItems.map((item) => {
    const direction = item.desc ? 'desc' : 'asc';
    if (item.id === 'amount' || item.id === 'method' || item.id === 'paidAt') {
      return { [item.id]: direction } as Prisma.PaymentOrderByWithRelationInput;
    }
    if (item.id === 'invoiceNumber') {
      return { invoice: { number: direction } };
    }
    return { paidAt: 'desc' };
  });
}

export function buildExpenseOrderBy(sort?: string): Prisma.ExpenseOrderByWithRelationInput[] {
  const sortItems = parseSort(sort);
  if (sortItems.length === 0) return [{ date: 'desc' }];

  return sortItems.map((item) => {
    const direction = item.desc ? 'desc' : 'asc';
    if (item.id === 'category' || item.id === 'amount' || item.id === 'date') {
      return { [item.id]: direction } as Prisma.ExpenseOrderByWithRelationInput;
    }
    return { date: 'desc' };
  });
}

function sumByStatus<
  T extends {
    status: string;
    total?: Prisma.Decimal | number | null;
    amount?: Prisma.Decimal | number | null;
  }
>(items: T[], allowedStatuses: string[], field: 'total' | 'amount') {
  return items.reduce((sum, item) => {
    if (!allowedStatuses.includes(item.status)) return sum;
    const value = item[field];
    return sum + Number(value ?? 0);
  }, 0);
}

export interface AgencyMetrics {
  openLeads: number;
  activeProjects: number;
  totalProjects: number;
  approvedPipeline: number;
  sentPipeline: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  cashIn: number;
  costOut: number;
  grossSpread: number;
}

export async function getAgencyMetrics(db: typeof prisma) {
  const [clients, projects, quotations, invoices, payments, expenses] = await Promise.all([
    db.client.findMany({ select: { status: true } }),
    db.project.findMany({ select: { status: true } }),
    db.quotation.findMany({ select: { status: true, total: true } }),
    db.invoice.findMany({ select: { status: true, total: true } }),
    db.payment.findMany({ select: { amount: true } }),
    db.expense.findMany({ select: { amount: true } })
  ]);

  const openLeads = clients.filter((item) => item.status === 'LEAD').length;
  const activeProjects = projects.filter((item) => item.status === 'ACTIVE').length;
  const totalProjects = projects.length;
  const approvedPipeline = sumByStatus(quotations, ['APPROVED'], 'total');
  const sentPipeline = sumByStatus(quotations, ['SENT'], 'total');
  const outstandingInvoices = sumByStatus(invoices, ['SENT', 'PARTIAL', 'OVERDUE'], 'total');
  const overdueInvoices = invoices.filter((item) => item.status === 'OVERDUE').length;
  const cashIn = payments.reduce((sum, item) => sum + Number(item.amount), 0);
  const costOut = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    openLeads,
    activeProjects,
    totalProjects,
    approvedPipeline,
    sentPipeline,
    outstandingInvoices,
    overdueInvoices,
    cashIn,
    costOut,
    grossSpread: cashIn - costOut
  } satisfies AgencyMetrics;
}
