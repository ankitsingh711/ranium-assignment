<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    message?: string
    icon?: string
  }>(),
  {
    message: '',
    icon: 'lucide:library'
  }
)
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-surface-200 bg-surface-0 px-6 py-16 text-center">
    <span class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-surface-600" aria-hidden="true">
      <Icon :name="icon" class="h-6 w-6" />
    </span>
    <p class="text-base font-medium text-surface-800">{{ title }}</p>
    <p v-if="message" class="max-w-sm text-sm text-surface-600">{{ message }}</p>
    <slot />
  </div>
</template>
