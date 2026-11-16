// Serves <dir>/index.html for directory URLs ("/" and "*/").
// Only invoked for those paths (run_worker_first in wrangler.jsonc); every
// other request is served straight from static assets, with .html URLs kept as-is.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/")) {
      const res = await env.ASSETS.fetch(new Request(new URL(url.pathname + "index.html" + url.search, url), request));
      if (res.status !== 404) return res;
    }
    return env.ASSETS.fetch(request);
  },
};
