import { NextRequest } from 'next/server';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { attachIntegrationConversationClient } from '@/lib/integration-runtime';

export async function POST(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'communications:attach',
    handler: async ({ requestId, organizationId }) => {
      const body = (await request.json().catch(() => null)) as {
        conversationId?: number;
        clientId?: number;
      } | null;

      if (
        !body?.conversationId ||
        !Number.isInteger(body.conversationId) ||
        !body.clientId ||
        !Number.isInteger(body.clientId)
      ) {
        return integrationError(
          requestId,
          'INVALID_ATTACH_PAYLOAD',
          'conversationId and clientId are required',
          400
        );
      }

      const result = await attachIntegrationConversationClient(
        body.conversationId,
        body.clientId,
        organizationId
      );

      return integrationSuccess(requestId, result);
    }
  });
}
