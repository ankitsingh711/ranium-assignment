# Shelf

A book discovery app: search Open Library, view book details, and keep a personal shortlist that survives a page refresh.

Built as a timeboxed (4 hour) practical exercise for Ranium Systems.

## Overview

Shelf lets you search for books by title or author, browse results with cover/title/author/year, open a dedicated detail page for any book (description, publisher, page count, subjects), and shortlist books you're interested in. The shortlist persists in the browser via `localStorage`.

## Features

- Search by title or author against the Open Library Search API
- Loading, empty, and error states for search
- Result cards showing cover, title, author, and first publish year, with graceful fallbacks for missing data
- Shareable/bookmarkable book detail pages at `/books/{workId}`
- Detail page: large cover, description, author, publisher, page count, subjects
- Graceful handling of invalid/non-existent book IDs and API failures, including a 5s request timeout so an unreachable Open Library shows an error instead of hanging
- Automatic in-app fallback to Apple's iTunes Search/Lookup API (ebooks) when Open Library is unreachable, both for search and for a book's detail page — results are shown directly in the app (with a small "Apple Books" badge/notice), not a link out; see Architecture and Tradeoffs
- Add/remove a book from a shortlist, from either the results grid or the detail page
- Shortlist panel (slide-over) accessible from the header, with its own empty state
- Shortlist persists across refreshes via `localStorage`
- Responsive layout (mobile through desktop)
- Basic accessibility: semantic HTML, labeled controls, visible focus states, `aria-pressed`/`role="dialog"` where relevant

## Tech Stack

- [Nuxt 4](https://nuxt.com/) / [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- TypeScript
- Tailwind CSS v4 (CSS-first `@theme` design tokens)
- Storybook 10 (Vue3 + Vite)
- [Open Library API](https://openlibrary.org/developers/api) — no API key required, primary data source
- [iTunes Search API](https://performance-partners.apple.com/search-api) (Apple Books, `media=ebook`) — no API key required, automatic fallback when Open Library is unreachable

## Local Development

Package manager used: **npm**.

```bash
# 1. Clone
git clone https://github.com/ankitsingh711/ranium-assignment.git
cd ranium-assignment

# 2. Install dependencies
npm install

# 3. Run the dev server (http://localhost:3000)
npm run dev

# 4. Run Storybook (http://localhost:6006)
npm run storybook

# 5. Build for production
npm run build
npm run preview   # optional: preview the production build locally
```

Type-check: `npx nuxi typecheck`. Static Storybook build: `npm run build-storybook`.

## Architecture

```text
app/
  pages/
    index.vue           search page
    books/[id].vue       book detail page (route param = Open Library work id)
  components/            presentational + light-logic components
  composables/
    useBooks.ts           search + detail data fetching, maps OL responses -> app types
    useShortlist.ts        shortlist state + localStorage persistence
  types/book.ts           app-level types + the (minimal) raw Open Library shapes
  utils/covers.ts          cover URL / work-id helpers
  assets/css/main.css      Tailwind v4 import + design tokens (@theme)
stories/                  Storybook stories (SearchBar, ShortlistButton)
.storybook/                Storybook config
```

**Pages** are thin: they own route params, call composables, and hand data to components — no business logic in templates.

**API/data layer** (`useBooks.ts`) is the only place that talks to Open Library (and its fallback, the iTunes Search API). It maps `OpenLibrarySearchDoc` / `OpenLibraryWork` / `OpenLibraryEdition` / `OpenLibraryAuthor` / `ItunesBookResult` into `BookSummary` / `BookDetail`, so the rest of the app never sees raw API fields from either source. Search results come straight from `search.json`. Detail pages combine three calls — the work, its author, and its first edition (for publisher/page count, which the work endpoint doesn't reliably carry) — each independently wrapped so a missing author or edition doesn't fail the whole page.

**Fallback data source**: Open Library is the primary source everywhere. If a search or a detail fetch to Open Library fails or exceeds a 5s timeout, `useBooks.ts` automatically retries against Apple's [iTunes Search/Lookup API](https://performance-partners.apple.com/search-api) filtered to `media=ebook` (no key required) and maps its response into the same `BookSummary`/`BookDetail` shape, tagged with `source: 'itunes'`. The UI shows a small inline notice on the search page and an "Apple Books" badge on affected cards, so it's never silently swapping data sources. Because the two APIs use incompatible id schemes, iTunes results get an `it_`-prefixed `id` (e.g. `it_597944491`) so `/books/{id}` knows which API to re-query on the detail page; Open Library ids are left exactly as-is (unprefixed), so this is fully backwards compatible with existing shortlist entries and bookmarked URLs from before this fallback existed.

This went through two earlier candidates before landing on iTunes, both worth knowing about: the Internet Archive API (`archive.org`) was tried first — a thoughtful choice on paper, since it's on different infrastructure than `openlibrary.org` and had stayed reachable during the specific outage that motivated adding a fallback at all — but during development `archive.org`'s own dynamic endpoints (`advancedsearch.php`, `/metadata/`) started failing too (`502`s and outright timeouts), which turned out to be because **Open Library and the Internet Archive share the same parent organization's infrastructure**: an org-wide capacity problem can take both down together, defeating the point of a fallback. Google Books was tried before that and worked correctly, but was dropped per explicit direction to avoid it as a dependency. iTunes was chosen last because it's genuinely independent infrastructure (Apple, unrelated to Google or Internet Archive) and was verified reachable at the time by testing it directly with `curl` rather than assumed.

No Nuxt server routes were needed: both APIs are public and CORS-friendly, so calling them directly from the client keeps the data flow to one hop and easy to explain.

**State management**: no external state library. `useShortlist()` holds its list in Nuxt's [`useState`](https://nuxt.com/docs/api/composables/use-state) rather than a plain module-level `ref` — `useState` is request-scoped on the server and a shared singleton on the client, so every component sees the same reactive list without prop-drilling and without one user's server-rendered request being able to leak into another's. (An earlier version of this composable used a module-level `ref`, which is a common Nuxt SSR trap: a plain module-scoped ref is a single object reused across *every* request the Node server handles, not per-request — it caused an intermittent SSR crash, `Attempting to define property on object that is not extensible`, and would have leaked shortlist data between concurrent users in production. Fixed by switching to `useState`.)

**Persistence**: `useShortlist()` reads from `localStorage` once per client session (guarded by a module-level flag that's safe here because it never runs on the server) and writes back on every add/remove. All storage access is guarded with `import.meta.client` so it never runs during SSR, and `try/catch` around both read and write so a disabled/full storage degrades to an in-memory (session-only) shortlist instead of crashing.

## Assumptions

- The Open Library **work** endpoint doesn't reliably include `publisher` or `number_of_pages` — those live on editions. The detail page fetches the first edition that has each field (`/works/{id}/editions.json`) rather than assuming edition `[0]` has everything.
- Search results only need the *first* author name for the card/grid; full multi-author display wasn't requested and would add clutter to a card-sized layout.
- "Shareable/bookmarkable" was interpreted as: the work id in the URL is sufficient to refetch everything the detail page needs — no client-side-only state is required to render `/books/{id}` directly.
- `localStorage` (not IndexedDB/cookies/a backend) is sufficient shortlist persistence per the assignment's own guidance.

## Tradeoffs

Kept simple deliberately, given the 4-hour cap:

- **Search is submit-triggered, not live/debounced-as-you-type.** A duplicate/stale-request guard (`AbortController`) still protects against rapid re-submits, but there's no keystroke debouncing since the UX doesn't call for live search.
- **No pagination/infinite scroll** — results are capped at 24. A real product would paginate.
- **Author name on the detail page costs one extra request** (`/authors/{id}.json`), issued after the work loads. Fine at this scale; a production version might batch this or accept the author list Open Library sometimes embeds and skip the extra round trip.
- **No automated tests** (unit/e2e) — out of scope per the assignment; Storybook stories are the only structured coverage, covering visual states rather than behavior.
- **The iTunes fallback is a deliberate scope addition beyond the assignment brief**, which specifies Open Library as the data source. Added because Open Library had a real, extended outage during development (see Unfinished / Known Issues) and a silent dead end felt worse than a documented, explained exception. It's implemented as a genuine second data source (results rendered in-app, not a link-out) at the developer's explicit direction — worth being ready to justify that scope call in review. It went through Google Books and then Internet Archive first (see Architecture for why each was dropped) before landing here.
- **The fallback only covers the two calls the UI blocks on** (search, and the work/item detail fetch) — it does not extend to the Open Library author/editions enrichment calls on the detail page, since those already fail independently and gracefully (missing author/publisher/pages, not a page-level error).
- **iTunes ebook results have no `publisher` or `pageCount` fields at all** (unlike Open Library, which has both, and unlike Google Books, which was tried earlier and has both too) — both are always `null` for `source: 'itunes'` books rather than guessed at. The UI already renders `null` as "Unknown" for both fields, so this degrades gracefully rather than needing special-case handling.
- **iTunes' JSON is served with `Content-Type: text/javascript`, not `application/json`.** `ofetch`'s automatic response parsing picks a parser from the content-type header, so without an explicit `responseType: 'json'` on both iTunes calls, it silently returned an unparsed string instead of throwing — the bug surfaced as every book "not found" rather than as a request failure, which took a moment to track down since it looked like a data problem, not a parsing one.

## Unfinished / Known Issues

- **Storybook + Vite 8/rolldown quirk**: `@storybook/vue3-vite@10.5.8` (pulled in as "latest") resolves to Vite 8, and in that combination the framework preset did not automatically register `@vitejs/plugin-vue` for the production `storybook build` step — the build failed with a JSX parse error on `<script setup>` blocks. Fixed by explicitly adding `@vitejs/plugin-vue` in `.storybook/main.ts`'s `viteFinal` (see that file). This took about 15 minutes to diagnose and is now working for both `storybook dev` and `storybook build`; documenting it here per the assignment's guidance rather than treating it as hidden magic.
- **Open Library's servers (`openlibrary.org`, `covers.openlibrary.org`) were unreachable for essentially the entire build**, confirmed from multiple independent networks (home Wi-Fi, mobile hotspot, a third unrelated network) and in a plain browser with no app involved. The Open Library-specific data-layer mapping (`useBooks.ts`'s `getOpenLibraryDetail`/search path) is therefore based on documented/previously-observed response shapes rather than a response captured live during this session — do a real smoke test against it as soon as Open Library is back, before recording (`curl -sv https://openlibrary.org/search.json?q=test`). The iTunes fallback path, by contrast, *was* exercised against live real data during development once it was confirmed reachable — a real detail page for Frank Herbert's *Dune* rendered correctly end-to-end, cover included, which is also how the `Content-Type: text/javascript` parsing bug (see Tradeoffs) got caught in the first place. The Internet Archive fallback that came before it was never confirmed working against live data — its own endpoints were down every time it was tested — which is a large part of why it was replaced.
- **Deployment**: not deployed from this session (no outbound network / no platform credentials available here). The build is verified locally (`npm run build` succeeds, SSR renders correctly, type-check passes) and is deploy-ready for Vercel, Netlify, or Cloudflare Pages with zero extra config — Nuxt's Nitro auto-detects each of these presets from the environment at build time.
- **Focus trapping** in the shortlist slide-over panel is not implemented (focus isn't cycled/contained while open) — basic keyboard operability (button controls, closeable, labeled) is in place, but a production version should trap focus for full modal-dialog compliance.
- **Two real bugs were caught and fixed during development against the live outage above**, both worth knowing about if touching this code: (1) `ofetch` (Nuxt's fetch wrapper) silently ignores its own `timeout` option whenever a custom `signal` is also passed to the same request — the search function needs a `signal` to cancel a stale search on resubmit, so its timeout has to be driven manually with `setTimeout` + `controller.abort()` instead (see the comment in `useBooks.ts`); the detail page's fetches don't pass a `signal` so `ofetch`'s built-in `timeout` works fine there. (2) `useShortlist.ts` originally held its state in a `ref()` declared at module scope, which Nuxt's Node server reuses as a *single shared object across every request*, not per-request — this caused an intermittent SSR crash (`Attempting to define property on object that is not extensible`) and would have leaked one user's shortlist into another's SSR-rendered page in production. Fixed by switching to Nuxt's `useState()`, which is request-scoped on the server.

## AI Usage

This project was built with Claude (Anthropic) as an active implementation partner, not just autocomplete. Documented honestly:

- **Where AI was used**: essentially the full implementation — project scaffolding (`nuxi init`), Tailwind v4 setup, the type definitions in `types/book.ts`, the `useBooks`/`useShortlist` composables, all components, both pages, the Storybook config and stories, and this README.
- **What AI generated**: all source files listed above, driven by a detailed spec (stack, structure, UX requirements, accessibility/error-handling requirements) provided up front by the developer.
- **What was reviewed**: every file was read and reasoned through during the session — in particular the data-layer design (why editions/author need separate calls), the shortlist persistence guards (SSR safety, storage failure handling), and the Storybook build failure (diagnosed root cause rather than papering over it).
- **What was changed / rejected**:
  - Initial Storybook scaffold pulled in `@storybook/addon-vitest`, `@chromatic-com/storybook`, `@storybook/addon-onboarding`, plus Playwright and Vitest as dependencies — all removed as unused weight; only `@storybook/addon-a11y` and `@storybook/addon-docs` were kept.
  - `BookGrid` initially emitted a `toggleShortlist` event up to be handled by the page — simplified to call `useShortlist().toggle()` directly inside the component, since routing that state up added a layer with no benefit.
  - `ErrorState`'s retry button was initially conditionally rendered based on whether a listener was attached (`$attrs.onRetry`) — simplified to always render, since every actual usage needed it.
  - The fallback went through four iterations at the developer's direction: a Google Books link-out ("Search Google Books instead", opens in a new tab) → an in-app Google Books fallback (real second data source) → swapped to the Internet Archive API, reasoned as a better choice given its infrastructure relationship to Open Library → swapped again to the iTunes Search API once that Internet Archive/Open Library relationship turned out to be a liability (both went down together) and the developer asked for a genuinely independent source. Each iteration's now-dead code was fully removed rather than left alongside its replacement — including a real bug caught along the way in the Internet Archive → iTunes swap: iTunes serves JSON as `Content-Type: text/javascript`, which silently defeated `ofetch`'s auto-parsing until `responseType: 'json'` was added explicitly (see Tradeoffs).
  - Before adding Apify as a candidate fallback (the developer's suggestion), it was evaluated and rejected: it's a scraping platform (not a bibliographic API), requires an API token (breaking this project's consistent zero-key pattern across all three sources it does use), and its scraper "Actors" run asynchronously (start-a-job-then-poll), a poor fit for something that needs to resolve within a few seconds. Explained instead of silently ignored.
- **Why changes were made**: mainly to keep the dependency surface and component APIs as small as the assignment explicitly asks for ("avoid unnecessary dependencies", "don't create abstractions that are not useful").

Because AI wrote the bulk of the code, the developer's job before the interview is to be able to explain every decision above on request — the architecture section and tradeoffs section above are written as that explanation.

## Production Improvements

If this were going to production:

- Add integration/e2e coverage (Playwright) for the three core flows: search → detail, shortlist add/remove, refresh persistence.
- Move shortlist persistence to a backend (with auth) so it survives across devices, instead of per-browser `localStorage`.
- Add pagination or infinite scroll to search results instead of a hard 24-item cap.
- Cache Open Library responses (e.g. a short-TTL edge cache or `nitro` route rules) to reduce duplicate calls for popular searches/books and improve resilience to Open Library rate limits/outages.
- Trap focus and restore it on close for the shortlist slide-over, for full dialog accessibility.
- Skeleton loading states instead of a single spinner, for perceived-performance polish.
- Structured error reporting (e.g. Sentry) instead of console-only failures, so API degradation is observable in production.
