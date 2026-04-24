import { Prisma, type PrismaClient } from '@prisma/client';
import type { InvoiceMutationPayload } from '@/features/invoices/api/types';
import type { ProjectMutationPayload } from '@/features/projects/api/types';
import type { QuotationMutationPayload } from '@/features/quotations/api/types';

type DbClient = PrismaClient | Prisma.TransactionClient;

function normalizeNumberInput(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function generateRunningNumber(db: DbClient, type: 'quotation' | 'invoice'): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = type === 'quotation' ? 'QUO' : 'INV';
  const pattern = `${prefix}-${year}-`;
  const latest =
    type === 'quotation'
      ? await db.quotation.findFirst({
          where: { number: { startsWith: pattern } },
          orderBy: { number: 'desc' },
          select: { number: true }
        })
      : await db.invoice.findFirst({
          where: { number: { startsWith: pattern } },
          orderBy: { number: 'desc' },
          select: { number: true }
        });

  const currentSequence = latest?.number
    ? Number.parseInt(latest.number.split('-').at(-1) ?? '0', 10)
    : 0;
  const nextSequence = Number.isFinite(currentSequence) ? currentSequence + 1 : 1;

  return `${prefix}-${year}-${String(nextSequence).padStart(4, '0')}`;
}

export async function buildQuotationDocument(
  db: DbClient,
  body: QuotationMutationPayload,
  currentNumber?: string
): Promise<Prisma.QuotationUncheckedCreateInput> {
  const normalizedServiceIds = [...new Set((body.serviceIds ?? []).filter((id) => id > 0))];
  const services =
    normalizedServiceIds.length > 0
      ? await db.product.findMany({ where: { id: { in: normalizedServiceIds } } })
      : [];
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const orderedServices = normalizedServiceIds
    .map((serviceId) => serviceMap.get(serviceId))
    .filter((service): service is NonNullable<typeof service> => !!service);

  let subtotal = body.total;
  let items: Array<{
    productId: number | null;
    description: string;
    qty: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
    amount: Prisma.Decimal;
  }> = [];

  if (orderedServices.length > 0) {
    subtotal = orderedServices.reduce((sum, service) => sum + Number(service.price), 0);
    items = orderedServices.map((service) => {
      const price = Number(service.price);
      return {
        productId: service.id,
        description: service.name,
        qty: new Prisma.Decimal(1),
        unitPrice: new Prisma.Decimal(price),
        amount: new Prisma.Decimal(price)
      };
    });
  } else {
    const safeCount = Math.max(body.itemsCount, 1);
    const unitAmount = Number((body.total / safeCount).toFixed(2));
    items = Array.from({ length: safeCount }, (_, index) => ({
      productId: null,
      description: `Service line ${index + 1}`,
      qty: new Prisma.Decimal(1),
      unitPrice: new Prisma.Decimal(unitAmount),
      amount: new Prisma.Decimal(unitAmount)
    }));
  }

  const documentNumber =
    normalizeNumberInput(body.number) ??
    currentNumber ??
    (await generateRunningNumber(db, 'quotation'));

  return {
    number: documentNumber,
    clientId: body.clientId,
    status: body.status,
    subtotal: new Prisma.Decimal(subtotal),
    tax: new Prisma.Decimal(0),
    discount: new Prisma.Decimal(0),
    total: new Prisma.Decimal(subtotal),
    validUntil: body.validUntil ? new Date(body.validUntil) : null,
    notes: body.notes?.trim() || null,
    items: { create: items }
  };
}

export async function buildProjectDocument(
  db: DbClient,
  body: ProjectMutationPayload
): Promise<Prisma.ProjectUncheckedCreateInput> {
  const quotation =
    body.quotationId && body.quotationId > 0
      ? await db.quotation.findUnique({
          where: { id: body.quotationId },
          select: {
            clientId: true,
            total: true
          }
        })
      : null;

  return {
    name: body.name.trim(),
    clientId: quotation?.clientId ?? body.clientId,
    quotationId: body.quotationId ?? null,
    status: body.status,
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    budget:
      body.budget === null || body.budget === undefined
        ? quotation?.total
          ? new Prisma.Decimal(quotation.total)
          : null
        : new Prisma.Decimal(body.budget),
    notes: body.notes?.trim() || null
  };
}

export async function buildInvoiceDocument(
  db: DbClient,
  body: InvoiceMutationPayload,
  currentNumber?: string
): Promise<Prisma.InvoiceUncheckedCreateInput> {
  const project =
    body.projectId && body.projectId > 0
      ? await db.project.findUnique({
          where: { id: body.projectId },
          include: {
            quotation: {
              select: {
                total: true
              }
            }
          }
        })
      : null;
  const derivedTotal = project?.quotation?.total
    ? Number(project.quotation.total)
    : project?.budget
      ? Number(project.budget)
      : null;
  const total = body.total > 0 ? body.total : (derivedTotal ?? 0);
  const documentNumber =
    normalizeNumberInput(body.number) ??
    currentNumber ??
    (await generateRunningNumber(db, 'invoice'));

  return {
    number: documentNumber,
    clientId: project?.clientId ?? body.clientId,
    projectId: body.projectId ?? null,
    status: body.status,
    subtotal: new Prisma.Decimal(total),
    tax: new Prisma.Decimal(0),
    total: new Prisma.Decimal(total),
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    paidAt: body.paidAt ? new Date(body.paidAt) : null,
    notes: body.notes?.trim() || null
  };
}
