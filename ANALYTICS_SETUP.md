# Search attribution setup

Everything here is free. No paid tool is required, and none is recommended —
skip anything that asks for a card.

The code side is already done (`src/lib/analytics.ts`,
`src/components/Analytics.tsx`). What is left is console configuration, which
only you can do because it needs your Google account.

---

## What you can and cannot learn

Worth being clear up front, because the answer differs by source.

| Question | Answer |
|---|---|
| What did someone type into **Google** before clicking? | **Yes** — in Search Console, never in GA4 |
| What did they type into **Bing**? | **Yes** — in Bing Webmaster Tools |
| What did they ask **ChatGPT / Perplexity / Claude / Copilot**? | **No.** Not available anywhere, at any price |
| Did a visit *come from* an AI assistant? | **Partly** — when it sends a referrer |
| Which page did an **AI Overview** click land on? | Only merged into ordinary Google totals |

**Search engines do not pass the query to your site.** They never have. Google
strips it at the redirect; that data lives only in Search Console, aggregated,
capped at ~1,000 rows and with low-volume terms withheld entirely.

**AI assistants pass nothing at all.** No query, and frequently no referrer —
those visits arrive looking identical to someone typing your URL. So the honest
goal is *channel* attribution ("this lead came from ChatGPT"), not *query*
attribution. Any tool claiming to show you AI prompts is inferring them.

---

## 1. Link Search Console to GA4 — 5 minutes

This is the one that answers "what did they search". Both properties already
exist; they are just not talking to each other.

1. <https://analytics.google.com> → **Admin**
2. Under *Product links* → **Search Console links** → **Link**
3. Choose the `https://kevinhoang.co` property, pick the web data stream, confirm
4. Then **Reports → Library**, find the *Search Console* collection, and click
   **Publish** — the reports are created unpublished and are invisible until you do

Two new reports appear: **Queries** (what people searched) and **Google organic
search traffic** (which landing page each query produced).

Search Console itself, at <https://search.google.com/search-console>, remains the
better tool for this — Performance → Queries, with a Pages tab. The link mostly
saves you switching tabs.

## 2. Bing Webmaster Tools — 10 minutes

Worth more than its search share suggests: **Bing's index is what ChatGPT Search
and Microsoft Copilot retrieve from.** Being visible there is an AI-visibility
decision, not a Bing-traffic one.

1. <https://www.bing.com/webmasters> → **Add a site**
2. Choose **Import from Google Search Console** — this carries the verification
   across and saves adding another meta tag
3. Submit `https://kevinhoang.co/sitemap.xml`

Then read **Search Performance** for Bing-side queries.

`scripts/submit-indexnow.mjs` already pings Bing on every deploy, so it learns
about changes quickly — but only once `INDEXNOW_KEY` is set. To enable:

```bash
openssl rand -hex 16                 # generate a key
echo "<that key>" > public/<that key>.txt
```

then set `INDEXNOW_KEY` in the Vercel project's **Production** environment.

## 3. Mark the conversions as Key Events — 5 minutes

The site now sends four events. Until they are marked, GA4 collects them but
does not treat them as conversions.

1. **Admin → Events**
2. Toggle **Mark as key event** for each:

| Event | Fires when |
|---|---|
| `generate_lead` | A contact form submits **successfully** |
| `contact_call` | A `tel:` link is tapped |
| `contact_text` | An `sms:` link is tapped |
| `appointment_click` | The scheduling link is opened |

They will not appear in the list until each has fired at least once. Trigger them
yourself on the live site, then check **Reports → Realtime**.

## 4. Register the `traffic_source` dimension — 2 minutes

**Without this step the AI attribution is collected but not reportable.** Every
event carries a `traffic_source` parameter; GA4 discards unregistered custom
parameters from reports.

1. **Admin → Custom definitions → Create custom dimension**
2. Dimension name: `Traffic source`, Scope: **Event**, Event parameter:
   `traffic_source`

Values you will see:

`ai_chatgpt` · `ai_perplexity` · `ai_claude` · `ai_copilot` · `ai_gemini` ·
`search_google` · `search_bing` · `search_other` · `social` · `referral` ·
`direct`

Data only accrues from the moment you register it — GA4 does not backfill. Do
this early even if you will not look at it for months.

---

## Reading it later

The question worth asking monthly is **"which channel produced leads"**, not
"which produced visits":

- GA4 → **Reports → Engagement → Events**, add *Traffic source* as a secondary
  dimension, look at `generate_lead` / `contact_call`
- Search Console → **Performance**, sort by Impressions rather than Clicks —
  high-impression low-CTR pages are usually a title/description problem, which is
  the cheapest fix in SEO
- Bing Webmaster → **Search Performance**, as the closest available proxy for
  what ChatGPT Search can see

### A caveat on AI numbers

Treat `ai_*` counts as a **floor, not a measurement**. A large and unknowable
share of assistant traffic sends no referrer and is recorded as `direct`. If
`ai_chatgpt` shows 12 visits, the true figure is higher by an unknown factor.
Use the trend, never the absolute number.
