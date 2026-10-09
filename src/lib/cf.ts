// WARNING: unauthenticated probe — delete before deploying (see src/server/cf.ts).
import { action, query } from '@solidjs/router';

import { probeBindings } from '../server/cf';

export const getProbe = query(async () => {
  'use server';
  return probeBindings('query');
}, 'cf-probe');

export const runProbe = action(async () => {
  'use server';
  return probeBindings('action');
});
