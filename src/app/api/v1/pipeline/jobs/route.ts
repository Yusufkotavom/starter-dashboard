import { NextRequest } from 'next/server';
import { Prisma, type PipelineJobStatus, type PipelineJobType } from '@/lib/prisma-client';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { executePipelineJob, updatePipelineJobStatus } from '@/lib/integration-runtime';
import { prisma } from '@/lib/prisma';

const PIPELINE_JOB_TYPES = [
  'CREATE_CLIENT',
  'CREATE_QUOTATION',
  'CREATE_INVOICE',
  'SEND_WHATSAPP_MESSAGE',
  'ATTACH_CONVERSATION_CLIENT'
] as const satisfies readonly PipelineJobType[];

const PIPELINE_JOB_STATUSES = [
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED'
] as const satisfies readonly PipelineJobStatus[];

function mapPipelineJob(record: {
  id: number;
  externalId: string | null;
  type: string;
  status: string;
  input: Prisma.JsonValue | null;
  output: Prisma.JsonValue | null;
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

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'pipeline:read',
    handler: async ({ requestId, organizationId, identity }) => {
      const { searchParams } = request.nextUrl;
      const page = Number(searchParams.get('page') ?? 1);
      const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
      const status = searchParams.get('status');
      const type = searchParams.get('type');
      const skip = (page - 1) * limit;

      const where = {
        organizationId,
        apiKeyId: identity.apiKeyId,
        ...(status && PIPELINE_JOB_STATUSES.includes(status as PipelineJobStatus)
          ? { status: status as PipelineJobStatus }
          : {}),
        ...(type && PIPELINE_JOB_TYPES.includes(type as PipelineJobType)
          ? { type: type as PipelineJobType }
          : {})
      };

      const [items, total] = await Promise.all([
        prisma.pipelineJob.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit
        }),
        prisma.pipelineJob.count({ where })
      ]);

      return integrationSuccess(requestId, {
        items: items.map(mapPipelineJob),
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
    scope: 'pipeline:write',
    handler: async ({ requestId, organizationId, identity }) => {
      const body = (await request.json().catch(() => null)) as {
        type?: PipelineJobType;
        input?: Prisma.JsonValue | null;
        externalId?: string | null;
      } | null;

      if (!body?.type) {
        return integrationError(requestId, 'INVALID_PIPELINE_PAYLOAD', 'type is required', 400);
      }

      if (!PIPELINE_JOB_TYPES.includes(body.type)) {
        return integrationError(
          requestId,
          'INVALID_PIPELINE_TYPE',
          `Unsupported pipeline type: ${body.type}`,
          400
        );
      }

      const job = await prisma.pipelineJob.create({
        data: {
          organizationId,
          apiKeyId: identity.apiKeyId,
          externalId: body.externalId?.trim() || null,
          type: body.type,
          status: 'PENDING',
          input: body.input === null ? Prisma.JsonNull : (body.input ?? undefined)
        }
      });

      await updatePipelineJobStatus({
        jobId: job.id,
        status: 'RUNNING'
      });

      try {
        const output = await executePipelineJob({
          type: body.type,
          input: body.input ?? null,
          organizationId
        });

        const updated = await updatePipelineJobStatus({
          jobId: job.id,
          status: 'SUCCEEDED',
          output: output as unknown as Prisma.JsonValue
        });

        return integrationSuccess(
          requestId,
          {
            job: mapPipelineJob(updated),
            result: output
          },
          { status: 201 }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Pipeline job failed';
        const updated = await updatePipelineJobStatus({
          jobId: job.id,
          status: 'FAILED',
          errorMessage: message
        });

        return integrationSuccess(
          requestId,
          {
            job: mapPipelineJob(updated),
            result: null
          },
          { status: 202 }
        );
      }
    }
  });
}
