import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { preview } from 'vite';

const routes = ['/about'];

const server = await preview({ preview: { port: 0, open: false } });
const base = server.resolvedUrls!.local[0]!;
try {
  for (const route of routes) {
    // manual: a redirect must fail the build, not write the target's HTML here.
    const res = await fetch(new URL(route.slice(1), base), { redirect: 'manual' });
    if (!res.ok) throw new Error(`prerender ${route}: ${res.status}`);
    // `about.html` rather than `about/index.html`: the asset layer's default
    // html_handling would redirect /about to /about/ for the latter.
    const file = `dist/client${route === '/' ? '/index' : route}.html`;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, withHashCsp(await res.text(), res.headers.get('content-security-policy') ?? '', route));
    console.log(`prerendered ${route} -> ${file}`);
  }
} finally {
  await server.close();
}

// A baked nonce would be reused by every visitor, so swap it for hashes.
// <meta> CSP ignores frame-ancestors. Not right after <head>: hydration claims
// head children by position, so an extra leading node breaks it silently.
// Throws rather than writing a page that would ship without a working CSP.
function withHashCsp(html: string, policy: string, route: string) {
  const nonce = policy.match(/'nonce-([^']*)'/)?.[1];
  const at = html.indexOf('<script');
  if (!nonce || at < 0 || at > html.indexOf('</head>')) {
    throw new Error(`prerender ${route}: no nonce in the CSP, or no <script> in <head>`);
  }
  html = html.replaceAll(` nonce="${nonce}"`, '');
  const hashes = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    ([, body]) => `'sha256-${createHash('sha256').update(body!).digest('base64')}'`,
  );
  const meta = policy
    .replace(`'nonce-${nonce}'`, hashes.join(' '))
    .replace(/; frame-ancestors [^;]*/, '');
  return html.replace('<script', `<meta http-equiv="Content-Security-Policy" content="${meta}"><script`);
}
