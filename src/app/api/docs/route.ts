import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  buildOrganizationReadScope,
  buildOrganizationScope,
  getActiveOrganizationId
} from '@/lib/workspace';

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

export async function GET(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const projectIdParam = request.nextUrl.searchParams.get('projectId');
  const search = request.nextUrl.searchParams.get('search') ?? undefined;
  const projectId = projectIdParam ? Number(projectIdParam) : undefined;

  const where: Prisma.DocWhereInput = {
    ...buildOrganizationReadScope(organizationId),
    ...(Number.isFinite(projectId) ? { OR: [{ projectId }, { projectId: null }] } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  const items = await prisma.doc.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }]
  });

  return NextResponse.json({
    items: items.map(mapDoc),
    total_items: items.length
  });
}

export async function POST(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const body = (await request.json().catch(() => null)) as DocMutationPayload | null;

  if (!body?.title?.trim()) {
    return NextResponse.json({ message: 'Title is required' }, { status: 400 });
  }

  const parsedProjectId = body.projectId == null ? null : Number(body.projectId);
  const projectId = Number.isFinite(parsedProjectId) ? parsedProjectId : null;

  const created = await prisma.doc.create({
    data: {
      ...buildOrganizationScope(organizationId),
      projectId,
      type: body.type?.trim() || 'note',
      title: body.title.trim(),
      content: body.content?.trim() || '',
      contentJson: jsonValueFromUnknown(body.contentJson)
    }
  });

  return NextResponse.json(mapDoc(created), { status: 201 });
}
