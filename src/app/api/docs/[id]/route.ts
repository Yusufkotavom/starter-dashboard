import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

interface DocMutationPayload {
  projectId?: number | null;
  type?: string;
  title?: string;
  content?: string;
  contentJson?: unknown;
}

function mapDoc(record: {
  id: number;
  projectId: number | null;
  type: string;
  title: string;
  content: string;
  contentJson: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    projectId: record.projectId,
    type: record.type,
    title: record.title,
    content: record.content,
    contentJson: record.contentJson,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function jsonValueFromUnknown(
  value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const parsedId = Number(id);

  if (!Number.isFinite(parsedId)) {
    return NextResponse.json({ message: 'Invalid doc id' }, { status: 400 });
  }

  const item = await prisma.doc.findFirst({
    where: {
      id: parsedId,
      ...buildOrganizationReadScope(organizationId)
    }
  });

  if (!item) {
    return NextResponse.json({ message: `Doc with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapDoc(item));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const parsedId = Number(id);
  if (!Number.isFinite(parsedId)) {
    return NextResponse.json({ message: 'Invalid doc id' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as DocMutationPayload | null;
  const existing = await prisma.doc.findFirst({
    where: {
      id: parsedId,
      ...buildOrganizationReadScope(organizationId)
    },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: `Doc with ID ${id} not found` }, { status: 404 });
  }

  const parsedProjectId = body?.projectId == null ? null : Number(body.projectId);
  const projectId = Number.isFinite(parsedProjectId) ? parsedProjectId : null;
  const updateData: Prisma.DocUncheckedUpdateInput = {};

  if (typeof body?.title === 'string') {
    updateData.title = body.title.trim() || 'Untitled';
  }

  if (typeof body?.content === 'string') {
    updateData.content = body.content;
  }

  if (body?.contentJson !== undefined) {
    updateData.contentJson = jsonValueFromUnknown(body.contentJson);
  }

  if (typeof body?.type === 'string') {
    updateData.type = body.type.trim() || 'note';
  }

  if (body?.projectId !== undefined) {
    updateData.projectId = projectId;
  }

  const updated = await prisma.doc.update({
    where: { id: existing.id },
    data: updateData
  });

  return NextResponse.json(mapDoc(updated));
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const parsedId = Number(id);
  if (!Number.isFinite(parsedId)) {
    return NextResponse.json({ message: 'Invalid doc id' }, { status: 400 });
  }

  const existing = await prisma.doc.findFirst({
    where: {
      id: parsedId,
      ...buildOrganizationReadScope(organizationId)
    },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: `Doc with ID ${id} not found` }, { status: 404 });
  }

  await prisma.doc.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}
