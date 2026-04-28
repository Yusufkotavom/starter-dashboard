import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';
import type { UpdateKanbanTaskPayload } from '@/features/kanban/api/types';
import { COLUMN_TO_DB, mapTask } from '../helpers';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const parsedId = Number(id);

  if (!Number.isFinite(parsedId)) {
    return NextResponse.json({ message: 'Invalid task id' }, { status: 400 });
  }

  const body = (await request.json()) as UpdateKanbanTaskPayload;
  const existing = await prisma.kanbanTask.findFirst({
    where: {
      id: parsedId,
      ...buildOrganizationReadScope(organizationId)
    },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: `Task with ID ${id} not found` }, { status: 404 });
  }

  const updated = await prisma.kanbanTask.update({
    where: { id: existing.id },
    data: {
      ...(typeof body.title === 'string' ? { title: body.title.trim() } : {}),
      ...(typeof body.description === 'string'
        ? { description: body.description.trim() || null }
        : {}),
      ...(typeof body.assignee === 'string' ? { assignee: body.assignee.trim() || null } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
      ...(body.column ? { column: COLUMN_TO_DB[body.column] } : {}),
      ...(typeof body.dueDate === 'string' ? { dueDate: body.dueDate.trim() || null } : {})
    }
  });

  return NextResponse.json(mapTask(updated));
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const parsedId = Number(id);

  if (!Number.isFinite(parsedId)) {
    return NextResponse.json({ message: 'Invalid task id' }, { status: 400 });
  }

  const existing = await prisma.kanbanTask.findFirst({
    where: {
      id: parsedId,
      ...buildOrganizationReadScope(organizationId)
    },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: `Task with ID ${id} not found` }, { status: 404 });
  }

  await prisma.kanbanTask.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}
