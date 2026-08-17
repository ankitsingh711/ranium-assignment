<script setup lang="ts">
const query = ref('')
const hasSearched = ref(false)
const { results, searchLoading, searchError, searchBooks } = useBooks()

async function runSearch() {
  hasSearched.value = true
  await searchBooks(query.value)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold text-surface-900">Find your next book</h1>
      <p class="text-sm text-surface-600">Search by title or author, powered by Open Library.</p>
    </div>

    <SearchBar v-model="query" :loading="searchLoading" @search="runSearch" />

    <LoadingState v-if="searchLoading" label="Searching Open Library…" />

    <ErrorState
      v-else-if="searchError"
      :message="searchError"
      @retry="runSearch"
    />

    <EmptyState
      v-else-if="hasSearched && results.length === 0"
      title="No books found"
      message="Try a different title or author."
    />

    <EmptyState
      v-else-if="!hasSearched"
      title="Start by searching for a book"
      message="Try searching for a title like “Dune” or an author like “Ursula K. Le Guin”."
    />

    <BookGrid v-else :books="results" />
  </div>
</template>
