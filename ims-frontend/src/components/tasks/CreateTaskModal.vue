<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Task</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleCreate" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input v-model="form.title" type="text" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Task title" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
          <textarea v-model="form.description" rows="3" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            placeholder="Describe the task..."></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
            <select v-model="form.projectId"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">No project</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee *</label>
            <select v-model="form.assigneeId" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Select user</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline *</label>
            <input v-model="form.deadline" type="date" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select v-model="form.priority"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="NORMAL">Normal</option>
              <option value="HIGH">🔴 High</option>
              <option value="URGENT">🚨 Urgent</option>
            </select>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" :disabled="submitting"
            class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {{ submitting ? 'Creating...' : 'Create Task' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';

const emit = defineEmits(['close', 'created']);

const form = ref({ title: '', description: '', projectId: '', assigneeId: '', deadline: '', priority: 'NORMAL' });
const projects = ref<any[]>([]);
const users = ref<any[]>([]);
const error = ref('');
const submitting = ref(false);

onMounted(async () => {
  try {
    const [projRes, usersRes] = await Promise.all([
      api.get('/projects'),
      api.get('/tasks/assignable-users'),
    ]);
    projects.value = projRes.data?.data || projRes.data;
    users.value = usersRes.data;
  } catch {}
});

async function handleCreate() {
  error.value = '';
  submitting.value = true;
  try {
    await api.post('/tasks', {
      title: form.value.title,
      description: form.value.description,
      assigneeId: form.value.assigneeId,
      deadline: new Date(form.value.deadline).toISOString(),
      projectId: form.value.projectId || undefined,
    });
    emit('created');
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to create task';
  } finally {
    submitting.value = false;
  }
}
</script>
