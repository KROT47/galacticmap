import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const image = process.env.TEST_IMAGE ? await readFile(process.env.TEST_IMAGE) : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a5kAAAAASUVORK5CYII=', 'base64');
const transport = new StdioClientTransport({ command: process.execPath, args: ['--import', './scripts/mcp-image-fetch-stub.mjs', 'mcp-server/index.mjs'], env: { ...process.env, GALACTICBOARD_URL: 'http://test.invalid', GALACTICBOARD_TOKEN: 'test' } });
const client = new Client({ name: 'image-test', version: '1.0.0' });
try {
  await client.connect(transport);
  const call = arguments_ => client.callTool({ name: 'add_image', arguments: { boardId: 'board', ...arguments_ } });
  const result = await call({ dataBase64: image.toString('base64'), alt: 'test' });
  assert.equal(result.isError, undefined, JSON.stringify(result));
  assert.equal(JSON.parse(result.content[0].text).assetId, createHash('sha256').update(image).digest('hex'));
  assert.equal(JSON.parse(result.content[0].text).nodeId, 'node');
  if (process.env.TEST_IMAGE) {
    const legacy = await call({ source: process.env.TEST_IMAGE });
    assert.equal(legacy.isError, undefined, JSON.stringify(legacy));
    assert.equal(JSON.parse(legacy.content[0].text).assetId, createHash('sha256').update(image).digest('hex'));
  }
  for (const args of [{}, { source: '/unused', dataBase64: 'YQ==' }, { dataBase64: '!!!!' }, { dataBase64: '' }, { dataBase64: 'YQ' }, { dataBase64: 'YR==' }, { dataBase64: 'A'.repeat(13981020) }]) {
    const failure = await call(args);
    assert.equal(failure.isError, true, JSON.stringify(args).slice(0, 100));
  }
  console.log(`MCP image tests passed (${image.length} source bytes)`);
} finally {
  await client.close();
}
