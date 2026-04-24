import {
  InvoiceStatus,
  Prisma,
  ProductType,
  SubscriptionInterval,
  SubscriptionStatus
} from '@prisma/client';
import { NextResponse } from 'next/server';
import { generateRunningNumber, isDocumentNumberConflict } from '@/lib/agency-workflows';
import { getAppSettings } from '@/lib/app-settings';
import {
  appendPortalNote,
  formatPortalDateTime,
  getPortalClientOrThrow
} from '@/lib/customer-portal';
import { prisma } from '@/lib/prisma';

interface PortalOrderPayload {
  productId?: number;
  planId?: number | null;
  notes?: string | null;
}

function addInterval(date: Date, interval: SubscriptionInterval): Date | null {
  const next = new Date(date);

  if (interval === SubscriptionInterval.ONE_TIME || interval === SubscriptionInterval.LIFETIME) {
    return null;
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

function buildProjectName(
  productName: string,
  clientName: string,
  planName?: string | null
): string {
  return planName
    ? `${productName} · ${planName} · ${clientName}`
    : `${productName} · ${clientName}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PortalOrderPayload | null;
  const productId = Number(body?.productId ?? 0);
  const planId = body?.planId ? Number(body.planId) : null;
  const notes = body?.notes?.trim() || null;

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ message: 'Invalid product selection' }, { status: 400 });
  }

  const { client, email } = await getPortalClientOrThrow();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      subscriptionPlans: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!product) {
    return NextResponse.json({ message: 'Product or service not found' }, { status: 404 });
  }

  const plan =
    planId && product.subscriptionPlans.some((item) => item.id === planId)
      ? (product.subscriptionPlans.find((item) => item.id === planId) ?? null)
      : null;

  if (planId && !plan) {
    return NextResponse.json({ message: 'Selected plan is no longer available' }, { status: 400 });
  }

  if (plan) {
    const existingSubscription = await prisma.clientSubscription.findFirst({
      where: {
        clientId: client.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE
      },
      select: { id: true }
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          message: 'This recurring plan is already active for your account'
        },
        { status: 409 }
      );
    }
  }

  const settings = await getAppSettings();
  const orderDate = new Date();
  const dueDate = new Date(orderDate);
  dueDate.setUTCDate(dueDate.getUTCDate() + settings.paymentTermsDays);

  const clientLabel = client.company ?? client.name;
  const amount = plan ? Number(plan.price) : Number(product.price);
  const description = plan ? `${product.name} · ${plan.name}` : product.name;
  const sourceLabel = [
    '[Portal self-serve order]',
    `Customer: ${clientLabel}`,
    `Email: ${email}`,
    `Created: ${formatPortalDateTime(orderDate)}`,
    `Catalog item: ${product.name}`,
    plan ? `Plan: ${plan.name} (${plan.interval})` : `Mode: one-off ${product.type.toLowerCase()}`,
    notes ? `Customer note: ${notes}` : null
  ]
    .filter(Boolean)
    .join('\n');

  let response: {
    invoiceId: number;
    invoiceNumber: string;
  } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      response = await prisma.$transaction(async (tx) => {
        const quotation = await tx.quotation.create({
          data: {
            number: await generateRunningNumber(tx, 'quotation'),
            clientId: client.id,
            status: 'APPROVED',
            subtotal: new Prisma.Decimal(amount),
            tax: new Prisma.Decimal(0),
            discount: new Prisma.Decimal(0),
            total: new Prisma.Decimal(amount),
            validUntil: dueDate,
            notes: sourceLabel,
            items: {
              create: {
                productId: product.id,
                description,
                qty: new Prisma.Decimal(1),
                unitPrice: new Prisma.Decimal(amount),
                amount: new Prisma.Decimal(amount)
              }
            }
          },
          select: {
            id: true,
            number: true
          }
        });

        const project = await tx.project.create({
          data: {
            name: buildProjectName(product.name, clientLabel, plan?.name),
            clientId: client.id,
            quotationId: quotation.id,
            status: 'ACTIVE',
            startDate: orderDate,
            budget: new Prisma.Decimal(amount),
            notes: appendPortalNote(
              null,
              `Created automatically from portal order.\nProduct type: ${product.type === ProductType.SERVICE ? 'Service' : 'Product'}`
            )
          },
          select: {
            id: true
          }
        });

        let subscriptionId: number | null = null;
        if (
          plan &&
          plan.interval !== SubscriptionInterval.ONE_TIME &&
          plan.interval !== SubscriptionInterval.LIFETIME
        ) {
          const subscription = await tx.clientSubscription.create({
            data: {
              clientId: client.id,
              planId: plan.id,
              projectId: project.id,
              status: SubscriptionStatus.ACTIVE,
              startDate: orderDate,
              nextBillingDate: addInterval(orderDate, plan.interval),
              autoRenew: true,
              notes: sourceLabel
            },
            select: {
              id: true
            }
          });
          subscriptionId = subscription.id;
        }

        const invoice = await tx.invoice.create({
          data: {
            number: await generateRunningNumber(tx, 'invoice'),
            clientId: client.id,
            projectId: project.id,
            subscriptionId,
            status: InvoiceStatus.SENT,
            subtotal: new Prisma.Decimal(amount),
            tax: new Prisma.Decimal(0),
            total: new Prisma.Decimal(amount),
            dueDate,
            notes: appendPortalNote(
              sourceLabel,
              `Auto-generated invoice from portal order.\nSource quotation: ${quotation.number}`
            )
          },
          select: {
            id: true,
            number: true
          }
        });

        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number
        };
      });
      break;
    } catch (error) {
      if (!isDocumentNumberConflict(error) || attempt === 4) {
        throw error;
      }
    }
  }

  if (!response) {
    return NextResponse.json({ message: 'Failed to create order' }, { status: 500 });
  }

  return NextResponse.json({
    message: `Order created. Invoice ${response.invoiceNumber} is ready for payment.`,
    invoiceId: response.invoiceId,
    invoiceNumber: response.invoiceNumber,
    redirectTo: `/portal/invoices/${response.invoiceId}`
  });
}
