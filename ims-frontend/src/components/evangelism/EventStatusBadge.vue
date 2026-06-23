<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colorClass]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: string }>();

// Map DB status values to sermon scheduling vocabulary
const MAP: Record<string, { label: string; cls: string }> = {
  PLANNED:     { label: 'Scheduled',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  CONFIRMED:   { label: 'Confirmed',  cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  IN_PROGRESS: { label: 'Recording',  cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  COMPLETED:   { label: 'Recorded',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  CANCELLED:   { label: 'Cancelled',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const colorClass = computed(() => MAP[props.status]?.cls ?? 'bg-gray-100 text-gray-700');
const label = computed(() => MAP[props.status]?.label ?? props.status);
</script>
