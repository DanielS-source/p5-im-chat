import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

interface ChatRequestBody {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

/**
 * Dev-only proxy so the browser bundle never sees ANTHROPIC_API_KEY.
 * Disable independently of removing the key: set LLM_ENABLED=false in .env.
 */
export function chatProxyPlugin(): Plugin {
  return {
    name: 'phantom-chat-llm-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { message: 'method not allowed' });
          return;
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        const enabled = process.env.LLM_ENABLED !== 'false';

        if (!enabled) {
          sendJson(res, 503, { message: 'LLM replies are disabled (LLM_ENABLED=false in .env)' });
          return;
        }
        if (!apiKey) {
          sendJson(res, 503, { message: 'LLM replies are disabled (ANTHROPIC_API_KEY is not set in .env)' });
          return;
        }

        let body: ChatRequestBody;
        try {
          body = JSON.parse(await readBody(req));
        } catch {
          sendJson(res, 400, { message: 'invalid request body' });
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        const client = new Anthropic({ apiKey });

        try {
          const stream = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: body.system,
            messages: body.messages,
          });

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              res.write(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`);
            }
          }

          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown error';
          res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        }

        res.end();
      });
    },
  };
}
