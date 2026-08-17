<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    message: string
    fallbackHref?: string
    fallbackLabel?: string
  }>(),
  {
    title: 'Something went wrong',
    fallbackHref: undefined,
    fallbackLabel: 'Search elsewhere instead'
  }
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 rounded-card border border-danger-500/20 bg-danger-500/5 px-6 py-16 text-center" role="alert">
    <span class="text-3xl" aria-hidden="true">⚠️</span>
    <p class="text-base font-medium text-surface-800">{{ title }}</p>
    <p class="max-w-sm text-sm text-surface-600">{{ message }}</p>
    <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        class="rounded-control bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        @click="$emit('retry')"
      >
        Try again
      </button>
      <a
        v-if="fallbackHref"
        :href="fallbackHref"
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm font-medium text-surface-600 underline decoration-surface-300 underline-offset-4 hover:text-brand-700"
      >
        {{ fallbackLabel }} ↗
      </a>
    </div>
  </div>
</template>
