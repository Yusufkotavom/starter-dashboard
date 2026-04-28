import { NextRequest } from 'next/server';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { prisma } from '@/lib/prisma';
import { parsePageParams } from '@/lib/integration-v1';
import type { CreateKanbanTaskPayload } from '@/features/kanban/api/types';
import { buildEmptyColumns, mapTask } from '@/app/api/kanban/tasks/helpers';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'tasks:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const projectIdParam = searchParams.get('projectId');
      const parsedProjectId = projectIdParam ? Number(projectIdParam) : undefined;
      const projectId = Number.isFinite(parsedProjectId) ? parsedProjectId : undefined;
      const { page, limit, skip } = parsePageParams(searchParams, 50, 100);

      const where = {
        organizationId,
        ...(projectId ? { projectId } : { projectId: null })
      };

      const [tasks, total] = await Promise.all([
        prisma.kanbanTask.findMany({
          where,
          orderBy: [{ column: 'asc' }, { orderIndex: 'asc' }, { id: 'asc' }],
          skip,
          take: limit
        }),
        prisma.kanbanTask.count({ where })
      ]);

      const columns = buildEmptyColumns();
      for (const task of tasks) {
        const mapped = mapTask(task);
        columns[mapped.column].push(mapped);
      }

      return integrationSuccess(requestId, {
        items: tasks.map(mapTask),
        columns,
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
    scope: 'tasks:write',
    handler: async ({ requestId, organizationId }) => {
      const body = (await request.json().catch(() => null)) as CreateKanbanTaskPayload | null;
      const projectId = body?.projectId && Number.isFinite(body.projectId) ? body.projectId : null;
      const docId = body?.docId && Number.isFinite(body.docId) ? body.docId : null;

      if (!body?.title?.trim()) {
        return integrationError(requestId, 'INVALID_TASK_PAYLOAD', 'title is required', 400);
      }

      const maxOrder = await prisma.kanbanTask.aggregate({
        where: {
          organizationId,
          projectId,
          column: 'BACKLOG'
        },
        _max: { orderIndex: true }
      });

      const created = await prisma.kanbanTask.create({
        data: {
          organizationId,
          projectId,
          title: body.title.trim(),
          description: body.description?.trim() || null,
          artifactType: body.artifactType ?? 'task',
          artifactPath: body.artifactPath?.trim() || null,
          docId,
          assignee: body.assignee?.trim() || null,
          priority: body.priority ?? 'medium',
          column: 'BACKLOG',
          orderIndex: (maxOrder._max.orderIndex ?? -1) + 1
        }
      });

      return integrationSuccess(requestId, mapTask(created), { status: 201 });
    }
  });
}
