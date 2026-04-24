import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mapExpenseRecord } from '@/lib/agency';
import type { ExpenseMutationPayload } from '@/features/expenses/api/types';

type Params = { params: Promise<{ id: string }> };

function normalizeExpensePayload(body: ExpenseMutationPayload): Prisma.ExpenseUncheckedUpdateInput {
  return {
    projectId: body.projectId ?? null,
    category: body.category.trim(),
    vendor: body.vendor?.trim() || null,
    description: body.vendor?.trim() || `${body.category.trim()} expense`,
    amount: new Prisma.Decimal(body.amount),
    date: new Date(body.date),
    notes: body.notes?.trim() || null
  };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const expense = await prisma.expense.findUnique({
    where: { id: Number(id) },
    include: { project: true }
  });

  if (!expense) {
    return NextResponse.json({ message: `Expense with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapExpenseRecord(expense));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as ExpenseMutationPayload;

  try {
    const expense = await prisma.expense.update({
      where: { id: Number(id) },
      data: normalizeExpensePayload(body),
      include: { project: true }
    });

    return NextResponse.json(mapExpenseRecord(expense));
  } catch {
    return NextResponse.json({ message: `Expense with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.expense.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Expense with ID ${id} not found` }, { status: 404 });
  }
}
