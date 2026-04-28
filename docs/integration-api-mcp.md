# Integration API + MCP (API Key)

## Auth
Use either header:

- `Authorization: Bearer <api_key>`
- `x-api-key: <api_key>`

All integration endpoints are under `/api/v1/*` and return envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "requestId": "uuid"
}
```

## Scope list
- `clients:read`, `clients:write`
- `quotations:read`, `quotations:write`
- `invoices:read`, `invoices:write`
- `projects:read`, `projects:write`
- `payments:read`, `payments:write`
- `products:read`, `products:write`
- `categories:read`, `categories:write`
- `subscription-plans:read`, `subscription-plans:write`
- `client-subscriptions:read`, `client-subscriptions:write`
- `communications:write`, `communications:attach`
- `pipeline:read`, `pipeline:write`
- `settings:read`, `settings:write`
- `*` (full access)

## Key management endpoints
- `GET /api/settings/integration-keys`
- `POST /api/settings/integration-keys`
- `PATCH /api/settings/integration-keys/:id` (update name/scopes/active)
- `DELETE /api/settings/integration-keys/:id` (deactivate)
- `POST /api/settings/integration-keys/:id` with body `{ "action": "rotate" }`

## v1 endpoint groups
- `clients`
- `quotations`
- `invoices`
- `communications`
- `pipeline/jobs`
- `products`
- `categories`
- `projects`
- `payments`
- `subscriptions/plans`
- `subscriptions/client-subscriptions`
- `settings`

## MCP server (native in repo)
Server script: `scripts/mcp-integration-server.mjs`

Required env:

```bash
export INTEGRATION_API_BASE_URL="https://your-host"
export INTEGRATION_API_KEY="sdk_live_xxx"
npm run mcp:integration
```

Exposed MCP tools:
- `clients_list`
- `clients_create`
- `invoices_create`
- `quotations_create`
- `communications_send`
- `pipeline_create_job`
- `pipeline_get_job`

## Quick curl smoke test

```bash
curl -sS "$BASE/api/v1/clients?page=1&limit=5" \
  -H "Authorization: Bearer $API_KEY" | jq
```
