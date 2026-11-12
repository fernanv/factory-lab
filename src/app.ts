import { NoteStore } from './notes.ts';

export type Request = { method: string; path: string; query?: Record<string, string>; body?: unknown };
export type Response = { status: number; body?: unknown };

const error = (status: number, code: string): Response => ({ status, body: { error: code } });

/** The whole API as a pure function, so it can be tested without a socket. */
export function handle(store: NoteStore, req: Request): Response {
  const [, resource, rawId, ...rest] = req.path.split('/');
  if (resource !== 'notes' || rest.length > 0) return error(404, 'not_found');

  if (rawId === undefined || rawId === '') {
    if (req.method === 'GET') {
      const limit = req.query?.limit === undefined ? 20 : Number(req.query.limit);
      return { status: 200, body: store.list(limit) };
    }
    if (req.method === 'POST') {
      const input = req.body as { title?: unknown; body?: unknown } | null;
      if (!input || typeof input !== 'object' || typeof input.title !== 'string') return error(400, 'invalid_note');
      const title = input.title.trim();
      if (title === '') return error(400, 'invalid_note');
      const body = typeof input.body === 'string' ? input.body : '';
      return { status: 201, body: store.add(title, body) };
    }
    return error(405, 'method_not_allowed');
  }

  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return error(404, 'not_found');
  if (req.method === 'GET') {
    const note = store.get(id);
    return note ? { status: 200, body: note } : error(404, 'not_found');
  }
  if (req.method === 'DELETE') {
    store.remove(id);
    return { status: 204 };
  }
  return error(405, 'method_not_allowed');
}
