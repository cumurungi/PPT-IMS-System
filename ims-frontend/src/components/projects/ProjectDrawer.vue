<template>
  <div class="fixed inset-0 z-50 flex justify-end" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="relative w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
        <div v-if="project">
          <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ project.name }}</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDept(project.department) }} · Created by {{ project.createdBy?.name }}</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
      </div>

      <div v-else-if="project" class="px-6 py-5 space-y-6">
        <!-- Description -->
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Description</label>
          <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">{{ project.description }}</p>
        </div>

        <!-- Progress -->
        <div>
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-500 dark:text-gray-400">Overall Progress</span>
            <span class="font-bold text-gray-900 dark:text-gray-100">{{ project.progress }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              class="bg-indigo-500 h-3 rounded-full transition-all"
              :style="{ width: project.progress + '%' }"
            ></div>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{{ project.completedTasks }} of {{ project.taskCount }} tasks completed</span>
            <span>Deadline: {{ new Date(project.deadline).toLocaleDateString() }}</span>
          </div>
        </div>

        <!-- Files -->
        <ProjectFiles :project-id="projectId" />

        <!-- Tasks list -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Tasks ({{ project.tasks?.length || 0 }})</label>
          </div>

          <div v-if="!project.tasks?.length" class="text-center py-8 text-sm text-gray-400">
            No tasks in this project yet.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="task in project.tasks"
              :key="task.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <!-- Status dot -->
                <div :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', statusDotColor(task.status)]"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ task.title }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ task.assignee?.name }} · {{ statusLabel(task.status) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span v-if="task._count?.comments" class="text-xs text-gray-400">💬{{ task._count.comments }}</span>
                <span class="text-xs text-gray-400">{{ formatTaskDate(task.deadline) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import ProjectFiles from './ProjectFiles.vue';

const props = defineProps<{ projectId: string }>();
defineEmits(['close']);

const project = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await api.get(`/projects/${props.projectId}`);
    project.value = data;
  } catch (err) {
    console.error('Failed to load project:', err);
  } finally {
    loading.value = false;
  }
});

function formatDept(d: string) {
  const map: Record<string, string> = { MEDIA: 'Media', EVANGELISM: 'Evangelism', IT: 'IT', HR_FINANCE: 'HR/Finance' };
  return map[d] || d;
}

function statusDotColor(status: string) {
  const map: Record<string, string> = {
    TODO: 'bg-gray-400',
    IN_PROGRESS: 'bg-blue-500',
    IN_REVIEW: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    BLOCKED: 'bg-red-500',
  };
  return map[status] || 'bg-gray-400';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    COMPLETED: 'Completed',
    BLOCKED: 'Blocked',
  };
  return map[status] || status;
}

function formatTaskDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
</script>
