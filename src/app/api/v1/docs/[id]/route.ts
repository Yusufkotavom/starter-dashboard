import { NextRequest } from 'next/server';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

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

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'docs:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const docId = parseIdParam(id);
      if (!docId) return invalidIdResponse(requestId, 'doc id');

      const item = await prisma.doc.findFirst({ where: { id: docId, organizationId } });
      if (!item) {
        return integrationError(requestId, 'DOC_NOT_FOUND', `Doc ${id} not found`, 404);
      }

      return integrationSuccess(requestId, mapDoc(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'docs:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const docId = parseIdParam(id);
      if (!docId) return invalidIdResponse(requestId, 'doc id');

      const body = (await request.json().catch(() => null)) as {
        projectId?: number | null;
        type?: string;
        title?: string;
        content?: string;
      } | null;

      const existing = await prisma.doc.findFirst({
        where: { id: docId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'DOC_NOT_FOUND', `Doc ${id} not found`, 404);
      }

      const parsedProjectId = body?.projectId == null ? null : Number(body.projectId);
      const projectId = Number.isFinite(parsedProjectId) ? parsedProjectId : null;

      const updated = await prisma.doc.update({
        where: { id: existing.id },
        data: {
          ...(typeof body?.title === 'string' ? { title: body.title.trim() || 'Untitled' } : {}),
          ...(typeof body?.content === 'string' ? { content: body.content } : {}),
          ...(typeof body?.type === 'string' ? { type: body.type.trim() || 'note' } : {}),
          ...(body?.projectId !== undefined ? { projectId } : {})
        }
      });

      return integrationSuccess(requestId, mapDoc(updated));
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'docs:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const docId = parseIdParam(id);
      if (!docId) return invalidIdResponse(requestId, 'doc id');

      const existing = await prisma.doc.findFirst({
        where: { id: docId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'DOC_NOT_FOUND', `Doc ${id} not found`, 404);
      }

      await prisma.doc.delete({ where: { id: existing.id } });
      return integrationSuccess(requestId, { success: true });
    }
  });
}
