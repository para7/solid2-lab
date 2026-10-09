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
    await writeFile(file, await res.text());
    console.log(`prerendered ${route} -> ${file}`);
  }
} finally {
  await server.close();
}
