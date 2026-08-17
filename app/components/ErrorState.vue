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
  <div class="flex flex-col items-center justify-center gap-3 rounded-card border border-danger-500/20 bg-danger-500/5 px-6 py-16 text-center" role="alert">
    <span class="flex h-12 w-12 items-center justify-center rounded-full bg-danger-500/10 text-danger-600" aria-hidden="true">
      <Icon name="lucide:triangle-alert" class="h-6 w-6" />
    </span>
    <p class="text-base font-medium text-surface-800">{{ title }}</p>
    <p class="max-w-sm text-sm text-surface-600">{{ message }}</p>
    <button
      type="button"
      class="mt-2 inline-flex items-center gap-1.5 rounded-control bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.97]"
      @click="$emit('retry')"
    >
      <Icon name="lucide:rotate-cw" class="h-4 w-4" />
      Try again
    </button>
  </div>
</template>
