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

node scripts/generate-icons.mjs          # regenerate favicons + og-image.jpg + og-about.jpg
node scripts/generate-blog-redirects.mjs # rewrite the blog 301s in vercel.json
node scripts/sync-listings.mjs           # refresh src/data/soldListings.ts from Supabase
node scripts/generate-video-posters.mjs   # build public/videos/ posters from public/videos/_src/
```

There is no Node toolchain required on the host if you use Docker:
`docker run --rm -v "$PWD":/app -w /app node:20-alpine npm run build`.

There is no test framework configured. The closest thing to one is the SEO auditor from the
`seo-web` skill, which checks the *built* output and exits non-zero on failure:

```bash
docker run --rm -v "$PWD":/app -v "$HOME/.claude/skills/seo-web/scripts":/skill:ro -w /app \
  node:20-alpine node /skill/seo-audit.mjs ./dist --origin https://kevinhoang.co \
  --private auth,admin,crm,profile,complete-profile,open-house,events,apply,rentals,search
```

The `--private` list must match `PRIVATE_PREFIXES` in [scripts/routes.mjs](scripts/routes.mjs).
`/apply`, `/rentals` and `/search` are `noindex` and out of the sitemap by design, so an
auditor that has not been told they are private reports all three as public pages that are
noindexed and orphaned.

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

**There are exactly TWO rewrites, each scoped to one prefix.** Both exist for
the same reason — a URL whose dynamic segment cannot be known at build time —
and both take the extensionless destination:

- `/search/:path*` → `/search`. An MLS number cannot be prerendered: there are
  ~22,000 active listings and the set changes hourly, so the prerendered
  `/search` shell fetches the listing client-side.
- `/apply/:path*` → `/apply`. A rental-application invite token is generated at
  runtime, so `/apply/<token>` has no prerendered file either.

The destination is `/search` and `/apply`, **not** `/search/index.html`:
`cleanUrls: true` strips the extension, so the explicit file path does not
resolve and every deep URL falls through to the 404. They are scoped to those
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
  application (optional), sign and send — so the shape of the document is
  readable before any of it is. A section's `group` and the DOM order must agree,
  or the index describes a page that is not there.
- **The required section is a `<div>`, not a second `<form>`.** Only the element
  around the submit button needs to be one; wrapping the applicant's details made
  Enter in a name field submit a document barely begun.
- **Draft and submit validate differently on purpose.** The form's resolver uses
  `rentalApplicationSchema`; the submit-only rules (both consents, a signature
  matching the typed name) live in `submissionSchema` and run once inside
  `submitApplication`. Validating those on every keystroke puts a half-filled
  form permanently in an error state, and autosave must never refuse to save.
- **One rendering of an application.** `RentalApplicationForm` in `readOnly` mode
  is what the applicant sees after submitting *and* what the admin reads, so the
  admin's copy cannot quietly omit a field the form collects. That is also why
  the print rules in [index.css](src/index.css) style **disabled** inputs: on
  paper the document is a page of them, and left alone they print as grey text in
  grey boxes.
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

- **`tenancy` keeps the address and the unit apart, so anything showing both
  joins them through `formatTenancyAddress()`.** Seeding put the whole formatted
  property — unit included — into `tenancy.propertyAddress` while
  `tenancy.unit` also held it, so `/rentals` rendered "42 Newman St · Unit 3,
  Malden, MA 02148 · Unit 3". Seeding now passes `withUnit: false`, and the
  formatter skips the unit when the address already names it, so rows written
  before the fix still read correctly. The word-boundary check is why a unit of
  "3" does not match the 3 in a street number.
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
- **The ZIP field is not `inputMode="numeric"`.** A leading zero is exactly what a
  numeric field eats, and 8 of 10 ZIPs on this site start with one — that is the
  same import bug that once rendered "Newton, MA 2459".
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
- **Copy link stays next to Send email.** Mail bounces, and a link the admin can
  paste into a text is the fallback that depends on nothing working.
- **The invite prefills the applicant's email, so they supply name and phone.**
  `seedFromInvite` seeds `applicant.email` from the invite only when the field is
  blank — someone who signed up with a different address keeps theirs. This is
  why `inviteeEmail` is part of the `offer` the edge function returns; it is the
  address that person was already mailed at, and it leaves only for a token that
  resolved.
- **No document is required to submit.** `submissionSchema` is untouched: a
  person applying entirely by PDF has no form to submit, and a blocked submit
  over a missing pay stub is a worse outcome than an application you can ask
  about.

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
- **`/complete-profile` is broken and the types now say so.**
  [ProfileCompletion.tsx](src/components/ProfileCompletion.tsx) reads and writes
  a `profiles` table that does not exist; the schema has `contacts` plus the
  related `contact_*` tables instead. `Auth.tsx` navigates here after signup, so
  it is a live path. It compiles only through a deliberately loud
  `untypedSupabase` escape hatch in that file. Fixing it means deciding where
  the data belongs, which is a data-model call rather than a typo.
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
