<template>
  <RouterLink v-if="to" :to="to"
    class="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 -mx-2 transition-colors">
    <div class="flex items-center gap-2">
      <span class="text-lg">{{ icon }}</span>
      <span class="text-sm text-gray-700 dark:text-gray-300">{{ label }}</span>
    </div>
    <span :class="[
      'inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold',
      count > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    ]">
      {{ count }}
    </span>
  </RouterLink>
  <div v-else class="flex items-center justify-between py-2">
    <div class="flex items-center gap-2">
      <span class="text-lg">{{ icon }}</span>
      <span class="text-sm text-gray-700 dark:text-gray-300">{{ label }}</span>
    </div>
    <span :class="[
      'inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold',
      count > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    ]">
      {{ count }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
  label: string;
  count: number;
  icon: string;
  to?: string;
}>();
</script>
