<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    message: string
  }>(),
  {
    title: 'Something went wrong'
  }
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 rounded-card border border-danger-500/20 bg-danger-500/5 px-6 py-16 text-center" role="alert">
    <span class="text-3xl" aria-hidden="true">⚠️</span>
    <p class="text-base font-medium text-surface-800">{{ title }}</p>
    <p class="max-w-sm text-sm text-surface-600">{{ message }}</p>
    <button
      type="button"
      class="mt-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      @click="$emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
