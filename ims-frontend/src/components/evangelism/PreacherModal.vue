<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ isEdit ? 'Edit Preacher' : 'Add Preacher' }}
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
          <input v-model="form.name" type="text" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g., Pastor John Doe" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization *</label>
          <input v-model="form.specialization" type="text" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g., Evangelism, Youth Ministry" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input v-model="form.email" type="email"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="email@example.com" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input v-model="form.phone" type="tel"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="+1 234 567 8900" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea v-model="form.notes" rows="3"
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Additional notes about this preacher..."></textarea>
        </div>

        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            Cancel
          </button>
          <button type="submit" :disabled="submitting"
            class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {{ submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Preacher') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import api from '@/api/axios';

const props = defineProps<{ preacher?: any }>();
const emit = defineEmits(['close', 'saved']);

const isEdit = computed(() => !!props.preacher);

const form = ref({
  name: props.preacher?.name ?? '',
  specialization: props.preacher?.specialization ?? '',
  email: props.preacher?.email ?? '',
  phone: props.preacher?.phone ?? '',
  notes: props.preacher?.notes ?? '',
});

const error = ref('');
const submitting = ref(false);

async function handleSubmit() {
  error.value = '';
  submitting.value = true;
  try {
    if (isEdit.value) {
      await api.patch(`/evangelism/preachers/${props.preacher.id}`, form.value);
    } else {
      await api.post('/evangelism/preachers', form.value);
    }
    emit('saved');
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to save preacher';
  } finally {
    submitting.value = false;
  }
}
</script>
