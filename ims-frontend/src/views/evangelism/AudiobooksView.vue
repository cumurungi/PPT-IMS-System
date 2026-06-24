<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Audiobooks</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Record Ellen G. White books chapter by chapter
        </p>
      </div>
      <button @click="showCreate = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
        <span>+</span> New Book
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="audiobooks.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <p class="text-4xl mb-3">🎧</p>
      <p class="text-sm">No audiobooks yet. Click "New Book" to start.</p>
    </div>

    <!-- Book list -->
    <div v-else class="flex-1 overflow-y-auto space-y-4">
      <div v-for="book in audiobooks" :key="book.id"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <!-- Book header -->
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-base font-bold text-gray-900 dark:text-gray-100">📚 {{ book.bookName }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              👤 {{ book.reader || 'No reader assigned' }} · {{ completedCount(book) }}/{{ book.chapters.length }} chapters done
            </p>
          </div>
          <div class="flex items-center gap-2">
            <!-- Overall progress -->
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ Math.round(completedCount(book) / Math.max(book.chapters.length, 1) * 100) }}%</span>
            <!-- Status badge -->
            <span v-if="completedCount(book) === book.chapters.length && book.chapters.length > 0"
              :class="['text-xs font-medium px-2 py-1 rounded-full', book.approved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300']">
              {{ book.approved ? '✅ Approved' : '⏳ Awaiting Approval' }}
            </span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div class="bg-indigo-500 h-2 rounded-full transition-all" :style="{ width: (completedCount(book) / Math.max(book.chapters.length, 1) * 100) + '%' }"></div>
        </div>

        <!-- Chapters list -->
        <div class="space-y-1.5">
          <div v-for="(ch, idx) in book.chapters" :key="idx"
            class="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750">
            <div class="flex items-center gap-3">
              <button @click="toggleChapter(book.id, idx, !ch.done)"
                :class="['w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  ch.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400']">
                <span v-if="ch.done" class="text-xs">✓</span>
              </button>
              <span :class="['text-sm', ch.done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100']">
                {{ ch.title }}
              </span>
            </div>
            <span v-if="ch.done" class="text-xs text-green-600 dark:text-green-400">Recorded</span>
            <span v-else class="text-xs text-gray-400">Pending</span>
          </div>
        </div>

        <!-- Upload ZIP + Approve (when all chapters done) -->
        <div v-if="completedCount(book) === book.chapters.length && book.chapters.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div v-if="!book.approved" class="space-y-3">
            <!-- Upload ZIP -->
            <div v-if="!book.fileUrl">
              <label class="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
                <span class="text-sm text-gray-500 dark:text-gray-400">📁 Upload ZIP folder of recordings</span>
                <input type="file" class="hidden" accept=".zip,.rar,.7z" @change="uploadFile(book.id, $event)" />
              </label>
              <div v-if="uploading === book.id" class="mt-2 flex items-center gap-2 text-xs text-indigo-600">
                <div class="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent"></div>
                Uploading...
              </div>
            </div>
            <div v-else class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <span>📦</span>
              <a :href="book.fileUrl" target="_blank" class="hover:underline">Download ZIP</a>
            </div>

            <!-- Approve button (manager only) -->
            <button v-if="isManager && book.fileUrl" @click="approveBook(book.id)"
              class="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
              ✅ Approve Audiobook
            </button>
            <p v-else-if="!isManager && book.fileUrl" class="text-xs text-gray-500 dark:text-gray-400 italic text-center">
              Waiting for manager to approve
            </p>
          </div>
          <div v-else class="text-center text-green-600 dark:text-green-400 text-sm font-medium">
            ✅ Audiobook approved and complete
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showCreate = false">
      <div class="absolute inset-0 bg-black/30" @click="showCreate = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">New Audiobook</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add a book with its chapters to record</p>
        </div>
        <form @submit.prevent="handleCreate" class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book Name *</label>
            <input v-model="createForm.bookName" type="text" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g., Steps to Christ" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reader *</label>
            <input v-model="createForm.reader" type="text" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Who will record this?" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapters *</label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Add each chapter (one per line)</p>
            <textarea v-model="createForm.chaptersText" rows="6" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Chapter 1: God's Love for Man&#10;Chapter 2: The Sinner's Need of Christ&#10;Chapter 3: Repentance&#10;Chapter 4: Confession" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showCreate = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" :disabled="submitting"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {{ submitting ? 'Creating...' : 'Create Book' }}
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
import { useAuthStore } from '@/stores/auth.store';

const toast = useToast();
const auth = useAuthStore();
const isManager = computed(() => auth.user?.role === 'MANAGER' || auth.user?.role === 'ADMIN');

interface Chapter { title: string; done: boolean; }
interface Audiobook {
  id: string;
  bookName: string;
  reader: string;
  chapters: Chapter[];
  fileUrl: string | null;
  approved: boolean;
  createdAt: string;
}

const audiobooks = ref<Audiobook[]>([]);
const loading = ref(true);
const showCreate = ref(false);
const submitting = ref(false);
const uploading = ref<string | null>(null);
const createForm = ref({ bookName: '', reader: '', chaptersText: '' });

function completedCount(book: Audiobook) {
  return book.chapters.filter(c => c.done).length;
}

async function handleCreate() {
  submitting.value = true;
  try {
    const chapters = createForm.value.chaptersText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (chapters.length === 0) {
      toast.error('Add at least one chapter');
      submitting.value = false;
      return;
    }

    await api.post('/evangelism/audiobooks', {
      bookName: createForm.value.bookName,
      reader: createForm.value.reader,
      chapters,
    });
    showCreate.value = false;
    createForm.value = { bookName: '', reader: '', chaptersText: '' };
    toast.success('Audiobook created');
    await fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to create');
  } finally {
    submitting.value = false;
  }
}

async function toggleChapter(bookId: string, chapterIndex: number, done: boolean) {
  try {
    await api.patch(`/evangelism/audiobooks/${bookId}/chapters/${chapterIndex}`, { done });
    // Update locally
    const book = audiobooks.value.find(b => b.id === bookId);
    if (book) book.chapters[chapterIndex].done = done;
  } catch (e: any) {
    toast.error('Failed to update chapter');
  }
}

async function uploadFile(bookId: string, event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  uploading.value = bookId;
  const formData = new FormData();
  formData.append('file', input.files[0]);
  try {
    const { data } = await api.post('/upload/media-asset', formData);
    await api.patch(`/evangelism/audiobooks/${bookId}`, { fileUrl: data.fileUrl });
    const book = audiobooks.value.find(b => b.id === bookId);
    if (book) book.fileUrl = data.fileUrl;
    toast.success('File uploaded');
  } catch (e: any) {
    toast.error('Upload failed');
  } finally {
    uploading.value = null;
    input.value = '';
  }
}

async function approveBook(bookId: string) {
  try {
    await api.patch(`/evangelism/audiobooks/${bookId}`, { approved: true });
    const book = audiobooks.value.find(b => b.id === bookId);
    if (book) book.approved = true;
    toast.success('Audiobook approved!');
  } catch (e: any) {
    toast.error('Failed to approve');
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
