import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapProductRecord } from '@/lib/catalog';
import type { ProductMutationPayload } from '@/features/products/api/types';
import { Prisma, ProductType, SubscriptionInterval } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizeProductPayload(body: ProductMutationPayload): Prisma.ProductUncheckedUpdateInput {
  return {
    name: body.name.trim(),
    description: body.description.trim(),
    type: body.type === 'service' ? ProductType.SERVICE : ProductType.PRODUCT,
    isDigital: !!body.isDigital,
    deliveryUrl: body.deliveryUrl?.trim() || null,
    price: new Prisma.Decimal(body.price),
    categorySlug: body.category,
    photoUrl: body.photoUrl || null
  };
}

async function syncRecurringPlans(
  productId: number,
  productName: string,
  plans: NonNullable<ProductMutationPayload['recurringPlans']>
) {
  const existingPlans = await prisma.subscriptionPlan.findMany({
    where: { serviceId: productId },
    include: {
      _count: {
        select: {
          subscriptions: true
        }
      }
    }
  });

  const incomingPlans = plans
    .map((plan) => ({
      id: plan.id,
      name: plan.name.trim(),
      description: plan.description?.trim() || null,
      interval: plan.interval as SubscriptionInterval,
      price: plan.price,
      isActive: plan.isActive
    }))
    .filter((plan) => plan.name && plan.price > 0);

  for (const plan of incomingPlans) {
    if (plan.id) {
      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: {
          name: plan.name,
          description: plan.description,
          interval: plan.interval,
          price: new Prisma.Decimal(plan.price),
          isActive: plan.isActive,
          serviceId: productId
        }
      });
      continue;
    }

    const baseSlug = slugify(`${productName}-${plan.name}-${plan.interval}`);
    let nextSlug = baseSlug || slugify(productName) || `plan-${Date.now()}`;
    let counter = 1;

    while (await prisma.subscriptionPlan.findUnique({ where: { slug: nextSlug } })) {
      nextSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    await prisma.subscriptionPlan.create({
      data: {
        name: plan.name,
        slug: nextSlug,
        description: plan.description,
        interval: plan.interval,
        price: new Prisma.Decimal(plan.price),
        isActive: plan.isActive,
        serviceId: productId
      }
    });
  }

  const incomingIds = new Set(incomingPlans.map((plan) => plan.id).filter(Boolean));
  const plansToArchive = existingPlans.filter((plan) => !incomingIds.has(plan.id));

  for (const plan of plansToArchive) {
    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        isActive: false
      }
    });
  }
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: {
      category: true,
      subscriptionPlans: {
        include: {
          _count: {
            select: {
              subscriptions: true
            }
          }
        },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }]
      }
    }
  });

  if (!product) {
    return NextResponse.json(
      { success: false, message: `Product with ID ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    time: new Date().toISOString(),
    message: `Product with ID ${id} found`,
    product: mapProductRecord(product)
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as ProductMutationPayload;

  try {
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: normalizeProductPayload(body),
      include: {
        category: true,
        subscriptionPlans: {
          include: {
            _count: {
              select: {
                subscriptions: true
              }
            }
          }
        }
      }
    });

    await syncRecurringPlans(product.id, product.name, body.recurringPlans ?? []);

    const hydrated = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: {
        category: true,
        subscriptionPlans: {
          include: {
            _count: {
              select: {
                subscriptions: true
              }
            }
          },
          orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }]
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: mapProductRecord(hydrated)
    });
  } catch {
    return NextResponse.json(
      { success: false, message: `Product with ID ${id} not found` },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.product.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch {
    return NextResponse.json(
      { success: false, message: `Product with ID ${id} not found` },
      { status: 404 }
    );
  }
}
