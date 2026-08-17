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
- Graceful handling of invalid/non-existent book IDs and API failures
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
- [Open Library API](https://openlibrary.org/developers/api) — no API key required

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

**API/data layer** (`useBooks.ts`) is the only place that talks to Open Library. It maps `OpenLibrarySearchDoc` / `OpenLibraryWork` / `OpenLibraryEdition` / `OpenLibraryAuthor` into `BookSummary` / `BookDetail`, so the rest of the app never sees raw API fields. Search results come straight from `search.json`. Detail pages combine three calls — the work, its author, and its first edition (for publisher/page count, which the work endpoint doesn't reliably carry) — each independently wrapped so a missing author or edition doesn't fail the whole page.

No Nuxt server routes were needed: Open Library's endpoints are public and CORS-friendly, so calling them directly from the client keeps the data flow to one hop and easy to explain.

**State management**: no external state library. `useShortlist()` holds one module-level `ref` shared by every component that calls it (Nuxt's plugin/module system already gives this composable a singleton-like scope per app instance) — no prop-drilling, no Pinia needed for a single piece of shared state.

**Persistence**: `useShortlist()` reads from `localStorage` on first client-side use and writes back on every add/remove. All storage access is guarded with `import.meta.client` so it never runs during SSR, and `try/catch` around both read and write so a disabled/full storage degrades to an in-memory (session-only) shortlist instead of crashing.

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
- **No skeleton loaders** — a single spinner-based `LoadingState` is used everywhere rather than content-shaped skeletons, to keep component count down.

## Unfinished / Known Issues

- **Storybook + Vite 8/rolldown quirk**: `@storybook/vue3-vite@10.5.8` (pulled in as "latest") resolves to Vite 8, and in that combination the framework preset did not automatically register `@vitejs/plugin-vue` for the production `storybook build` step — the build failed with a JSX parse error on `<script setup>` blocks. Fixed by explicitly adding `@vitejs/plugin-vue` in `.storybook/main.ts`'s `viteFinal` (see that file). This took about 15 minutes to diagnose and is now working for both `storybook dev` and `storybook build`; documenting it here per the assignment's guidance rather than treating it as hidden magic.
- **Live API responses were not manually re-verified against Open Library at build time** — this environment had no outbound network access during development, so the data-layer mapping is based on the documented/previously-observed Open Library response shapes rather than a live fetch captured during this session. The defensive null-handling throughout (`| null` on every optional field, try/catch around the editions/author enrichment calls) means the app won't crash if a field is missing or renamed, but it's worth a quick manual smoke test against the live API before the final recording.
- **Deployment**: not deployed from this session (no outbound network / no platform credentials available here). The build is verified locally (`npm run build` succeeds, SSR renders correctly, type-check passes) and is deploy-ready for Vercel, Netlify, or Cloudflare Pages with zero extra config — Nuxt's Nitro auto-detects each of these presets from the environment at build time.
- **Focus trapping** in the shortlist slide-over panel is not implemented (focus isn't cycled/contained while open) — basic keyboard operability (button controls, closeable, labeled) is in place, but a production version should trap focus for full modal-dialog compliance.

## AI Usage

This project was built with Claude (Anthropic) as an active implementation partner, not just autocomplete. Documented honestly:

- **Where AI was used**: essentially the full implementation — project scaffolding (`nuxi init`), Tailwind v4 setup, the type definitions in `types/book.ts`, the `useBooks`/`useShortlist` composables, all components, both pages, the Storybook config and stories, and this README.
- **What AI generated**: all source files listed above, driven by a detailed spec (stack, structure, UX requirements, accessibility/error-handling requirements) provided up front by the developer.
- **What was reviewed**: every file was read and reasoned through during the session — in particular the data-layer design (why editions/author need separate calls), the shortlist persistence guards (SSR safety, storage failure handling), and the Storybook build failure (diagnosed root cause rather than papering over it).
- **What was changed / rejected**:
  - Initial Storybook scaffold pulled in `@storybook/addon-vitest`, `@chromatic-com/storybook`, `@storybook/addon-onboarding`, plus Playwright and Vitest as dependencies — all removed as unused weight; only `@storybook/addon-a11y` and `@storybook/addon-docs` were kept.
  - `BookGrid` initially emitted a `toggleShortlist` event up to be handled by the page — simplified to call `useShortlist().toggle()` directly inside the component, since routing that state up added a layer with no benefit.
  - `ErrorState`'s retry button was initially conditionally rendered based on whether a listener was attached (`$attrs.onRetry`) — simplified to always render, since every actual usage needed it.
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
