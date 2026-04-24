import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildProductOrderBy, mapProductRecord } from '@/lib/catalog';
import type { ProductMutationPayload } from '@/features/products/api/types';
import { Prisma, ProductType } from '@prisma/client';

function normalizeProductPayload(body: ProductMutationPayload): Prisma.ProductUncheckedCreateInput {
  return {
    name: body.name.trim(),
    description: body.description.trim(),
    type: body.type === 'service' ? ProductType.SERVICE : ProductType.PRODUCT,
    price: new Prisma.Decimal(body.price),
    categorySlug: body.category
  };
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
      include: { category: true },
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
    include: { category: true }
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Product created successfully',
      product: mapProductRecord(created)
    },
    { status: 201 }
  );
}
