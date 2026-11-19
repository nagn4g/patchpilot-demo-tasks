'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server.js');

let base;
let server;

test.before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function getPage(page, limit) {
  const res = await fetch(`${base}/tasks?page=${page}&limit=${limit}`);
  assert.equal(res.status, 200);
  return res.json();
}

test('health endpoint answers', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('each page returns at most `limit` items', async () => {
  const p1 = await getPage(1, 2);
  assert.ok(
    p1.data.length <= 2,
    `page 1 returned ${p1.data.length} items, expected at most 2`
  );
});

test('ids are unique across pages and cover the full set', async () => {
  const seen = new Set();
  const totalPages = 6; // 12 tasks, limit 2
  for (let p = 1; p <= totalPages; p++) {
    const { data } = await getPage(p, 2);
    for (const t of data) {
      assert.ok(!seen.has(t.id), `task id ${t.id} appears on more than one page`);
      seen.add(t.id);
    }
  }
  assert.equal(seen.size, 12, `only ${seen.size} distinct ids across all pages`);
});
