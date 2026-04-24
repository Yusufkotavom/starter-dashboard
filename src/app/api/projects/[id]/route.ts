import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mapProjectRecord } from '@/lib/agency';
import type { ProjectMutationPayload } from '@/features/projects/api/types';

type Params = { params: Promise<{ id: string }> };

function normalizeProjectPayload(body: ProjectMutationPayload): Prisma.ProjectUncheckedUpdateInput {
  return {
    name: body.name.trim(),
    clientId: body.clientId,
    quotationId: body.quotationId ?? null,
    status: body.status,
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    budget:
      body.budget === null || body.budget === undefined ? null : new Prisma.Decimal(body.budget),
    notes: body.notes?.trim() || null
  };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: { client: true }
  });

  if (!project) {
    return NextResponse.json({ message: `Project with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapProjectRecord(project));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as ProjectMutationPayload;

  try {
    const project = await prisma.project.update({
      where: { id: Number(id) },
      data: normalizeProjectPayload(body),
      include: { client: true }
    });

    return NextResponse.json(mapProjectRecord(project));
  } catch {
    return NextResponse.json({ message: `Project with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.project.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Project with ID ${id} not found` }, { status: 404 });
  }
}
