#!/usr/bin/env node
import readline from 'node:readline';

const baseUrl = process.env.INTEGRATION_API_BASE_URL;
const apiKey = process.env.INTEGRATION_API_KEY;

if (!baseUrl || !apiKey) {
  console.error('Missing INTEGRATION_API_BASE_URL or INTEGRATION_API_KEY');
  process.exit(1);
}

const tools = [
  {
    name: 'clients_list',
    description: 'List clients from integration API',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        limit: { type: 'number' },
        search: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'clients_create',
    description: 'Create a client',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        address: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['name', 'email'],
      additionalProperties: true
    }
  },
  {
    name: 'invoices_create',
    description: 'Create an invoice',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'number' },
        projectId: { type: 'number' },
        status: { type: 'string' },
        total: { type: 'number' },
        dueDate: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['clientId'],
      additionalProperties: true
    }
  },
  {
    name: 'quotations_create',
    description: 'Create a quotation',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'number' },
        serviceIds: { type: 'array', items: { type: 'number' } },
        status: { type: 'string' },
        total: { type: 'number' },
        validUntil: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['clientId'],
      additionalProperties: true
    }
  },
  {
    name: 'communications_send',
    description: 'Send outbound message via WhatsApp integration',
    inputSchema: {
      type: 'object',
      properties: {
        phone: { type: 'string' },
        conversationId: { type: 'number' },
        body: { type: 'string' },
        attachmentUrl: { type: 'string' },
        attachmentName: { type: 'string' },
        documentUrl: { type: 'string' }
      },
      required: ['body'],
      additionalProperties: true
    }
  },
  {
    name: 'pipeline_create_job',
    description: 'Create pipeline job for agent orchestration',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        input: { type: 'object' },
        externalId: { type: 'string' }
      },
      required: ['type'],
      additionalProperties: true
    }
  },
  {
    name: 'pipeline_get_job',
    description: 'Fetch pipeline job by id or externalId',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id'],
      additionalProperties: false
    }
  },
  {
    name: 'docs_list',
    description: 'List docs',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        limit: { type: 'number' },
        search: { type: 'string' },
        projectId: { type: 'number' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'docs_create',
    description: 'Create doc',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number' },
        type: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' }
      },
      required: ['title'],
      additionalProperties: true
    }
  },
  {
    name: 'tasks_list',
    description: 'List project tasks',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        limit: { type: 'number' },
        projectId: { type: 'number' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'tasks_create',
    description: 'Create task',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number' },
        title: { type: 'string' },
        description: { type: 'string' },
        artifactType: { type: 'string' },
        artifactPath: { type: 'string' },
        docId: { type: 'number' },
        assignee: { type: 'string' },
        priority: { type: 'string' }
      },
      required: ['title'],
      additionalProperties: true
    }
  }
];

async function callIntegration(method, path, payload, query) {
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && String(value).length > 0) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: payload ? JSON.stringify(payload) : undefined
  });

  const json = await response.json().catch(() => ({ success: false, error: { message: 'Invalid JSON' } }));
  return {
    status: response.status,
    ok: response.ok,
    data: json
  };
}

async function handleToolCall(name, args = {}) {
  switch (name) {
    case 'clients_list':
      return callIntegration('GET', '/api/v1/clients', null, args);
    case 'clients_create':
      return callIntegration('POST', '/api/v1/clients', args);
    case 'invoices_create':
      return callIntegration('POST', '/api/v1/invoices', args);
    case 'quotations_create':
      return callIntegration('POST', '/api/v1/quotations', args);
    case 'communications_send':
      return callIntegration('POST', '/api/v1/communications/send', args);
    case 'pipeline_create_job':
      return callIntegration('POST', '/api/v1/pipeline/jobs', args);
    case 'pipeline_get_job':
      return callIntegration('GET', `/api/v1/pipeline/jobs/${encodeURIComponent(String(args.id || ''))}`);
    case 'docs_list':
      return callIntegration('GET', '/api/v1/docs', null, args);
    case 'docs_create':
      return callIntegration('POST', '/api/v1/docs', args);
    case 'tasks_list':
      return callIntegration('GET', '/api/v1/tasks', null, args);
    case 'tasks_create':
      return callIntegration('POST', '/api/v1/tasks', args);
    default:
      return {
        status: 400,
        ok: false,
        data: {
          success: false,
          error: { code: 'TOOL_NOT_FOUND', message: `Unknown tool: ${name}` }
        }
      };
  }
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', async (line) => {
  if (!line.trim()) return;

  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  const { id, method, params } = message;

  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'integration-api-mcp', version: '1.0.0' },
          capabilities: { tools: {} }
        }
      });
      return;
    }

    if (method === 'tools/list') {
      send({ jsonrpc: '2.0', id, result: { tools } });
      return;
    }

    if (method === 'tools/call') {
      const result = await handleToolCall(params?.name, params?.arguments ?? {});
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        }
      });
      return;
    }

    send({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${String(method)}` }
    });
  } catch (error) {
    send({
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: error instanceof Error ? error.message : 'Internal error' }
    });
  }
});
