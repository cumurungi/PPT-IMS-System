<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <p class="text-sm text-gray-500 dark:text-gray-400">Online distribution platforms for published content.</p>
      <button v-if="auth.isManager" @click="showCreate = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
        <span>+</span> Add Platform
      </button>
    </div>
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>
    <div v-else class="flex-1 overflow-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
      <div v-if="platforms.length === 0" class="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">🌐</p><p class="text-sm">No platforms configured yet.</p>
      </div>
      <div v-for="p in platforms" :key="p.id"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-start justify-between mb-2">
          <p class="font-semibold text-gray-900 dark:text-gray-100">{{ p.name }}</p>
          <span :class="['text-xs px-2 py-0.5 rounded-full font-medium',
            p.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                       : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400']">
            {{ p.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
        <p class="text-xs text-indigo-600 dark:text-indigo-400 mb-1">{{ p.type }}</p>
        <a :href="p.url" target="_blank"
          class="text-xs text-gray-500 dark:text-gray-400 hover:underline truncate block">{{ p.url }}</a>
      </div>
    </div>

    <!-- Add Platform Modal -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showCreate = false">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Platform</h2>
          <button @click="showCreate = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form @submit.prevent="createPlatform" class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform Name *</label>
            <input v-model="form.name" type="text" required placeholder="e.g., YouTube"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
            <select v-model="form.type" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Select type</option>
              <option value="VIDEO">Video</option>
              <option value="AUDIO">Audio</option>
              <option value="WEBSITE">Website</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL *</label>
            <input v-model="form.url" type="url" required placeholder="https://"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <p v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showCreate = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" :disabled="submitting"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {{ submitting ? 'Adding...' : 'Add Platform' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const platforms = ref<any[]>([]);
const loading = ref(true);
const showCreate = ref(false);
const submitting = ref(false);
const formError = ref('');
const form = ref({ name: '', type: '', url: '' });

async function createPlatform() {
  formError.value = ''; submitting.value = true;
  try {
    await api.post('/it/platforms', { ...form.value, isActive: true });
    showCreate.value = false;
    form.value = { name: '', type: '', url: '' };
    await fetchPlatforms();
  } catch (e: any) { formError.value = e.response?.data?.message || 'Failed to add platform'; }
  finally { submitting.value = false; }
}

async function fetchPlatforms() {
  loading.value = true;
  try { const { data } = await api.get('/it/platforms'); platforms.value = data; }
  catch (err) { console.error(err); }
  finally { loading.value = false; }
}
onMounted(fetchPlatforms);
</script>
