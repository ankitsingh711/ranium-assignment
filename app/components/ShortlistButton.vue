<script setup lang="ts">
withDefaults(
  defineProps<{
    active: boolean
    size?: 'sm' | 'md'
    variant?: 'labeled' | 'icon'
  }>(),
  { size: 'md', variant: 'labeled' }
)

defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    v-if="variant === 'icon'"
    type="button"
    class="inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-90"
    :class="
      active
        ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
        : 'border-surface-200/80 bg-surface-0/90 text-surface-700 hover:border-brand-400 hover:text-brand-700'
    "
    :aria-pressed="active"
    :aria-label="active ? 'Remove from shortlist' : 'Add to shortlist'"
    :title="active ? 'Remove from shortlist' : 'Add to shortlist'"
    @click.prevent.stop="$emit('toggle')"
  >
    <Icon name="lucide:star" class="h-4.5 w-4.5" :class="{ 'fill-current': active }" />
  </button>

  <button
    v-else
    type="button"
    class="inline-flex items-center gap-1.5 rounded-control border font-medium shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
    :class="[
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2.5 text-sm',
      active
        ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
        : 'border-surface-300 bg-surface-0 text-surface-800 hover:border-brand-400 hover:text-brand-700'
    ]"
    :aria-pressed="active"
    @click="$emit('toggle')"
  >
    <Icon name="lucide:star" class="h-4 w-4 shrink-0" :class="{ 'fill-current': active }" />
    <span>{{ active ? 'Shortlisted' : 'Add to shortlist' }}</span>
  </button>
</template>
