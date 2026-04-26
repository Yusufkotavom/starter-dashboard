import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface IntegrationIdentity {
  apiKeyId: number;
  organizationId: string | null;
  scopes: string[];
  name: string;
  keyPrefix: string;
}

function normalizeApiKey(value: string): string {
  return value.trim();
}

export function hashIntegrationApiKey(value: string): string {
  return crypto.createHash('sha256').update(normalizeApiKey(value)).digest('hex');
}

export function extractIntegrationApiKey(request: NextRequest): string | null {
  const bearer = request.headers.get('authorization');
  if (bearer?.startsWith('Bearer ')) {
    const token = bearer.slice('Bearer '.length).trim();
    return token || null;
  }

  const header = request.headers.get('x-api-key')?.trim();
  return header || null;
}

export async function authenticateIntegrationRequest(
  request: NextRequest
): Promise<IntegrationIdentity | null> {
  const rawApiKey = extractIntegrationApiKey(request);
  if (!rawApiKey) {
    return null;
  }

  const keyHash = hashIntegrationApiKey(rawApiKey);
  const apiKey = await prisma.integrationApiKey.findFirst({
    where: {
      keyHash,
      isActive: true
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      keyPrefix: true,
      scopes: true
    }
  });

  if (!apiKey) {
    return null;
  }

  await prisma.integrationApiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date()
    }
  });

  return {
    apiKeyId: apiKey.id,
    organizationId: apiKey.organizationId ?? null,
    scopes: apiKey.scopes,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix
  };
}

export function hasIntegrationScope(identity: IntegrationIdentity, scope: string): boolean {
  return identity.scopes.includes('*') || identity.scopes.includes(scope);
}
