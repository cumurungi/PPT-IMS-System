<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', colorClass]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: string }>();

const colorMap: Record<string, { class: string; label: string }> = {
  TODO: { class: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', label: 'To Do' },
  IN_PROGRESS: { class: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', label: 'In Progress' },
  IN_REVIEW: { class: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', label: 'In Review' },
  COMPLETED: { class: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', label: 'Completed' },
  BLOCKED: { class: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300', label: 'Blocked' },
};

const colorClass = computed(() => colorMap[props.status]?.class || 'bg-gray-100 text-gray-700');
const label = computed(() => colorMap[props.status]?.label || props.status);
</script>
