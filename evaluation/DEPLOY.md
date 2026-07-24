# Deploying the demo (free)

The app is deployed as **one** service: Express serves the REST API *and* the
compiled React client from the same origin. That keeps the session cookie
same-site, so no CORS or cookie-domain configuration is needed anywhere.

```
npm run build   # installs server + client deps, builds client/dist
npm start       # node server/src/index.js, serves API + client on $PORT
```

## Render (recommended, no credit card)

1. Push this folder to a GitHub repository.
2. On https://render.com → **New → Web Service** → connect the repo.
3. Render reads `render.yaml` and fills everything in. If you create the
   service manually instead, use:

   | Setting | Value |
   | ------- | ----- |
   | Runtime | Node |
   | Build command | `npm install && npm run build` |
   | Start command | `npm start` |
   | Instance type | Free |
   | Env vars | `NODE_ENV=production`, `NODE_VERSION=22`, `SESSION_SECRET=<random string>` |

4. Deploy. The URL looks like `https://rs2-shopping-cart.onrender.com`.

Log in with `rs2user` / `Password`.

### Two things to know about the free instance

- **It sleeps after 15 minutes of idle time** and takes ~1 minute to wake up.
  Open the URL a couple of minutes before showing the demo so the first
  visitor doesn't stare at a loading page.
- **The filesystem is ephemeral.** `shopping-cart.sqlite` is recreated and
  re-seeded on every restart, so products always come back and baskets reset.
  For a demo that's fine; a persistent deployment would use a Render disk or
  swap SQLite for the managed Postgres.

## Docker (Fly.io, Koyeb, a VPS, anywhere)

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY . .
RUN npm install && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

## Not suitable

Vercel, Netlify and Cloudflare Pages run the backend as serverless functions:
`better-sqlite3` is a native module on a read-only filesystem there, and the
in-memory session store doesn't survive between invocations. The app needs a
long-running Node process.

## Changes made for deployment

- `server/src/app.js`: serves `client/dist` with an SPA fallback when the build
  exists; sets `trust proxy` and `cookie.secure` when `NODE_ENV=production`.
- root `package.json`: added `build` and `start` scripts, pinned Node >= 20.
- added `render.yaml`, `.node-version`, `.gitignore`.
