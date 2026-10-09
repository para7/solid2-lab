// The server middleware chain (wired via `start.middleware` in
// vite.config.ts): `(event, next)` functions fronting every request the server
// dispatches — page renders, server function calls, and API routes alike.
// Each runs inside the request-event scope, so getRequestEvent() (and the
// session helpers built on it) work here exactly as in application code.
import type { StartMiddleware } from '@solidjs/vite-plugin';
import { createAPIHandler } from 'filesystem-routing/api';
import routes from 'virtual:file-routes';

const csp: StartMiddleware = async (event, next) => {
  const nonce = crypto.randomUUID();
  event.nonce = nonce;
  const response = await next();
  // Not on every response: CSP only governs documents.
  if (response.headers.get('content-type')?.startsWith('text/html')) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; '),
    );
  }
  return response;
};

// createAPIHandler serves the GET/POST/... exports of route modules
// (see src/routes/api) and passes everything else down the chain.
// filesystem-routing 0.4.0 is still request-first `(request, next)`.
const api = createAPIHandler(routes);

export default [csp, (event, next) => api(event.request, next)] satisfies StartMiddleware[];
