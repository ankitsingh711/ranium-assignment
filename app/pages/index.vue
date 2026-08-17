<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const initialQuery = typeof route.query.q === 'string' ? route.query.q : ''
const query = ref(initialQuery)
const hasSearched = ref(false)
const lastQuery = ref('')
const { results, searchLoading, searchError, usedFallback, searchBooks } = useBooks()

async function runSearch() {
  hasSearched.value = true
  lastQuery.value = query.value.trim()
  router.replace({ query: lastQuery.value ? { q: lastQuery.value } : {} })
  await searchBooks(query.value)
}

if (initialQuery) {
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
        Open Library is unavailable right now — showing results from the Internet Archive instead.
      </div>
      <p class="text-sm text-surface-600">
        {{ results.length }} result{{ results.length === 1 ? '' : 's' }} for “{{ lastQuery }}”
      </p>
      <BookGrid :books="results" />
    </div>
  </div>
</template>
