import { createServer } from 'node:http';
import { handle } from './app.ts';
import { NoteStore } from './notes.ts';

const store = new NoteStore();
const MAX_BODY = 64 * 1024;

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > MAX_BODY) req.destroy();
  });
  req.on('end', () => {
    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'invalid_json' }));
      return;
    }
    const out = handle(store, {
      method: req.method ?? 'GET',
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body,
    });
    res.writeHead(out.status, { 'content-type': 'application/json' });
    res.end(out.body === undefined ? undefined : JSON.stringify(out.body));
  });
}).listen(Number(process.env.PORT ?? 3000), '127.0.0.1');
