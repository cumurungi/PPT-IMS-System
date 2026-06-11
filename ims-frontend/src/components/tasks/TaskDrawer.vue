<template>
  <div class="fixed inset-0 z-50 flex justify-end" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="relative w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
        <StatusBadge :status="task.status" />
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
      </div>

      <div class="px-6 py-5 space-y-6">
        <!-- Title -->
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ task.title }}</h2>

        <!-- Meta info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Assignee</label>
            <div class="flex items-center gap-2 mt-1">
              <div class="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
                {{ task.assignee?.name?.charAt(0) }}
              </div>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ task.assignee?.name }}</span>
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Due Date</label>
            <p :class="['text-sm mt-1', isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300']">
              {{ new Date(task.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) }}
              {{ isOverdue ? ' (Overdue)' : '' }}
            </p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Project</label>
            <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">{{ task.project?.name }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Department</label>
            <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">{{ task.project?.department }}</p>
          </div>
        </div>

        <!-- Status update -->
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Update Status</label>
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="s in statuses"
              :key="s.value"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                task.status === s.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
              ]"
              @click="changeStatus(s.value)"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Description</label>
          <p class="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap">{{ task.description }}</p>
        </div>

        <!-- Comments -->
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Comments ({{ comments.length }})</label>
          <div class="mt-3 space-y-3">
            <div v-for="c in comments" :key="c.id" class="flex gap-3">
              <div class="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                {{ c.author?.name?.charAt(0) }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ c.author?.name }}</span>
                  <span class="text-xs text-gray-400">{{ timeAgo(c.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{{ c.body }}</p>
              </div>
            </div>
          </div>
          <!-- Add comment -->
          <form @submit.prevent="addComment" class="mt-4 flex gap-2">
            <input
              v-model="newComment"
              type="text"
              placeholder="Write a comment..."
              class="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              :disabled="!newComment.trim()"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >Send</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import StatusBadge from './StatusBadge.vue';

const props = defineProps<{ task: any }>();
const emit = defineEmits(['close', 'updated']);

const comments = ref<any[]>([]);
const newComment = ref('');

const statuses = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'BLOCKED', label: 'Blocked' },
];

const isOverdue = computed(() => props.task.status !== 'COMPLETED' && new Date(props.task.deadline) < new Date());

onMounted(async () => {
  try {
    const { data } = await api.get(`/tasks/${props.task.id}/comments`);
    comments.value = data;
  } catch {}
});

async function changeStatus(status: string) {
  if (status === props.task.status) return;
  try {
    await api.patch(`/tasks/${props.task.id}`, { status });
    emit('updated');
  } catch (err) {
    console.error('Failed to update status:', err);
  }
}

async function addComment() {
  if (!newComment.value.trim()) return;
  try {
    const { data } = await api.post(`/tasks/${props.task.id}/comments`, { body: newComment.value });
    comments.value.push(data);
    newComment.value = '';
  } catch (err) {
    console.error('Failed to add comment:', err);
  }
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
</script>
