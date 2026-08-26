# Kevin Hoang Real Estate — kevinhoang.co

Marketing site and lightweight CRM for a Needham, MA real estate agent.
Vite + React 18 + TypeScript + Tailwind, Supabase for auth/data/storage,
deployed to Vercel.

**The public site is statically generated, not a client-only SPA.** Every route
is prerendered to HTML at build time by `vite-react-ssg` so that crawlers and AI
search engines — which mostly do not execute JavaScript — see real content and
real per-page meta tags.

## Getting started

```sh
npm install
npm run dev          # http://localhost:8080
```

Or without a local Node install:

```sh
docker compose up app
```

Copy `.env` from the team vault; the frontend needs `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on :8080 |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run build` | typecheck → prerender all routes → write `sitemap.xml` and `llms.txt` |
| `npm run build:spa` | plain `vite build`; **not** what ships — no prerendering |
| `npm run preview` | serve the built bundle |
| `npm run lint` | eslint |
| `node scripts/generate-icons.mjs` | regenerate favicons and `og-image.jpg` |
| `node scripts/generate-blog-redirects.mjs` | rewrite the retired-blog 301s in `vercel.json` |

## Adding a route

A route needs to be registered in **three** places or something breaks quietly:

1. [`src/AppRoutes.tsx`](src/AppRoutes.tsx) — the router and the prerender set.
2. [`scripts/routes.mjs`](scripts/routes.mjs) — the sitemap registry.
3. Confirm `dist/<route>/index.html` exists after `npm run build`.

Vercel checks the filesystem before applying rewrites and there is no SPA
fallback, so **a route that isn't prerendered returns a real 404 on hard
refresh** even though in-app navigation to it works.

## Where things live

| Concern | File |
| --- | --- |
| Identity, NAP, GA4/GSC IDs, towns served | [`src/lib/siteConfig.ts`](src/lib/siteConfig.ts) |
| All head tags (title, canonical, OG, JSON-LD) | [`src/components/Seo.tsx`](src/components/Seo.tsx) |
| JSON-LD builders | [`src/lib/schema.ts`](src/lib/schema.ts) |
| Route registry for the sitemap | [`scripts/routes.mjs`](scripts/routes.mjs) |
| Blog corpus and related-post ranking | [`src/data/blogData.ts`](src/data/blogData.ts) |
| Town guides | [`src/data/neighborhoodData.ts`](src/data/neighborhoodData.ts), [`src/pages/NeighborhoodDetail.tsx`](src/pages/NeighborhoodDetail.tsx) |
| Routing, redirects, cache headers | [`vercel.json`](vercel.json) |

Phone, email, and address come from `siteConfig.ts` everywhere — they must match
the Google Business Profile character-for-character.

## Before you change anything

Read [CLAUDE.md](CLAUDE.md). It documents the static-generation invariants, the
SEO conventions, and the content rules — each of which is written down because
breaking it caused a real bug on this site.

Other setup docs: [ADMIN_SETUP.md](ADMIN_SETUP.md), [ENV_SETUP.md](ENV_SETUP.md),
[DOCKER_README.md](DOCKER_README.md), [CRM_README.md](CRM_README.md).

## Deployment

Pushes to `main` deploy through Vercel, which runs `npm run build`. The build
fails on a type error by design.

After a domain or content change, remember the off-site half: submit
`https://kevinhoang.co/sitemap.xml` in Google Search Console, verify in Bing
Webmaster Tools, and keep the Google Business Profile listing in sync with
`siteConfig.ts`.
