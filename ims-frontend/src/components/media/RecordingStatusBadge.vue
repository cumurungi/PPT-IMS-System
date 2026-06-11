<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', colorClass]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: string }>();

const map: Record<string, { class: string; label: string }> = {
  CAPTURED: { class: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', label: 'Captured' },
  IN_EDITING: { class: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', label: 'In Editing' },
  EDITED: { class: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', label: 'Edited' },
  APPROVED: { class: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', label: 'Approved' },
  PUBLISHED: { class: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', label: 'Published' },
};

const colorClass = computed(() => map[props.status]?.class || 'bg-gray-100 text-gray-700');
const label = computed(() => map[props.status]?.label || props.status);
</script>
