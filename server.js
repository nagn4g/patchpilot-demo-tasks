// patchpilot-demo-tasks — tiny in-memory task API used as the PatchPilot demo target.
// Run: npm start (listens on PORT, default 3000). No dependencies, no database.
'use strict';

const http = require('node:http');

const { tasks, findTask } = require('./lib/tasks.js');

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function listTasks(page, limit) {
  const start = (page - 1) * limit;
  const data = tasks.slice(start, start + limit + 1);
  return { page, limit, total: tasks.length, data };
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/tasks') {
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
      const limit = Math.max(1, Number(url.searchParams.get('limit')) || 10);
      return sendJson(res, 200, listTasks(page, limit));
    }

    if (req.method === 'GET' && url.pathname.startsWith('/tasks/')) {
      const id = Number(url.pathname.split('/')[2]);
      const task = findTask(id);
      return sendJson(res, 200, task);
    }

    if (req.method === 'POST' && url.pathname === '/tasks') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const task = {
            id: tasks.length + 1,
            title: parsed.title || `Task ${tasks.length + 1}`,
            status: 'open',
          };
          tasks.push(task);
          sendJson(res, 201, task);
        } catch {
          sendJson(res, 400, { error: 'invalid json' });
        }
      });
      return;
    }

    return sendJson(res, 404, { error: 'not found' });
  });
}

if (require.main === module) {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  createServer().listen(port, () => {
    console.log(`patchpilot-demo-tasks listening on :${port}`);
  });
}

module.exports = { createServer, tasks };
