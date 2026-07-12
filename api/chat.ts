import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

// Production counterpart to server/chatProxyPlugin.ts — that one is a Vite
// dev-server middleware and only exists while `vite dev` is running, so it
// has no effect on the static site Vercel actually deploys. This is the
// same /api/chat contract (and the same streaming logic), served as a
// Vercel serverless function instead, so ANTHROPIC_API_KEY still never
// reaches the browser bundle in production either.
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

interface ChatRequestBody {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const enabled = process.env.LLM_ENABLED !== 'false';

  if (!enabled) {
    res.status(503).json({ message: 'LLM replies are disabled (LLM_ENABLED=false)' });
    return;
  }
  if (!apiKey) {
    res.status(503).json({ message: 'LLM replies are disabled (ANTHROPIC_API_KEY is not set)' });
    return;
  }

  // Vercel auto-parses the body into req.body for application/json requests.
  const body = req.body as ChatRequestBody;

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
}
