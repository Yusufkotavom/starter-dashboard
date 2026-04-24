import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapProductRecord } from '@/lib/catalog';
import type { ProductMutationPayload } from '@/features/products/api/types';
import { Prisma, ProductType } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

function normalizeProductPayload(body: ProductMutationPayload): Prisma.ProductUncheckedUpdateInput {
  return {
    name: body.name.trim(),
    description: body.description.trim(),
    type: body.type === 'service' ? ProductType.SERVICE : ProductType.PRODUCT,
    price: new Prisma.Decimal(body.price),
    categorySlug: body.category,
    photoUrl: body.photoUrl || null
  };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { category: true }
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
      include: { category: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: mapProductRecord(product)
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
