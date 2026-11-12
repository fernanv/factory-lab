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

test('refuses malformed requests', () => {
  const store = new NoteStore();
  assert.equal(handle(store, { method: 'POST', path: '/notes', body: { body: 'no title' } }).status, 400);
  assert.equal(handle(store, { method: 'POST', path: '/notes', body: null }).status, 400);
  assert.equal(handle(store, { method: 'GET', path: '/notes/abc' }).status, 404);
  assert.equal(handle(store, { method: 'GET', path: '/other' }).status, 404);
  assert.equal(handle(store, { method: 'PUT', path: '/notes' }).status, 405);
});
