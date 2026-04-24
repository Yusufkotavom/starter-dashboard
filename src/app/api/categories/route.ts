import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildCategoryOrderBy, mapCategoryRecord } from '@/lib/catalog';
import type { CategoryMutationPayload } from '@/features/categories/api/types';
import { Prisma } from '@prisma/client';

function normalizeCategoryPayload(body: CategoryMutationPayload): Prisma.CategoryCreateInput {
  return {
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    description: body.description.trim() || null
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.CategoryWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: buildCategoryOrderBy(sort),
      skip,
      take: limit
    }),
    prisma.category.count({ where })
  ]);

  return NextResponse.json({
    success: true,
    time: new Date().toISOString(),
    message: 'Categories loaded successfully',
    total_categories: total,
    offset: skip,
    limit,
    categories: items.map(mapCategoryRecord)
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CategoryMutationPayload;

  const created = await prisma.category.create({
    data: normalizeCategoryPayload(body),
    include: { _count: { select: { products: true } } }
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Category created successfully',
      category: mapCategoryRecord(created)
    },
    { status: 201 }
  );
}
