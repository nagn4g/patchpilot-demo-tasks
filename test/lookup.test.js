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

test('unknown id returns 404', async () => {
  const res = await fetch(`${base}/tasks/999`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'not found' });
});

test('known id returns that task', async () => {
  const res = await fetch(`${base}/tasks/3`);
  assert.equal(res.status, 200);
  const task = await res.json();
  assert.equal(task.id, 3);
  assert.equal(task.title, 'Task 3');
});
