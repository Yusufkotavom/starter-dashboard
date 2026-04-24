import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapProjectRecord } from '@/lib/agency';
import { buildProjectDocument } from '@/lib/agency-workflows';
import type { ProjectMutationPayload } from '@/features/projects/api/types';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: {
      id: Number(id),
      ...buildOrganizationReadScope(organizationId)
    },
    include: { client: true, quotation: true }
  });

  if (!project) {
    return NextResponse.json({ message: `Project with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapProjectRecord(project));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const body = (await request.json()) as ProjectMutationPayload;

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ message: `Project with ID ${id} not found` }, { status: 404 });
    }
    const project = await prisma.project.update({
      where: { id: existing.id },
      data: await buildProjectDocument(prisma, body, organizationId),
      include: { client: true, quotation: true }
    });

    return NextResponse.json(mapProjectRecord(project));
  } catch {
    return NextResponse.json({ message: `Project with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ message: `Project with ID ${id} not found` }, { status: 404 });
    }
    await prisma.project.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Project with ID ${id} not found` }, { status: 404 });
  }
}
