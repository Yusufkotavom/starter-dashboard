import { NextRequest } from 'next/server';
import { mapProjectRecord } from '@/lib/agency';
import { buildProjectDocument } from '@/lib/agency-workflows';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';
import { ProjectStatus } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'projects:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const projectId = parseIdParam(id);
      if (!projectId) return invalidIdResponse(requestId);

      const item = await prisma.project.findFirst({
        where: { id: projectId, organizationId },
        include: { client: true, quotation: true }
      });

      if (!item) {
        return integrationError(requestId, 'PROJECT_NOT_FOUND', `Project ${id} not found`, 404);
      }

      return integrationSuccess(requestId, mapProjectRecord(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'projects:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const projectId = parseIdParam(id);
      if (!projectId) return invalidIdResponse(requestId);

      const body = (await request.json().catch(() => null)) as {
        name?: string;
        clientId?: number;
        quotationId?: number | null;
        status?: ProjectStatus;
        startDate?: string | null;
        endDate?: string | null;
        budget?: number | null;
        notes?: string | null;
      } | null;

      if (!body?.name?.trim() || !body.clientId || !Number.isInteger(body.clientId)) {
        return integrationError(
          requestId,
          'INVALID_PROJECT_PAYLOAD',
          'name and clientId are required',
          400
        );
      }

      const existing = await prisma.project.findFirst({
        where: { id: projectId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'PROJECT_NOT_FOUND', `Project ${id} not found`, 404);
      }

      const updated = await prisma.project.update({
        where: { id: existing.id },
        data: await buildProjectDocument(
          prisma,
          {
            name: body.name,
            clientId: body.clientId,
            quotationId: body.quotationId ?? null,
            status: body.status ?? 'ACTIVE',
            startDate: body.startDate ?? null,
            endDate: body.endDate ?? null,
            budget: body.budget ?? null,
            notes: body.notes ?? null
          },
          organizationId
        ),
        include: { client: true, quotation: true }
      });

      return integrationSuccess(requestId, mapProjectRecord(updated));
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'projects:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const projectId = parseIdParam(id);
      if (!projectId) return invalidIdResponse(requestId);

      const existing = await prisma.project.findFirst({
        where: { id: projectId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'PROJECT_NOT_FOUND', `Project ${id} not found`, 404);
      }

      await prisma.project.delete({ where: { id: existing.id } });
      return integrationSuccess(requestId, { success: true });
    }
  });
}
