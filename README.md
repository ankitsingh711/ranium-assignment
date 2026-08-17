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
- Automatic in-app fallback to the Internet Archive API when Open Library is unreachable, both for search and for a book's detail page — results are shown directly in the app (with a small "Internet Archive" badge/notice), not a link out; see Architecture and Tradeoffs
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
- [Internet Archive API](https://archive.org/developers/) (`advancedsearch.php` / `metadata`) — no API key required, automatic fallback when Open Library is unreachable

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

**API/data layer** (`useBooks.ts`) is the only place that talks to Open Library (and its fallback, the Internet Archive). It maps `OpenLibrarySearchDoc` / `OpenLibraryWork` / `OpenLibraryEdition` / `OpenLibraryAuthor` / `ArchiveOrgSearchDoc` / `ArchiveOrgMetadata` into `BookSummary` / `BookDetail`, so the rest of the app never sees raw API fields from either source. Search results come straight from `search.json`. Detail pages combine three calls — the work, its author, and its first edition (for publisher/page count, which the work endpoint doesn't reliably carry) — each independently wrapped so a missing author or edition doesn't fail the whole page.

**Fallback data source**: Open Library is the primary source everywhere. If a search or a detail fetch to Open Library fails or exceeds a 5s timeout, `useBooks.ts` automatically retries against the [Internet Archive API](https://archive.org/developers/) (`advancedsearch.php` for search, `metadata/{identifier}` for detail — no key required) and maps its response into the same `BookSummary`/`BookDetail` shape, tagged with `source: 'archive'`. The UI shows a small inline notice on the search page and an "Internet Archive" badge on affected cards, so it's never silently swapping data sources. Because the two APIs use incompatible id schemes, Internet Archive results get an `ia_`-prefixed `id` (e.g. `ia_dune0000herb`) so `/books/{id}` knows which API to re-query on the detail page; Open Library ids are left exactly as-is (unprefixed), so this is fully backwards compatible with existing shortlist entries and bookmarked URLs from before this fallback existed. Internet Archive was chosen over other free/keyless book APIs specifically because it's on the `archive.org` domain — a different IP range than `openlibrary.org` (both are run by the Internet Archive organization, but on separate infrastructure) — which is meaningful because the Open Library outage encountered during this project's development was isolated to `openlibrary.org`/`covers.openlibrary.org` while `archive.org` stayed reachable throughout; see Unfinished / Known Issues for the flip side of that same infrastructure relationship.

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
- **Internet Archive fallback is a deliberate scope addition beyond the assignment brief**, which specifies Open Library as the data source. Added because Open Library had a real, extended outage during development (see Unfinished / Known Issues) and a silent dead end felt worse than a documented, explained exception. It's implemented as a genuine second data source (results rendered in-app, not a link-out) at the developer's explicit direction — worth being ready to justify that scope call in review. An earlier iteration used the Google Books API instead; switched to Internet Archive partway through both because it shares infrastructure lineage with `archive.org` (see Architecture) and because the developer asked for something other than Google Books specifically.
- **The fallback only covers the two calls the UI blocks on** (search, and the work/item detail fetch) — it does not extend to the Open Library author/editions enrichment calls on the detail page, since those already fail independently and gracefully (missing author/publisher/pages, not a page-level error).
- **`pageCount` for Internet Archive results is a loose proxy** (`metadata.imagecount`, the number of scanned page images), not a true print page count the way Open Library's `number_of_pages` is — close enough to be useful, not exact. Documented rather than presented as equivalent.
- **Internet Archive's search endpoint (`advancedsearch.php`) is itself noticeably slower and less reliable than Open Library's** — observed round trips of 2-7s when healthy, and a `502 Sorry, we're kinda busy` server-overload response directly during development. It gets a longer timeout (8s vs. Open Library's 5s) to account for that, but if it's also down there's no third source to fall back to further — the fallback's own failure path (a clear error message, no crash) is what runs in that case.

## Unfinished / Known Issues

- **Storybook + Vite 8/rolldown quirk**: `@storybook/vue3-vite@10.5.8` (pulled in as "latest") resolves to Vite 8, and in that combination the framework preset did not automatically register `@vitejs/plugin-vue` for the production `storybook build` step — the build failed with a JSX parse error on `<script setup>` blocks. Fixed by explicitly adding `@vitejs/plugin-vue` in `.storybook/main.ts`'s `viteFinal` (see that file). This took about 15 minutes to diagnose and is now working for both `storybook dev` and `storybook build`; documenting it here per the assignment's guidance rather than treating it as hidden magic.
- **Open Library's servers (`openlibrary.org`, `covers.openlibrary.org`) were unreachable for the entire build.** This was verified from multiple independent networks (home Wi-Fi, mobile hotspot, and a third, unrelated network) and in a plain browser with no app involved — DNS resolves, but the TCP connection to that specific IP range times out or is refused, while Internet Archive's main site (`archive.org`, a different IP range) loads fine. This points to an outage/instability specific to Open Library's own infrastructure, consistent with prior extended Open Library outages after the 2024 Internet Archive breach. Practical effect: the data-layer mapping (`useBooks.ts`) is based on documented/previously-observed Open Library response shapes rather than a response captured live during this session, and the app itself has never been exercised against real search results — only against the failure path (which is why the timeout/error-handling work above got prioritized). **Do a real smoke test against live data as soon as Open Library is back**, before recording — retry with `curl -sv https://openlibrary.org/search.json?q=test`.
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
  - The fallback went through three iterations at the developer's direction: first a Google Books link-out ("Search Google Books instead", opens in a new tab), then an in-app Google Books fallback (real second data source, results rendered inside the app), then swapped again to Internet Archive as the actual source once the developer asked for a non-Google alternative. Each iteration's now-dead code (the `ErrorState` `fallbackHref` prop, a `googleBooksSearchUrl` util, the Google Books types/mapping in `useBooks.ts`) was fully removed rather than left alongside the replacement.
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
