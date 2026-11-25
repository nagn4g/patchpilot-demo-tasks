// create.test.js — MOBL-60: POST /tasks must honour the status field.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server.js');

test('POST /tasks honours the status field', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write video script', status: 'done' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.status, 'done');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
