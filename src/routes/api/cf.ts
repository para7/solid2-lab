// WARNING: unauthenticated probe — delete before deploying (see src/server/cf.ts).
import type { APIHandler } from 'filesystem-routing/api';

import { probeBindings, readKey } from '../../server/cf';

export const GET: APIHandler = async ({ request }) => {
  const key = new URL(request.url).searchParams.get('key');
  return Response.json(key ? { key, value: await readKey(key) } : await probeBindings('api'));
};
