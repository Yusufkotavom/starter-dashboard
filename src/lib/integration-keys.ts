import crypto from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { hashIntegrationApiKey } from '@/lib/integration-auth';

export interface IntegrationKeyRecord {
  id: number;
  organizationId: string | null;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function mapIntegrationKeyRecord(record: {
  id: number;
  organizationId: string | null;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): IntegrationKeyRecord {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    keyPrefix: record.keyPrefix,
    scopes: record.scopes,
    isActive: record.isActive,
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function requireAuthenticatedDashboardUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('AUTH_REQUIRED');
  }

  return { userId };
}

function createRawIntegrationApiKey() {
  return `sdk_live_${crypto.randomBytes(24).toString('base64url')}`;
}

export async function createIntegrationApiKey(args: {
  name: string;
  scopes: string[];
  organizationId: string | null;
}) {
  const rawKey = createRawIntegrationApiKey();
  const keyPrefix = rawKey.slice(0, 16);
  const created = await prisma.integrationApiKey.create({
    data: {
      organizationId: args.organizationId,
      name: args.name.trim(),
      keyPrefix,
      keyHash: hashIntegrationApiKey(rawKey),
      scopes: [...new Set(args.scopes)].toSorted(),
      isActive: true
    }
  });

  return {
    key: rawKey,
    record: mapIntegrationKeyRecord(created)
  };
}
