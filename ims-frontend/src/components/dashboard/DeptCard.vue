<template>
  <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ formatDept(dept.department) }}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">{{ dept.users }} members</span>
    </div>
    <!-- Progress bar -->
    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
      <div
        class="bg-indigo-500 h-2 rounded-full transition-all"
        :style="{ width: completionRate + '%' }"
      ></div>
    </div>
    <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>{{ dept.completedTasks }}/{{ dept.tasks }} tasks</span>
      <span>{{ completionRate }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  dept: {
    department: string;
    users: number;
    projects: number;
    tasks: number;
    completedTasks: number;
  };
}>();

const completionRate = computed(() => {
  if (props.dept.tasks === 0) return 0;
  return Math.round((props.dept.completedTasks / props.dept.tasks) * 100);
});

function formatDept(d: string) {
  const map: Record<string, string> = {
    MEDIA: '🎬 Media',
    EVANGELISM: '📅 Evangelism',
    IT: '💻 IT',
    HR_FINANCE: '👥 HR/Finance',
  };
  return map[d] || d;
}
</script>
