import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/app.ts';
import { NoteStore, type Note } from '../src/notes.ts';

test('creates a note and reads it back', () => {
  const store = new NoteStore();
  const created = handle(store, { method: 'POST', path: '/notes', body: { title: 'Buy milk', body: '2 l' } });
  assert.equal(created.status, 201);
  const note = created.body as Note;
  assert.equal(note.id, 1);
  assert.equal(note.title, 'Buy milk');
  assert.deepEqual(handle(store, { method: 'GET', path: '/notes/1' }), { status: 200, body: note });
});

test('lists newest first, limited', () => {
  const store = new NoteStore();
  for (const title of ['a', 'b', 'c']) handle(store, { method: 'POST', path: '/notes', body: { title } });
  const all = handle(store, { method: 'GET', path: '/notes' }).body as Note[];
  assert.deepEqual(all.map((n) => n.title), ['c', 'b', 'a']);
  const two = handle(store, { method: 'GET', path: '/notes', query: { limit: '2' } }).body as Note[];
  assert.deepEqual(two.map((n) => n.title), ['c', 'b']);
});

test('deletes a note', () => {
  const store = new NoteStore();
  handle(store, { method: 'POST', path: '/notes', body: { title: 'x' } });
  assert.equal(handle(store, { method: 'DELETE', path: '/notes/1' }).status, 204);
  assert.equal(handle(store, { method: 'GET', path: '/notes/1' }).status, 404);
});

test('C1: rejects empty or whitespace-only titles without storing', () => {
  const store = new NoteStore();
  for (const title of ['', '   ', '\t\n ']) {
    const res = handle(store, { method: 'POST', path: '/notes', body: { title, body: 'b' } });
    assert.deepEqual(res, { status: 400, body: { error: 'invalid_note' } });
  }
  assert.equal(store.notes.length, 0);
  assert.deepEqual(handle(store, { method: 'GET', path: '/notes' }).body, []);
});

test('C2: stored title is trimmed', () => {
  const store = new NoteStore();
  const created = handle(store, { method: 'POST', path: '/notes', body: { title: '  Buy milk \n' } });
  assert.equal(created.status, 201);
  assert.equal((created.body as Note).title, 'Buy milk');
  assert.equal((handle(store, { method: 'GET', path: '/notes/1' }).body as Note).title, 'Buy milk');
});

test('C3: valid notes keep working as before', () => {
  const store = new NoteStore();
  const created = handle(store, { method: 'POST', path: '/notes', body: { title: 'Plan', body: '  keep body  ' } });
  assert.equal(created.status, 201);
  const note = created.body as Note;
  assert.equal(note.id, 1);
  assert.equal(note.title, 'Plan');
  assert.equal(note.body, '  keep body  ');
  const noBody = handle(store, { method: 'POST', path: '/notes', body: { title: 'x' } });
  assert.equal(noBody.status, 201);
  assert.equal((noBody.body as Note).body, '');
  assert.equal(store.notes.length, 2);
});

test('refuses malformed requests', () => {
  const store = new NoteStore();
  assert.equal(handle(store, { method: 'POST', path: '/notes', body: { body: 'no title' } }).status, 400);
  assert.equal(handle(store, { method: 'POST', path: '/notes', body: null }).status, 400);
  assert.equal(handle(store, { method: 'GET', path: '/notes/abc' }).status, 404);
  assert.equal(handle(store, { method: 'GET', path: '/other' }).status, 404);
  assert.equal(handle(store, { method: 'PUT', path: '/notes' }).status, 405);
});
