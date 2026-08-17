# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **npm**.

```bash
npm install              # install deps
npm run dev              # dev server at http://localhost:3000
npm run build             # production build (Nitro)
npm run preview           # preview the production build locally
npm run generate           # static generation
npx nuxi typecheck         # type-check (vue-tsc)
npm run storybook          # Storybook dev server at http://localhost:6006
npm run build-storybook    # static Storybook build
```

There is no automated test suite (unit/e2e) in this project — out of scope per the original assignment. Storybook stories (`stories/`) are the only structured coverage, and they cover visual states, not behavior. There is no lint script configured.

## Architecture

```text
app/
  pages/
    index.vue            search page
    books/[id].vue        book detail page (route param = Open Library work id)
  components/             presentational + light-logic components
  composables/
    useBooks.ts            search + detail data fetching, maps OL responses -> app types
    useShortlist.ts         shortlist state + localStorage persistence
  types/book.ts            app-level types + the (minimal) raw Open Library shapes
  utils/covers.ts           cover URL / work-id helpers
  utils/externalSearch.ts    Google Books fallback link builder
  assets/css/main.css       Tailwind v4 import + design tokens (@theme)
stories/                   Storybook stories (SearchBar, ShortlistButton)
.storybook/                 Storybook config
```

**Pages are thin**: they own route params, call composables, and hand data to components — no business logic in templates.

**API/data layer** (`app/composables/useBooks.ts`) is the only place that talks to Open Library. It maps `OpenLibrarySearchDoc` / `OpenLibraryWork` / `OpenLibraryEdition` / `OpenLibraryAuthor` into `BookSummary` / `BookDetail`, so the rest of the app never sees raw API fields. Search results come straight from `search.json`. Detail pages combine three calls — the work, its author, and its first edition (for publisher/page count, which the work endpoint doesn't reliably carry) — each independently wrapped so a missing author or edition doesn't fail the whole page. Requests use a 5s timeout so an unreachable Open Library surfaces an error instead of hanging.

There are no Nuxt server routes: Open Library's endpoints are public and CORS-friendly, so the client calls them directly, keeping the data flow to one hop.

**State management**: no external state library. `useShortlist()` holds one module-level `ref` shared by every component that calls it (Nuxt's plugin/module system gives this composable a singleton-like scope per app instance) — no prop-drilling, no Pinia for a single piece of shared state.

**Persistence**: `useShortlist()` reads from `localStorage` on first client-side use and writes back on every add/remove. All storage access is guarded with `import.meta.client` (never runs during SSR) and wrapped in `try/catch` so a disabled/full storage degrades to an in-memory, session-only shortlist instead of crashing.

**Search-failure fallback**: on a failed search, the UI shows a "Search Google Books instead" link (`app/utils/externalSearch.ts`) that opens Google Books in a new tab with the same query. This is a link-out only, not a second data source — no Google Books data is fetched or merged into `BookSummary`/`BookDetail`.

## Notable constraints / gotchas

- **Storybook + Vite 8/rolldown**: `@storybook/vue3-vite@10.5.8` resolves to Vite 8, and the framework preset doesn't auto-register `@vitejs/plugin-vue` for `storybook build`, causing a JSX parse error on `<script setup>` blocks. Fixed by explicitly adding `@vitejs/plugin-vue` in `.storybook/main.ts`'s `viteFinal`. Don't remove that without re-verifying `npm run build-storybook`.
- Search is submit-triggered, not live/debounced-as-you-type; an `AbortController` guards against duplicate/stale requests on rapid re-submits, but there's no keystroke debouncing.
- Search results are capped at 24, no pagination/infinite scroll.
- The detail page's author name costs one extra request (`/authors/{id}.json`) issued after the work loads.
- Focus is not trapped in the shortlist slide-over panel (`ShortlistPanel.vue`) — basic keyboard operability exists, but it isn't a fully compliant modal dialog yet.
