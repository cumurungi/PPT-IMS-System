<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">New Recording</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>

      <form @submit.prevent="handleCreate" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input v-model="form.title" type="text" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g., Sunday Service Recording" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recording Date *</label>
            <input v-model="form.recordingDate" type="date" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format *</label>
            <select v-model="form.format" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Select</option>
              <option value="MP4">MP4 (Video)</option>
              <option value="MOV">MOV (Video)</option>
              <option value="MP3">MP3 (Audio)</option>
              <option value="WAV">WAV (Audio)</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes) *</label>
          <input v-model.number="durationMinutes" type="number" min="0" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g., 90" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link to Event (optional)</label>
          <select v-model="form.eventId"
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">No event</option>
            <option v-for="e in events" :key="e.id" :value="e.id">{{ e.title }}</option>
          </select>
        </div>

        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            Cancel
          </button>
          <button type="submit" :disabled="submitting"
            class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {{ submitting ? 'Creating...' : 'Create' }}
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

const form = ref({ title: '', recordingDate: '', format: '', eventId: '' });
const durationMinutes = ref<number | null>(null);
const events = ref<any[]>([]);
const error = ref('');
const submitting = ref(false);

onMounted(async () => {
  try {
    const { data } = await api.get('/evangelism/events');
    events.value = data;
  } catch {
    // Evangelism events may not be accessible; that's fine
  }
});

async function handleCreate() {
  error.value = '';
  submitting.value = true;
  try {
    await api.post('/media/recordings', {
      title: form.value.title,
      recordingDate: new Date(form.value.recordingDate).toISOString(),
      format: form.value.format,
      durationSeconds: (durationMinutes.value || 0) * 60,
      eventId: form.value.eventId || undefined,
    });
    emit('created');
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to create recording';
  } finally {
    submitting.value = false;
  }
}
</script>
