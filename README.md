# patchpilot-demo-tasks

Tiny in-memory task API — the demo target for PatchPilot (Codegeist 2026).
It has one planted pagination bug, on purpose: the fix is PatchPilot's job.

## Run

- `npm start` — listens on `:3000` (override with `PORT`).
- `npm test` — pagination test suite. It FAILS on the current code (that's the point)
  and should PASS after the fix.

## API

- `GET /health` → `{ "ok": true }`
- `GET /tasks?page=1&limit=2` → `{ page, limit, total, data }`
- `GET /tasks/:id`
- `POST /tasks` with `{ "title": "..." }`

## Repro

```sh
curl 'http://localhost:3000/tasks?page=1&limit=2'
curl 'http://localhost:3000/tasks?page=2&limit=2'
```

Expected: 2 items per page, no id on more than one page.
Actual: page 1 returns 3 items, and its last item shows up again as the first
item of page 2.

## Notes

- No database, no secrets, no `.env`. Node >= 22.
- Do not fix the bug in this repo — the fix is demonstrated by PatchPilot.
