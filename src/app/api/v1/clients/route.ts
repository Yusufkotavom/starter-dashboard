import { NextRequest } from 'next/server';
import { ClientStatus, Prisma } from '@prisma/client';
import { mapClientRecord } from '@/lib/agency';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { createIntegrationClient } from '@/lib/integration-runtime';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'clients:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const page = Number(searchParams.get('page') ?? 1);
      const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
      const search = searchParams.get('search') ?? undefined;
      const status = searchParams.get('status') ?? undefined;
      const skip = (page - 1) * limit;

      const where: Prisma.ClientWhereInput = {
        organizationId,
        ...(status ? { status: { equals: status as ClientStatus } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
              ]
            }
          : {})
      };

      const [items, total] = await Promise.all([
        prisma.client.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit
        }),
        prisma.client.count({ where })
      ]);

      return integrationSuccess(requestId, {
        items: items.map(mapClientRecord),
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
    scope: 'clients:write',
    handler: async ({ requestId, organizationId }) => {
      const body = (await request.json().catch(() => null)) as {
        name?: string;
        email?: string;
        phone?: string | null;
        company?: string | null;
        address?: string | null;
        status?: ClientStatus;
        notes?: string | null;
      } | null;

      if (!body?.name?.trim() || !body?.email?.trim()) {
        return integrationError(
          requestId,
          'INVALID_CLIENT_PAYLOAD',
          'name and email are required',
          400
        );
      }

      const created = await createIntegrationClient(
        {
          name: body.name,
          email: body.email,
          phone: body.phone ?? null,
          company: body.company ?? null,
          address: body.address ?? null,
          status: body.status ?? 'LEAD',
          notes: body.notes ?? null
        },
        organizationId
      );

      return integrationSuccess(requestId, created, { status: 201 });
    }
  });
}
