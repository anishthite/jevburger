import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { orderFromAnswers, orderQuestions, type OrderAnswers } from './src/jev/orders';

type BrowserKey = { provider: 'openrouter' | 'typesafe'; key: string };
type RequestBody = { text?: string; state?: unknown; questions?: { action?: { criteria?: Record<string, string> } }; key?: BrowserKey };

function jevServer(env: Record<string, string>): Plugin {
  const configured = Boolean(env.TYPESAFE_API_KEY || env.OPENROUTER_API_KEY);
  let client: TypeSafeClient | undefined;

  async function ask(state: unknown, questions: Record<string, unknown>, key?: BrowserKey): Promise<OrderAnswers> {
    const openRouterKey = env.TYPESAFE_API_KEY ? '' : env.OPENROUTER_API_KEY || (key?.provider === 'openrouter' ? key.key : '');
    if (openRouterKey) {
      const response = await fetch('https://openrouter.ai/api/alpha/decisions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'X-Title': 'Jevburger' },
        body: JSON.stringify({ model: env.JEV_MODEL || '~typesafe/jev-latest', state, questions }),
        signal: AbortSignal.timeout(30_000),
      });
      const result = await response.json() as { answers?: OrderAnswers; error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message || `OpenRouter returned ${response.status}`);
      if (!result.answers) throw new Error('Jev returned no answers');
      return result.answers;
    }
    const apiKey = env.TYPESAFE_API_KEY || (key?.provider === 'typesafe' ? key.key : '');
    if (!apiKey) throw new Error('Connect a TypeSafe or OpenRouter key to use Jev');
    const sdk = env.TYPESAFE_API_KEY ? (client ??= new TypeSafeClient({ apiKey, timeout: 30_000 })) : new TypeSafeClient({ apiKey, timeout: 30_000 });
    const result = await sdk.systemOne({ state: state as never, questions: questions as never });
    return result.answers as OrderAnswers;
  }

  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url?.split('?')[0];
    if (!['/api/config', '/api/decide', '/api/parse'].includes(url ?? '')) return next();
    res.setHeader('Content-Type', 'application/json');
    if (url === '/api/config') { res.end(JSON.stringify({ configured })); return; }
    if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST required' })); return; }
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 24_000) throw new Error('Request too large');
      }
      const data = JSON.parse(body) as RequestBody;
      if (data.key && (!['openrouter', 'typesafe'].includes(data.key.provider) || typeof data.key.key !== 'string')) throw new Error('Invalid key');
      if (url === '/api/parse') {
        if (typeof data.text !== 'string' || !data.text.trim() || data.text.length > 180) throw new Error('Write one burger order (up to 180 characters)');
        const answers = await ask({ customer_said: data.text }, orderQuestions(data.text), data.key);
        orderFromAnswers(answers);
        res.end(JSON.stringify({ answers }));
      } else {
        const criteria = data.questions?.action?.criteria;
        if (!criteria || !Object.keys(criteria).length || Object.keys(criteria).length > 64 || !data.state) throw new Error('Invalid decision request');
        const answers = await ask(data.state, data.questions!, data.key);
        const id = answers.action?.choice;
        if (!id || !Object.hasOwn(criteria, id)) throw new Error('Jev returned an unavailable move');
        res.end(JSON.stringify({ id }));
      }
    } catch (error) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Jev request failed' }));
    }
  };
  return { name: 'jevburger-api', configureServer(server) { server.middlewares.use(handler); }, configurePreviewServer(server) { server.middlewares.use(handler); } };
}

export default defineConfig(({ mode }) => ({ plugins: [react(), jevServer(loadEnv(mode, process.cwd(), ''))] }));
