import { NextRequest, NextResponse } from 'next/server';
import { Prisma, ProjectStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildProjectOrderBy, mapProjectRecord } from '@/lib/agency';
import { buildProjectDocument } from '@/lib/agency-workflows';
import type { ProjectMutationPayload } from '@/features/projects/api/types';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

export async function GET(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const search = searchParams.get('search') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.ProjectWhereInput = {
    ...buildOrganizationReadScope(organizationId),
    ...(status ? { status: { equals: status as ProjectStatus } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
            { client: { name: { contains: search, mode: 'insensitive' } } },
            { client: { company: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { client: true, quotation: true },
      orderBy: buildProjectOrderBy(sort),
      skip,
      take: limit
    }),
    prisma.project.count({ where })
  ]);

  return NextResponse.json({
    items: items.map(mapProjectRecord),
    total_items: total
  });
}

export async function POST(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const body = (await request.json()) as ProjectMutationPayload;
  const created = await prisma.project.create({
    data: await buildProjectDocument(prisma, body, organizationId),
    include: { client: true, quotation: true }
  });

  return NextResponse.json(mapProjectRecord(created), { status: 201 });
}
