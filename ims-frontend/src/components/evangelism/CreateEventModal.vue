<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Sermon Work Item</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This creates one sermon workflow item and notifies Media automatically.</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>

      <form @submit.prevent="handleCreate" class="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sermon Title *</label>
          <input v-model="form.title" type="text" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g., The Three Angels' Message" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recording Date *</label>
            <input v-model="form.date" type="date" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
            <input v-model="form.time" type="time"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Series / Type *</label>
          <select v-model="form.series" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">Select type</option>
            <option value="Series">Series</option>
            <option value="Single Sermon">Single Sermon</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location <span class="text-xs text-gray-400 font-normal">(defaults to Studio)</span></label>
          <input v-model="form.location" type="text"
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Studio" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brief Outline</label>
          <textarea v-model="form.description" rows="2"
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Key points, topics covered..." />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preacher(s)</label>
          <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1">
            <p v-if="preachers.length === 0" class="text-sm text-gray-400 dark:text-gray-500 p-1">
              No preachers yet. Add them in the Preachers tab first.
            </p>
            <label v-for="p in preachers" :key="p.id"
              class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1.5 rounded">
              <input type="checkbox" :value="p.id" v-model="form.preacherIds"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <div>
                <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">{{ p.name }}</span>
                <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">— {{ p.specialization }}</span>
              </div>
            </label>
          </div>
        </div>

        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <span class="mt-0.5">📬</span>
          <span>A recording request will be automatically sent to the Media team.</span>
        </div>

        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button type="submit" :disabled="submitting"
            class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {{ submitting ? 'Creating...' : 'Create Sermon' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api/axios';

const props = defineProps<{ preachers: any[] }>();
const emit = defineEmits(['close', 'created']);

const form = ref({
  title: '',
  date: '',
  time: '09:00',
  series: '',
  location: '',
  description: '',
  preacherIds: [] as string[],
});
const error = ref('');
const submitting = ref(false);

async function handleCreate() {
  error.value = '';
  submitting.value = true;
  try {
    const dateTime = form.value.time
      ? `${form.value.date}T${form.value.time}:00`
      : form.value.date;

    await api.post('/evangelism/sermons', {
      title: form.value.title,
      scheduledDate: new Date(dateTime).toISOString(),
      series: form.value.series,
      location: form.value.location || undefined,
      description: form.value.description || undefined,
      preacherIds: form.value.preacherIds,
    });
    emit('created');
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to schedule sermon';
  } finally {
    submitting.value = false;
  }
}
</script>
