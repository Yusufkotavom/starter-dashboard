import { DocumentSequenceType, Prisma, type PrismaClient } from '@prisma/client';
import type { InvoiceMutationPayload } from '@/features/invoices/api/types';
import type { ProjectMutationPayload } from '@/features/projects/api/types';
import type { QuotationMutationPayload } from '@/features/quotations/api/types';

type DbClient = PrismaClient | Prisma.TransactionClient;

export function isDocumentNumberConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes('number');
  }

  return typeof target === 'string' && target.includes('number');
}

function normalizeNumberInput(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function generateRunningNumber(
  db: DbClient,
  type: 'quotation' | 'invoice',
  organizationId?: string | null
): Promise<string> {
  const year = new Date().getUTCFullYear();
  const scopeKey = organizationId?.trim() || 'global';
  const sequenceType =
    type === 'quotation' ? DocumentSequenceType.QUOTATION : DocumentSequenceType.INVOICE;
  const settings = await db.appSettings.findUnique({
    where: { id: 1 },
    select: { invoicePrefix: true, quotationPrefix: true }
  });
  const prefix =
    type === 'quotation'
      ? settings?.quotationPrefix?.trim().toUpperCase() || 'QUO'
      : settings?.invoicePrefix?.trim().toUpperCase() || 'INV';
  const sequence = await db.documentSequence.upsert({
    where: {
      scopeKey_type_year: {
        scopeKey,
        type: sequenceType,
        year
      }
    },
    create: {
      scopeKey,
      type: sequenceType,
      year,
      lastValue: 1
    },
    update: {
      lastValue: {
        increment: 1
      }
    },
    select: {
      lastValue: true
    }
  });

  return `${prefix}-${year}-${String(sequence.lastValue).padStart(4, '0')}`;
}

export async function generateUniqueRunningNumber(
  db: DbClient,
  type: 'quotation' | 'invoice',
  organizationId?: string | null
): Promise<string> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const candidate = await generateRunningNumber(db, type, organizationId);
    const existing =
      type === 'quotation'
        ? await db.quotation.findUnique({
            where: { number: candidate },
            select: { id: true }
          })
        : await db.invoice.findUnique({
            where: { number: candidate },
            select: { id: true }
          });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error(`UNIQUE_${type.toUpperCase()}_NUMBER_GENERATION_FAILED`);
}

export async function buildQuotationDocument(
  db: DbClient,
  body: QuotationMutationPayload,
  currentNumber?: string,
  organizationId?: string | null
): Promise<Prisma.QuotationUncheckedCreateInput> {
  const normalizedServiceIds = [...new Set((body.serviceIds ?? []).filter((id) => id > 0))];
  const services =
    normalizedServiceIds.length > 0
      ? await db.product.findMany({
          where: {
            id: { in: normalizedServiceIds },
            ...(organizationId
              ? {
                  OR: [{ organizationId }, { organizationId: null }]
                }
              : {})
          }
        })
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
    (await generateUniqueRunningNumber(db, 'quotation', organizationId ?? null));

  return {
    organizationId: organizationId ?? null,
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
  } as Prisma.QuotationUncheckedCreateInput;
}

export async function buildProjectDocument(
  db: DbClient,
  body: ProjectMutationPayload,
  organizationId?: string | null
): Promise<Prisma.ProjectUncheckedCreateInput> {
  const quotation =
    body.quotationId && body.quotationId > 0
      ? await db.quotation.findFirst({
          where: {
            id: body.quotationId,
            ...(organizationId
              ? {
                  OR: [{ organizationId }, { organizationId: null }]
                }
              : {})
          },
          select: {
            clientId: true,
            total: true
          }
        })
      : null;

  return {
    organizationId: organizationId ?? null,
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
  } as Prisma.ProjectUncheckedCreateInput;
}

export async function buildInvoiceDocument(
  db: DbClient,
  body: InvoiceMutationPayload,
  currentNumber?: string,
  organizationId?: string | null
): Promise<Prisma.InvoiceUncheckedCreateInput> {
  const project =
    body.projectId && body.projectId > 0
      ? await db.project.findFirst({
          where: {
            id: body.projectId,
            ...(organizationId
              ? {
                  OR: [{ organizationId }, { organizationId: null }]
                }
              : {})
          },
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
    (await generateUniqueRunningNumber(db, 'invoice', organizationId ?? null));

  return {
    organizationId: organizationId ?? null,
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
  } as Prisma.InvoiceUncheckedCreateInput;
}
