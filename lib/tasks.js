// patchpilot-demo-tasks — task store + lookup helper.
'use strict';

// Deterministic seed data: 12 tasks, stable ids, ordered by id.
const tasks = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: `Task ${i + 1}`,
  status: i % 3 === 0 ? 'done' : 'open',
}));

// BUG (MOBL-59): when no task matches, this returns the LAST task instead
// of undefined, so the API answers 200 with the wrong task.
function findTask(id) {
  return tasks.find((t) => t.id === id) || tasks[tasks.length - 1];
}

module.exports = { tasks, findTask };
