<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 10 })
</script>

<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" role="status" aria-label="Loading search results">
    <BookCardSkeleton v-for="n in count" :key="n" />
  </div>
</template>
