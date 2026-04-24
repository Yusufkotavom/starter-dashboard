import { NextRequest, NextResponse } from 'next/server';
import { ClientStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildClientOrderBy, mapClientRecord } from '@/lib/agency';
import { normalizePhoneNumber } from '@/lib/phone';
import type { ClientMutationPayload } from '@/features/clients/api/types';
import {
  buildOrganizationReadScope,
  buildOrganizationScope,
  getActiveOrganizationId
} from '@/lib/workspace';

function normalizeClientPayload(
  body: ClientMutationPayload,
  organizationId: string | null
): Prisma.ClientCreateInput {
  return {
    ...buildOrganizationScope(organizationId),
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: normalizePhoneNumber(body.phone),
    company: body.company?.trim() || null,
    address: body.address?.trim() || null,
    status: body.status,
    notes: body.notes?.trim() || null
  };
}

export async function GET(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const search = searchParams.get('search') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.ClientWhereInput = {
    ...buildOrganizationReadScope(organizationId),
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
      orderBy: buildClientOrderBy(sort),
      skip,
      take: limit
    }),
    prisma.client.count({ where })
  ]);

  return NextResponse.json({
    items: items.map(mapClientRecord),
    total_items: total
  });
}

export async function POST(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const body = (await request.json()) as ClientMutationPayload;
  const created = await prisma.client.create({
    data: normalizeClientPayload(body, organizationId)
  });

  return NextResponse.json(mapClientRecord(created), { status: 201 });
}
