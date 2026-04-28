import { NextRequest } from 'next/server';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';
import type { UpdateKanbanTaskPayload } from '@/features/kanban/api/types';
import { COLUMN_TO_DB, mapTask } from '@/app/api/kanban/tasks/helpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'tasks:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const taskId = parseIdParam(id);
      if (!taskId) return invalidIdResponse(requestId, 'task id');

      const item = await prisma.kanbanTask.findFirst({ where: { id: taskId, organizationId } });
      if (!item) {
        return integrationError(requestId, 'TASK_NOT_FOUND', `Task ${id} not found`, 404);
      }

      return integrationSuccess(requestId, mapTask(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'tasks:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const taskId = parseIdParam(id);
      if (!taskId) return invalidIdResponse(requestId, 'task id');

      const body = (await request.json().catch(() => null)) as UpdateKanbanTaskPayload | null;
      const docId = body?.docId && Number.isFinite(body.docId) ? body.docId : null;

      const existing = await prisma.kanbanTask.findFirst({
        where: { id: taskId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'TASK_NOT_FOUND', `Task ${id} not found`, 404);
      }

      const updated = await prisma.kanbanTask.update({
        where: { id: existing.id },
        data: {
          ...(typeof body?.title === 'string' ? { title: body.title.trim() } : {}),
          ...(typeof body?.description === 'string'
            ? { description: body.description.trim() || null }
            : {}),
          ...(typeof body?.artifactType === 'string' ? { artifactType: body.artifactType } : {}),
          ...(typeof body?.artifactPath === 'string'
            ? { artifactPath: body.artifactPath.trim() || null }
            : {}),
          ...(body?.docId !== undefined ? { docId } : {}),
          ...(typeof body?.assignee === 'string' ? { assignee: body.assignee.trim() || null } : {}),
          ...(body?.priority ? { priority: body.priority } : {}),
          ...(body?.column ? { column: COLUMN_TO_DB[body.column] } : {}),
          ...(typeof body?.dueDate === 'string' ? { dueDate: body.dueDate.trim() || null } : {})
        }
      });

      return integrationSuccess(requestId, mapTask(updated));
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'tasks:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const taskId = parseIdParam(id);
      if (!taskId) return invalidIdResponse(requestId, 'task id');

      const existing = await prisma.kanbanTask.findFirst({
        where: { id: taskId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'TASK_NOT_FOUND', `Task ${id} not found`, 404);
      }

      await prisma.kanbanTask.delete({ where: { id: existing.id } });
      return integrationSuccess(requestId, { success: true });
    }
  });
}
