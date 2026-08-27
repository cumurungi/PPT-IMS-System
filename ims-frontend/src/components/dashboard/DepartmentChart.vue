<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Department Performance</h3>
    <div v-if="!departments || departments.length === 0" class="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
      No department data available yet.
    </div>
    <div v-else class="space-y-4">
      <div v-for="d in departments" :key="d.department" class="flex items-center gap-3">
        <div class="w-24 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{{ formatDeptName(d.department) }}</div>
        <div class="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
          <div class="h-full bg-indigo-500 rounded-full" :style="{ width: barWidth(d) + '%' }"></div>
          <span class="absolute inset-0 flex items-center justify-center text-xs text-gray-700 dark:text-gray-200 font-medium px-2">
            {{ d.completed }} / {{ d.total }} {{ d.metricLabel || '' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  departments: Array<{
    department: string;
    metricLabel: string;
    completedLabel: string;
    completed: number;
    total: number;
  }>;
}>();

function formatDeptName(dept: string): string {
  const map: Record<string, string> = {
    MEDIA: 'Media',
    EVANGELISM: 'Evangelism',
    IT: 'IT',
    HR_FINANCE: 'HR / Finance',
  };
  return map[dept] || dept;
}

function barWidth(d: any): number {
  if (!d.total || d.total <= 0) return 0;
  const pct = (d.completed / d.total) * 100;
  return Math.min(100, Math.max(0, pct));
}
</script>
