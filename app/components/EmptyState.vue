<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    message?: string
    icon?: string
  }>(),
  {
    message: '',
    icon: '📚'
  }
)
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-surface-200 bg-surface-0 px-6 py-16 text-center">
    <span class="text-3xl" aria-hidden="true">{{ icon }}</span>
    <p class="text-base font-medium text-surface-800">{{ title }}</p>
    <p v-if="message" class="max-w-sm text-sm text-surface-600">{{ message }}</p>
    <slot />
  </div>
</template>
