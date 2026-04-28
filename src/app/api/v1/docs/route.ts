import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { parsePageParams } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

function mapDoc(record: {
  id: number;
  projectId: number | null;
  type: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    projectId: record.projectId,
    type: record.type,
    title: record.title,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'docs:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const { page, limit, skip } = parsePageParams(searchParams, 20, 100);
      const search = searchParams.get('search') ?? undefined;
      const projectIdParam = searchParams.get('projectId');
      const parsedProjectId = projectIdParam ? Number(projectIdParam) : undefined;
      const projectId = Number.isFinite(parsedProjectId) ? parsedProjectId : undefined;

      const where: Prisma.DocWhereInput = {
        organizationId,
        ...(projectId ? { OR: [{ projectId }, { projectId: null }] } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
              ]
            }
          : {})
      };

      const [items, total] = await Promise.all([
        prisma.doc.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit
        }),
        prisma.doc.count({ where })
      ]);

      return integrationSuccess(requestId, {
        items: items.map(mapDoc),
        total_items: total,
        page,
        per_page: limit,
        total_pages: Math.max(Math.ceil(total / limit), 1)
      });
    }
  });
}

export async function POST(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'docs:write',
    handler: async ({ requestId, organizationId }) => {
      const body = (await request.json().catch(() => null)) as {
        projectId?: number | null;
        type?: string;
        title?: string;
        content?: string;
      } | null;

      if (!body?.title?.trim()) {
        return integrationError(requestId, 'INVALID_DOC_PAYLOAD', 'title is required', 400);
      }

      const parsedProjectId = body.projectId == null ? null : Number(body.projectId);
      const projectId = Number.isFinite(parsedProjectId) ? parsedProjectId : null;

      const created = await prisma.doc.create({
        data: {
          organizationId,
          projectId,
          type: body.type?.trim() || 'note',
          title: body.title.trim(),
          content: body.content?.trim() || ''
        }
      });

      return integrationSuccess(requestId, mapDoc(created), { status: 201 });
    }
  });
}
