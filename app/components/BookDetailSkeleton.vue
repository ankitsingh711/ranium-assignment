<template>
  <div class="flex flex-col gap-6 sm:flex-row" role="status" aria-label="Loading book details">
    <div class="mx-auto w-48 shrink-0 sm:mx-0 sm:w-56">
      <div class="aspect-[2/3] animate-pulse rounded-card bg-surface-100" />
    </div>
    <div class="flex flex-1 flex-col gap-4">
      <div class="flex flex-col gap-2">
        <div class="h-7 w-2/3 animate-pulse rounded bg-surface-100" />
        <div class="h-4 w-1/3 animate-pulse rounded bg-surface-100" />
      </div>
      <div class="h-9 w-40 animate-pulse rounded-control bg-surface-100" />
      <div class="flex flex-col gap-2">
        <div class="h-3.5 w-full animate-pulse rounded bg-surface-100" />
        <div class="h-3.5 w-full animate-pulse rounded bg-surface-100" />
        <div class="h-3.5 w-4/5 animate-pulse rounded bg-surface-100" />
      </div>
    </div>
  </div>
</template>
