import { NextRequest } from 'next/server';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

function mapPipelineJob(record: {
  id: number;
  externalId: string | null;
  type: string;
  status: string;
  input: unknown;
  output: unknown;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    externalId: record.externalId,
    type: record.type,
    status: record.status,
    input: record.input,
    output: record.output,
    errorMessage: record.errorMessage,
    startedAt: record.startedAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'pipeline:read',
    handler: async ({ requestId, organizationId, identity }) => {
      const { id } = await params;
      const where = Number.isInteger(Number(id))
        ? {
            id: Number(id),
            organizationId,
            apiKeyId: identity.apiKeyId
          }
        : {
            externalId: id,
            organizationId,
            apiKeyId: identity.apiKeyId
          };

      const job = await prisma.pipelineJob.findFirst({
        where
      });

      if (!job) {
        return integrationError(requestId, 'PIPELINE_JOB_NOT_FOUND', `Job ${id} not found`, 404);
      }

      return integrationSuccess(requestId, mapPipelineJob(job));
    }
  });
}
