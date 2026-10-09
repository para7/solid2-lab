// WARNING: unauthenticated probe — delete before deploying (see src/server/cf.ts).
import { createMemo } from 'solid-js';

import { getProbe, runProbe } from '../lib/cf';

export default function CF() {
  const probe = createMemo(() => getProbe());
  return (
    <section>
      <pre id="probe">{JSON.stringify(probe())}</pre>
      <form action={runProbe} method="post">
        <button type="submit">probe action</button>
      </form>
    </section>
  );
}
