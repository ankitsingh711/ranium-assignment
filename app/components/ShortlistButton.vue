<script setup lang="ts">
withDefaults(
  defineProps<{
    active: boolean
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' }
)

defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded-control border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    :class="[
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm',
      active
        ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
        : 'border-surface-300 bg-surface-0 text-surface-800 hover:border-brand-400 hover:text-brand-700'
    ]"
    :aria-pressed="active"
    @click="$emit('toggle')"
  >
    <span aria-hidden="true">{{ active ? '★' : '☆' }}</span>
    <span>{{ active ? 'Shortlisted' : 'Add to shortlist' }}</span>
  </button>
</template>
