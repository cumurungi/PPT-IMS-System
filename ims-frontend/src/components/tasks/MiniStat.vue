<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
    <p :class="['text-lg font-bold', textColor]">{{ value }}</p>
    <p class="text-xs text-gray-500 dark:text-gray-400">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ label: string; value: number; color?: string }>();

const textColor = computed(() => {
  const map: Record<string, string> = {
    gray: 'text-gray-600 dark:text-gray-300',
    blue: 'text-blue-600 dark:text-blue-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
  };
  return map[props.color || ''] || 'text-gray-900 dark:text-gray-100';
});
</script>
