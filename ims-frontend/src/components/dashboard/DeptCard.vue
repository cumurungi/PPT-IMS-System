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
      <span>{{ dept.metricLabel || 'Items' }}: {{ dept.total || 0 }}</span>
      <span>{{ dept.completedLabel || 'Done' }}: {{ dept.completed || 0 }}</span>
    </div>
    <div v-if="dept.pendingApprovals" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
      ⚠️ {{ dept.pendingApprovals }} pending approval{{ dept.pendingApprovals > 1 ? 's' : '' }}
    </div>
    <div v-if="dept.pendingLeave" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
      ⚠️ {{ dept.pendingLeave }} leave request{{ dept.pendingLeave > 1 ? 's' : '' }}
    </div>
    <div v-if="dept.openTickets" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
      ⚠️ {{ dept.openTickets }} open ticket{{ dept.openTickets > 1 ? 's' : '' }}
    </div>
    <div v-if="dept.queueSize" class="text-xs text-blue-600 dark:text-blue-400 mt-1">
      📡 {{ dept.queueSize }} in publishing queue
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
    metricLabel?: string;
    completedLabel?: string;
    total?: number;
    completed?: number;
    pendingApprovals?: number;
    pendingLeave?: number;
    openTickets?: number;
    queueSize?: number;
  };
}>();

const completionRate = computed(() => {
  const total = props.dept.total || 0;
  const completed = props.dept.completed || 0;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
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
