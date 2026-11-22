// scripts/publish-repro.js — runs ONLY when the test step fails (the
// workflow gates it with `if: failure()`).
// Reads the test output saved by the test step, pulls out the failing
// assertion lines, and publishes them as a "repro" check run on the head
// commit — so PatchPilot can read the failure through the GitHub API
// (raw job logs redirect off api.github.com and cannot be fetched).
'use strict';

const fs = require('node:fs');

const MAX_TEXT_CHARS = 6000;

async function main() {
  const outputPath = process.argv[2] || 'test-output.txt';
  let raw = '';
  try {
    raw = fs.readFileSync(outputPath, 'utf8');
  } catch {
    raw = '';
  }

  // node --test prints TAP: failing tests show as "not ok <n> — <name>",
  // followed by assertion details ("Expected", "Actual", "AssertionError").
  // Keep the failing lines plus a little context around them.
  const lines = raw.split('\n');
  const keep = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/not ok|AssertionError|Expected|Actual/i.test(line)) {
      for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 6); j++) {
        if (!keep.includes(lines[j])) keep.push(lines[j]);
      }
    }
  }
  const evidence = (keep.length ? keep.join('\n') : raw.slice(-3000)).slice(0, MAX_TEXT_CHARS);

  const token = process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const sha = process.env.GITHUB_SHA;
  if (!token || !repo || !sha) {
    console.error('publish-repro: missing GH_TOKEN, GITHUB_REPOSITORY, or GITHUB_SHA; printing evidence instead.');
    console.log(evidence);
    return;
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/check-runs`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'patchpilot-demo-tasks',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'repro',
      head_sha: sha,
      status: 'completed',
      conclusion: 'failure',
      output: {
        title: 'Pagination bug reproduced',
        summary: 'The pagination tests failed on this commit. The failing assertion is in the text below.',
        text: evidence || '(no failing lines found in the test output)',
      },
    }),
  });
  if (!response.ok) {
    console.error(`publish-repro: check-runs API returned ${response.status}`);
    console.log(evidence);
    return;
  }
  console.log('publish-repro: "repro" check run created.');
}

main().catch((error) => {
  console.error(`publish-repro: ${error.message}`);
});
