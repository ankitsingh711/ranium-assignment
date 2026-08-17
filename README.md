# Shelf

A book discovery app: search for books, view book details, and keep a personal shortlist that survives a page refresh.

Built as a timeboxed (4 hour) practical exercise for Ranium Systems.

> **Deviation from the assignment brief, stated up front**: the assignment specifies the Open Library API as the data source. This build uses Apple's iTunes Search/Lookup API (`media=ebook`, i.e. Apple Books) instead, at the developer's explicit direction, after Open Library was unreachable for essentially this entire development session (see Unfinished / Known Issues for how that was verified) and iTunes was the API confirmed actually working when tested live. Be ready to explain this in review — it's a real, deliberate scope deviation, not an oversight, and it has a real cost: iTunes' commercially-curated ebook catalog covers meaningfully fewer books than Open Library's library-catalog data, and it has no `publisher` or `pageCount` fields at all, so those two required detail-page fields always render as "Unknown" now rather than sometimes.

## Overview

Shelf lets you search for books by title or author, browse results with cover/title/author/year, open a dedicated detail page for any book (description, publisher, page count, subjects), and shortlist books you're interested in. The shortlist persists in the browser via `localStorage`.

## Features

- Search by title or author against Apple's iTunes Search API, filtered to ebooks
- Loading, empty, and error states for search
- Result cards showing cover, title, author, and first publish year, with graceful fallbacks for missing data
- Shareable/bookmarkable book detail pages at `/books/{id}`
- Detail page: large cover, description, author, publisher, page count, subjects
- Graceful handling of invalid/non-existent book IDs and API failures, including a 5s request timeout so an unreachable API shows an error instead of hanging
- Add/remove a book from a shortlist, from either the results grid or the detail page
- Shortlist panel (slide-over) accessible from the header, with its own empty state
- Shortlist persists across refreshes via `localStorage`
- Search results and active filters persist across navigation (open a book, go back — no refetch)
- Responsive layout (mobile through desktop)
- Basic accessibility: semantic HTML, labeled controls, visible focus states, `aria-pressed`/`role="dialog"` where relevant

## Tech Stack

- [Nuxt 4](https://nuxt.com/) / [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- TypeScript
- Tailwind CSS v4 (CSS-first `@theme` design tokens)
- Storybook 10 (Vue3 + Vite)
- [iTunes Search API](https://performance-partners.apple.com/search-api) (Apple Books, `media=ebook`) — no API key required, sole data source

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
    books/[id].vue       book detail page (route param = iTunes track id)
  components/            presentational + light-logic components
  composables/
    useBooks.ts           search + detail data fetching, maps iTunes responses -> app types
    useShortlist.ts        shortlist state + localStorage persistence
  types/book.ts           app-level types + the (minimal) raw iTunes shapes
  assets/css/main.css      Tailwind v4 import + design tokens (@theme)
stories/                  Storybook stories (SearchBar, ShortlistButton)
.storybook/                Storybook config
```

**Pages** are thin: they own route params, call composables, and hand data to components — no business logic in templates.

**API/data layer** (`useBooks.ts`) is the only place that talks to iTunes. It maps `ItunesBookResult` into `BookSummary`/`BookDetail`, so the rest of the app never sees raw API fields. Two things about iTunes' response shape needed handling explicitly rather than just passed through: descriptions arrive as raw HTML (`<b>`, `<i>`, `<br />`), stripped to plain text with line breaks preserved as `\n` (see Tradeoffs for why that's done in the data layer, not the template); and the JSON is served with `Content-Type: text/javascript`, which `ofetch` doesn't auto-detect as JSON without an explicit `responseType: 'json'` on every call (see Tradeoffs — this was a real bug caught during development, not a preemptive guard).

No Nuxt server routes were needed: the API is public and CORS-friendly, so calling it directly from the client keeps the data flow to one hop and easy to explain.

**State management**: no external state library. `useShortlist()` holds its list in Nuxt's [`useState`](https://nuxt.com/docs/api/composables/use-state) rather than a plain module-level `ref` — `useState` is request-scoped on the server and a shared singleton on the client, so every component sees the same reactive list without prop-drilling and without one user's server-rendered request being able to leak into another's. (An earlier version of this composable used a module-level `ref`, which is a common Nuxt SSR trap: a plain module-scoped ref is a single object reused across *every* request the Node server handles, not per-request — it caused an intermittent SSR crash, `Attempting to define property on object that is not extensible`, and would have leaked shortlist data between concurrent users in production. Fixed by switching to `useState`.)

The search page's own state (query, results, loading/error flags, active filters) uses the same `useState` pattern for a different reason: `pages/index.vue` unmounts when you open a book's detail page. A plain `ref` there would reset to its default every time you navigated back, forcing a full re-search just to see results you already had. With `useState`, navigating back shows the same results instantly, no refetch. A guard (`if (route.query.q && !hasSearched.value)`) makes sure the initial auto-search from a shared `?q=` URL still only fires once, not on every remount.

**Persistence**: `useShortlist()` reads from `localStorage` once per client session (guarded by a module-level flag that's safe here because it never runs on the server) and writes back on every add/remove. All storage access is guarded with `import.meta.client` so it never runs during SSR, and `try/catch` around both read and write so a disabled/full storage degrades to an in-memory (session-only) shortlist instead of crashing.

## Assumptions

- iTunes' ebook catalog is a reasonable stand-in for a general book database for demo purposes, but it's commercially curated (Apple Books) rather than a library catalog — coverage of older, obscure, or public-domain titles is materially worse than Open Library's.
- `publisher` and `pageCount` are always `null` for every book, since iTunes' ebook results carry neither field. The UI already renders `null` as "Unknown" for both, so this degrades the same way missing data from any source would, rather than needing special-case handling — but it's worth being upfront that it's now *always* missing, not sometimes.
- Search results only need the *first* author name for the card/grid; full multi-author display wasn't requested and would add clutter to a card-sized layout.
- "Shareable/bookmarkable" was interpreted as: the id in the URL is sufficient to refetch everything the detail page needs — no client-side-only state is required to render `/books/{id}` directly.
- `localStorage` (not IndexedDB/cookies/a backend) is sufficient shortlist persistence per the assignment's own guidance.

## Tradeoffs

Kept simple deliberately, given the 4-hour cap:

- **Using iTunes instead of Open Library is the largest tradeoff in this project** — see the callout at the top. It was a direct, explicit instruction from the developer after Open Library proved unreachable all session; it is not what the assignment asked for, and that's worth being direct about rather than glossing over.
- **No fallback data source.** Earlier iterations of this project had a primary (Open Library) + fallback (tried Google Books, then Internet Archive, then iTunes) architecture specifically to survive one source being down. Once iTunes became the *only* source, that resilience is gone — if iTunes is down, search and detail both fail with a clear error message, but there's nothing left to fall back to. A production version of this app would likely want two independent sources again, not one.
- **Search is submit-triggered, not live/debounced-as-you-type.** A duplicate/stale-request guard (`AbortController`) still protects against rapid re-submits, but there's no keystroke debouncing since the UX doesn't call for live search.
- **No pagination/infinite scroll** — results are capped at 24. A real product would paginate.
- **No automated tests** (unit/e2e) — out of scope per the assignment; Storybook stories are the only structured coverage, covering visual states rather than behavior.
- **iTunes' JSON is served with `Content-Type: text/javascript`, not `application/json`.** `ofetch`'s automatic response parsing picks a parser from the content-type header, so without an explicit `responseType: 'json'` on both iTunes calls, it silently returned an unparsed string instead of throwing — the bug surfaced as every book "not found" rather than as a request failure, which took a moment to track down since it looked like a data problem, not a parsing one.
- **iTunes descriptions are stripped of HTML in the data layer, not rendered with `v-html`.** The template already renders text safely (escaped, no XSS risk from third-party content) — which is exactly why raw `<b>`/`<i>`/`<br />` tags initially showed up literally as visible text instead of being interpreted. The fix is a small `stripHtml()` in `useBooks.ts` that converts `<br>`/`</p>` to newlines (rendered visually via `whitespace-pre-line` on the description `<p>`), strips remaining tags, and decodes common entities — not a `v-html` switch, which would reintroduce the exact risk the original escaping was preventing.

## Unfinished / Known Issues

- **Storybook + Vite 8/rolldown quirk**: `@storybook/vue3-vite@10.5.8` (pulled in as "latest") resolves to Vite 8, and in that combination the framework preset did not automatically register `@vitejs/plugin-vue` for the production `storybook build` step — the build failed with a JSX parse error on `<script setup>` blocks. Fixed by explicitly adding `@vitejs/plugin-vue` in `.storybook/main.ts`'s `viteFinal` (see that file). This took about 15 minutes to diagnose and is now working for both `storybook dev` and `storybook build`; documenting it here per the assignment's guidance rather than treating it as hidden magic.
- **Why Open Library isn't used** (context for the callout at the top): `openlibrary.org` and `covers.openlibrary.org` were unreachable for essentially this entire development session, confirmed from multiple independent networks (home Wi-Fi, mobile hotspot, a third unrelated network), from a plain browser with no app involved, and even from a completely separate cloud network unrelated to the developer's machine — DNS resolved, but the TCP connection to that specific server timed out or was refused everywhere it was tried. Two API fallbacks were tried in turn before switching away from Open Library as primary entirely: the Internet Archive API (`archive.org`) seemed promising since it's on different infrastructure than `openlibrary.org`, but turned out to share the same parent organization's backend — it started failing too (`502 Sorry, we're kinda busy`, timeouts) partway through, defeating the point of a fallback. Google Books worked but was explicitly ruled out per developer direction. iTunes was the API actually confirmed reachable and returning correct real data (a live detail page for Frank Herbert's *Dune* rendered correctly end-to-end, cover included) when tested directly with `curl` — which is also how the `Content-Type: text/javascript` parsing bug got caught. If you're reading this after Open Library has recovered, it's worth deciding whether to reintroduce it (see Production Improvements).
- **Deployment**: not deployed from this session (no outbound network / no platform credentials available here). The build is verified locally (`npm run build` succeeds, SSR renders correctly, type-check passes) and is deploy-ready for Vercel, Netlify, or Cloudflare Pages with zero extra config — Nuxt's Nitro auto-detects each of these presets from the environment at build time.
- **Focus trapping** in the shortlist slide-over panel is not implemented (focus isn't cycled/contained while open) — basic keyboard operability (button controls, closeable, labeled) is in place, but a production version should trap focus for full modal-dialog compliance.
- **A real SSR bug was caught and fixed during development, worth knowing about if touching this code**: `useShortlist.ts` originally held its state in a `ref()` declared at module scope, which Nuxt's Node server reuses as a *single shared object across every request*, not per-request — this caused an intermittent SSR crash (`Attempting to define property on object that is not extensible`) and would have leaked one user's shortlist into another's SSR-rendered page in production. Fixed by switching to Nuxt's `useState()`, which is request-scoped on the server.

## AI Usage

This project was built with Claude (Anthropic) as an active implementation partner, not just autocomplete. Documented honestly:

- **Where AI was used**: essentially the full implementation — project scaffolding (`nuxi init`), Tailwind v4 setup, the type definitions in `types/book.ts`, the `useBooks`/`useShortlist` composables, all components, both pages, the Storybook config and stories, and this README.
- **What AI generated**: all source files listed above, driven by a detailed spec (stack, structure, UX requirements, accessibility/error-handling requirements) provided up front by the developer.
- **What was reviewed**: every file was read and reasoned through during the session — in particular the data-layer design, the shortlist persistence guards (SSR safety, storage failure handling), and the Storybook build failure (diagnosed root cause rather than papering over it).
- **What was changed / rejected**:
  - Initial Storybook scaffold pulled in `@storybook/addon-vitest`, `@chromatic-com/storybook`, `@storybook/addon-onboarding`, plus Playwright and Vitest as dependencies — all removed as unused weight; only `@storybook/addon-a11y` and `@storybook/addon-docs` were kept.
  - `BookGrid` initially emitted a `toggleShortlist` event up to be handled by the page — simplified to call `useShortlist().toggle()` directly inside the component, since routing that state up added a layer with no benefit.
  - `ErrorState`'s retry button was initially conditionally rendered based on whether a listener was attached (`$attrs.onRetry`) — simplified to always render, since every actual usage needed it.
  - The data source went through several iterations at the developer's direction, each fully replacing the last rather than leaving dead code behind: Open Library as the sole source (per the original brief) → Open Library primary with a Google Books link-out on failure → Open Library primary with a real in-app Google Books fallback → swapped the fallback to the Internet Archive API → swapped the fallback to iTunes once Internet Archive turned out to share Open Library's infrastructure (both went down together) → finally, Open Library dropped entirely and iTunes promoted to sole primary source, per explicit developer direction after weighing that this breaks the assignment's literal API requirement (see the callout at the top). Each swap's now-unused code (`ErrorState`'s `fallbackHref` prop, a `googleBooksSearchUrl` util, the `OpenLibrary*`/`GoogleBooksVolume`/`ArchiveOrg*` types, `getOpenLibraryDetail`, `utils/covers.ts`, the multi-source `id`-prefix scheme and "source" badges) was fully removed at each step rather than accumulating alongside its replacement.
  - Before adding Apify as a candidate fallback (the developer's suggestion), it was evaluated and rejected: it's a scraping platform (not a bibliographic API), requires an API token (breaking this project's consistent zero-key pattern), and its scraper "Actors" run asynchronously (start-a-job-then-poll), a poor fit for something that needs to resolve within a few seconds. Explained instead of silently ignored.
- **Why changes were made**: mainly to keep the dependency surface and component APIs as small as the assignment explicitly asks for ("avoid unnecessary dependencies", "don't create abstractions that are not useful") — and, for the final data-source change, per explicit developer instruction after the tradeoffs (see the callout at the top) were laid out and acknowledged.

Because AI wrote the bulk of the code, the developer's job before the interview is to be able to explain every decision above on request — the architecture section and tradeoffs section above are written as that explanation.

## Production Improvements

If this were going to production:

- **Reconsider reintroducing Open Library** (or another richer source) once it's confirmed stable again — the current iTunes-only setup was a direct response to an outage during development, not necessarily the right permanent architecture. A primary + fallback design (as this project had at one point) gives better resilience than a single source either way.
- Add integration/e2e coverage (Playwright) for the three core flows: search → detail, shortlist add/remove, refresh persistence.
- Move shortlist persistence to a backend (with auth) so it survives across devices, instead of per-browser `localStorage`.
- Add pagination or infinite scroll to search results instead of a hard 24-item cap.
- Cache API responses (e.g. a short-TTL edge cache or `nitro` route rules) to reduce duplicate calls for popular searches/books and improve resilience to rate limits/outages.
- Trap focus and restore it on close for the shortlist slide-over, for full dialog accessibility.
- Skeleton loading states instead of a single spinner, for perceived-performance polish.
- Structured error reporting (e.g. Sentry) instead of console-only failures, so API degradation is observable in production.
