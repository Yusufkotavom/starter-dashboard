import { NextRequest } from 'next/server';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { sendIntegrationWhatsAppMessage } from '@/lib/integration-runtime';

export async function POST(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'communications:write',
    handler: async ({ requestId, organizationId }) => {
      const body = (await request.json().catch(() => null)) as {
        phone?: string | null;
        conversationId?: number | null;
        body?: string;
        attachmentUrl?: string | null;
        attachmentName?: string | null;
        documentUrl?: string | null;
      } | null;

      if (!body?.body?.trim()) {
        return integrationError(requestId, 'INVALID_MESSAGE_PAYLOAD', 'body is required', 400);
      }

      const result = await sendIntegrationWhatsAppMessage(
        {
          phone: body.phone ?? null,
          conversationId: body.conversationId ?? null,
          body: body.body,
          attachmentUrl: body.attachmentUrl ?? null,
          attachmentName: body.attachmentName ?? null,
          documentUrl: body.documentUrl ?? null
        },
        organizationId
      );

      return integrationSuccess(requestId, result, { status: 201 });
    }
  });
}
