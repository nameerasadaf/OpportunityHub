import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function localApiDevPlugin() {
  return {
    name: 'local-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const endpoint = url.pathname;

        res.status = function (code) {
          this.statusCode = code;
          return this;
        };

        res.json = function (data) {
          this.setHeader('Content-Type', 'application/json');
          this.end(JSON.stringify(data));
          return this;
        };

        try {
          if (endpoint === '/api/opportunities') {
            const { default: handler } = await server.ssrLoadModule('/api/opportunities.js');
            return await handler(req, res);
          }

          if (endpoint === '/api/gemini') {
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const rawBody = Buffer.concat(chunks).toString('utf8');
            try {
              req.body = rawBody ? JSON.parse(rawBody) : {};
            } catch {
              req.body = {};
            }

            const { default: handler } = await server.ssrLoadModule('/api/gemini.js');
            return await handler(req, res);
          }

          next();
        } catch (error) {
          console.error('Local API dev server error:', error);
          res.status(500).json({ error: error.message || 'Internal server error in dev' });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of Object.keys(env)) {
    if (!process.env[key]) {
      process.env[key] = env[key];
    }
  }

  return {
    plugins: [react(), localApiDevPlugin()],
  };
});
