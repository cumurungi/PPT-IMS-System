<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Editing</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Recordings currently being edited or awaiting approval</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ inEditingCount }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">In Editing</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ editedCount }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Edited (Ready for Approval)</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ recordings.length }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="flex items-center gap-3 mb-4 flex-shrink-0">
      <input v-model="searchQuery" type="text" placeholder="Search..."
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none" />
      <select v-model="filterStatus"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All</option>
        <option value="IN_EDITING">In Editing</option>
        <option value="EDITED">Edited</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filtered.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <p class="text-4xl mb-3">✂️</p>
      <p class="text-sm">No recordings in editing. Start editing from the Recordings tab.</p>
    </div>

    <!-- Recordings in editing -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="rec in filtered" :key="rec.id"
          @click="openRecording(rec)"
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow cursor-pointer">
          <!-- Title + Status -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{{ rec.title }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ rec.event?.title || 'No sermon linked' }}
              </p>
            </div>
            <span :class="['text-xs font-medium px-2 py-1 rounded-full',
              rec.status === 'IN_EDITING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300']">
              {{ rec.status === 'IN_EDITING' ? 'Editing' : 'Edited' }}
            </span>
          </div>

          <!-- Progress bar (only for IN_EDITING) -->
          <div v-if="rec.status === 'IN_EDITING'" class="mb-3">
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span class="font-medium">{{ rec.editingProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-blue-500 h-2 rounded-full transition-all" :style="{ width: rec.editingProgress + '%' }"></div>
            </div>
          </div>

          <!-- Edited: ready for approval indicator -->
          <div v-if="rec.status === 'EDITED'" class="mb-3">
            <p class="text-xs text-yellow-600 dark:text-yellow-400 font-medium">⏳ Ready to send for preacher approval</p>
          </div>

          <!-- Editor + Date -->
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span v-if="rec.editor" class="flex items-center gap-1">
              <span class="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-300 text-xs font-bold">
                {{ rec.editor.name.charAt(0) }}
              </span>
              {{ rec.editor.name }}
            </span>
            <span v-else class="text-gray-300 dark:text-gray-600 italic">No editor</span>
            <span>{{ formatDate(rec.recordingDate) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recording Detail Drawer (reuse existing) -->
    <RecordingDrawer
      v-if="selectedRecording"
      :recording-id="selectedRecording.id"
      @close="selectedRecording = null"
      @updated="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import RecordingDrawer from '@/components/media/RecordingDrawer.vue';

const recordings = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const filterStatus = ref('');
const selectedRecording = ref<any>(null);

const inEditingCount = computed(() => recordings.value.filter(r => r.status === 'IN_EDITING').length);
const editedCount = computed(() => recordings.value.filter(r => r.status === 'EDITED').length);

const filtered = computed(() => {
  let result = recordings.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(r => r.title.toLowerCase().includes(q));
  }
  if (filterStatus.value) {
    result = result.filter(r => r.status === filterStatus.value);
  }
  return result;
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function openRecording(rec: any) {
  selectedRecording.value = rec;
}

async function fetchData() {
  loading.value = true;
  selectedRecording.value = null;
  try {
    const { data } = await api.get('/media/recordings', { params: { stage: 'editing' } });
    recordings.value = data;
  } catch (err) {
    console.error('Failed to load editing recordings:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
