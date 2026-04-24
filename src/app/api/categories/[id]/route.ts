import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapCategoryRecord } from '@/lib/catalog';
import type { CategoryMutationPayload } from '@/features/categories/api/types';
import { Prisma } from '@prisma/client';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

function normalizeCategoryPayload(body: CategoryMutationPayload): Prisma.CategoryUpdateInput {
  return {
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    description: body.description.trim() || null
  };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const category = await prisma.category.findFirst({
    where: {
      id: Number(id),
      ...buildOrganizationReadScope(organizationId)
    },
    include: { _count: { select: { products: true } } }
  });

  if (!category) {
    return NextResponse.json(
      { success: false, message: `Category with ID ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    time: new Date().toISOString(),
    message: `Category with ID ${id} found`,
    category: mapCategoryRecord(category)
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const body = (await request.json()) as CategoryMutationPayload;

  try {
    const existing = await prisma.category.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Category with ID ${id} not found` },
        { status: 404 }
      );
    }
    const category = await prisma.category.update({
      where: { id: existing.id },
      data: normalizeCategoryPayload(body),
      include: { _count: { select: { products: true } } }
    });

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category: mapCategoryRecord(category)
    });
  } catch {
    return NextResponse.json(
      { success: false, message: `Category with ID ${id} not found` },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;

  try {
    const existing = await prisma.category.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Category with ID ${id} not found` },
        { status: 404 }
      );
    }
    await prisma.category.delete({
      where: { id: existing.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch {
    return NextResponse.json(
      { success: false, message: `Category with ID ${id} not found` },
      { status: 404 }
    );
  }
}
