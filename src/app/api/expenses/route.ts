import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildExpenseOrderBy, mapExpenseRecord } from '@/lib/agency';
import type { ExpenseMutationPayload } from '@/features/expenses/api/types';
import {
  buildOrganizationReadScope,
  buildOrganizationScope,
  getActiveOrganizationId
} from '@/lib/workspace';

function normalizeExpensePayload(
  body: ExpenseMutationPayload,
  organizationId: string | null
): Prisma.ExpenseUncheckedCreateInput {
  return {
    ...buildOrganizationScope(organizationId),
    projectId: body.projectId ?? null,
    category: body.category.trim(),
    vendor: body.vendor?.trim() || null,
    description: body.vendor?.trim() || `${body.category.trim()} expense`,
    amount: new Prisma.Decimal(body.amount),
    date: new Date(body.date),
    notes: body.notes?.trim() || null
  };
}

export async function GET(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.ExpenseWhereInput = {
    ...buildOrganizationReadScope(organizationId),
    ...(search
      ? {
          OR: [
            { category: { contains: search, mode: 'insensitive' } },
            { vendor: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { project: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { project: true },
      orderBy: buildExpenseOrderBy(sort),
      skip,
      take: limit
    }),
    prisma.expense.count({ where })
  ]);

  return NextResponse.json({
    items: items.map(mapExpenseRecord),
    total_items: total
  });
}

export async function POST(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const body = (await request.json()) as ExpenseMutationPayload;
  const created = await prisma.expense.create({
    data: normalizeExpensePayload(body, organizationId),
    include: { project: true }
  });

  return NextResponse.json(mapExpenseRecord(created), { status: 201 });
}
