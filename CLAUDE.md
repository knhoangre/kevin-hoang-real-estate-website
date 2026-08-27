# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Commands

```bash
npm run dev        # Vite dev server on :8080
npm run typecheck  # tsc -b --noEmit
npm run build      # typecheck, prerender every route, write sitemap.xml + llms.txt
npm run build:spa  # plain vite build — NOT what ships; skips prerendering
npm run preview    # serve the built bundle
npm run lint       # eslint

docker compose up app   # same dev server in a container

node scripts/generate-icons.mjs          # regenerate favicons + og-image.jpg
node scripts/generate-blog-redirects.mjs # rewrite the blog 301s in vercel.json
```

There is no Node toolchain required on the host if you use Docker:
`docker run --rm -v "$PWD":/app -w /app node:20-alpine npm run build`.

There is no test framework configured. The closest thing to one is the SEO auditor from the
`seo-web` skill, which checks the *built* output and exits non-zero on failure:

```bash
docker run --rm -v "$PWD":/app -v "$HOME/.claude/skills/seo-web/scripts":/skill:ro -w /app \
  node:20-alpine node /skill/seo-audit.mjs ./dist --origin https://kevinhoang.co \
  --private auth,admin,crm,profile,complete-profile,open-house,events
```

Run it after any change that touches routes, head tags, schema, or navigation. It has already
caught a defect that passed source review here (82 pages referencing a JSON-LD `@id` that was
only declared on the homepage).

## Architecture

Vite + React 18 + TypeScript for a Needham, MA real estate agent, deployed to
**Vercel**. Supabase provides auth, Postgres, and storage. There is no
application server of our own.

**This is statically generated, not a plain SPA.** `npm run build` runs
`vite-react-ssg`, which prerenders every route to HTML at build time (~122
pages). The client hydrates that HTML. This exists so crawlers that don't
execute JavaScript — social unfurlers, most AI crawlers — see real content and
real meta tags. Before this the site was a client-only SPA: every route served
the same near-empty shell with one identical set of meta tags.

**Entry point** ([src/main.tsx](src/main.tsx)): `ViteReactSSG({ routes })`. It
owns the router *and* the HelmetProvider, on both the client and the server.

**Layout** ([src/App.tsx](src/App.tsx)): the root layout route — providers,
`<Navbar/>`, `<Outlet/>`, `<Footer/>`. It deliberately contains **no
`BrowserRouter` and no `HelmetProvider`**; adding either nests them against the
generator's own and breaks head-tag collection at build time.

**Routing** ([src/AppRoutes.tsx](src/AppRoutes.tsx)): a `RouteRecord[]` array,
not JSX. Every route is code-split via `lazy`, which maps our default exports
onto react-router's expected `Component` named export. `entry` points at the
source file so per-route CSS resolves. `/blog/:slug` and `/neighborhoods/:slug`
use `getStaticPaths` to expand into one page per post/town, sourced from
`src/data/`.

### SSG invariants — each of these caused a real bug here

- **`ssgOptions.script` must stay `'defer'`.** Under `'async'` the app module can
  execute before the inline script that sets `window.__VITE_REACT_SSG_HASH__`, so
  it fetches `static-loader-data-manifest-undefined.json`, 404s, and hydration
  dies with React #418/#423 — intermittently, on whichever route loses the race.
- **[src/components/Seo.tsx](src/components/Seo.tsx) imports `Head` from
  `vite-react-ssg`**, never `Helmet` from `react-helmet-async`. `Head` wraps
  `Helmet`, but importing react-helmet-async directly yields a second module
  instance with its own React context, and head tags silently fail to register
  at build time.
- **[index.html](index.html) must contain no title/description/canonical/OG/
  Twitter tags.** The generator *prepends* its output rather than replacing, so
  anything declared there survives as a duplicate alongside the per-route
  version.
- **Nothing may read `window`/`localStorage` during render.**
  [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts) used
  to `throw` when `window` was undefined; since `AuthProvider` is in the root
  layout, that hard-crashed the generator on the first page. It now guards only
  the auth options.
- **i18n initialises with a fixed `lng: 'en'`, with no browser language
  detector.** The detector read `localStorage`/`navigator` at module scope, so
  the server rendered `en` while the client could first render `vi` — a
  hydration mismatch that discards the prerendered markup for the whole page.
  The stored preference is applied after mount by
  [LanguagePreference.tsx](src/components/LanguagePreference.tsx).
- **Private routes (auth/admin/crm/profile/events/open-house) ARE prerendered.**
  They're kept out of search by `noindex` (see
  [PrivatePage.tsx](src/components/PrivatePage.tsx)) and robots.txt, not by
  withholding HTML — excluding them makes Vercel's fallback serve the
  homepage's markup at those URLs, which hydrates against the wrong tree.
- **No nested `<a>` elements.** The parser auto-closes the outer one, so server
  markup can never match the client tree and hydration fails for the whole page.

### Routing / 404 model ([vercel.json](vercel.json))

Every registered route prerenders to its own `path/index.html`
(`dirStyle: 'nested'`), and **Vercel checks the filesystem before applying
rewrites**, so real routes are served directly. There is **no SPA rewrite** —
unknown paths fall through to `public/404.html` with a real HTTP 404. The old
config rewrote everything to `index.html`, which returned HTTP 200 soft-404s for
every typo and dead link.

**Consequence: any route NOT in the prerender set will 404 on hard refresh**,
even though in-app navigation to it works. Adding a route means all three of:
1. [src/AppRoutes.tsx](src/AppRoutes.tsx) — the router and prerender set,
2. [scripts/routes.mjs](scripts/routes.mjs) — the sitemap registry,
3. confirming the `.html` exists in `dist/` after a build.

### Freshness signals

- **`lastmod` is emitted only where a real content date exists.** It used to be
  the build date on all 117 URLs, which is not a freshness signal but noise —
  every page claimed to change on every deploy. `scripts/routes.mjs` reads each
  post's `updated ?? date` out of `blogData.ts`; static routes carry no
  `lastmod` at all, because an absent one is ignored while a false one teaches
  crawlers to distrust the whole file.
- **`BlogPost.updated` is set only when the body actually changed.** It drives
  the visible "Updated" line *and* schema.org `dateModified`, in that order —
  structured data that states something the page does not show is the same
  violation as a BreadcrumbList with no visible trail.
- **`scripts/submit-indexnow.mjs` runs at the end of `npm run build`** and is a
  no-op without `INDEXNOW_KEY`, the same way `<Analytics>` is inert without
  `SITE.ga4Id`. It submits only URLs whose `lastmod` is within 30 days: a
  submission is a claim that a page changed, and claiming all 117 every deploy
  is that claim made falsely. IndexNow reaches Bing, which is what ChatGPT
  Search and Copilot retrieve from; Google does not participate.
- **robots.txt names the AI crawlers explicitly.** `User-agent: *` already
  allowed them, but `Google-Extended` and `Applebot-Extended` are not crawlers —
  they govern whether indexed content may ground generated answers, and there
  the difference is between "allowed" and "unstated". robots.txt has no
  inheritance, so an agent matching its own `User-agent` line ignores the `*`
  group; the named agents share one group rather than repeating the rules.

## SEO / GEO conventions

- **All head tags go through [src/components/Seo.tsx](src/components/Seo.tsx)** —
  title, description, canonical, OG, Twitter, robots, JSON-LD. Never set
  `document.title` or reach for Helmet directly; `<Seo>` is what keeps OG from
  drifting away from the title and guarantees a self-referencing canonical on
  every route. Every public page has a unique title and description.
- **A page whose content is behind an early return still needs its head.**
  [PropertiesList.tsx](src/pages/PropertiesList.tsx) hoists `<Seo>` above its
  `isLoading` guard, because at build time the loading branch is what renders.
- JSON-LD builders live in [src/lib/schema.ts](src/lib/schema.ts); identity and
  NAP in [src/lib/siteConfig.ts](src/lib/siteConfig.ts).
- **JSON-LD entities**: three addressable `@id` nodes — `#agent`
  (RealEstateAgent), `#website`, `#kevin` (Person). `blogPosting`'s author and
  the agent's `employee` reference `#kevin` by `@id`, so `person()` must be
  emitted on the *same page* for the reference to resolve — it is included on
  the homepage and every blog post.
- **Unverified fields stay absent.** `compact()` drops any empty field from the
  schema, so a value that is not known yet is simply omitted rather than
  placeheld — wrong coordinates or invented hours are worse than none. `geo`,
  `hours` and the profile list have since been filled in and each carries the
  date it was confirmed; `CLIENTS_SERVED` in
  [Stats.tsx](src/components/Stats.tsx) and `LICENCE_NUMBER` in
  [About.tsx](src/pages/About.tsx) are the two still gated at zero/empty, and
  both render an alternative rather than a placeholder. Fill values in
  [siteConfig.ts](src/lib/siteConfig.ts), never inline.
- **`SITE.profiles` is the one profile list.** `sameAs` in the schema is derived
  from it (`profileUrls`), and [/about](src/pages/About.tsx) renders the same
  array as visible outbound links. A `sameAs` URL that appears nowhere visible
  is an unbacked assertion; the visible link plus a link back from the profile
  is what actually merges them into one entity.
- **`BreadcrumbList` must mirror a visible `<Breadcrumbs>` trail**, built from
  the same array — marking up an invisible trail violates Google's guidelines.
  Pages with no visible trail emit no BreadcrumbList.
- **FAQ answers must be in the DOM, toggled with `hidden`** — never
  `{open && <p>…}`, and never the Radix accordion, which unmounts collapsed
  content. Use [FaqAccordion](src/components/FaqAccordion.tsx). `/faq` shipped
  0 of 36 answers and 1 of 3 question sets until this was fixed.
- **FAQPage schema is kept for AI-search value only** — Google removed FAQ rich
  results in May 2026. Don't build pages *for* that rich result.
- **Never gate the visibility of prerendered content on JS.** framer-motion wrote
  `style="opacity:0"` into the prerendered HTML across 23 files and only
  animated it away after hydration. It was replaced with the CSS `.enter` /
  `.enter-down` / `.enter-left` / `.enter-right` / `.enter-fade` classes in
  [src/index.css](src/index.css), staggered with an inline `--enter-delay`, which
  respect `prefers-reduced-motion`. framer-motion survives **only** in
  [Navbar.tsx](src/components/Navbar.tsx), for menus that are closed by default
  and open on interaction — those are not prerendered content.
- **Links must be real `<a>`/`<Link>` elements.** The town cards on
  `/neighborhoods` were `<div onClick>`, so no crawler could reach any of the 14
  town guides and they could not be tabbed to.
- **The footer is the site's crawlable link graph.** The Navbar renders its
  dropdowns through `AnimatePresence`, so those links do not exist in the
  prerendered HTML. Anything that needs inbound internal links belongs in
  [Footer.tsx](src/components/Footer.tsx).
- **Topical distinctness**: the landing pages each own one axis and **no `<h1>`
  or `<h2>` string may appear on more than one** — if they converge they compete
  for the same query and neither ranks. Verify against the *built* HTML, since
  the shells contribute headings too.
  - [/about](src/pages/About.tsx) — **person** ("who is Kevin Hoang"); declares
    the `#kevin` Person node and carries the visible profile links
  - [/needham-real-estate-agent](src/pages/NeedhamAgent.tsx) — **intent**
    ("who do I hire"); the hub, links out to the others
  - [/home-valuation](src/pages/HomeValuation.tsx) — **seller intent**
  - [/vietnamese-speaking-real-estate-agent](src/pages/VietnameseAgent.tsx) —
    **language**. Vietnamese is an *additional* service, not a specialization:
    every section that raises it also states that clients of every background are
    served. Do not edit that framing away.
  - [/relocation](src/pages/Relocation.tsx) — **origin market** (CT → MA)
  - `/neighborhoods/:slug` — **place**, informational only
  - `/vi/*` — **language**, and unlike the four above these are *documents in
    Vietnamese*, not English pages about Vietnamese service. They pair with an
    English counterpart rather than competing with one.
- **NAP consistency**: name, address, and phone must be identical
  character-for-character everywhere, and all of it comes from
  [siteConfig.ts](src/lib/siteConfig.ts) — display phone `(860) 682-2251`,
  E.164 `+1-860-682-2251` for `tel:`/`sms:`/schema. Inconsistent NAP actively
  suppresses local ranking. The footer's call link used to dial a different
  number entirely from the one printed next to it.
- **`scripts/routes.mjs` reads slugs out of the `src/data/*.ts` modules** rather
  than duplicating them, so the sitemap cannot drift from the corpus.

### The Vietnamese tree (`/vi`)

- **Six real prerendered routes**, listed in
  [src/lib/viRoutes.ts](src/lib/viRoutes.ts) with the English page each one
  pairs with. They exist because the language toggle swaps copy *after*
  hydration — so before this, not one word of Vietnamese appeared in any
  prerendered document and no crawler had ever seen any of it. The toggle
  still works everywhere else; `/vi` supersedes it only for these six.
- **Content is literal Vietnamese JSX, never `t()`.** i18n is pinned to
  `lng: 'en'` during generation, so anything assembled through
  `useTranslation()` prerenders in English regardless of what the reader has
  selected. This is the same constraint that forced `LanguagePreference` to
  apply the stored language after mount.
- **hreflang must be reciprocal or it is ignored.** Every page in a set lists
  every member *including itself*, plus `x-default` pointing at the English
  one. Both sides derive from `alternatesFor()` so that is structurally true
  rather than something to remember. hreflang is **not** a canonical — each
  page keeps its own self-referencing canonical.
- **NAP is not translated.** Phone, email and address come from `SITE` on the
  Vietnamese pages exactly as everywhere else.
- **The town guides are deliberately NOT translated.** Seventeen near-identical
  translations is the scaled-content shape this corpus was cleaned of once.
  `/vi/khu-vuc` describes them and links out to the English guides instead.

## Design system

The site ran **two** visual systems for months and was unified on 2026-08-27. Anything
new must join the one system rather than start a third.

### Two column widths, and only two

`theme.container` caps at 1400px, but every page also applies `px-4`, which beats the
container's own `2rem` padding (utilities layer beats components layer) — so an uncapped
page runs body text to ~1368px. Nothing on this site should. Every page picks one of:

- **`max-w-4xl` (896px) — prose.** Landing pages, `/vi/*`, blog posts, town guides,
  `/about`, the legal pages. Reading measure is the constraint.
- **`max-w-6xl` (1152px) — wide.** `/properties`, `/buyer`, `/seller`, `/blog`,
  `/neighborhoods`, `/testimonials`, `/contact`, `/calculator`, `/first-time-buyers`,
  the FAQ body. These carry card grids, tables, or the roadmap's sticky-sidebar layout,
  which at 896px squeezes the step-detail columns to ~38 characters.

A component that opens its own `container mx-auto px-4` — `BuyerResources`,
`SellerResources`, `RealEstateCalculators` — must respect the same cap, or it renders
wider than the page containing it.

### Colour tokens

Defined once in [tailwind.config.ts](tailwind.config.ts), with the full allow/deny table
in a comment there. The short version:

- `ink` `#1a1a1a` — text on light. `ink-deep` `#0d0d0f` — the dark surface.
  `bone` `#faf8f5` — the warm light surface.
- **Champagne has two values and they are not interchangeable.** `champagne` `#c5a572`
  is 8.31:1 on `ink-deep` but **2.33:1 on white** — it fails WCAG at every size on a
  light surface, so on light it may only be a *non-text mark* (`bg-champagne` rules,
  `decoration-champagne`, `marker:text-champagne`, borders, rings).
  `champagne-ink` `#8c6b35` is the same hue at 4.92:1 on white and is what text on a
  light surface uses — links, active nav labels, eyebrows. It is 3.94:1 on `ink-deep`,
  so it never goes there.
- Three real failures shipped before this rule existed: the homepage About subtitle,
  the ordered-list numerals on every blog post, and the FAQ contact card, whose links
  got *less* legible on hover.

**Colour that carries meaning is exempt from champagne**: the amber review stars, the
blue `important-notice` panels on `/buyer` and `/seller`, form-error red, and the
blue/purple `ACCENTS` in [Roadmap.tsx](src/components/Roadmap.tsx) — that pair is the
only thing telling the buyer and seller guides apart at a glance, which champagne alone
cannot do. Recolouring a signal to the brand accent deletes the signal.

### One chrome

[PageShell.tsx](src/components/PageShell.tsx) owns the dark hero, breadcrumbs, eyebrow,
h1, lede, credential strip and CTA band. `LandingPage`, `ViPage`, `/about` and `/faq`
sit on top of it; before this each had hand-copied the same class strings, and the dark
CTA band alone existed in four places. It also makes the BreadcrumbList rule structural:
the shell renders the visible trail and emits `breadcrumbs(crumbs)` from the same array,
or renders neither — there is no longer a way to ship one without the other.

The navbar is `fixed` at `h-20`. Pages that clear it use `pt-20`; pages whose dark hero
deliberately runs *under* it use `pt-32`. `pt-16` is the old wrong value.

## Content rules

- **Do not bulk-generate blog posts.** The corpus previously carried 100
  machine-generated "daily" posts (one per calendar day Jan 11 – Apr 20 2026,
  built by rotating 25 topic templates and appending "· Note N"). At 58% of all
  blog URLs of five templated paragraphs each, that is precisely the pattern
  Google's scaled-content-abuse policy targets. They were retired on 2026-08-26.
  A small corpus of substantial posts outranks hundreds of thin ones.
- Every retired slug has a 301 to its nearest surviving post.
  [scripts/retired-blog-slugs.json](scripts/retired-blog-slugs.json) is the
  **source of truth**; run `node scripts/generate-blog-redirects.mjs` to apply
  it. **Never hand-edit the redirects in vercel.json** — the two would drift and
  retired URLs would start 404ing. Several live posts are redirect targets;
  deleting one strands the URLs pointing at it.
- **Never fabricate.** No invented market statistics, sale counts, dollar
  figures, awards, or credentials that aren't independently verifiable. Cite a
  source for any strong claim, and give the year for any statutory or tax figure.
  The relocation FAQ points at the MA DOR and CT OPM rate tables rather than
  restating percentages nobody can check.
- **`getRelatedPosts`** ([blogData.ts](src/data/blogData.ts)) ranks by shared
  distinctive words, with ties broken by a slug hash rather than recency.
  Recency is the tempting tiebreak and the wrong one: it sends every
  zero-overlap post to the same newest few, concentrating inbound links on a
  handful and orphaning the rest.
- **Review / AggregateRating schema is intentionally not implemented.** Google
  disregards self-serving review markup on an organization's own page regardless
  of authenticity, and publishing unverifiable testimonials as machine-readable
  review claims carries manual-action risk plus FTC exposure (16 CFR Part 465).
  Verified Google Business Profile reviews are the correct vehicle.

## Gotchas

- `npm run build` runs `typecheck` first, and that is load-bearing: the old
  `vite build` skipped `tsc` entirely, which masked a real bug (the CRM contact
  CSV exported a blank "Sources" column because it read `contact.sources` after
  the field was renamed to `source`).
- **Analytics ship disabled.** [Analytics.tsx](src/components/Analytics.tsx) is
  driven by `SITE.ga4Id` / `SITE.gscVerification`; nothing is injected while they
  are empty. GA is configured `send_page_view: false` with a manual page_view on
  route change, because the app is client-routed after hydration.
- Images: every Unsplash URL must carry `?auto=format&fit=crop&w=<size>&q=<n>` —
  a bare `images.unsplash.com/photo-…` serves a multi-MB original, and the
  homepage hero (the LCP element) was exactly that. Below-the-fold `<img>` tags
  get `loading="lazy" decoding="async"`.
- `src/integrations/supabase/types.ts` is generated — never hand-edit it.
