import { createHash } from 'node:crypto';

globalThis.fetch = async (url, options) => {
  if (String(url).endsWith('/assets')) {
    const hash = createHash('sha256').update(options.body).digest('hex');
    return Response.json({ assetId: hash, width: 100, height: 50 });
  }
  if (String(url).endsWith('/changes')) {
    const body = JSON.parse(options.body);
    if (!body.ops[0].data.assetId) throw new Error('Missing asset ID');
    return Response.json({ refs: { img: 'node' } });
  }
  throw new Error(`Unexpected URL: ${url}`);
};
