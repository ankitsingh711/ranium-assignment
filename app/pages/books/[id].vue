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
    <NuxtLink
      to="/"
      class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-surface-600 transition-colors hover:-translate-x-0.5 hover:text-brand-700"
    >
      <Icon name="lucide:arrow-left" class="h-4 w-4" />
      Back to search
    </NuxtLink>

    <BookDetailSkeleton v-if="pending" />

    <ErrorState
      v-else-if="error"
      :title="error.statusCode === 404 ? 'Book not found' : 'Couldn\'t load this book'"
      :message="
        error.statusCode === 404
          ? 'This book doesn\'t exist, or the link is incorrect.'
          : 'Could not reach the book data source. Check your connection and try again.'
      "
      @retry="refresh"
    />

    <div v-else-if="book" class="flex flex-col gap-8 sm:flex-row sm:gap-10">
      <div class="mx-auto w-48 shrink-0 sm:mx-0 sm:w-56">
        <div class="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-card bg-surface-100 shadow-md">
          <img
            v-if="book.coverUrlLarge"
            :src="book.coverUrlLarge"
            :alt="`Cover of ${book.title}`"
            class="h-full w-full object-cover"
          >
          <div v-else class="flex flex-col items-center gap-2 px-4 text-center" aria-hidden="true">
            <Icon name="lucide:book-x" class="h-8 w-8 text-surface-300" />
            <span class="text-sm text-surface-600">No cover available</span>
          </div>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-5">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-surface-900 sm:text-3xl">{{ book.title }}</h1>
          <p class="text-base text-surface-600">{{ book.author ?? 'Unknown author' }}</p>
        </div>

        <div>
          <ShortlistButton :active="isShortlisted(book.id)" @toggle="toggle(book)" />
        </div>

        <p class="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-surface-800">
          {{ book.description ?? 'No description available for this book.' }}
        </p>

        <dl class="grid max-w-sm grid-cols-2 gap-4 border-t border-surface-200 pt-5 text-sm">
          <div class="flex items-start gap-2.5">
            <Icon name="lucide:building-2" class="mt-0.5 h-4 w-4 shrink-0 text-surface-600" />
            <div>
              <dt class="font-medium text-surface-600">Publisher</dt>
              <dd class="mt-0.5 text-surface-900">{{ book.publisher ?? 'Unknown' }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-2.5">
            <Icon name="lucide:file-text" class="mt-0.5 h-4 w-4 shrink-0 text-surface-600" />
            <div>
              <dt class="font-medium text-surface-600">Pages</dt>
              <dd class="mt-0.5 text-surface-900">{{ book.pageCount ?? 'Unknown' }}</dd>
            </div>
          </div>
        </dl>

        <div v-if="book.subjects.length > 0" class="border-t border-surface-200 pt-5">
          <h2 class="mb-2.5 flex items-center gap-1.5 text-sm font-medium text-surface-600">
            <Icon name="lucide:tags" class="h-4 w-4" />
            Subjects
          </h2>
          <ul class="flex flex-wrap gap-2">
            <li v-for="subject in book.subjects.slice(0, 12)" :key="subject">
              <NuxtLink
                :to="`/?q=${encodeURIComponent(subject)}`"
                class="inline-block rounded-full bg-surface-100 px-3 py-1 text-xs text-surface-800 transition-colors hover:bg-brand-100 hover:text-brand-700"
              >
                {{ subject }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
