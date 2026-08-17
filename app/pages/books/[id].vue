<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: book, pending, error, refresh } = await useAsyncData(
  `book-${id}`,
  () => getBookDetail(id)
)

const { isShortlisted, toggle } = useShortlist()
</script>

<template>
  <div>
    <NuxtLink to="/" class="mb-6 inline-flex items-center gap-1 text-sm font-medium text-surface-600 hover:text-brand-700">
      ← Back to search
    </NuxtLink>

    <LoadingState v-if="pending" label="Loading book…" />

    <ErrorState
      v-else-if="error"
      title="Couldn't load this book"
      message="This book may not exist, or Open Library is temporarily unavailable."
      @retry="refresh"
    />

    <div v-else-if="book" class="flex flex-col gap-6 sm:flex-row">
      <div class="mx-auto w-48 shrink-0 sm:mx-0">
        <div class="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-card bg-surface-100">
          <img
            v-if="book.coverUrlLarge"
            :src="book.coverUrlLarge"
            :alt="`Cover of ${book.title}`"
            class="h-full w-full object-cover"
          >
          <span v-else class="px-4 text-center text-sm text-surface-600" aria-hidden="true">No cover available</span>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900">{{ book.title }}</h1>
          <p class="text-sm text-surface-600">{{ book.author ?? 'Unknown author' }}</p>
        </div>

        <ShortlistButton :active="isShortlisted(book.id)" @toggle="toggle(book)" />

        <p class="text-sm leading-relaxed text-surface-800">
          {{ book.description ?? 'No description available for this book.' }}
        </p>

        <dl class="grid grid-cols-2 gap-4 text-sm sm:max-w-sm">
          <div>
            <dt class="font-medium text-surface-600">Publisher</dt>
            <dd class="text-surface-900">{{ book.publisher ?? 'Unknown' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-surface-600">Pages</dt>
            <dd class="text-surface-900">{{ book.pageCount ?? 'Unknown' }}</dd>
          </div>
        </dl>

        <div v-if="book.subjects.length > 0">
          <h2 class="mb-2 text-sm font-medium text-surface-600">Subjects</h2>
          <ul class="flex flex-wrap gap-2">
            <li
              v-for="subject in book.subjects.slice(0, 12)"
              :key="subject"
              class="rounded-full bg-surface-100 px-3 py-1 text-xs text-surface-800"
            >
              {{ subject }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
