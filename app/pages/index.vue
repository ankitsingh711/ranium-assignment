<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const initialQuery = typeof route.query.q === 'string' ? route.query.q : ''
const query = ref(initialQuery)
const hasSearched = ref(false)
const lastQuery = ref('')
const { results, searchLoading, searchError, searchBooks } = useBooks()

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
      :fallback-href="lastQuery ? googleBooksSearchUrl(lastQuery) : undefined"
      fallback-label="Search Google Books instead"
      @retry="runSearch"
    />

    <EmptyState
      v-else-if="hasSearched && results.length === 0"
      icon="🔍"
      title="No books found"
      :message="`Nothing matched “${lastQuery}”. Try a different title or author.`"
    />

    <EmptyState
      v-else-if="!hasSearched"
      title="Start by searching for a book"
      message="Try a title like “Dune” or an author like “Ursula K. Le Guin”."
    />

    <div v-else class="flex flex-col gap-4">
      <p class="text-sm text-surface-600">
        {{ results.length }} result{{ results.length === 1 ? '' : 's' }} for “{{ lastQuery }}”
      </p>
      <BookGrid :books="results" />
    </div>
  </div>
</template>
