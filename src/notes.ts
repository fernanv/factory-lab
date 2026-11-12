export type Note = { id: number; title: string; body: string; createdAt: string };

export class NoteStore {
  notes: Note[] = [];
  nextId = 1;

  add(title: string, body: string, now: Date = new Date()): Note {
    const note = { id: this.nextId++, title, body, createdAt: now.toISOString() };
    this.notes.push(note);
    return note;
  }

  get(id: number): Note | undefined {
    return this.notes.find((n) => n.id === id);
  }

  /** Newest first. */
  list(limit: number): Note[] {
    return [...this.notes].reverse().slice(0, limit);
  }

  remove(id: number): boolean {
    const before = this.notes.length;
    this.notes = this.notes.filter((n) => n.id !== id);
    return this.notes.length < before;
  }
}
