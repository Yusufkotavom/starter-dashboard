import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';
import type { ReorderKanbanTasksPayload } from '@/features/kanban/api/types';
import { COLUMN_TO_DB, mapTask } from '../helpers';

export async function POST(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const body = (await request.json()) as ReorderKanbanTasksPayload;
  const projectId = body.projectId && Number.isFinite(body.projectId) ? body.projectId : null;

  if (!body.columns) {
    return NextResponse.json({ message: 'Columns payload is required' }, { status: 400 });
  }

  const taskIds = Object.values(body.columns)
    .flat()
    .map((item) => item.id);

  if (taskIds.length === 0) {
    return NextResponse.json({ success: true, items: [] });
  }

  const existingTasks = await prisma.kanbanTask.findMany({
    where: {
      id: { in: taskIds },
      ...buildOrganizationReadScope(organizationId),
      projectId
    },
    select: { id: true }
  });

  if (existingTasks.length !== taskIds.length) {
    return NextResponse.json({ message: 'Some tasks are not accessible' }, { status: 403 });
  }

  await prisma.$transaction(
    (
      Object.entries(body.columns) as Array<[keyof typeof body.columns, Array<{ id: number }>]>
    ).flatMap(([columnKey, items]) =>
      items.map((item, index) =>
        prisma.kanbanTask.update({
          where: { id: item.id },
          data: {
            column: COLUMN_TO_DB[columnKey],
            orderIndex: index
          }
        })
      )
    )
  );

  const updatedTasks = await prisma.kanbanTask.findMany({
    where: {
      id: { in: taskIds }
    },
    orderBy: [{ column: 'asc' }, { orderIndex: 'asc' }, { id: 'asc' }]
  });

  return NextResponse.json({
    success: true,
    items: updatedTasks.map(mapTask)
  });
}
