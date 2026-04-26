import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import {
  authenticateIntegrationRequest,
  hasIntegrationScope,
  type IntegrationIdentity
} from '@/lib/integration-auth';
import { prisma } from '@/lib/prisma';

export interface IntegrationSuccessEnvelope<T> {
  success: true;
  data: T;
  error: null;
  requestId: string;
}

export interface IntegrationErrorEnvelope {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
  requestId: string;
}

export interface IntegrationContext {
  identity: IntegrationIdentity;
  requestId: string;
  organizationId: string | null;
  request: NextRequest;
}

function jsonValueFromUnknown(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

async function logIntegrationRequest(args: {
  identity: IntegrationIdentity | null;
  requestId: string;
  organizationId: string | null;
  method: string;
  path: string;
  scope?: string;
  statusCode: number;
  success: boolean;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string;
}) {
  try {
    await prisma.integrationRequest.create({
      data: {
        organizationId: args.organizationId,
        apiKeyId: args.identity?.apiKeyId ?? null,
        requestId: args.requestId,
        method: args.method,
        path: args.path,
        scope: args.scope ?? null,
        statusCode: args.statusCode,
        success: args.success,
        requestBody: jsonValueFromUnknown(args.requestBody),
        responseBody: jsonValueFromUnknown(args.responseBody),
        errorMessage: args.errorMessage ?? null
      }
    });
  } catch {
    // Avoid failing the main request on audit logging issues.
  }
}

export function createIntegrationRequestId(): string {
  return crypto.randomUUID();
}

export function integrationSuccess<T>(
  requestId: string,
  data: T,
  init?: ResponseInit
): NextResponse<IntegrationSuccessEnvelope<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      requestId
    },
    init
  );
}

export function integrationError(
  requestId: string,
  code: string,
  message: string,
  status: number
): NextResponse<IntegrationErrorEnvelope> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message
      },
      requestId
    },
    { status }
  );
}

export async function withIntegrationAuth(args: {
  request: NextRequest;
  scope: string;
  handler: (context: IntegrationContext) => Promise<NextResponse>;
}) {
  const requestId = createIntegrationRequestId();
  const identity = await authenticateIntegrationRequest(args.request);
  const path = args.request.nextUrl.pathname;
  const method = args.request.method;

  if (!identity) {
    await logIntegrationRequest({
      identity: null,
      requestId,
      organizationId: null,
      method,
      path,
      scope: args.scope,
      statusCode: 401,
      success: false,
      errorMessage: 'Missing or invalid integration API key'
    });

    return integrationError(
      requestId,
      'UNAUTHORIZED',
      'Missing or invalid integration API key',
      401
    );
  }

  if (!hasIntegrationScope(identity, args.scope)) {
    await logIntegrationRequest({
      identity,
      requestId,
      organizationId: identity.organizationId,
      method,
      path,
      scope: args.scope,
      statusCode: 403,
      success: false,
      errorMessage: `Missing required scope: ${args.scope}`
    });

    return integrationError(requestId, 'FORBIDDEN', `Missing required scope: ${args.scope}`, 403);
  }

  try {
    const response = await args.handler({
      identity,
      requestId,
      organizationId: identity.organizationId,
      request: args.request
    });

    let responseBody: unknown = null;
    try {
      responseBody = await response.clone().json();
    } catch {
      responseBody = null;
    }

    await logIntegrationRequest({
      identity,
      requestId,
      organizationId: identity.organizationId,
      method,
      path,
      scope: args.scope,
      statusCode: response.status,
      success: response.ok,
      responseBody
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unhandled integration API error';

    await logIntegrationRequest({
      identity,
      requestId,
      organizationId: identity.organizationId,
      method,
      path,
      scope: args.scope,
      statusCode: 500,
      success: false,
      errorMessage: message
    });

    return integrationError(requestId, 'INTERNAL_ERROR', message, 500);
  }
}
