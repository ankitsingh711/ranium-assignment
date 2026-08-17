<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// All of this page's own state lives in useState (not plain refs) for the
// same reason useBooks()'s search state does: this page unmounts when you
// open a book's detail page, and a plain ref would reset to its default on
// every return trip instead of showing what was already there.
const query = useState('book-search-query', () => (typeof route.query.q === 'string' ? route.query.q : ''))
const hasSearched = useState('book-search-has-searched', () => false)
const lastQuery = useState('book-search-last-query', () => '')
const { results, searchLoading, searchError, usedFallback, searchBooks } = useBooks()

const sort = useState<'relevance' | 'newest' | 'oldest'>('book-search-sort', () => 'relevance')
const yearFrom = useState<number | null>('book-search-year-from', () => null)
const yearTo = useState<number | null>('book-search-year-to', () => null)
const coverOnly = useState('book-search-cover-only', () => false)

const filtersActive = computed(
  () => sort.value !== 'relevance' || yearFrom.value !== null || yearTo.value !== null || coverOnly.value
)

const filteredResults = computed(() => {
  let books = results.value
  if (yearFrom.value !== null) books = books.filter((b) => b.firstPublishYear !== null && b.firstPublishYear >= yearFrom.value!)
  if (yearTo.value !== null) books = books.filter((b) => b.firstPublishYear !== null && b.firstPublishYear <= yearTo.value!)
  if (coverOnly.value) books = books.filter((b) => b.coverUrl !== null)

  if (sort.value !== 'relevance') {
    books = [...books].sort((a, b) => {
      const ay = a.firstPublishYear ?? -Infinity
      const by = b.firstPublishYear ?? -Infinity
      return sort.value === 'newest' ? by - ay : ay - by
    })
  }
  return books
})

function clearFilters() {
  sort.value = 'relevance'
  yearFrom.value = null
  yearTo.value = null
  coverOnly.value = false
}

async function runSearch() {
  hasSearched.value = true
  lastQuery.value = query.value.trim()
  clearFilters()
  router.replace({ query: lastQuery.value ? { q: lastQuery.value } : {} })
  await searchBooks(query.value)
}

// Only auto-run on a genuine first load of a shared/bookmarked `?q=` URL —
// not on every remount, since hasSearched (and results) already persist
// across navigation via useState above.
if (route.query.q && !hasSearched.value) {
  runSearch()
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-2 text-center sm:text-left">
      <h1 class="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
        Find your next <span class="text-brand-600">book</span>
      </h1>
      <p class="text-base text-surface-600">Search by title or author, powered by Open Library.</p>
    </div>

    <SearchBar v-model="query" :loading="searchLoading" @search="runSearch" />

    <BookGridSkeleton v-if="searchLoading" />

    <ErrorState
      v-else-if="searchError"
      :message="searchError"
      @retry="runSearch"
    />

    <EmptyState
      v-else-if="hasSearched && results.length === 0"
      icon="lucide:search-x"
      title="No books found"
      :message="`Nothing matched “${lastQuery}”. Try a different title or author.`"
    />

    <EmptyState
      v-else-if="!hasSearched"
      title="Start by searching for a book"
      message="Try a title like “Dune” or an author like “Ursula K. Le Guin”."
    />

    <div v-else class="flex flex-col gap-4">
      <div
        v-if="usedFallback"
        class="flex items-center gap-2 rounded-control border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-800"
        role="status"
      >
        <Icon name="lucide:info" class="h-4 w-4 shrink-0" />
        Open Library is unavailable right now — showing results from Apple Books instead.
      </div>

      <SearchFilters
        v-model:sort="sort"
        v-model:year-from="yearFrom"
        v-model:year-to="yearTo"
        v-model:cover-only="coverOnly"
        :active="filtersActive"
        @clear="clearFilters"
      />

      <p class="text-sm text-surface-600">
        {{ filteredResults.length }} result{{ filteredResults.length === 1 ? '' : 's' }}
        {{ filtersActive ? `(of ${results.length})` : '' }} for “{{ lastQuery }}”
      </p>

      <EmptyState
        v-if="filteredResults.length === 0"
        icon="lucide:search-x"
        title="No books match your filters"
        message="Try widening the year range or clearing the cover filter."
      >
        <button
          type="button"
          class="mt-2 inline-flex items-center gap-1.5 rounded-control bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.97]"
          @click="clearFilters"
        >
          <Icon name="lucide:x" class="h-4 w-4" />
          Clear filters
        </button>
      </EmptyState>
      <BookGrid v-else :books="filteredResults" />
    </div>
  </div>
</template>
