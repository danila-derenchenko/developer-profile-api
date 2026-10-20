import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';

// Reproduce the loader's listen interception before importing the entrypoint:
// https://github.com/vercel/vercel/blob/main/packages/node/src/serverless-functions/serverless-handler.mts
const originalListen = http.Server.prototype.listen;
let server;
http.Server.prototype.listen = function () {
  server = this;
  http.Server.prototype.listen = originalListen;
  return this;
};

const timeout = setTimeout(() => {
  console.error('Entrypoint import hung while Vercel deferred listen()');
  process.exit(1);
}, 8_000);

try {
  await import('../../dist/src/main.js');
  assert.ok(server, 'The loader must capture the initialized HTTP server');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const endpoint = `http://127.0.0.1:${server.address().port}/graphql`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ profile { name skills { name } } }' }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.errors, undefined);
  assert.equal(body.data.profile.name, 'Test Developer');
  assert.deepEqual(body.data.profile.skills, [{ name: 'TypeScript' }, { name: 'NestJS' }]);
  const sandbox = await fetch(endpoint, { headers: { accept: 'text/html' } });
  assert.equal(sandbox.status, 200);
  assert.match(await sandbox.text(), /apollo/i);
} finally {
  clearTimeout(timeout);
  http.Server.prototype.listen = originalListen;
  server?.closeAllConnections();
  server?.close();
}
