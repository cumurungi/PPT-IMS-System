<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Audiobooks</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Ellen G. White books — Proof reading & recording by Evangelism team
        </p>
      </div>
      <button @click="showCreate = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
        <span>+</span> New Audiobook
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ stats.proofReading }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Proof Reading</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats.readyToRecord }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ready to Record</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ stats.recording }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Recording</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats.completed }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Completed</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="flex items-center gap-3 mb-4 flex-shrink-0">
      <input v-model="search" type="text" placeholder="Search audiobooks..."
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-52 focus:ring-2 focus:ring-indigo-500 outline-none" />
      <select v-model="filterStatus"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All Stages</option>
        <option value="PROOF_READING">Proof Reading</option>
        <option value="READY">Ready to Record</option>
        <option value="RECORDING">Recording</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <p class="text-4xl mb-3">🎧</p>
      <p class="text-sm">No audiobooks yet. Click "New Audiobook" to start.</p>
    </div>

    <!-- List -->
    <div v-else class="flex-1 overflow-y-auto space-y-3">
      <div v-for="book in filtered" :key="book.id"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ book.title }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              📚 {{ book.bookName }} · 👤 {{ book.reader || 'No reader assigned' }}
            </p>
            <p v-if="book.chapters" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">📄 {{ book.chapters }}</p>
          </div>
          <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', statusClass(book.status)]">
            {{ statusLabel(book.status) }}
          </span>
        </div>

        <!-- Progress actions -->
        <div class="mt-3 flex items-center gap-2">
          <button v-if="book.status === 'PROOF_READING'" @click="updateStatus(book.id, 'READY')"
            class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium">
            ✓ Proof Reading Done
          </button>
          <button v-if="book.status === 'READY'" @click="updateStatus(book.id, 'RECORDING')"
            class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium">
            🎙️ Start Recording
          </button>
          <button v-if="book.status === 'RECORDING'" @click="updateStatus(book.id, 'COMPLETED')"
            class="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium">
            ✓ Recording Done
          </button>
          <span v-if="book.status === 'COMPLETED'" class="text-xs text-green-600 dark:text-green-400 font-medium">
            ✅ Done
          </span>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showCreate = false">
      <div class="absolute inset-0 bg-black/30" @click="showCreate = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">New Audiobook</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Schedule an Ellen G. White audiobook recording</p>
        </div>
        <form @submit.prevent="handleCreate" class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapter / Episode Title *</label>
            <input v-model="createForm.title" type="text" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g., Steps to Christ — Chapter 3: Repentance" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book Name *</label>
            <input v-model="createForm.bookName" type="text" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g., Steps to Christ, Desire of Ages, Great Controversy" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapters / Pages</label>
            <input v-model="createForm.chapters" type="text"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g., Chapter 3, pages 45-52" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reader</label>
            <input v-model="createForm.reader" type="text"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Who will read/record this?" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showCreate = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" :disabled="submitting"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {{ submitting ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { useToast } from '@/composables/useToast';

const toast = useToast();

interface Audiobook {
  id: string;
  title: string;
  bookName: string;
  chapters?: string;
  reader?: string;
  status: 'PROOF_READING' | 'READY' | 'RECORDING' | 'COMPLETED';
  createdAt: string;
}

const audiobooks = ref<Audiobook[]>([]);
const loading = ref(true);
const search = ref('');
const filterStatus = ref('');
const showCreate = ref(false);
const submitting = ref(false);
const createForm = ref({ title: '', bookName: '', chapters: '', reader: '' });

const stats = computed(() => ({
  proofReading: audiobooks.value.filter(b => b.status === 'PROOF_READING').length,
  readyToRecord: audiobooks.value.filter(b => b.status === 'READY').length,
  recording: audiobooks.value.filter(b => b.status === 'RECORDING').length,
  completed: audiobooks.value.filter(b => b.status === 'COMPLETED').length,
}));

const filtered = computed(() => {
  let result = audiobooks.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(b => b.title.toLowerCase().includes(q) || b.bookName.toLowerCase().includes(q));
  }
  if (filterStatus.value) result = result.filter(b => b.status === filterStatus.value);
  return result;
});

function statusClass(status: string) {
  const map: Record<string, string> = {
    PROOF_READING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    READY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    RECORDING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PROOF_READING: 'Proof Reading',
    READY: 'Ready to Record',
    RECORDING: 'Recording',
    COMPLETED: 'Completed',
  };
  return map[status] || status;
}

async function handleCreate() {
  submitting.value = true;
  try {
    await api.post('/evangelism/audiobooks', createForm.value);
    showCreate.value = false;
    createForm.value = { title: '', bookName: '', chapters: '', reader: '' };
    toast.success('Audiobook created');
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to create audiobook');
  } finally {
    submitting.value = false;
  }
}

async function updateStatus(id: string, status: string) {
  try {
    await api.patch(`/evangelism/audiobooks/${id}`, { status });
    toast.success(`Status updated to ${statusLabel(status)}`);
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to update');
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await api.get('/evangelism/audiobooks');
    audiobooks.value = data;
  } catch (err) {
    console.error('Failed to load audiobooks:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
