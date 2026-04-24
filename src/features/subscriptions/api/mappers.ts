import {
  Prisma,
  SubscriptionInterval,
  SubscriptionStatus,
  type ClientSubscription as PrismaClientSubscription,
  type Product,
  type Project,
  type SubscriptionPlan as PrismaSubscriptionPlan,
  type Client
} from '@prisma/client';
import type {
  ClientSubscription,
  ClientSubscriptionMutationPayload,
  SubscriptionPlan,
  SubscriptionPlanMutationPayload
} from './types';

type SubscriptionPlanRecord = PrismaSubscriptionPlan & {
  service: Product | null;
  _count: {
    subscriptions: number;
  };
};

type ClientSubscriptionRecord = PrismaClientSubscription & {
  client: Client;
  plan: PrismaSubscriptionPlan;
  project: Project | null;
  _count: {
    invoices: number;
  };
};

export function mapSubscriptionPlanRecord(record: SubscriptionPlanRecord): SubscriptionPlan {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    serviceId: record.serviceId,
    serviceName: record.service?.name ?? null,
    price: Number(record.price),
    interval: record.interval,
    isActive: record.isActive,
    activeSubscriptions: record._count.subscriptions,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapClientSubscriptionRecord(record: ClientSubscriptionRecord): ClientSubscription {
  const effectivePrice = Number(record.priceOverride ?? record.plan.price);

  return {
    id: record.id,
    clientId: record.clientId,
    clientName: record.client.name,
    clientCompany: record.client.company,
    planId: record.planId,
    planName: record.plan.name,
    planInterval: record.plan.interval,
    projectId: record.projectId,
    projectName: record.project?.name ?? null,
    status: record.status,
    startDate: record.startDate.toISOString(),
    nextBillingDate: record.nextBillingDate?.toISOString() ?? null,
    endDate: record.endDate?.toISOString() ?? null,
    autoRenew: record.autoRenew,
    priceOverride: record.priceOverride ? Number(record.priceOverride) : null,
    effectivePrice,
    notes: record.notes,
    invoiceCount: record._count.invoices,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function normalizeSubscriptionPlanPayload(body: SubscriptionPlanMutationPayload) {
  return {
    name: body.name.trim(),
    slug: body.slug.trim(),
    description: body.description?.trim() || null,
    serviceId: body.serviceId ?? null,
    price: new Prisma.Decimal(body.price),
    interval: body.interval as SubscriptionInterval,
    isActive: body.isActive
  };
}

export function normalizeClientSubscriptionPayload(body: ClientSubscriptionMutationPayload) {
  return {
    clientId: body.clientId,
    planId: body.planId,
    projectId: body.projectId ?? null,
    status: body.status as SubscriptionStatus,
    startDate: new Date(body.startDate),
    nextBillingDate: body.nextBillingDate ? new Date(body.nextBillingDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    autoRenew: body.autoRenew,
    priceOverride:
      typeof body.priceOverride === 'number' ? new Prisma.Decimal(body.priceOverride) : null,
    notes: body.notes?.trim() || null
  };
}
