import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildProductOrderBy, mapProductRecord } from '@/lib/catalog';
import type { ProductMutationPayload } from '@/features/products/api/types';
import { Prisma, ProductType, SubscriptionInterval } from '@prisma/client';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizeProductPayload(body: ProductMutationPayload): Prisma.ProductUncheckedCreateInput {
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const categories = searchParams.get('categories') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    ...(categories ? { categorySlug: { in: categories.split(/[.,]/).filter(Boolean) } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
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
      },
      orderBy: buildProductOrderBy(sort),
      skip,
      take: limit
    }),
    prisma.product.count({ where })
  ]);

  return NextResponse.json({
    success: true,
    time: new Date().toISOString(),
    message: 'Products loaded successfully',
    total_products: total,
    offset: skip,
    limit,
    products: items.map(mapProductRecord)
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ProductMutationPayload;

  const created = await prisma.product.create({
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

  if (body.recurringPlans?.length) {
    await syncRecurringPlans(created.id, created.name, body.recurringPlans);
  }

  const hydrated = await prisma.product.findUniqueOrThrow({
    where: { id: created.id },
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

  return NextResponse.json(
    {
      success: true,
      message: 'Product created successfully',
      product: mapProductRecord(hydrated)
    },
    { status: 201 }
  );
}
