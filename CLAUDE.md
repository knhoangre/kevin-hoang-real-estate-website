# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Commands

```bash
npm run dev        # Vite dev server on :8080 (host), but see the Docker note below
npm run typecheck  # tsc -b --noEmit
npm run build      # typecheck, prerender every route, write sitemap.xml + llms.txt
npm run build:spa  # plain vite build — NOT what ships; skips prerendering
npm run preview    # serve the built bundle
npm run lint       # eslint

docker compose up app   # same dev server in a container — but on :5173, NOT :8080

node scripts/generate-icons.mjs          # regenerate favicons + og-image.jpg + og-about.jpg
node scripts/generate-blog-redirects.mjs # rewrite the blog 301s in vercel.json
node scripts/sync-listings.mjs           # refresh src/data/soldListings.ts from Supabase
node scripts/generate-video-posters.mjs   # build public/videos/ posters from public/videos/_src/
node scripts/geocode-listings.ts         # backfill idx_geocodes from the US Census geocoder
```

Two things here are checks rather than generators, and both exit non-zero on failure:

```bash
node scripts/valuation-check.ts   # assertions for the comp estimator (no deps, no network)
node scripts/massgis-check.ts     # the address-suggestion parser; add --live to hit MassGIS
node scripts/recommendations-check.ts  # the taste profile behind "Recommended for you"
node scripts/listing-url-check.ts      # a listing's URL: old number-only links, and the email copy of the slug
node scripts/phone-check.ts            # the phone formatter: a pasted "+1 (203) 379-8682" is 203-379-8682
sh supabase/tests/run.sh          # the IDX comp migrations, the saved-homes RLS AND the people on a showing tour (needs Docker)
sh cockroach/tests/run.sh         # the sold database: its writer and its read endpoint (needs Docker)
```

`.ts` rather than `.mjs` for the three newest: Node runs TypeScript directly
(type stripping, stable since Node 23), so they import from `src/lib` instead of
re-implementing it. `geocode-listings.ts` importing `addressKey()` is the point —
it removes a mirror rather than documenting one.

**The two dev servers listen on different ports, and the config does not say so.**
`vite.config.ts` sets `server.port: 8080`, which is what a host `npm run dev` uses —
but the container overrides it and `docker-compose.yml` publishes `5173:5173`, so
the Docker path is **http://localhost:5173**. Curling :8080 against a running
container gets nothing and looks like a broken app.

**On a Mac the Docker path is usually the only one that works.** `node_modules` is
mounted as an anonymous volume so the install inside the container is a *Linux*
one; a host `npm run dev` or `npm run build` then fails on a missing platform
binary (`Cannot find module '@rollup/rollup-darwin-arm64'`). Build through Docker
instead — no Node toolchain needed on the host:
`docker run --rm -v "$PWD":/app -w /app node:20-alpine npm run build`.

The `.ts` check scripts are the exception: they run on the HOST with plain `node`,
because they import nothing from `node_modules`. They do need Node 23+ for type
stripping, which is why they are not part of the Node 20 build.

There is no test framework configured. The closest thing to one is the SEO auditor from the
`seo-web` skill, which checks the *built* output and exits non-zero on failure:

```bash
docker run --rm -v "$PWD":/app -v "$HOME/.claude/skills/seo-web/scripts":/skill:ro -w /app \
  node:20-alpine node /skill/seo-audit.mjs ./dist --origin https://kevinhoang.co \
  --private auth,admin,crm,profile,complete-profile,open-house,events,apply,rentals,saved,search
```

The `--private` list must match `PRIVATE_PREFIXES` in [scripts/routes.mjs](scripts/routes.mjs).
`/apply`, `/rentals`, `/saved` and `/search` are `noindex` and out of the sitemap by design,
so an auditor that has not been told they are private reports all four as public pages that
are noindexed and orphaned.

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
- **The first render may not read the query string.** A page is prerendered
  once, with none, and that document is what the browser hydrates for
  `/search?town=Abington` too. `Search` built its filters straight from the URL,
  so a filtered link rendered a selected town, a chip and a different tab that
  are not in the HTML: fifteen thrown errors and a redrawn page on exactly the
  links that get sent to clients (and that the open-house email links to),
  until 2026-10-09. [useHydrated()](src/hooks/useHydrated.ts) is false for the
  hydrating render and true after; `Search` uses the default filters until it
  flips, and fetches nothing for them — its request effect and its
  scroll-on-page-change effect both wait on the flag, or a link to `?page=3`
  would search twice and scroll on arrival.

### Routing / 404 model ([vercel.json](vercel.json))

Every registered route prerenders to its own `path/index.html`
(`dirStyle: 'nested'`), and **Vercel checks the filesystem before applying
rewrites**, so real routes are served directly. There is **no SPA rewrite** —
unknown paths fall through to `public/404.html` with a real HTTP 404. The old
config rewrote everything to `index.html`, which returned HTTP 200 soft-404s for
every typo and dead link.

**There are exactly TWO rewrites, each scoped to one prefix.** Both exist for
the same reason — a URL whose dynamic segment cannot be known at build time —
and both take the extensionless destination:

- `/search/:path*` → `/search/listing`. An MLS number cannot be prerendered:
  there are ~22,000 active listings and the set changes hourly. So every listing
  URL is served ONE document — the listing page's own loading state, prerendered
  as `/search/listing` — and the listing is fetched client-side.
- `/apply/:path*` → `/apply`. A rental-application invite token is generated at
  runtime, so `/apply/<token>` has no prerendered file either.

The destination is `/search/listing` and `/apply`, **not**
`/search/listing/index.html`: `cleanUrls: true` strips the extension, so the
explicit file path does not resolve and every deep URL falls through to the 404.

**A rewrite must serve the document of the SAME route in the same state.** Until
2026-10-09 the first rewrite pointed at `/search` — the search page's document,
served for a URL the router renders as `SearchListing`. React cannot hydrate one
page as another: every listing ever opened threw six errors (#418 x5, #423),
discarded the HTML and rendered again from nothing, which a visitor saw as the
search page flashing up before the home they had been sent. It is the same
failure as the homepage's markup being served at a private URL, arrived at from
the other side. `/apply/<token>` never had it, because `/apply` and
`/apply/:token` are one component with one first render. The rule for
`SearchListing` that follows: its first render is the loading skeleton WHATEVER
the URL says — `state` starts as `'loading'` even for a URL that names no
listing, and "missing" is set in an effect. **These errors are thrown, not
logged**: they reach Playwright as `pageerror` and never as a console message,
and a check listening only to the console reported "none" on a page throwing
six. They are scoped to those
two prefixes on purpose: Vercel checks the filesystem before applying rewrites,
so every real route is still served directly and every unknown path still falls
through to `public/404.html` with a real 404. A broader rewrite is how this site
used to return HTTP 200 soft-404s for every typo.

**Prefer a query param over a third rewrite.** `/rentals?id=` and
`/admin/applications?id=` open one application; as `/rentals/:id` they would each
have needed their own rewrite. Every broadening of that file moves the site back
toward the soft-404 behaviour, so a dynamic segment has to earn its rewrite.

**`vercel.json` must contain no `comment` keys.** It is JSON, so it has no
comments, and Vercel validates the file against a schema that rejects unknown
properties — `rewrites[0] should NOT have additional property comment` failed
the build and, because the failure is at config-validation time, it silently
stopped deploying `main` at all rather than failing one route. Explanations for
anything in that file belong here instead.

**Consequence: any route NOT in the prerender set will 404 on hard refresh**,
even though in-app navigation to it works. Adding a route means all three of:
1. [src/AppRoutes.tsx](src/AppRoutes.tsx) — the router and prerender set,
2. [scripts/routes.mjs](scripts/routes.mjs) — the sitemap registry,
3. confirming the `.html` exists in `dist/` after a build.

**`hasDarkHero()` in [navItems.ts](src/lib/navItems.ts) is a hand-kept list, and it
drifts silently.** The navbar starts transparent only over a page this function
claims has a dark hero; a page with one that is not listed shows a white bar over
a near-black band, which is invisible in review because nothing errors. `/search`,
`/rentals`, `/videos`, `/apply` and all ten `/properties/<slug>` pages had that
bug until 2026-09-13. Verify against the BUILT output rather than by eye — compare
`bg-ink-deep` inside each prerendered page's `<main>` with what the function
returns, and the mismatches are the list. Sections with detail routes belong in
`DARK_HERO_PREFIX`, not `DARK_HERO_EXACT`.

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
- **`og:image` must actually be 1200x630.** `<Seo>` declares those dimensions,
  and for 65 pages it was declaring them over an image that was not: blog posts
  served an 800x500 Unsplash crop, the 17 town guides a 500x300 one — under
  Facebook's 600x315 floor, so those unfurled as a thumbnail or not at all — and
  /about the raw 750x1125 *portrait*. Content images stay small for the page and
  are widened only for the card, by `ogVariant()` in
  [src/lib/images.ts](src/lib/images.ts); raising them in `src/data/*.ts` would
  trade a social bug for an LCP one, since the same URL feeds the on-page `<img>`.
  A local file passed as `ogImage` must already be 1200x630 — that is why /about
  has a generated `og-about.jpg` rather than reusing the photo.
- **`preloadImage` goes on the page that shows the image, never in
  [index.html](index.html).** That file is the shared shell, so a `<link
  rel="preload">` in it is inherited by all ~122 prerendered routes: 121 fetched
  the homepage hero at high priority without displaying it, and on every page
  with its own hero it won the race purely by being discovered first.
- **Declaring `#agent` on a page is not free.** The full `realEstateAgent()` node
  carries `employee: {'@id': '#kevin'}`, so emitting it anywhere without
  `person()` alongside strands that reference. Use `agentIdentity()` on pages
  that merely reference the business — it is the compact declaration with no
  onward references. The SEO auditor catches this; it caught it on /contact.
- **JSON-LD entities**: three addressable `@id` nodes — `#agent`
  (RealEstateAgent), `#website`, `#kevin` (Person). `blogPosting`'s author and
  the agent's `employee` reference `#kevin` by `@id`, so `person()` must be
  emitted on the *same page* for the reference to resolve — it is included on
  the homepage and every blog post.
- **Unverified fields stay absent.** `compact()` drops any empty field from the
  schema, so a value that is not known yet is simply omitted rather than
  placeheld — wrong coordinates or invented hours are worse than none. `hours`
  and the profile list have since been filled in and each carries the date it
  was confirmed (`geo` was too, and is null again since the office went — see
  the service-area note below); `CLIENTS_SERVED` in
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
- **NAP consistency**: name and phone must be identical character-for-character
  everywhere, and all of it comes from [siteConfig.ts](src/lib/siteConfig.ts) —
  display phone `(860) 682-2251`, E.164 `+1-860-682-2251` for `tel:`/`sms:`/schema.
  Inconsistent NAP actively suppresses local ranking. The footer's call link used
  to dial a different number entirely from the one printed next to it.
- **There is NO street address, and that is deliberate.** Kevin moved from Keller
  Williams (150 West St, Needham) to **LPT Realty** on 2026-09-26. LPT is a cloud
  brokerage with no local office, so he is a **service-area business**: the Google
  Business Profile hides its address and lists service areas, `SITE.address` is
  locality-only (Newton, MA, US — no street, no ZIP, since Newton has one per
  village and choosing one invents a location), and `SITE.geo` is null.
  `streetAddress` and `postalCode` were **removed** from the type rather than
  blanked, so anything that tries to print them fails to compile. Do not "fix" the
  gap with a virtual office or PO box — both violate Google's guidelines and are a
  documented suspension cause — or with a town-centre coordinate, which describes a
  business that is not there. `locality` and `serviceAreaLine` replaced
  `formattedAddress` and `mapsHref`.
- **Based in NEWTON, since 2026-09-27; Needham is a town served, not the base.**
  Needham was only ever where the Keller Williams office was; Kevin lives in
  Newton (confirmed 2026-09-27), which is why `/vi/gioi-thieu` may say he lives
  and works there — do not "correct" that to the looser "based in". Every "based in"
  claim reads `SITE.address.addressLocality` or says Newton — the homepage title,
  the byline on every post (`AuthorCard`), `/about`, the town-guide aside, llms.txt
  and both social cards. `/needham-real-estate-agent` is **kept**: it is the page
  for people hiring an agent *in* Needham, which is still true, and it now says the
  practice is based next door in Newton. The Google Business Profile's hidden
  address has to be in Newton as well, or the profile and the site disagree about
  where the business is.
- **The brokerage name must be on every page — it is in the footer for that
  reason.** 254 CMR 3.09 requires all real estate advertising to include the
  broker's name conspicuously. Until 2026-09-26 it appeared only in the homepage
  hero and a few landing pages. Every place that names it reads `SITE.brokerage`;
  four literal "Keller Williams Realty" strings were what went stale on the move.
  The social cards carry it too (`generate-icons.mjs`), and they must be
  regenerated on a Debian image with fonts — Alpine silently renders every glyph
  as a box.
- **A past closing is never attributed to the current brokerage.**
  `PropertyDetail` used to describe each closing as "represented by Kevin Hoang,
  ${SITE.brokerage}", which on the move would have relabelled Keller Williams sales
  as LPT Realty sales. It now names Kevin alone. The closings have no `soldDate`,
  so which brokerage each closed under cannot be derived.
- **`scripts/routes.mjs` reads slugs out of the `src/data/*.ts` modules** rather
  than duplicating them, so the sitemap cannot drift from the corpus.

**`/search` retries a failed read, and that is not defensive padding.**
`idx_listings` is 170 MB with 71 MB of indexes, and an exact count scans every
matching row — about 16,000 for the default search. Warm that is 0.3s; cold,
after a sync or a quiet spell, it exceeds three seconds, which is the `anon`
role's `statement_timeout`, so the first visitor of the hour got HTTP 500 and an
empty page. Refreshing appeared to fix it because their own failed attempt had
warmed the buffer cache. Measured on the live project: two 500s at 3.3s and 3.2s,
then 0.27s for every call after. `withRetry` in
[idxSearch.ts](src/lib/idxSearch.ts) retries twice with backoff — the attempt
that just failed is what warms the cache, so the retry is the fast case almost by
construction — and skips `PGRST`/`42xxx` codes, which are our own malformed
queries and will fail identically three times. The server half is
`ALTER ROLE anon SET statement_timeout = '8s'` (Supabase's own default for
`authenticated`); the two are deliberately independent, so the client fix keeps
working if that setting is ever reset.

**…but the real cause was reading the whole table, and that is fixed in the
database.** Until 2026-09-27 the default search fetched all 15,526 matches,
sorted them and kept 24 — 20,193 buffers, ~160 MB, because `idx_listings_price`
is ascending and the query asks for `DESC NULLS LAST`, which a backward scan of
it cannot produce. Cold that took 7-8 seconds. Migration
`20260927100000_idx_search_speed` added partial indexes in the exact order the
page asks for — sale, rent and per-town — and the same search reads 26 buffers in
2.6 ms. **The `nullsFirst: false` on both `.order()` calls is load-bearing**: ask
for NULLS FIRST and none of those indexes apply. Rentals have their own index
because every rent sorts below every house, so a shared one walked 17,000 sale
rows to find 24 rentals.
- **Pressing Next lands at the top of the results, and two things used to stop
  it.** [ScrollToTop](src/components/ScrollToTop.tsx) has the navigation type in
  its effect's dependencies, and that changes on its own: a visit starts as POP
  and the first query-string change makes it PUSH, so the effect re-ran and sent
  the reader to the top of the document — once per visit, on the first press
  only. It now does nothing unless the path itself moved. Behind that, the
  page's own scroll was `behavior: 'smooth'`, and a page change swaps 24 cards
  for a skeleton half the height and back within a quarter of a second: the
  scroll started for the results and ended beside the Next button, on every
  press. It goes in one step now. Both were found by logging every scroll call
  in a browser, not by reading — neither looks wrong on the page.
- **The cards and the total are two requests.** `count: 'exact'` makes PostgREST
  count in the same statement, so the 24 cards used to wait on a count of every
  match. `searchListings` returns rows only and `countListings` the total; the
  page renders the cards when they land and fills in "of N" later, and a failed
  count is silent. Until the count arrives, a full page implies a next one.
- **`idx_listings` vacuums at 2% dead, not 20%.** One active sync rewrites
  ~24,000 of 125,000 rows, which sat just under the default trigger, so the
  visibility map went stale (45% of pages all-visible, measured) and the count's
  index-only scan fell back to the table for 11,645 of 15,526 rows.
- **The town dropdown reads `idx_town_counts`**, a materialized view refreshed by
  pg_cron after the syncs (`55 0,6,12,18` and `45 5`). It used to group all
  125,000 rows on every visit — 6.5 s cold — and had silently been counting a
  year of closings since the sold feed was added, offering "Newton (1,257)" above
  a search that found 259. It now counts what the default tab shows; its status
  list mirrors `AVAILABLE_STATUSES`. **If the sync schedule moves, move the two
  refresh jobs with it.**

### Listings

- **`src/data/soldListings.ts` is generated — never hand-edit it.** Listings are
  edited in `/admin/properties` and pulled down with
  `node scripts/sync-listings.mjs`, which is deliberately NOT in `npm run build`:
  the output is committed, so the build stays deterministic and needs neither
  network nor database credentials. It refuses to write an empty file, because an
  empty result is far more often a broken query or an RLS change than an emptied
  table. It also downloads every listing photo, re-encodes it and commits it to
  `public/listings/` — see the next point.
- **Listing photos are served from `public/listings/`, never from Supabase
  Storage.** `/properties` used to reference 339 bucket objects directly: 228 MB
  of full-resolution PNGs rendered into a ~360px card, and because
  `.upload()` was called without a `cacheControl` option every object was stored
  `cache-control: no-cache`, so Supabase's CDN revalidated and re-transferred on
  *every* request. That single page was the entire free-tier egress bill.
  `sync-listings.mjs` now downloads each photo, resizes it to 900px (2x the card)
  and writes WebP into `public/listings/` — 19 MB total, 56 KB average — which
  Vercel serves under the `immutable` header in [vercel.json](vercel.json). The
  files are generated output committed alongside the snapshot; never hand-edit
  them, and re-run the sync after adding a listing. The script is idempotent: it
  reuses what is already on disk and prunes what no listing references.
  - **Supabase image transformations are not an option here.** The
    `/render/image/` endpoint is a paid-plan feature and answers **HTTP 403** on
    this project. The resize has to happen in the sync script.
  - **Every `storage.upload()` must pass `cacheControl`**, or the object defaults
    to `no-cache` and bills egress on every hit — [Properties.tsx](src/pages/Properties.tsx)
    uses a year (filenames carry a `Date.now()` stamp and are never rewritten),
    [Profile.tsx](src/pages/Profile.tsx) an hour (the avatar path is fixed and
    upserted in place, so a long TTL would serve a stale picture).
  - **`fromRow()` in [PropertiesList.tsx](src/pages/PropertiesList.tsx) maps live
    `image_urls` back onto the local paths.** Without it the post-hydration
    revalidation would swap all 339 photos back to bucket URLs a moment after
    load, restoring the whole problem plus a visible flash. A photo with no local
    copy — a listing added since the last sync — deliberately falls back to its
    Supabase URL rather than rendering nothing.
- **The snapshot exists so `/properties` prerenders content.** The page fetched
  from Supabase in an effect, so at generation time it rendered its spinner and
  the HTML contained no listings at all — on the one page whose subject is
  listings. It now seeds state from the snapshot and revalidates after mount; the
  live fetch is a refresh, not the source. Its `ItemList` schema was withheld for
  the same reason and is now honest.
- **The `town` and `zip_code` columns are dirty and are normalised on read.**
  `town` holds "Newton, MA", "Newton" and "Brookline" — one field, three formats —
  and 8 of 10 `zip_code` values lost their leading zero to a numeric CSV import,
  so the page rendered "Newton, MA 2459". `sync-listings.mjs` fixes both, and
  `fromRow()` in [PropertiesList.tsx](src/pages/PropertiesList.tsx) mirrors that
  logic **exactly** — if the two disagree, a listing visibly changes format the
  moment client-side revalidation replaces the prerendered copy. The underlying
  rows have not been rewritten; that is a separate decision.
- **Each closing is its own page at `/properties/<slug>`.** They were
  `#listing-<slug>` fragments on `/properties` until 2026-08-31, and a fragment
  cannot be ranked, cited, or linked to as a subject — so the strongest evidence
  on the site had no address of its own and the town guides had nothing specific
  to point at. [PropertyDetail.tsx](src/pages/PropertyDetail.tsx) renders
  entirely from the committed snapshot with no fetch and no loading branch;
  `/properties` revalidates because a listing added since the last sync should
  still appear in the list, but a detail route does not exist until the next
  build anyway.
  - **`sold_date`, `description`, `list_price` and `represented` are what keep
    these from being thin.** Specs alone are what every aggregator publishes
    about the same house. All four are nullable and every one is *omitted* when
    absent — no placeholder, no zero, and no representation side implied. The
    closed-vs-asked line renders only when both prices are present:
    `percentOfAsking()` returns null otherwise rather than assuming the two were
    equal, which would be a fabricated statistic about a real transaction.
  - **`fromRow()` must compute the same slug as `sync-listings.mjs`.** It used to
    return `String(r.id)` and that was invisible, because the slug was only an
    anchor target. It is now a URL: a revalidation computing a different slug
    rewrites every card's link to a page that does not exist. The two `slugify`
    implementations are a deliberate mirror, like the town and ZIP normalisation
    beside them.
  - **Listing photos are 900px and og:image must be 1200x630**, so
    `sync-listings.mjs` crops `public/listings/<mls>/og.jpg` from each listing's
    first photo — the same split as `ogVariant()` in
    [images.ts](src/lib/images.ts). A listing with no card falls back to
    `SITE.defaultOgImage` rather than to a photo of the wrong size, because a
    generic card unfurls and an undersized one does not.
  - **Photo alt text is positional** (`"<address> — photo 3 of 42"`). Nobody
    recorded what each room is, and describing photographs nobody looked at is
    the same fabrication the copy rules forbid.
  - **Every heading interpolates the address, not just the town.** Two of the ten
    are in Newton, and CtaBand's heading is an `<h2>` — town-level headings would
    have those two pages competing with each other under the
    topical-distinctness rule.
  - `formatPrice` / `formatBaths` and the rest live in
    [src/lib/listings.ts](src/lib/listings.ts). They were three private copies
    that had already drifted ("Price on Request" vs "Price on request").
- **[ListingGallery](src/components/listing/ListingGallery.tsx) is the one
  photo gallery**, on `/search/<mls>` and `/properties/<slug>` alike. The
  picture is the control: the left and right edges (22% each) go back and
  forward, the middle opens every photo full screen as a column to scroll
  through, starting at the photo that was showing. Three things in it look like
  details and are not:
  - **The edge zones are children of Embla's viewport, after the track.** Embla
    slides its viewport's FIRST child and listens for drags on the viewport
    itself, so buttons there stay put, a swipe that starts on one still drags,
    and Embla's own click suppression stops a swipe ending over an edge from
    also skipping a photo. Laid over the carousel from outside, they swallow
    every touch that starts on them.
  - **A click steps from the photo the press STARTED on, not `scrollNext()`.** A
    press mid-slide grabs the carousel and Embla settles on the nearer photo —
    usually the one being left — so fast clicking moved one photo per two
    clicks. Measured, not guessed: the check clicks three times 60ms apart.
  - **The full-screen view positions itself with arithmetic, not
    `scroll-margin-top`.** The frames are `overflow-hidden`, and Chromium 131
    ignores scroll-margin on those, which opened the view with the photo's top
    under the bar. Each frame is a fixed 4:3 with `object-contain`: the fixed
    height is what makes "open at photo 30" land before the images have loaded.
- **A listing's URL is `/search/<address>-<MLS number>`, and only the number is
  read** ([listingUrl.ts](src/lib/listingUrl.ts)). It was `/search/73568135`,
  which texted beside three others says nothing about which house it is; Kevin
  asked for the address on 2026-10-09 and gave the shape,
  `170-Gore-St-Unit-417-Cambridge-MA-02141`. The number stays on the end because
  an address is not one listing — the same condo is for sale and for rent at
  once under two numbers, and returns a year later under a third — and because
  the feed respells addresses.
  - **Every link sent before that date still works, and that is structural, not
    a redirect.** A segment that is all digits IS the number. The page then
    rewrites its own address bar to the full form (`replace`, so Back is still
    one press; the query string and hash ride along, since emailed links carry
    `utm_source`). There is no redirect table to maintain and none to go stale.
  - **Because only the number is read, the words can be wrong.** A saved home's
    snapshot has no ZIP and still makes a working link; a respelled address in
    an old email still opens. Do not "validate" the words against the listing.
  - **In a slug the number must be six digits or more.** A link that lost its
    number ends in a ZIP, and five digits used to be an acceptable MLS number —
    the visitor would be told a house had sold that was never looked up. That
    case has its own wording ("This link is missing its listing").
  - **Every link is built by `listingPath()`** — the cards, the comps table, the
    two admin pages. The edge functions carry a mirror (`listingSlug` in
    [listingEmail.ts](supabase/functions/_shared/listingEmail.ts)) for the
    schedule's text and emails, and `node scripts/listing-url-check.ts` runs both
    copies over the same addresses, so it is a mirror that is checked.
  - **GA4 is sent `/search/<mls>` for every form of the link** (`analyticsPath`).
    One listing would otherwise be three rows, and the address-bar rewrite would
    count one visit twice — `<Analytics>` is keyed on that folded path, not on
    the pathname. The address is in the page title, which GA4 reports beside it.
  - Words are cased the way an address is written, because the feed is not
    consistent ("60 PATTISON ST Unit C14" is a real value): a word all in one
    case gets a capital, a word with its own shape ("McGrath") is left alone.
- **IDX and owned listings are opposite SEO cases.** The sold listings are
  first-party, unique and indexable — the strongest evidence on the site, which
  is why they also appear per-town via
  [TownSoldListings](src/components/TownSoldListings.tsx). A future IDX feed is
  the same syndicated data as thousands of other agent sites, and MLS PIN's rules
  generally require it be non-indexable — so it belongs on its own `noindex`
  route as a conversion feature, never merged into `/properties`.
- **`TownSoldListings` renders nothing where there are no sales.** 11 of the 17
  guides have no closing behind them, and a heading over an empty box is the thin
  templated filler this corpus was cleaned of once. Its `<h2>` interpolates the
  town name so the six instances stay distinct under the topical-distinctness
  rule.

### The price estimate (on a listing's `/search/…` page)

Comparable-sales valuation on the IDX listing pages. Two modules: everything
numeric is in [valuation.ts](src/lib/valuation.ts), which is **pure — no network,
no DOM** so it can be run against a synthetic market whose true answer is known;
[idxComps.ts](src/lib/idxComps.ts) does the fetching and holds no judgement.
`node scripts/valuation-check.ts` is the check, and it is the real one: it
generates a market from known parameters ($300/sqft marginal, $40k a bathroom,
+0.5%/month) and asserts the estimator recovers them.

- **An estimate is built from FIVE sales that are like the home, or it is not
  made.** Kevin read the panel on live listings on 2026-10-09 — up to seventy
  "comparables" under one house, some thousands of square feet apart from it —
  and asked for what an agent would pull. Until then the ladder loosened what a
  comp had to be as it widened (45% in size and any bedroom count on the last
  rung) and used every sale a rung matched; the most on one home was 173.
  - **`LIKENESS` is the same on every rung**: same property type, within 20% of
    the floor area, within one bedroom (two on a multi-family, where the count
    is across units) and one bathroom. An unknown bed or bath count is not a
    mismatch. Widening the search widens WHERE, never what a comp is.
  - **`MAX_COMPS` is 5 and equals `MIN_COMPS`.** `chooseComps()` keeps the five
    highest by `compWeight()` — distance, recency, size, beds, baths, style —
    and that same score weights them, so there is one opinion about "alike".
    It swaps the weakest for a sale on the other side of the subject's size
    when the best five are all larger or all smaller, which is the bracketing
    an appraiser does on purpose. Three comps was tried: the forty-odd homes it
    added were off by nearly 20% on average.
  - **There is NO town-wide rung.** Half a mile, one mile, two miles, same ZIP —
    all twelve months — and then nothing. A sale somewhere else in the town at
    an unknown distance is not a comp: on 152 homes for sale statewide that
    rung was mostly Boston and its numbers sat a median of 28% from the asking
    price. Do not add it back to raise coverage.
  - **The page asks the database TWO questions** (`candidateBounds()`): the
    like band, so it comes back whole, and a wide pool the trend and the rates
    are fitted on. One capped query was returning six weeks of Boston condos,
    so a listing there found nothing from its own ZIP code.
  - **`againstAsking()` withholds the estimate when it is more than 20% from the
    asking price**, and this is the change that moved accuracy. Measured on 812
    closings: the list price was a median of 3.0% from the sale price, and where
    the estimate was more than 20% from the list price (162 homes) the estimate
    was the closer of the two three times. That far apart, the model is missing
    something the person who priced the home could see. The panel then says
    "No estimate for this home", gives the reason with both figures in the
    sentence, and still lists the sales; the one-line summary beside the price
    is not shown at all. It is applied in `useListingValuation`, not in
    `valuate()`, which knows nothing about what anyone is asking. The cost is
    real and worth knowing: the estimate can no longer be the thing that says a
    listing is wildly overpriced.
  - **Measured 2026-10-09 on 1,276 closings** (thirty per town and type; the
    `final*.ts` harness was a one-off, `valuation-backtest.ts` is the kept
    instrument and applies the asking check unless `--raw`). What the page shows:
    median error 6.8%, mean 8.3%, bias +0.7%, **96% within 20%**, 1.8% more than
    25% out, worst 45%. Before: 10.2%, 13.7%, +3.3%, 78%, 14.4%, worst 148%.
    **The price of that is coverage** — a number on 51% of those homes instead
    of 79%, sales but no number on 26%, nothing on 23% (was 8%). On the homes
    both rules could value, five like sales alone are barely better than dozens
    of loose ones (median 9.5% → 8.8%); it is declining the thin cases and the
    asking check that did the work.
  - **The chart has no trend line any more.** A line through five points within
    20% of each other in size slopes whichever way one sale tips it.
  - The comps table carries beds and baths and opens with the subject's own row,
    so each sale is read against it.
- **The sold feed is DELETED as it ages, so `idx_sold_archive` is the comp source
  of truth — never `idx_listings`.** MLS PIN's sold feed is a rolling twelve-month
  window (measured 2026-09-20: 2025-09-17 to 2026-09-18, to the day), and
  `idx-sync`'s retention sweep removes what falls out of it. `idx_archive_sold(p_mls)`
  runs on **every upsert batch** of the sold feed, with that batch's MLS numbers,
  before the sweep. It copied the whole archive on every slice until 2026-09-27,
  when fifteen of sixteen nightly runs timed out doing it; per batch, the work is
  bounded by 500 rows rather than by the size of the archive. The zero-argument
  form still exists for a manual backfill and must never go back on a schedule.
  It is callable by `service_role` only — Supabase's default privileges grant every
  new function to `anon` and `authenticated` BY NAME, so `REVOKE ... FROM PUBLIC`
  alone left it open to the anon key; revoke from those roles explicitly, and the
  test bootstrap now reproduces those defaults so a missing revoke fails. The
  archive is scoped to the 17 served towns, MA only, sales only, modelled columns
  only: 7,495 rows a year against a 500 MB free tier. **The town list in that
  function is a deliberate mirror of `SITE.areaServed`**, and forgetting to add a
  town there means that town's sales are never archived — silently, and
  unrecoverably a year later.
- **Town names are NOT unique, and every comp query filters `state`.** MLS PIN's
  town table is `TOWN_NUM|LONG|COUNTY|STATE` and `generate-idx-towns.mjs` keeps
  only the first two, so Dover MA and Dover NH resolve to the same string. Measured
  on the live feed: Dover is 127 MA rows and **19 NH**, Concord 336 and 5, Belmont
  521 and 7, Winchester 479 and 2, Newton 997 and 3, Brookline 998 and 2. This is a
  pre-existing defect in `/search` itself — `?town=Dover` shows New Hampshire
  listings today — and `searchListings()` should get the same filter.
- **An unknown distance is not a near one.** A row with no geocode is included when
  no radius is asked for and excluded when one is. The inverse lets a sale from the
  far side of town be presented as half a mile away, and until the geocode backfill
  finishes that is most rows.
- **Price per square foot is not an adjustment rate.** The grid adjusts at the
  *marginal* rate from a regression on the comp set — typically 40–60% of average
  $/sqft, measured at $277 against a true $300 in the synthetic check. Adjusting at
  full average $/sqft overshoots by half the difference, which is the error
  [how-to-read-a-comp-massachusetts](src/data/blogData.ts) is written about.
  **Bedrooms are a selection axis, never a dollar line** — they are collinear with
  floor area and adjusting for both counts the same square feet twice.
- **Every adjustment is derived or dropped.** `deriveRates()` offers each feature
  to one multivariate OLS and keeps a coefficient only if it clears significance
  *and* has the sign the world has. A regression on nine houses will report a
  bathroom worth minus $200,000 often enough that not checking is not an option,
  and a wrong-signed adjustment is worse than none — it moves the estimate
  confidently the wrong way. Dropped features are named in "what this could not
  look at" rather than quietly omitted.
- **The time adjustment is Fannie Mae's, and zero is a real answer.** Mandatory
  for appraisals dated on or after 2025-03-01, where omitting it is named an
  unacceptable practice. `marketTrend()` returns exactly 0 when the slope fails
  significance or the sample is under twelve sales: the requirement is that the
  adjustment be *market-derived*, so inventing a drift the data does not support is
  the very fabrication it exists to prevent.
- **Below 5 comps it refuses; above 35% dispersion it withholds only the number.**
  `medianAskingRent` sets three for a median of asking rents in an editable field;
  this is a claim about one house next to someone else's asking price, so it needs
  more. When the comps disagree too much the range, the chart and the comp table
  still render — that disagreement is itself worth knowing.
- **Rentals are not valued; multi-family is, but only against its own unit
  count.** A sale estimate on a unit for rent answers nothing. Multi-family was
  refused until 2026-09-26 on the grounds that MF `bedrooms` is a total across
  units — true and irrelevant, since comps are always the same property type.
  What must match is the unit count, which `unitClass()` reads from MF_TYPE
  (A/D/F/G/H two-family, B/I/J/K three, C/L/M/N four, E/O/P/Q five-plus; 100%
  filled). Style is ignored on MF, where the column has no codebook. MF is the
  weakest type because it trades on rents the feed does not carry, and the panel
  says so.
- **`style` is a comma-separated SET and the codes collide across property types.**
  "A,D" is a real value; "A" is Colonial on a single-family and Detached on a condo.
  Compare with `styleSet()` overlap, always within one `prop_type`. An **unknown**
  style is not a mismatch — treating it as one counts against every listing
  whose agent left the field blank. Since 2026-10-09 style is a PREFERENCE in
  `compWeight()` (a different style counts 0.7) and no longer a filter on the
  tight rungs: a Ranch the same size on the same street is still a comp.
- **The chart is hand-rolled SVG and plots RAW sale prices.** recharts is a
  dependency but is imported only by the admin-only lazy `CRMDashboard`, so using it
  here would drop the library into a public chunk, and `ResponsiveContainer`
  measures DOM width so it renders empty at first paint and on paper. Plotting
  *adjusted* prices would draw a tighter cloud corresponding to no transaction and
  fold the model's assumptions into the evidence offered for them; the adjustment
  is shown per-comp in the table instead. Champagne is a non-text mark here, which
  is the only thing it may be on white.
- **`SITE.valuation` is the compliance switch, and it exists before it is needed.**
  NAR's IDX policy authorises AVMs and permits MLS content for "developing market
  statistics", but an estimate shown *in immediate conjunction with a listing* must
  be disabled at an individual seller's request — and the feed carries no flag
  saying who has asked. `enabled: false` withdraws it sitewide; `suppressedMls`
  withdraws one. Suppression removes the **number**, not the comps or the chart.
  **Not yet checked against MLS PIN Attachment C**, the same open caveat
  [IdxDisclosure.tsx](src/components/IdxDisclosure.tsx) carries about its own wording.
- **Measured accuracy, 2026-09-26, with geocodes loaded: median absolute error
  10.2%, mean 14.3%, bias +4.5%, 74% within 20%** (SUPERSEDED by the 2026-10-09
  figures at the top of this section; kept for what it says about the
  instrument) — 413 real closings across the
  17 towns, `--per-town 12`. By type: condo 8.5%, multi-family 9.1%,
  single-family 13.3%. On a sample of 90 live active listings statewide, the
  panel appears on 80. `node scripts/valuation-backtest.ts` is the instrument: it
  holds each home out of its own comp set, removes every sale that closed after
  it (without that the model is shown its subject's future and the error comes
  back flattering and meaningless), and looks the home's coordinate up exactly as
  the page does — it passed none until 2026-09-26, and would have reported the
  geocoding as worthless. Read the BIAS before the error. Re-run after any change
  to the tiers, the grid or the weighting.
  - **`--no-geo` runs the same homes with no coordinates**, which is how to see
    what geocoding buys: overall 11.3% → 10.5%, condo 10.8% → 8.5% (a sale in the
    same building is the best comp there is), single-family roughly a wash. The
    backfill covers 94.8% of addresses (22,534 of 23,758; rentals excluded, since
    a rental is never a subject or a comp). Comps in towns outside the 17 are not
    geocoded and fall through to the ZIP rung.
  - **The same-ZIP rung is what runs without a coordinate**, and it exists
    because "same town" fails in big towns: Boston is one MLS town from Back Bay
    to Mattapan, and single-family there was 26% off at town level, 12% at ZIP
    level (bias −11.5% → +1.4%). ZIPs track Boston's neighbourhoods closely.
  - **Rates come from the whole pool; the comps come from the ladder.** Five
    sales cannot support five regression coefficients, so `deriveRates` runs on
    every time-adjusted sale of the type in the town and the comps only supply
    the prices those rates adjust. `TIER_TARGET` (8 before a rung was trusted)
    existed for the same reason and was removed on 2026-10-09: with the likeness
    band fixed it measured as no different from stopping at five.
  - **Single-family runs ~6% high and that is most likely condition**, which no
    field carries: a house that needs work sells below comps the model cannot
    tell it apart from. That is the case for photo condition scoring, not for more
    tuning of the grid.
  - A town that stays badly off is worth adding to `suppressedMls` rather than
    explaining away. Concord (about −10%) is the outlier to watch.
- **The number is withheld — the range and comps still shown — whenever it would
  be a projection rather than a reading.** Appraisal practice requires comps to
  BRACKET the subject, and the live listings showed why. A subject larger or
  smaller in floor area than every comp gets no single number (a $2.7M Hanover
  house resolved against ten smaller sales came out 48% under its ask). So does a
  single-family or multi-family whose lot is more than 1.5x the largest comp's:
  a ten-acre Mansfield development parcel was valued as the ranch on it, "57%
  above". Lots are checked on the large side only, where price turns into land
  value; condos never, since their `acres` is the complex's. `withheld` carries
  the reason so the panel can say it in plain words. Measured cost: about 5% more
  homes show a range instead of a number, and the numbers shown got better.
- **A list price under $10,000 is a placeholder, not a price.** Listings are
  entered at $1 for auctions and "price on request"; compared with an estimate it
  printed "asking is 100% below" on a live Chicopee listing, and would have
  stretched the chart's axis to zero. `comparableAsking()` returns null for it, so
  there is no comparison and no mark on the chart — the estimate itself still shows.
- **Comps come from every town, not just the 17.** `idx_comparable_sales` reads
  the live sold feed (all towns, twelve months) UNION the archive (seventeen
  towns, growing), deduplicated on the archive's primary key — a sale counted
  twice would carry double weight in the median. Before 2026-09-26 it read only
  the archive, so ~88% of listings on `/search` could never show an estimate.
- **…and it reads them from `idx_comp_pool`, a materialized view, because the
  function was too slow to answer.** Kevin could not find the estimate on
  2026-09-27 because on many listings it never arrived: called as a function,
  `idx_comparable_sales` read **45,764 buffers in 7.4 s with everything in
  cache**, against 1,620 buffers and 23 ms for the same SQL with literals, and
  under load it hit the 8-second timeout. Two causes, both worth knowing for any
  future SQL function here: a `LANGUAGE sql` function with a `SET` clause is
  **never inlined**, so its body gets a generic plan with the parameters as
  unknowns; and in a generic plan **`(p_x IS NULL OR col = p_x)` cannot be an
  index condition**, so it walked every sale of the type in the state and ran
  `idx_address_key()`'s regexes on each one to join geocodes. The pool is
  archive ∪ live sold feed, deduplicated, sanity-banded, with lat/lon joined on,
  written in `(prop_type, state, town, settled_date DESC)` order and rebuilt
  NON-concurrently by pg_cron at 05:55 UTC after the sold feed (a concurrent
  refresh would let that physical order decay). The function now does plain
  equalities on that index and answers in 13 ms. `p_town` is required — NULL
  returns nothing. Staleness is at most a day, the sold feed's own cadence. The
  SQL tests refresh the pool after every block that changes data, and the test
  bootstrap stubs `cron`.
- **`ValuationSummary` renders nothing while it waits**, so a slow lookup is
  indistinguishable from "no estimate". Check a live listing in a real browser
  when the estimate "is missing" — `docker run mcr.microsoft.com/playwright/python`
  with a short script logging the `idx_comparable_sales` response is how the
  timeout above was found.
- **The estimate is stated beside the asking price, not only in the panel.**
  `ValuationSummary` is one line under the price that links down to the working.
  The panel alone sat below the mortgage calculator, where it was on the page and
  effectively invisible. Both read `useListingValuation`, which react-query keys
  on the MLS number, so they make one request. Active listings only: on a sold
  one the sale price is the fact.
- **The panel must not contradict [/home-valuation](src/pages/HomeValuation.tsx)**,
  which is an indexed money page arguing that automated estimates cannot see
  condition. It agrees with that page in its own words and links to it, rather than
  overselling. Its `<h2>` interpolates the address, like every heading on that page.
- **`idxComps.ts` carries a scoped `CompsSchema` cast, and it is temporary.**
  `types.ts` cannot describe `idx_geocodes` or `idx_comparable_sales` until the
  migrations are pushed and it is regenerated. Unlike the deleted `db` escape hatch
  this asserts a *precise* schema that the compiler still checks, in one module —
  but delete it and switch to `supabase` directly after regenerating.

### Sold data in CockroachDB — BUILT AND TESTED, NOT YET SWITCHED ON

**State on 2026-10-06: every piece below is deployed and inert.** No CockroachDB
cluster exists yet; `SOLD_DB_URL_RW` / `SOLD_DB_URL_RO` are unset, so the sync
writes nowhere new and `SITE.soldData.backend` is `'supabase'`, so the site reads
sold listings exactly as it always has. Everything in "The price estimate" above
describes what is LIVE. This section is what replaces the sold half of it.

- **Why a second database.** Supabase's free tier is 500 MB shared with the CRM,
  so sold listings were deleted when they aged out of MLS PIN's twelve-month
  window and the archive that outlives it was cut to seventeen towns and a third
  of the columns — 7,106 rows against 98,921 in the feed. CockroachDB's free
  allowance is 10 GiB; a year of sales statewide with every column is about
  0.2 GiB. `idx_sold` there is the whole feed, every town, every field, rentals
  included, and NOTHING IS EVER DELETED FROM IT. The writer's login has no DELETE.
- **Only sold data moves. Active listings stay in Supabase**, read directly by
  the browser as now. `/search` for homes on the market is the part that must
  never break and it does not depend on this at all.
- **Azure SQL's free offer and Cosmos DB were both considered and ruled out**
  (Kevin asked, 2026-10-06). Azure SQL free is 100,000 vCore-seconds a month —
  about 55 awake hours at the smallest size, which the sync alone spends — after
  which the database is paused until the next month, and each wake takes about a
  minute. Cosmos DB is a document database: no joins, no SQL functions, so the
  estimator and search would be rewritten from scratch.
- **REQUEST UNITS ARE THE CONSTRAINT, NOT STORAGE.** The free allowance is 50
  million a month and a cluster that spends it is DISABLED until the next.
  Rewriting 99,000 rows nightly, the way the Supabase sync upserts every row to
  stamp `synced_at`, would cost roughly twice that. So `writeSoldBatch`
  ([soldDb.ts](supabase/functions/_shared/soldDb.ts)) hashes each feed row, reads
  the stored hashes for the batch from a narrow covering index, and writes only
  rows that are new or changed. There is no `synced_at` over there, no retention
  sweep, and a night on which nothing changed writes nothing. **Do not add a
  "touched at" column to `idx_sold`** — it turns every row into a write.
- **One table replaces three things:** the sold half of `idx_listings`,
  `idx_sold_archive`, and the `idx_comp_pool` materialized view that existed to
  union them. With one table there is nothing to union and no nightly rebuild.
  Coordinates are copied onto each row when it is written (and pushed later for
  addresses geocoded after the fact — the `soldGeocodes` body), so the comp query
  filters on distance without a second database. `idx_geocodes` itself stays in
  Supabase, where the geocode script writes it.
- **[sold-api](supabase/functions/_shared/soldRead.ts) is a fixed set of
  questions, not a query interface** — `search`, `count`, `byMls`, `similar`,
  `comps`. Every statement is written there and every value bound as a
  parameter; it connects with a login that can only SELECT. It is public (the
  anon key is in every browser), which is also why totals are cached for ten
  minutes: a count is the one answer no index shortcuts.
- **Rows come back shaped like `idx_listings` rows**, so no page changed.
  [soldApi.ts](src/lib/soldApi.ts) is the only caller, and `idxSearch.ts`,
  `idxComps.ts` and `favorites.ts` route their sold branches through it when
  `SITE.soldData.backend` says so. `listingByMls` asks Supabase first and the
  sold database only on a miss.
- **What is KEPT is not what is SHOWN.** `comps` reads every sale ever stored;
  the ops that display a listing are limited to `DISPLAY_MONTHS` (12, the window
  MLS PIN's own feed shows). Whether older sold listings may be displayed is a
  question for MLS PIN's rules — the same open caveat `SITE.valuation` carries —
  and when it is answered it is that one constant.
- **Three CockroachDB differences that each cost a failed run, so they are
  written down:** a bare `6371.0088` is a DECIMAL and will not multiply by the
  FLOAT `asin()` returns (cast it); a `VALUES` list of bare placeholders is
  refused with "could not determine data type of placeholder" (use `unnest` of
  cast arrays); and postgres.js returns INT8/DECIMAL as strings and DATE as a
  `Date` unless told otherwise — `openSoldDb` installs three type parsers, and
  without them a sale date serialises as midnight UTC, the evening before.
- **`sh cockroach/tests/run.sh` is the check** — 86 assertions against a real
  single-node cluster in Docker, run in Deno because the code under test is an
  edge function's. The comp assertions restate `idx_comps_test.sql`: a comp query
  cannot cross a state line, and an unknown distance is not a near one. On
  2026-10-06 the real archive was imported into a local cluster and `comps`
  returned row-for-row what `idx_comparable_sales()` returns live, distances to
  six decimals, in every case the local data covered.
- **While both databases are written, a CockroachDB failure does not fail the
  sync.** It is recorded in `idx_sold_runs` over there and returned in the
  function's response, and tomorrow's run offers the same rows again. That has to
  be REVERSED at the last step, when Supabase stops holding sold rows: from then
  a failed write is a lost day and must be a red run.
- **`importArchive` and `soldGeocodes` refuse anything but the service role.**
  The feed sync itself still accepts any valid key, as it always has — worth
  tightening once the role of the vault's `idx_sync_service_key` is confirmed.

**The cutover, in order — only step 5 changes what a visitor sees:**

1. Kevin creates the cluster and sets the two secrets (steps in the 2026-10-06
   handover; no AWS account is involved — CockroachDB hosts it).
2. `cockroach/schema/001_idx_sold.sql`, then `002_roles.sql` after the two SQL
   users exist.
3. `{"importArchive":true,"offset":N,"limit":1000}` until `more` is false, then
   let one full night of the sold sync run. Add the `soldGeocodes` cron.
4. Row counts match; `node scripts/valuation-backtest.ts` gives the same answer
   against the new database (it needs a mode for that — not yet written).
5. `SITE.soldData.backend = 'cockroach'`.
6. A week later: the sync stops writing sold rows to Supabase and starts failing
   on a CockroachDB error; then the Supabase-side sold rows, `idx_sold_archive`,
   `idx_comp_pool` and its cron are removed. Kevin runs that deletion himself.

### Rental applications (`/apply`, `/rentals`, `/admin/applications`)

RentSpree's model: the admin creates an invite in `/admin/applications`, shares
`/apply/<token>`, and the recipient creates an account and fills the form. It
replaces the Greater Boston Real Estate Board's **RH101** paper form.

- **The RH101 form is copyrighted by GBREB** (© 1969) and may not be reproduced.
  What ships is our own document collecting comparable information — do not copy
  its layout, wording, or form ID onto the page.
- **No SSN and no bank account numbers**, both of which the paper form collects.
  Storing either is real breach and compliance exposure and nothing here needs
  them; screening that requires an SSN is ordered through a bureau, which takes
  it directly. **Do not add them back** because the paper form has them.
- **No "are you a convicted felon?" question.** Blanket criminal-history
  screening is the subject of active MA and federal fair-housing guidance and the
  1969 form predates all of it. Restoring it is a decision for a broker and
  counsel, not a default. The fair-housing notice in `ConsentsSection` is a real
  obligation, not boilerplate — it names the classes Massachusetts protects
  *today*, which is a longer list than the original.
- **Source of income is a protected class in MA**, which is why the Other Income
  section is optional in full and asks rather than demands.
- **`rental_application_invites` has NO read policy for anon or authenticated.**
  A token is resolved only by the `rental-application-invite` edge function under
  the service-role key, which returns just the label and property. A SELECT
  policy filtered by token would let anyone enumerate the table. Every failure —
  unknown, expired, revoked, claimed by someone else — returns the identical
  `{valid:false}`, because distinguishing them makes the endpoint a
  token-guessing oracle.
- **There is no applicant INSERT policy on `rental_applications`.** Rows are
  created by that same function, which is the only thing that can verify an
  invite; an INSERT policy would let any signed-in user create an application
  with no invite at all.
- **RLS is scoped by row, not by column**, so the applicant's UPDATE policy alone
  would let them set their own status to `approved`. The
  `guard_submitted_rental_application` trigger is what actually restricts them to
  `draft`/`submitted`/`withdrawn` and prevents reassignment.
- **The applicant's edit window closes when REVIEW starts, not at submit**, and
  `isApplicantEditable()` mirrors rule 1 of that trigger. If the two ever
  disagree the applicant sees enabled fields and a save the database refuses.
  It froze at submit until 2026-09-13, which fitted a form where every section
  was required; once everything below the applicant's own details became
  optional the intended flow is to send a PDF and five fields and fill the rest
  in later, and the old rule forbade exactly that. The same change fixed a branch
  that could never run — the trigger permitted the applicant to set `withdrawn`,
  but had already rejected every update where `OLD.status <> 'draft'`, so an
  application could not be withdrawn from the only state anyone would withdraw
  from.
- **`submitted_at` is pinned to the FIRST send, by the trigger.** `submitApplication`
  sets it on every submit, so without that pin each later edit would move the date
  the admin's list sorts by. The consent timestamps deliberately DO re-stamp: the
  applicant is certifying the version that will now be read. A client cannot be
  the thing that decides what either timestamp means, which is why the pin is in
  the database.
- **Withdrawing is not a return to draft**, and the trigger refuses that
  transition. An application that quietly left the admin's list would leave them
  waiting on a decision nobody was going to make. It is a trigger rather than an RLS predicate deliberately: as RLS
  the row goes silently invisible to UPDATE and the applicant sees a successful
  save that changed nothing.
- **The answers live in one `jsonb` column, so
  [src/lib/rentalApplication.ts](src/lib/rentalApplication.ts) is the real
  contract**, not the generated Supabase types. Everything reading or writing an
  application goes through it, the way `submitContact.ts` owns both contact
  forms. `hydrateApplication` merges a stored draft over the empty document with
  `safeParse`, so a draft written before a schema change still opens.
- **Nothing on the draft path may validate against `rentalApplicationSchema`.**
  Two bugs came from this, and both were live in production on 2026-09-13.
  `emptyApplication()` was `rentalApplicationSchema.parse({...})` passing `''` for
  the fifteen `req()` fields — `.min(1)`, so the blank document could never
  satisfy the schema it is the blank document OF. It threw inside
  `hydrateApplication`, so every applicant opening an invite got "Could not open
  the application" and not one could start one. It is now a literal annotated
  `RentalApplicationData`, which makes `tsc` the drift check — stronger than the
  parse pretended to be, and checked at build time rather than in front of the
  applicant. `hydrateApplication` then ended with `safeParse(merged)` falling back
  to the blank document, which for a draft always failed for the same reason: the
  effect was silent and worse than an error, since a draft in the database came
  back as an empty form. It now merges and does not validate — `deepMerge` keeps a
  stored value only where its type matches the blank document's, which is the
  shape guarantee that path actually needs.
- **Only five fields are required, and they are all in the first section.**
  First and last name, date of birth, email, phone — plus the consents at submit.
  Residence, employment, references, household and the unit were required until
  2026-09-13 and are now optional, because the second path this form has to
  support is the applicant who already completed an application on another
  agency's paperwork: the useful thing to do with that is read their PDF, not
  refuse their submission for want of an employer. The Documents section is the
  alternative to answering the questions, which is why it renders SECOND — right
  after the required part and before the optional run — and why nothing in that
  run blocks a submit.
- **`SECTION_GROUPS` is what makes that legible.** The sticky index renders four
  headed runs in document order — what we need, or upload it, the full
  application, sign and send — so the shape of the document is readable before
  any of it is. A section's `group` and the DOM order must agree, or the index
  describes a page that is not there. Nothing in the index or the form says
  "optional" any more (removed 2026-10-06 at Kevin's request, along with the
  "The rest is optional" box); the sections are still optional in the schema,
  which is what actually decides whether a submit goes through.
- **The index's current line comes from `useActiveSection`, not an
  IntersectionObserver.** An observer's callback receives the sections whose
  state just CHANGED, not the ones on screen, so "pick the topmost entry" gave a
  different answer scrolling down than up: on a tall window a short section was
  lit while mid-screen and had handed over to the next by the time it was being
  read, and a jump link lit the PREVIOUS section, whose bottom edge lands exactly
  on the observer's margin (112px scroll-margin minus the 24px gap is 88px).
  The hook asks one question with one answer — the last section whose top has
  reached a line under the navbar — and `jumpTo` holds a clicked section until
  the reader scrolls. [Roadmap.tsx](src/components/Roadmap.tsx) still has the
  old pattern; its steps are tall enough that it has not shown.
- **The required section is a `<div>`, not a second `<form>`.** Only the element
  around the submit button needs to be one; wrapping the applicant's details made
  Enter in a name field submit a document barely begun.
- **Draft and submit validate differently on purpose.** The form's resolver uses
  `rentalApplicationSchema`; the submit-only rules (both consents, a signature
  matching the typed name) live in `submissionSchema` and run once inside
  `submitApplication`. Validating those on every keystroke puts a half-filled
  form permanently in an error state, and autosave must never refuse to save.
- **The PDF is a SECOND rendering of an application, and that is a knowing
  exception.** `window.print()` can save the page as a PDF and Cmd-P still does — but
  JavaScript cannot reach those bytes, so there is nothing to append the uploaded
  documents to, and a merged file is the thing an owner actually gets sent. So
  [applicationPdf.ts](src/lib/applicationPdf.ts) lays the document out again with
  pdf-lib. The mitigation for the duplication is `PDF_FIELDS` plus a check that
  walks the blank document's leaves and asserts every one is covered — 75 of them
  today — so a field added to the schema and forgotten there is caught by a test
  rather than by an owner reading a PDF with a gap in it. Re-run that check after
  any change to the schema.
  - Empty answers are OMITTED and so is a boolean `No`, the same rule the page
    follows: a PDF of forty "—" rows says nothing.
  - Uploaded PDFs are merged page-for-page with `copyPages`, not rasterised, so a
    twelve-page tax return stays readable and selectable. Images are contained,
    never cropped — a licence with its edges cut off is not a copy of a licence.
  - **pdf-lib embeds only PNG and JPEG.** WEBP and HEIC go through a canvas
    first, and Chrome cannot decode HEIC at all, so that path ends in a page
    naming the file rather than in a silently missing document. Same for a
    password-protected PDF and a download that fails.
  - `import('pdf-lib')` is dynamic on purpose. It is ~400 KB, it lands in its own
    chunk, and no prerendered page references it — verified in `dist/` after a
    build, which is where to check it again.
- **One rendering of an application.** `RentalApplicationForm` in `readOnly` mode
  is what the applicant sees after submitting *and* what the admin reads, so the
  admin's copy cannot quietly omit a field the form collects. That is also why
  the print rules in [index.css](src/index.css) style **disabled** inputs: on
  paper the document is a page of them, and left alone they print as grey text in
  grey boxes.
  - **The admin can also EDIT it, behind an explicit "Edit answers" toggle**, and
    it is the same form again rather than an admin-only editor that would have to
    be kept in step with it. The database always permitted this —
    `guard_submitted_rental_application` returns early for `public.is_admin()`, so
    the freeze at submit was never the admin's — but the form opens read-only, so
    turning it on is a deliberate act and a stray keypress while reading somebody
    else's submitted application cannot become a silent edit. `showSubmit` is a
    prop separate from `readOnly` for this: the admin's edits autosave, and there
    is no submit button, because submitting re-stamps the consent timestamps and
    those are the record that a named person authorised a named version. Leaving
    the application re-reads the row, since autosave has already made the copy in
    state stale.
- **There is one Download PDF button and no Print button beside it.** The
  browser's own dialog prints the page on screen, which can never include the
  attachments, so the two buttons produced two different PDFs of the same
  application — a choice nobody should have to make. Cmd-P still prints the page,
  which is why index.css keeps styling the disabled inputs for paper.
- **`/rentals` is the applicant's own applications and the admin does not have
  it.** `listMyApplications` filters on `applicant_user_id`, and that filter is
  NOT redundant with RLS: the applicant policy is scoped to `auth.uid()`, but the
  admin policy beside it is FOR ALL over every row, so for an admin the unfiltered
  query returned every application on the site and the page whose subject is
  "yours" listed other people's. RLS is a ceiling on what a query MAY read, not a
  statement of what it MEANS. The profile menu hides the entry for an admin and
  the page redirects them to `/admin/applications`, so the two copies of the same
  rows cannot be confused — only one of them can correct an application.
- **`signUp` takes a `redirectTo`, and `/apply` passes its own URL.** Confirming
  an email address lands wherever `emailRedirectTo` says, and `AuthContext` hard-
  coded `window.location.origin` — so somebody who signed up from `/apply/<token>`
  confirmed their address and arrived at the HOMEPAGE, with the token in the URL
  they had just left. The client is PKCE with `detectSessionInUrl`, so returning
  to `/apply/<token>?code=…` exchanges the code and the page's effect claims the
  invite. **The URL must be in Supabase's redirect allow-list** (Authentication →
  URL Configuration); anything not matching falls back to the Site URL and the
  homepage problem returns silently. `src/hooks/useAuth.ts` has its own `signUp`
  that `/auth` uses and this change does not reach — see the note about the two
  `useAuth` implementations.
- **`/apply` does not redirect to `/auth`.** That page navigates to the broken
  `/complete-profile` on signup and would lose the token, landing the applicant
  signed in with nothing to apply for. `InviteSignIn` authenticates in place and
  the page's effect claims the invite as soon as a session exists.
- **The `db` escape hatch is gone, and it must not come back.** While
  `types.ts` did not know these tables, `rentalApplication.ts` carried a cast
  scoped to their three names; the types were regenerated on 2026-09-13 and it
  was deleted. Real typing immediately caught both jsonb writes passing
  `Record<string, unknown>` where the column is `Json`. After any schema change
  here, regenerate rather than reintroducing a cast — a blanket `as any` on
  `supabase` is what once switched off type checking for every Supabase call in
  the app.

- **An applicant becomes a CRM contact through a trigger, not the client.**
  `contacts` and its value tables are admin-only under RLS, so the browser that
  has the applicant's name in it is the one thing that cannot file it;
  `trg_rental_applications_crm` fires on the denormalised name/email/phone
  columns, which `saveDraft` already keeps in step. It is tagged `Renter` and the
  source is `Rental Application & <street, town>`, matching the
  `Open House & <address>` convention. `contacts_view` already exposes source,
  birthday and tags, so the CRM needed no change to show any of it.
- **`crm_upsert_contact()` is the ONE find-or-create for a contact.**
  `submit-contact`, `submit-open-house-signin` and `submit-event-signin` each
  carry their own ~250-line hand-rolled copy of that dance; this is deliberately
  not a fourth, and those three should move onto it. Three behaviours in it are
  decisions, not details: it refuses a row with no name or no way to reach
  somebody (an unactionable contact is worse than none); `p_prefer_new` means the
  person typed this about themselves, so an applicant fixing their own phone moves
  the contact onto it while a bulk import never overwrites; and `source_id` is
  never overwritten either way, because it records how somebody FIRST arrived and
  is what the CRM filters on.
- **`p_match_email`/`p_match_phone` are why a correction is not a duplicate.**
  Dedupe keys on current values, so an applicant changing their email AND phone in
  one save has nothing left that matches and forks into a second contact. The
  trigger passes the OLD values for matching only. This was caught by running the
  migration against a real Postgres — the 30 assertions are worth re-running
  after any change here, since nothing in CI covers SQL.
- **The CRM sync can never fail an applicant's save.** The trigger is AFTER, and
  the upsert is wrapped in an exception block that raises a WARNING. Someone
  filling in a form must not be blocked by a duplicate-key race on our side.
- **`tenancy` keeps the address and the unit apart, and `formatTenancyAddress()`
  puts the unit against the STREET, not at the end of the line.** Appending it
  produced two spellings of one address in the same admin list, because what sits
  in `propertyAddress` depends on when the row was seeded: rows from before the
  seeding fix hold the whole formatted property and read "42 Newman St · Unit 3,
  Malden, MA 02148", while rows written since hold the address without the unit
  and read "42 Newman St, Malden, MA 02148 · Unit 3". Same unit, two renderings,
  and an address that renders two ways is an address no list can group. The unit
  now goes after the first comma-separated part — the street line in every shape
  this field has held — so old and new rows read identically without rewriting
  any of them. It also skips the unit entirely when the address already names it
  — seeding passes `withUnit: false` for that reason — and the word-boundary
  check is why a unit of "3" does not match the 3 in a street number.
- **The property is five fields, and `formatProperty()` is the only thing that
  turns them into a line.** `property_address` was one free-text field, which made
  it the one part of an invite that could not be reused — "12 Elm St, Needham MA"
  and "12 Elm Street" are the same unit and no query can tell. It now means the
  STREET line, with `unit`, `property_town`, `property_state` and `property_zip`
  beside it, so `/admin/applications` can offer the properties already used and
  the applicant's tenancy address is seeded complete. Existing invites keep
  working: the three new columns are nullable and `formatProperty` omits what is
  absent. Every display — the invite label, the admin list, the "Applying for"
  card, the seeded tenancy line — goes through that one function, and the edge
  function carries a deliberate mirror of it for the email, because the address in
  the email disagreeing with the address on the page is the failure this prevents.
  Same arrangement as the town/ZIP normalisation shared between
  `sync-listings.mjs` and `fromRow`.
- **The invite's street field suggests addresses from MassGIS**
  ([massgis.ts](src/lib/massgis.ts), [AddressAutocomplete](src/components/admin/AddressAutocomplete.tsx)).
  "151 wash" offers "151 Washington St, Cambridge, MA 02139" and picking it fills
  town, state and ZIP. MassGIS because it is the Commonwealth's own address
  points, free, keyless and CORS-open to kevinhoang.co — Google Places needs a
  billed key, Nominatim's policy forbids autocomplete, the Census geocoder has no
  suggest. The locator ignores both its `location` bias and a town typed after the
  street, so it runs twice: once boxed to Greater Boston/MetroWest, once statewide,
  local first. Suffixes are normalised to USPS abbreviations, which is what makes
  it serve the same purpose as the reuse picker — one canonical spelling per
  address. A building's unit range ("#1-12") is shown as a hint under Unit and
  never written into it. Failure is silent: the field stays plain text.
- **The ZIP field is not `inputMode="numeric"`.** A leading zero is exactly what a
  numeric field eats, and 8 of 10 ZIPs on this site start with one — that is the
  same import bug that once rendered "Newton, MA 2459".
- **`/admin/applications` is one card per property, and an application takes
  its property from its INVITE.** `groupByProperty()` keys on `propertyKey()` —
  the same street + unit + town key the reuse picker uses — read from the invite
  the application was claimed through, never from `tenancy.propertyAddress`.
  That field is editable on the applicant's own form, so two people applying for
  one unit can spell it two ways and would split into two cards; the invite is
  the admin's structured record of what the link was for. The typed address is
  the fallback only for an application whose invite no longer exists. Groups
  sort by their newest application or link. A link created before the address
  became its own field groups by its label, so it will not merge with a newer
  structured link for the same unit — rewriting those rows is a separate
  decision.
- **`previousProperties()` keys on street + unit + town, not on the formatted
  line.** An invite recorded before the zip existed still matches the same unit
  entered later with one; the picker exists to stop the admin retyping an address,
  not to demand they retype it identically. Rent comes back as last time's and is
  a starting point, since it is the field most likely to have changed between
  tenants.
- **Documents are a separate table, and that is what keeps uploads open.**
  `rental_application_documents` is not `rental_applications`, so
  `guard_submitted_rental_application` — which freezes the answers once status
  leaves `draft` — does not freeze the attachments. An applicant can send the pay
  stub they forgot a week after submitting, and someone who filled in an
  application on another agency's form can upload that PDF and type nothing here
  at all. Folding documents into the application row would have made both
  impossible.
- **The `rental-documents` bucket is private, and `getPublicUrl` must never
  touch it.** `property-images` is public-read because a listing photo is
  published anyway; a pay stub is not. Reads go through `documentUrl()`, which
  mints a 300-second signed URL **on click** — a URL fetched when the list
  loaded would be stale by the time anyone used it, and a permanent unguessable
  URL to a tax return is a tax return on the open internet. The bucket is
  created in the migration rather than the dashboard, unlike the two older ones,
  because its `file_size_limit` and `allowed_mime_types` are the real control and
  have to be reviewable — the check in `uploadDocument` only produces the error
  message.
- **The object path never contains the applicant's filename.** It is
  `<application_id>/<uuid>.<ext>`; the original is kept in `file_name` for
  display. The path is keyed on the application and not the uploader so one RLS
  predicate on `storage.objects` covers the applicant and the admin, and a
  co-applicant added later would inherit access from the application.
- **`rental_application_documents` has no applicant UPDATE policy.**
  `admin_note` and `needs_replacement` are the only mutable columns and both are
  the admin's. This is the same lesson as the guard trigger next door — RLS is
  scoped by row, not by column — but here the answer is simply to grant no
  UPDATE rather than to write another trigger. There IS an applicant INSERT
  policy, unlike on `rental_applications`: owning an application row is what
  already required a verified invite, and that is what the predicate checks.
- **`guard_rental_document_count()` is the anti-abuse control, not a captcha.**
  Reaching an INSERT requires a confirmed account that claimed an unrevoked,
  unexpired invite, so this is not a public surface; what it needs is a ceiling
  on what one account can do — 40 documents per application, 12 per kind, 10 in
  any rolling ten minutes. It raises `check_violation` with a readable message,
  which `DocumentsPanel` shows verbatim.
- **`DocumentsPanel` is mounted outside the `<form>`.** A file input inside it
  feeds the `form.watch` subscription that drives the 2s autosave, and Enter in
  the "what is it?" label field would submit the application. That is why
  `RentalApplicationForm` closes its `<form>` after `ConsentsSection` and opens a
  second one around the submit button.
- **`documentUploads` is a separate prop from `readOnly`** for the same reason
  the tables are separate: `/rentals` shows a submitted application with every
  answer disabled and uploads still working.
- **The invite email is sent by the `send` action, which is admin-only and takes
  an invite id — never an email address.** `resolve` is public and `claim` needs
  only a session, so the one action that sends mail cannot lean on either; it
  checks `app_metadata.is_admin` off the JWT-resolved user, the same flag
  `public.is_admin()` and `AuthContext` read. Taking the id means the function
  looks the recipient up itself, so it cannot be used to mail an arbitrary
  person. The link's origin comes from the admin's browser so a preview
  deployment mails a link to itself, and anything not matching `*.kevinhoang.co`
  falls back to the canonical site. `sent_at` is stamped after a successful send;
  a failed stamp is logged and still reports sent, because the mail did go.
- **Several applicant emails means several invites, never one shared link.**
  The invite form takes up to six addresses (2026-10-08) and creates one invite
  and sends one email per address. An invite is claimed by the first account
  that opens it and is `{valid:false}` to everyone after, and each roommate is
  an applicant with their own income, references and signature — so a shared
  link would be a link only one of them could use. They arrive together because
  an application takes its property from its invite. The same address typed
  twice is one link; on a partial failure the form keeps only the addresses
  that got none, so retrying does not invite the others twice.
- **Copy link stays next to Send email.** Mail bounces, and a link the admin can
  paste into a text is the fallback that depends on nothing working.
- **The admin is emailed when an application is submitted, by
  `rental-application-submitted`.** The recipient is hardcoded in the function
  and nothing in the request can influence it: the caller sends an application id
  and every name, address and figure in the message is read back out of the
  database under the service-role key — the same shape as `send` taking an invite
  id rather than an address. It refuses anything that is not a *submitted*
  application the caller owns (or an admin's), and it returns one refusal for
  "does not exist" and "is not yours" so the endpoint cannot be used to find out
  which ids are real. `replyTo` is the applicant, because replying is almost
  always the next thing to do.
  - **`admin_notified_at` is what separates a re-send from a double-submit.** An
    applicant can edit and re-send until review starts and the updated version IS
    worth a second email; the same email thirty seconds later is a form submitted
    twice. Ten minutes is the line.
  - **It is invoked from `submitApplication` and can never fail the submit.** The
    row is already written when it runs; raising there would tell somebody their
    application had failed when it had not. A missed notice costs Kevin nothing
    but reading `/admin/applications` instead of being told.
  - **The guard trigger now exempts `service_role`, and that is not cosmetic.** An
    edge function under the service-role key bypasses RLS but NOT triggers, and
    `public.is_admin()` resolves `auth.uid()`, which is NULL there — so every rule
    applied to our own server and rule 6 silently discarded the stamp the notifier
    had just written. Silently, because a BEFORE trigger assigning to `NEW` is not
    an error: the UPDATE reports success and changes nothing.
  - **Rule 6 keeps `admin_notified_at` out of the applicant's hands** for the same
    reason `status` is not theirs — RLS is scoped by row, not by column.
    Suppressing the email announcing your own application is a self-defeating
    thing to want, which is exactly why nobody would notice it happening.
- **The invite prefills the applicant's email, so they supply name and phone.**
  `seedFromInvite` seeds `applicant.email` from the invite only when the field is
  blank — someone who signed up with a different address keeps theirs. This is
  why `inviteeEmail` is part of the `offer` the edge function returns; it is the
  address that person was already mailed at, and it leaves only for a token that
  resolved.
- **The credit report is the ONE required document, and the requirement lives in
  the component, not in `submissionSchema`.** Everything else stays optional on
  the original reasoning — a blocked submit over a missing pay stub is a worse
  outcome than an application you can ask about, and a person applying entirely
  by PDF has no form to submit at all, so no document requirement can reach
  them. The credit report is different because it is the one thing no other
  agency's paperwork carries across. `REQUIRED_DOCUMENT_KINDS` is derived from
  the `required` flag on `DOCUMENT_KINDS`, `DocumentsPanel` reports its list up
  through `onDocsChange`, and `RentalApplicationForm` refuses the submit and
  scrolls to the section. It is deliberately NOT in `submissionSchema`: a file is
  not a form value, so validating it there would put react-hook-form's resolver
  in an error state over something no field on the page can clear. The check runs
  once, at submit, next to where the submit-only consent rules run.
- **`DOCUMENT_KINDS` carries the credit-report instructions as `steps`.** "Upload
  your credit report" is the line applicants come back with questions about, so
  the Experian click path renders open on the page — not behind an accordion,
  which would hide the answer behind the step somebody is stuck on. The copy asks
  for ONE report from any of the three bureaus, not all three, and points at
  annualcreditreport.com, which is the federally authorised source; it is the
  applicant pulling their OWN report, which is why this still needs no SSN.
- **The requirement is stated in ONE place, next to the button it affects.** No
  "Required" badge on the section and no alarm over the empty one — a form that
  labels its own sections as demands reads as a gate rather than a request, and
  the applicant is being asked for their financial records by somebody they have
  not met. The section asks plainly and gives the steps; the line above the
  submit button names what is outstanding, in bone-and-champagne rather than the
  amber reserved for a file that has actually been rejected. The button stays
  enabled either way: a disabled control with no explanation is what people write
  in about.
- **`DOCUMENT_KINDS` is a plain annotated array, not `as const`.** The `id` union
  is declared beside it and mirrors the `kind` CHECK constraint in the migration,
  which is the real closed set. Deriving the union from the literal made the
  optional `required`/`steps` fields unreadable on the union of entry types.

### Open house sign-in (`/open-house`)

- **The address field finds the listing, and the guest's email links to it.**
  [ListingLookup](src/components/admin/ListingLookup.tsx) suggests active
  listings for a typed address or a pasted MLS number (`suggestListings()` in
  [idxSearch.ts](src/lib/idxSearch.ts)); choosing one stores the MLS number on
  the sign-in and puts a card for that home — photo, price, a button to
  `/search/<mls>` — in the confirmation email. Before 2026-10-06 the email named
  an address and linked to nothing, so the guest looked the house up on Zillow.
  A house not in the feed is still typed by hand and simply carries no link.
- **`open_house_sign_ins.mls_number` is nullable and has NO foreign key.**
  `idx_listings` is a cache: idx-sync deletes a row the moment MLS PIN stops
  sending it. A foreign key would either block that delete, which is a
  compliance problem, or cascade it into the sign-in and erase a lead because a
  house sold.
- **The listing in an email is read on the server, by MLS number, never taken
  from the request.** `submit-open-house-signin` is callable with the anon key,
  so a card built from the request body would let anyone send mail under this
  name with any photo and any link. A number that is not in the feed is neither
  stored nor linked. The same function used to interpolate visitor-typed fields
  raw into Kevin's notification email; they are escaped now.
- **[listingEmail.ts](supabase/functions/_shared/listingEmail.ts) is the one
  listing card for email**, shared with the showing schedule. It names the
  listing office, because an email showing the photo and price is an IDX display
  like any other. Its `formatPrice`, `formatBaths`, photo URL and status labels
  are deliberate mirrors of the app's — an edge function cannot import from the
  bundle. Links use `www.`, which skips the apex's redirect, and carry
  `utm_source=open-house` so GA4 can say how many guests came back.
- **[SuggestInput](src/components/admin/SuggestInput.tsx) is the one
  suggest-as-you-type field.** `AddressAutocomplete` (MassGIS) and
  `ListingLookup` (IDX) are thin wrappers that supply a source and a row. Its
  `worth`/`suggest`/`valueOf`/`keyOf` props are read in an effect, so pass
  module-level functions — an inline arrow restarts the request every render.

### Saved homes and recommendations (`/saved`, `/admin/activity`)

A signed-in visitor can press the heart on any listing; `/saved` lists what they
saved, what to look at next, and what they opened recently. Kevin reads the same
data per client at `/admin/activity`.

- **The admin can see every client's saved and viewed homes, and the site says
  so** — one paragraph at the foot of `/saved` and a section in the privacy
  policy. That visibility is half the point of the feature; the disclosure is
  what makes it one Kevin can use. Do not remove either without the other.
- **Every row carries a snapshot, and the DATABASE writes it.** `idx_listings` is
  a cache: a home leaves it the day it goes under agreement, which is exactly
  when a saved home becomes interesting. So `listing_favorites` and
  `listing_views` keep address, town and price — copied from `idx_listings` by a
  BEFORE INSERT trigger and by `record_listing_view()`, never accepted from the
  browser. A client that wrote its own snapshot could put any address and price
  into the list Kevin reads as "what this client is looking at". `saveListing()`
  sends an MLS number and nothing else.
- **There is no write policy on `listing_views`.** A view is recorded only by
  `record_listing_view()` (SECURITY DEFINER), because an increment cannot be
  expressed through PostgREST's upsert and a write policy would let a browser set
  its own count. There is no UPDATE on `listing_favorites` at all — RLS is scoped
  by row, not by column, so granting none is how the snapshot stays honest.
- **Both functions are revoked from `anon` and `authenticated` BY NAME** and
  granted back deliberately; `admin_client_activity()` reaches `auth.users`, so
  its admin check is its first statement. `sh supabase/tests/run.sh` asserts all
  of this — 31 assertions, mostly about what one account must not be able to do
  to another's. Re-run it after any change to that migration.
- **`listFavorites` and `listViews` filter by user even though RLS already
  scopes a visitor to their own rows.** The admin's policy is every row, so
  without the filter Kevin's own `/saved` would list what every client saved —
  the mistake `/rentals` made with applications.
- **The admin's own browsing is never recorded.** `SearchListing` skips
  `recordView` for `isAdmin`: Kevin opens listings all day for other people, and
  his history would be his clients' tastes averaged together.
- **[recommendations.ts](src/lib/recommendations.ts) is pure**, like
  `valuation.ts`, and `node scripts/recommendations-check.ts` runs it against
  histories whose right answer is known. A profile is four readable statements —
  up to three towns, a property type, a price band, a bedroom count — not a
  similarity score. Three decisions in it are measured rather than tasted:
  rentals and sales are separate markets and the band is computed inside one; the
  band is the 20th–80th percentile BY WEIGHT, so one dream house does not move
  it; and repeat views weigh by square root, so a home reopened 25 times counts
  as five, not as the whole history. A saved home counts as four views.
- **A null profile is a real answer.** With nothing priced and located in the
  history the page says so and recommends nothing, rather than falling back to
  "popular listings" — the site's taste presented as the visitor's.
- **Recommendations run one query per town**, each an equality on town + state +
  type with a price range and `ORDER BY list_price DESC NULLS LAST` — the shape
  the per-town partial indexes serve. `town IN (…)` would sort every match. State
  is filtered because town names are not unique in the feed.
- **The heart is a SIBLING of the card's link, never inside it.** A `<button>`
  in an `<a>` is the same invalid nesting as the nested-`<a>` hydration failures.
  `ListingCard` is a wrapper holding the link and an overlay the size of the
  photograph; `group` moved to the wrapper with it. Sold listings get no heart.
- **Signing in returns to the listing through `sessionStorage`, not `?next=`**
  ([authReturn.ts](src/lib/authReturn.ts)). A URL parameter is something a
  stranger can put in a link, which makes the sign-in page an open redirect; this
  value is written only by our own code from the browser's own `location`. It is
  validated on the way out regardless.
- **A saved home that has left the feed is drawn from its snapshot and says so.**
  It is not a link — there is no page behind it — and it keeps "Remove".

### Showing tours (`/admin/showings`)

Admin only. Kevin types each MLS number (or address) and the time he booked;
the page puts the stops in order and turns them into one schedule for the
client, with a link to each home on this site.

- **Nothing is looked up but the listing.** MLS PIN's IDX download carries no
  open-house schedule and no showing availability, so every time on a tour is
  one Kevin typed. Do not build anything that claims to find them.
- **A tour is a LIST of people, in one jsonb column (`showing_tours.clients`).**
  It was one client in three columns until 2026-10-08, which made a couple
  either one name field holding two people or two tours for the same Saturday.
  Each person has a name and whatever reaches them; the greeting names all of
  them ("Hi Tammy and Matthew") and the email goes to everyone with an address,
  on one To line. A column rather than a child table because the people are
  edited as a set and saved with one UPDATE — and because the single-request
  write for a child table is an upsert, which fires BEFORE INSERT triggers for
  rows that did not change (the idx_price_history defect). `showingTours.ts` is
  the contract for its shape, the way `rentalApplication.ts` is for an
  application's.
- **Anyone on a tour who is not in the CRM is filed there on save, by a
  trigger** (`showing_tour_people`), through `crm_upsert_contact()`. Kevin asked
  for this on 2026-10-08: a client typed into a tour was otherwise a person the
  CRM had never heard of. Four things in it are decisions:
  - **`p_prefer_new` is FALSE.** A tour adds people and fills blanks; it never
    overwrites. The case that settles it is a couple sharing an email — under
    TRUE the second of them matches the first's contact and renames it.
  - **Only a person who is new or changed is filed.** Otherwise editing a note
    re-files everybody, and a contact Kevin deleted from the CRM comes back.
    Someone NOT yet filed is offered again on every save, which is how tours
    older than the migration, and a person who gains a last name later, get in.
    The migration itself filed nobody.
  - **The rule for who can be filed is `crm_upsert_contact`'s own:** a first
    AND last name, and an email or ten-digit phone. "Tammy" with a phone is
    fine on a tour and is not a contact yet. `canFileInCrm()` mirrors that rule
    only to choose the line shown under a row.
  - **`contactId` is the database's to write.** The trigger ignores whatever the
    browser sends in that key, so "In your CRM" under a name is its answer.
    Each person's `id` is made up once by the browser and kept; it is how a
    corrected phone number is told apart from a different person.
- **`crm_upsert_contact()` was callable with the public key until 2026-10-08.**
  Supabase grants every new function to `anon` and `authenticated` BY NAME and
  the migration that created it never revoked them, so anyone could write to
  the CRM — and with `p_prefer_new`, move an existing contact onto another name
  and phone. It is `service_role` only now; its callers are SECURITY DEFINER
  triggers and are unaffected. The same check is worth making on any function
  added here: `has_function_privilege('anon', …)` in a test, as
  `showing_tours_test.sql` does.
- **Two ways out, and neither needs the other.** `showing-schedule` has two
  actions: `send` emails the client (calendar file attached, Kevin on cc) and
  stamps `sent_at`; `preview` returns the same schedule as a text message and
  as the email's HTML and SENDS NOTHING. "Text message" calls `preview` — Kevin
  copies the text or opens it in Messages (`smsHrefTo`) and sends it from his own
  phone. A tour needs everyone named and an email OR a phone for at least one
  of them; the trigger enforces that. With two or more phone numbers there is
  one link per person and a group link — the group form (`smsHrefToGroup`) is
  one Apple does not document, so the per-person links are never replaced by it.
- **One renderer, on the server.** The text and the email are built from the
  same resolved stops in one call. A second renderer in the browser for the text
  is how a client gets an email that says 10:00 and a text that says 10:30.
- **The function takes a tour ID and nothing else**, the same shape as the
  rental invite's `send`: the recipient and every word are read from the
  database, so it cannot be used to mail an arbitrary person. It checks
  `app_metadata.is_admin` itself; the tables are `public.is_admin()` FOR ALL and
  revoked from `anon`.
- **Dates and times are wall-clock values**, `DATE` and `TIME`, never an
  instant. `new Date('2026-10-10')` is midnight UTC — the evening of the 9th
  here — so both the page (`formatTourDate`) and the function (`longDate`) build
  the date in UTC and format it in UTC. The calendar file carries
  `TZID=America/New_York` with the zone defined in the file, and `METHOD:PUBLISH`
  rather than `REQUEST`, which would make mail clients show accept/decline.
- **Listings are re-read from the feed when the schedule is built**, so a price
  cut between booking and sending is the price in the message. The snapshot on
  each stop is what prints when a listing has left the feed. A home that was
  never in it is still a valid stop; it just has no link.
- **The text has no driving-route link; the email does.** A Maps URL through
  three addresses is about three hundred characters, all of it visible in a text.
- **A preview is thrown away when the tour changes**, and the details form says
  when it has unsaved edits. The worst outcome on this page is texting a schedule
  that describes the tour as it was two edits ago.

### Transactional email

Two senders, and only one of them is ours today.

- **Our own mail goes through Resend** from `Kevin Hoang <contact@kevinhoang.co>`
  — five edge functions now (`submit-contact`, the two sign-in functions,
  `rental-application-invite`'s `send` action, and `rental-application-submitted`). `RESEND_API_KEY` is a project
  secret; each function no-ops with a readable error without it.
- **Supabase Auth's own mail** — confirm signup, password reset, email change —
  does NOT go through Resend by default. It ships from
  `noreply@mail.app.supabase.io`, a shared domain unrelated to this site, with an
  unstyled one-line body. It reads as phishing next to the invite email that
  brought the person here, and that shared sender is rate-limited to a handful of
  messages an hour, so it is also a signup failure waiting for a busy day.
- **The templates live in [supabase/templates/](supabase/templates/)** and are
  wired up in `supabase/config.toml`, so they are reviewable and versioned rather
  than only existing in a dashboard field — the same argument as creating the
  `rental-documents` bucket in a migration. `supabase config push` applies them to
  the linked project. They use Supabase's own `{{ .ConfirmationURL }}` /
  `{{ .Email }}` / `{{ .NewEmail }}` variables, not ours.
- **`[auth.email.notification.*]` is a DIFFERENT mechanism from
  `[auth.email.template.*]`, and the difference is the point.** A template is
  transactional: something is pending and the mail carries the link that
  completes it. A notification is a notice — the change has already happened, and
  the mail exists so the person it happened TO finds out. They are **off by
  default**, which means a stolen session could change a password and leave no
  trace anywhere the account holder would see. `password_changed` and
  `phone_changed` are enabled here; Supabase also supports `email_changed`,
  `mfa_factor_enrolled`, `mfa_factor_unenrolled`, `identity_linked` and
  `identity_unlinked`. Variables are `{{ .Email }}`, `{{ .SiteURL }}`,
  `{{ .Data }}`, plus `{{ .Phone }}` / `{{ .OldPhone }}` on the phone one.
- **A security notice carries NO button.** Both of these end with the site
  address to type by hand, not a link to click. A mail that says "your password
  changed — click here if this wasn't you" teaches precisely the habit the next
  phishing email depends on, and the reader's safe route is one they already
  know. The phone notice shows the old number as well as the new, because "your
  number changed" tells somebody who did not change it nothing they can act on.
- **The template is the smaller half.** What makes an email look legitimate is the
  sender matching the domain the link points at. Custom SMTP pointed at Resend
  with `contact@kevinhoang.co` is the fix — that address is already verified
  there, so SPF and DKIM align — and it also lifts the rate limit. It is
  configured under Authentication → SMTP Settings, host `smtp.resend.com`, user
  `resend`, password the same API key. Do not put the API key in `config.toml`.

### Videos (`/videos`)

The Instagram reels, watchable in a modal without leaving the site.

- **The reels are never hosted here.** They stay on Instagram — their
  bandwidth — and the site holds only a committed 720px poster frame plus our
  own title and description per video. Supabase Storage is deliberately not
  involved: video is orders of magnitude heavier than photographs, and hosting
  it there would repeat at far greater cost the egress mistake `/properties`
  made with 339 full-resolution PNGs.
- **Instagram's player loads on CLICK, never on page load.** Radix unmounts
  closed dialog content, which is a problem for FAQ answers and exactly the
  behaviour wanted in [VideoLightbox.tsx](src/components/VideoLightbox.tsx):
  until someone opens a video, `/videos` has made no request to instagram.com at
  all. That is the whole trade that makes the one third-party embed on an
  otherwise first-party site affordable — the site links out to Google Maps
  rather than embedding it for the same reason. Verify it in DevTools after any
  change here.
- **Thumbnails cannot be hotlinked.** An Instagram permalink carries no image,
  and the real thumbnail is a signed `scontent.cdninstagram.com` URL that expires
  within days. `public/videos/` is generated output built by
  `scripts/generate-video-posters.mjs` from hand-saved screenshots in
  `public/videos/_src/` — never hand-edit it, and re-run the script after adding
  a reel. It is not in `npm run build`, for the same reason `sync-listings.mjs`
  is not. It reads ids out of `videos.ts` by regex and strips **both** comment
  styles first: stripping only `//` picked the example id out of that file's own
  doc block and reported a missing screenshot for a video that does not exist.
  Posters are 720px WebP and the social card is cropped `position: 'top'` —
  a centre crop of a 9:16 frame lands on somebody's torso.
- **`title` and `description` are ours, not the Instagram caption.** A pasted
  caption is emoji and hashtags — not indexable text, and it reads badly on a
  light page. This copy is the only prose on the page and the content rules
  apply to it in full.
- **The card is a real `<a>` to the reel**, upgraded to the modal by a click
  handler that leaves modified clicks alone. With JS off, or for a crawler, it
  is still a working link. Nothing may nest inside it — see the no-nested-`<a>`
  rule above.
- **The page emits `person()` as well as `agentIdentity()`**, because
  `videoObject().creator` references `#kevin`, and an `@id` only resolves
  against a node declared in the same document.
- **An empty `videos` array renders an honest empty state**, not placeholder
  cards, and the poster script refuses to prune when it reads no entries.

### The Vietnamese tree (`/vi`)

- **Real prerendered routes, one per entry** in
  [src/lib/viRoutes.ts](src/lib/viRoutes.ts) with the English page each one
  pairs with — thirteen since 2026-09-27. They exist because the language
  toggle swaps copy *after* hydration — so before this, not one word of
  Vietnamese appeared in any prerendered document and no crawler had ever seen
  any of it. The toggle still works everywhere else; `/vi` supersedes it only
  for the paired pages.
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
- **The desktop menu pairs each English page with its Vietnamese one, on the same
  line** (`PANEL_ROWS` in [Navbar.tsx](src/components/Navbar.tsx)). It was the
  English links, then all eleven Vietnamese ones beneath — twenty rows, taller
  than a laptop screen. The rows are derived from `VI_ROUTES`, so a new
  Vietnamese route arrives beside its English page without being listed twice.
  Both columns carry a heading ("English", "Tiếng Việt"); a heading over one
  column only read as a layout mistake. Since `/vi/bai-viet` and
  `/vi/dich-vu-tieng-viet` were added every English row has a partner.
- **`/vi/dich-vu-tieng-viet` shares its copy with the English page's toggle**
  through [src/data/viServices.tsx](src/data/viServices.tsx); only the links
  differ. It has its OWN h1 and title because the toggle copy's h1 is the `/vi`
  homepage's h1 word for word, and it leaves out the two FAQ questions `/vi` and
  `/vi/cau-hoi-thuong-gap` already answer.
- **`/vi/bai-viet` does not translate the blog.** Like `/vi/khu-vuc`, it
  describes the English posts by topic in Vietnamese and links to them. Topics
  are assigned by slug in `ViBlog.tsx`; titles are read from `blogData`, and a
  post assigned to no topic falls into a last "Bài viết khác" group rather than
  disappearing. `BlogPost` has `titleVi`/`excerptVi`/`contentVi` for posts
  translated properly, one at a time.
- **The town guides are deliberately NOT translated.** Seventeen near-identical
  translations is the scaled-content shape this corpus was cleaned of once.
  `/vi/khu-vuc` describes them and links out to the English guides instead.

## The calculator (`HomeCalculator`)

- **One calculator in three places**: every listing page (`ListingPayment`),
  `/calculator`, and `/vi/cong-cu-tinh-toan`. Three views — living in it, renting
  it out, selling it. Until 2026-09-27 `/calculator` ran a separate
  `RealEstateCalculators` (sliders in cards, own arithmetic, 147 i18n keys, no
  PMI or cap rate) and listings had no seller view; it was deleted. The
  arithmetic is in [@/lib/mortgage](src/lib/mortgage.ts) and
  [@/lib/sellerProceeds](src/lib/sellerProceeds.ts); the component owns only UI.
- **Its words are literal strings in
  [copy.tsx](src/components/calculator/copy.tsx), never `t()`**, with the
  language passed as a prop — that is what lets `/vi/cong-cu-tinh-toan`
  prerender a working Vietnamese calculator instead of linking to an English
  one. One `CalculatorCopy` interface types both languages, so a label added to
  one and forgotten in the other fails the build. `/calculator` follows the
  toggle after mount; a listing page is always English, like the rest of it.
- **The seed says where each number came from** (listing, missing, or example),
  and the hints follow it. On `/calculator` every opening figure is an example
  and the intro says so before any number does.
- **The Massachusetts deed excise is $2.28 per $500 of price** (c.64D §1 plus
  the 14% surtax; DOR Directive 95-4, checked 2026-09-27), customarily the
  seller's. Barnstable County's rate is NOT modelled — official sources disagree
  on it — and the UI sends Cape sellers to their attorney. Commission opens at
  `SITE.assumedSellerCommissionRate`, dated and labelled as an assumption.

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

### Two faces, and the homepage uses only one of them

`font-display` is Playfair Display and `font-sans` is Inter; both load from the
one Google Fonts stylesheet in [index.html](index.html), so choosing between them
costs no request.

The landing-page heroes are set in the serif. **The homepage is not** — as of
2026-09-13 there is no `font-display` anywhere on it, verified against the built
`dist/index.html`. The h1 is full caps at `lg:text-7xl` over a photograph, and
Playfair is a high-contrast transitional serif: at that size its hairlines and
ball terminals are doing a great deal of work against a moving background, where
Inter's even weight simply reads. It also takes the LCP element off the serif.
The four section h2s — About, Stats, Reviews, Contact — went with it, because a
serif heading between two sans ones reads as a page assembled from two designs,
which this site genuinely was until 2026-08-27.

**All five are letterspaced, and positive tracking is the point.** Caps are one
height with flat sidebearings, so a line of them at a text face's default fit
reads as a wall; the h1 carried `tracking-tight`, which is tuned for mixed-case
display type and is exactly wrong here. Section h2s take `tracking-widest`
(0.1em) and the h1 `tracking-wider` (0.05em) — tracking comes DOWN as size goes
up, and the h1 is twice their size. Both stay well short of the 0.15–0.3em the
eyebrows use, so the hierarchy between an eyebrow and a heading survives. The
h1's leading went up alongside it: letterspaced caps need the extra air or the
block closes back up vertically.

Every one of these strings is already uppercase in `en.json` **and** `vi.json`,
so the tracking is not applied to mixed-case text in either language.

Related: `.numeral` in [index.css](src/index.css) exists because Playfair ships
old-style figures, so no number goes in the display face either.

### One chrome

[PageShell.tsx](src/components/PageShell.tsx) owns the dark hero, breadcrumbs, eyebrow,
h1, lede, credential strip and CTA band. `LandingPage`, `ViPage`, `/about` and `/faq`
sit on top of it; before this each had hand-copied the same class strings, and the dark
CTA band alone existed in four places. It also makes the BreadcrumbList rule structural:
the shell renders the visible trail and emits `breadcrumbs(crumbs)` from the same array,
or renders neither — there is no longer a way to ship one without the other.

**A page's body must go through `ShellSection`, not straight into `PageShell`'s
children.** `PageShell` renders `{children}` raw — it owns the hero, not the
column — so a page that passes its body directly renders full-bleed: no
horizontal padding, and no `max-w-*` cap, which is exactly the uncapped ~1368px
measure the two-widths rule exists to prevent. `/apply` and `/rentals` did that
until 2026-09-13, and it showed up as the application's sticky section index
sitting against the window while the same form inside `AdminShell` looked right.
`ShellSection` takes `width`, `className` and `inner`, so a page with its own
background or spacing still goes through it rather than hand-rolling
`container px-4`.

Padding lives in `PageShell` alone: its three containers are
`px-4 sm:px-6 lg:px-8`. `px-4` on its own is what every page used to carry, and
it OVERRIDES the container's configured `2rem` (utilities beat components), so
the configured gutter had never applied anywhere. `/faq` still hand-rolls
`container px-4` around the same sticky-sidebar layout and so keeps the old 16px.

**A dark button highlights in champagne, never in a different black.**
`bg-ink-deep text-white hover:bg-champagne hover:text-ink-deep` is the pair on
every dark button on a light surface. The admin's body buttons carried
`hover:bg-black/80` — a hover nobody could see — until 2026-10-08; they read
`ADMIN_BUTTON` from [AdminShell.tsx](src/components/AdminShell.tsx) now. A few
public ones still have the old hover (both contact forms, `/auth`, `/rentals`,
`/saved`, `/apply`, `/first-time-buyers`).

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
- **Never advise waiving a home inspection.** Since 2025-10-15, [760 CMR
  74.00](https://www.mass.gov/info-details/residential-home-inspections) (from the
  Affordable Homes Act, c. 150 of the Acts of 2024) bars a Massachusetts seller or
  listing agent from conditioning acceptance of an offer on an inspection waiver, or
  accepting an offer that requires one. Six posts recommended it as a competitive
  tactic until 2026-08-28; they were corrected and now point at
  `massachusetts-home-inspection-waiver-law`. A buyer may still decline to inspect
  once under agreement as their own uninfluenced decision — that is the only version
  that is still accurate. Waiving the *appraisal* or *financing* contingency is
  unaffected and is still discussed throughout.
- **Review / AggregateRating schema is intentionally not implemented.** Google
  disregards self-serving review markup on an organization's own page regardless
  of authenticity, and publishing unverifiable testimonials as machine-readable
  review claims carries manual-action risk plus FTC exposure (16 CFR Part 465).
  Verified Google Business Profile reviews are the correct vehicle.

## Gotchas

- **Adding an npm dependency means rebuilding the dev container.**
  [docker-compose.yml](docker-compose.yml) mounts `- /app/node_modules` as an
  anonymous volume, which deliberately MASKS the host's `node_modules` so a macOS
  install cannot leak into the Linux container — and therefore installing on the
  host is invisible inside it. The symptom is Vite's
  `Failed to resolve import "<pkg>"` from a file that is plainly correct, with a
  `/app/...` path in the trace. `docker compose up --build` (the Dockerfile runs
  `npm install` at build time) or `docker compose exec app npm install`.
- **A migration version must be UNIQUE, or `supabase db push` is permanently
  blocked.** Two files shared `20240320000000` until 2026-09-13. The remote
  history records one row per version, so the second file could never pair with
  one, showed as pending forever, and — its version sorting before the last
  applied migration — made every push demand `--include-all`. Renaming it to a
  free version and repairing it fixed it. `ls supabase/migrations | sed 's/_.*//'
  | sort | uniq -d` should print nothing.
- **`supabase db push` answering `unexpected login role status 401` means a
  stale token, not a missing password.** The CLI loads the repo's `.env`, and
  the `SUPABASE_ACCESS_TOKEN` there (expired as of 2026-10-06) overrides the
  CLI's own stored login for the `db` and `migration` commands. Prefix them with
  an empty value — `SUPABASE_ACCESS_TOKEN= npx supabase db push` — and the stored
  login is used instead. `functions deploy` and `gen types` need the same prefix
  once that variable is exported into the shell.
- **A migration applied by hand in the SQL editor still has to be recorded.**
  `supabase migration repair --status applied <version>` writes the history row
  without re-running the file; otherwise the CLI keeps offering to apply it and
  the same "inserted before the last migration" refusal comes back.

- `npm run build` runs `typecheck` first, and that is load-bearing: the old
  `vite build` skipped `tsc` entirely, which masked a real bug (the CRM contact
  CSV exported a blank "Sources" column because it read `contact.sources` after
  the field was renamed to `source`).
- **Conversion tracking is delegated, not per-anchor.**
  [Analytics.tsx](src/components/Analytics.tsx) listens on `document` for clicks
  on any `tel:`, `sms:` or `SITE.appointmentUrl` link — there are ~25 across 12
  files and no two share a className, so wrapping each would risk a styling
  regression per site and silently miss any added later. Event names and the
  referrer classifier live in [src/lib/analytics.ts](src/lib/analytics.ts);
  `traffic_source` must be registered as a GA4 custom dimension or it is
  collected but not reportable. See [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md).
  **No tool can report the query behind an AI-assistant visit** — assistants send
  no query and often no referrer, so `ai_*` counts are a floor, not a measurement.
- **Every phone field formats through `formatPhoneInput()` in
  [phone.ts](src/lib/phone.ts), and none may set `maxLength`.** A pasted
  "+1 (203) 379-8682" came out as a different number until 2026-10-09, for two
  reasons that hid each other. The country code was kept as the first digit and
  the number cut to ten from the front (120-337-9868). And five fields carried
  `maxLength={12}`, which the browser applies to pasted text BEFORE `onChange`
  runs, so the formatter was handed "+1 (203) 379". `phoneDigits()` drops a
  leading 1 — no North American area code starts with one — and there were six
  private copies of the formatter, now one. `node scripts/phone-check.ts`
  covers the function; the `maxLength` half only shows in a real browser.
- **Both contact forms submit through
  [src/lib/submitContact.ts](src/lib/submitContact.ts).** There are two forms —
  `components/Contact.tsx` on the homepage and `pages/Contact.tsx` on /contact —
  and they had diverged badly: /contact's `onSubmit` was a `setTimeout` that
  showed the success toast and reset the fields **without sending anything**, so
  every message written on the page the navbar and footer link to was discarded
  while its sender was told it had been delivered. One transport now, so a fix to
  either reaches both. `generate_lead` fires only after a genuine success.
- **Analytics ship disabled.** [Analytics.tsx](src/components/Analytics.tsx) is
  driven by `SITE.ga4Id` / `SITE.gscVerification`; nothing is injected while they
  are empty. GA is configured `send_page_view: false` with a manual page_view on
  route change, because the app is client-routed after hydration.
- Images: every Unsplash URL must carry `?auto=format&fit=crop&w=<size>&q=<n>` —
  a bare `images.unsplash.com/photo-…` serves a multi-MB original, and the
  homepage hero (the LCP element) was exactly that. Below-the-fold `<img>` tags
  get `loading="lazy" decoding="async"`.
- **`src/integrations/supabase/types.ts` is generated — never hand-edit it.**
  Regenerate after any schema change:
  ```bash
  npx supabase login
  npx supabase gen types typescript --project-id zvipgykolpoxukyjgffx \
    > src/integrations/supabase/types.ts
  ```
  It described only 8 of the 29 tables and views until 2026-08-27, and the mock
  client in [client.ts](src/integrations/supabase/client.ts) was cast `as any`,
  which collapsed the exported `supabase` union to `any` — so **no Supabase call
  anywhere in the app was type-checked**. That cast is now
  `as unknown as SupabaseClient<Database>`; keep it that way. Letting either
  regress turns the whole data layer back into `any`, which is how the CRM CSV
  shipped a blank "Sources" column after `contact.sources` became `source`.
- **`/complete-profile`: the `profiles` table DOES exist.** This entry used to
  say it did not, and that was wrong — checked against the live project on
  2026-09-13, where `public.profiles` exists (empty) with exactly the columns
  [ProfileCompletion.tsx](src/components/ProfileCompletion.tsx) writes, and the
  regenerated `types.ts` now describes it. So the `untypedSupabase` escape hatch
  in that file is removable and the page may simply work; what has never been
  decided is whether a person belongs in `profiles` or in `contacts` with the
  `contact_*` tables, which is the data-model call. `Auth.tsx` navigates here
  after signup, so it is a live path either way.
- **`@supabase/supabase-js` is pinned to `~2.57.4`, and that ceiling is
  load-bearing.** From roughly 2.11x of `@supabase/realtime-js` onward the `ws`
  fallback was dropped in favour of a native `WebSocket`, which Node 20 does not
  have. Since `AuthProvider` sits in the root layout, `createClient()` runs
  during static generation, so a newer version fails the build outright with
  "Node.js 20 detected without native WebSocket support" — on the first page, not
  at runtime. Lifting the pin means moving the build to Node 22+ (here, in
  `docker-compose.yml`, and in Vercel's project settings) or passing an explicit
  `transport` to the client. 2.57.4 carries `@supabase/auth-js` 2.71.1, which is
  what clears CVE-2025-48370.
- **There are two `useAuth` implementations, and the login page uses the one
  you would not expect.** `src/contexts/AuthContext.tsx` owns the session,
  `isAdmin`, and the avatar, and every component reads it via
  `@/contexts/AuthContext`. But [Auth.tsx](src/pages/Auth.tsx) imports
  `../hooks/useAuth` instead — a standalone hook with its own `signIn`,
  `signUp`, `signInWithGoogle` and a duplicate copy of the OAuth
  `sessionStorage` dance. It is not dead code, so it survived the dead-code
  sweep. It is also not currently a bug: `Auth.tsx` destructures only the three
  action functions, never the hook's `user`/`loading`, which is fortunate
  because that local `user` state has no `onAuthStateChange` subscription and
  is write-only. The risk is drift — a fix to the redirect logic in one copy
  will not reach the other. Consolidating means moving `Auth.tsx` onto the
  context and reconciling the return shapes (`{data, error}` with errors caught
  vs. the raw Supabase result), which changes the login path and needs testing
  against a real project.
- **React Router is held at 6.x by `vite-react-ssg`**, whose peer range is
  `react-router-dom ^6.14.1` even at 0.9.2 — it has no React Router 7 support at
  all. Two advisories (CVE-2026-53666, CVE-2026-53669) are fixed only in 7.18.0
  and therefore cannot be resolved without replacing the SSG engine. Neither is
  reachable here: the open-redirect needs attacker-controlled input reaching
  `navigate()`, and the only dynamic target is `oauth_return_path`, built from
  `window.location.pathname` (always browser-normalised, always leading `/`) on a
  route that has no SPA rewrite and so 404s before React mounts. The
  `deserializeErrors()` injection needs attacker-influenced hydration data; ours
  is a build-time literal baked into each prerendered file.
