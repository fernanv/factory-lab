# factory-lab

Synthetic notes API used to exercise an automated Issue → PR → CI → review flow. No real data, no dependencies.

```sh
npm test     # Node >= 22.18 runs the TypeScript directly
npm start    # http://localhost:3000
```

| Route | Behaviour |
|---|---|
| `GET /notes?limit=N` | newest first, at most `limit` notes (default 20) |
| `POST /notes` | body `{ "title", "body" }` → 201 with the note |
| `GET /notes/:id` | 200 with the note, or 404 |
| `DELETE /notes/:id` | 204, or 404 |

`main` is protected: changes arrive by pull request, with CI green and the owner's approval.
