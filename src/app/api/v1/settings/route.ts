import { NextRequest } from 'next/server';
import { getAppSettings, saveAppSettings } from '@/lib/app-settings';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'settings:read',
    handler: async ({ requestId }) => {
      const settings = await getAppSettings();
      return integrationSuccess(requestId, settings);
    }
  });
}

export async function PUT(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'settings:write',
    handler: async ({ requestId }) => {
      const body = (await request.json().catch(() => null)) as Awaited<
        ReturnType<typeof getAppSettings>
      > | null;

      if (!body) {
        return integrationError(requestId, 'INVALID_SETTINGS_PAYLOAD', 'Invalid payload', 400);
      }

      const settings = await saveAppSettings(body);
      return integrationSuccess(requestId, settings);
    }
  });
}
