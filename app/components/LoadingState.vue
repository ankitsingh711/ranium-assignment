<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), {
  label: 'Loading…'
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-surface-600" role="status" aria-live="polite">
    <span class="h-8 w-8 animate-spin rounded-full border-2 border-surface-300 border-t-brand-600" />
    <p class="text-sm">{{ label }}</p>
  </div>
</template>
