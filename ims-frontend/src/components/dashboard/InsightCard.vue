<template>
  <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
    <div class="flex-1">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ title }}</span>
        <span class="text-xs px-2 py-0.5 rounded-full" :class="insightColor(insight)">
          {{ insight }}
        </span>
      </div>
      <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span v-for="m in metrics" :key="m.label" class="flex items-center gap-1">
          <span class="font-medium">{{ m.label }}:</span>
          <span class="text-gray-700 dark:text-gray-300">{{ m.value }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  insight: string;
  metrics: Array<{ label: string; value: string }>;
}>();

function insightColor(insight: string): string {
  const lower = insight.toLowerCase();
  if (lower.includes('at risk') || lower.includes('backlogged') || lower.includes('high')) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }
  if (lower.includes('needs attention') || lower.includes('growing')) {
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  }
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
}
</script>
