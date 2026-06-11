<template>
  <div class="w-72 flex flex-col bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex-shrink-0 h-full">
    <!-- Column header -->
    <div class="flex items-center justify-between mb-3 px-1">
      <div class="flex items-center gap-2">
        <div :class="['w-3 h-3 rounded-full', dotColor]"></div>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ title }}</h3>
      </div>
      <span class="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
        {{ tasks.length }}
      </span>
    </div>

    <!-- Cards -->
    <div class="flex-1 overflow-y-auto space-y-2">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-shadow"
        @click="$emit('open', task)"
      >
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{{ task.title }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{{ task.project?.name }}</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1">
            <div class="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
              {{ task.assignee?.name?.charAt(0) }}
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ task.assignee?.name?.split(' ')[0] }}</span>
          </div>
          <span :class="['text-xs', isOverdue(task) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-400']">
            {{ formatDate(task.deadline) }}
          </span>
        </div>
        <div v-if="task._count?.comments || task._count?.attachments" class="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span v-if="task._count?.comments">💬 {{ task._count.comments }}</span>
          <span v-if="task._count?.attachments">📎 {{ task._count.attachments }}</span>
        </div>
      </div>
      <div v-if="tasks.length === 0" class="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
        No tasks
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ title: string; status: string; color: string; tasks: any[] }>();
defineEmits(['open', 'update-status']);

const dotColor = computed(() => {
  const map: Record<string, string> = {
    gray: 'bg-gray-400',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  };
  return map[props.color] || 'bg-gray-400';
});

function isOverdue(task: any) {
  return task.status !== 'COMPLETED' && new Date(task.deadline) < new Date();
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
</script>
