import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildOrganizationReadScope,
  buildOrganizationScope,
  getActiveOrganizationId
} from '@/lib/workspace';
import type { CreateKanbanTaskPayload } from '@/features/kanban/api/types';
import { buildEmptyColumns, mapTask } from './helpers';

export async function GET(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const projectIdParam = request.nextUrl.searchParams.get('projectId');
  const parsedProjectId = projectIdParam ? Number(projectIdParam) : undefined;
  const projectId = Number.isFinite(parsedProjectId) ? parsedProjectId : undefined;

  const tasks = await prisma.kanbanTask.findMany({
    where: {
      ...buildOrganizationReadScope(organizationId),
      ...(projectId ? { projectId } : { projectId: null })
    },
    orderBy: [{ column: 'asc' }, { orderIndex: 'asc' }, { id: 'asc' }]
  });

  const columns = buildEmptyColumns();
  for (const task of tasks) {
    const mapped = mapTask(task);
    columns[mapped.column].push(mapped);
  }

  return NextResponse.json({ columns });
}

export async function POST(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const body = (await request.json()) as CreateKanbanTaskPayload;
  const projectId = body.projectId && Number.isFinite(body.projectId) ? body.projectId : null;

  if (!body.title?.trim()) {
    return NextResponse.json({ message: 'Title is required' }, { status: 400 });
  }

  const maxOrder = await prisma.kanbanTask.aggregate({
    where: {
      ...buildOrganizationScope(organizationId),
      projectId,
      column: 'BACKLOG'
    },
    _max: { orderIndex: true }
  });

  const created = await prisma.kanbanTask.create({
    data: {
      ...buildOrganizationScope(organizationId),
      projectId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      assignee: body.assignee?.trim() || null,
      priority: body.priority ?? 'medium',
      column: 'BACKLOG',
      orderIndex: (maxOrder._max.orderIndex ?? -1) + 1
    }
  });

  return NextResponse.json(mapTask(created), { status: 201 });
}
