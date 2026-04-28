import { NextRequest } from 'next/server';
import { Prisma, ProjectStatus } from '@prisma/client';
import { mapProjectRecord } from '@/lib/agency';
import { buildProjectDocument } from '@/lib/agency-workflows';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { parsePageParams } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'projects:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const { page, limit, skip } = parsePageParams(searchParams);
      const search = searchParams.get('search') ?? undefined;
      const status = searchParams.get('status') ?? undefined;

      const where: Prisma.ProjectWhereInput = {
        organizationId,
        ...(status ? { status: { equals: status as ProjectStatus } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } }
              ]
            }
          : {})
      };

      const [items, total] = await Promise.all([
        prisma.project.findMany({
          where,
          include: { client: true, quotation: true },
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit
        }),
        prisma.project.count({ where })
      ]);

      return integrationSuccess(requestId, {
        items: items.map(mapProjectRecord),
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
    scope: 'projects:write',
    handler: async ({ requestId, organizationId }) => {
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

      const created = await prisma.project.create({
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

      return integrationSuccess(requestId, mapProjectRecord(created), { status: 201 });
    }
  });
}
