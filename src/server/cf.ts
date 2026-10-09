// WARNING: probe code for docs/migration-checklist.md. Anyone can trigger R2
// writes and emails, and read any R2 key via /api/cf?key=. Delete it (with
// src/lib/cf.ts, src/routes/cf.tsx, src/routes/api/cf.ts) before deploying.
import 'server-only';
import { env, waitUntil } from 'cloudflare:workers';
import { EmailMessage } from 'cloudflare:email';

export async function probeBindings(surface: string) {
  const key = `probe/${surface}`;

  const d1 = await env.DB.prepare('select 1 as one').first('one');
  await env.BUCKET.put(key, surface);
  const r2 = await (await env.BUCKET.get(key))?.text();

  const deferredKey = `${key}/deferred`;
  waitUntil(
    new Promise((r) => setTimeout(r, 500)).then(() =>
      env.BUCKET.put(deferredKey, new Date().toISOString()),
    ),
  );

  const raw = [
    'From: noreply@example.com',
    'To: me@example.com',
    `Subject: probe ${surface}`,
    `Message-ID: <${crypto.randomUUID()}@example.com>`,
    'Content-Type: text/plain',
    '',
    'hello',
  ].join('\r\n');
  await env.EMAIL.send(new EmailMessage('noreply@example.com', 'me@example.com', raw));

  return { surface, d1, r2, email: 'sent', deferredKey };
}

export async function readKey(key: string) {
  return (await env.BUCKET.get(key))?.text() ?? null;
}
