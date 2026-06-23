<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', colorClass]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ priority: string }>();

const map: Record<string, { class: string; label: string }> = {
  LOW: { class: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', label: '🟢 Low' },
  MEDIUM: { class: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', label: '🟡 Medium' },
  HIGH: { class: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300', label: '🔴 High' },
};

const colorClass = computed(() => map[props.priority]?.class || 'bg-gray-100 text-gray-700');
const label = computed(() => map[props.priority]?.label || props.priority);
</script>
