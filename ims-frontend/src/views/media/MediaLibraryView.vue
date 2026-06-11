<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Media Library</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Browse, search and organize media assets</p>
      </div>
      <label class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors">
        <span>+</span> Upload Asset
        <input type="file" class="hidden" @change="handleUpload" />
      </label>
    </div>

    <!-- Filter -->
    <div class="flex items-center gap-3 mb-4 flex-shrink-0">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by title..."
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-56 focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <select
        v-model="filterCategory"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        <option value="">All Categories</option>
        <option value="Video">Video</option>
        <option value="Audio">Audio</option>
        <option value="Image">Image</option>
        <option value="Document">Document</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <!-- Upload progress -->
    <div v-if="uploading" class="mb-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
      Uploading {{ uploadProgress }}%...
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Asset grid -->
    <div v-else class="flex-1 overflow-y-auto">
      <div v-if="filteredAssets.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">🗃️</p>
        <p class="text-sm">No media assets yet. Upload one to get started.</p>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="asset in filteredAssets"
          :key="asset.id"
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group"
        >
          <!-- Preview -->
          <div class="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
            <span class="text-4xl">{{ categoryIcon(asset.category) }}</span>
            <button
              @click="deleteAsset(asset.id)"
              class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs transition-opacity"
              title="Delete"
            >🗑️</button>
          </div>
          <!-- Info -->
          <div class="p-3">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ asset.title }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ asset.category }} · {{ formatSize(asset.fileSizeBytes) }}</p>
            <div v-if="asset.tags?.length" class="flex flex-wrap gap-1 mt-2">
              <span v-for="tag in asset.tags.slice(0, 3)" :key="tag"
                class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Asset metadata modal (after upload) -->
    <div v-if="pendingUpload" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="pendingUpload = null">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Asset Details</h2>
        </div>
        <form @submit.prevent="saveAsset" class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input v-model="assetForm.title" type="text" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
            <select v-model="assetForm.category" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Select</option>
              <option value="Video">Video</option>
              <option value="Audio">Audio</option>
              <option value="Image">Image</option>
              <option value="Document">Document</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
            <input v-model="tagsInput" type="text"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g., sermon, 2024, sunday" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="pendingUpload = null"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" :disabled="saving"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {{ saving ? 'Saving...' : 'Save Asset' }}
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

const assets = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const filterCategory = ref('');
const uploading = ref(false);
const uploadProgress = ref(0);
const pendingUpload = ref<any>(null);
const assetForm = ref({ title: '', category: '' });
const tagsInput = ref('');
const saving = ref(false);

const filteredAssets = computed(() => {
  let result = assets.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(a => a.title.toLowerCase().includes(q));
  }
  if (filterCategory.value) {
    result = result.filter(a => a.category === filterCategory.value);
  }
  return result;
});

function categoryIcon(category: string) {
  const map: Record<string, string> = {
    Video: '🎬', Audio: '🎵', Image: '🖼️', Document: '📄', Other: '📦',
  };
  return map[category] || '📦';
}

function formatSize(bytes: number | string) {
  const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB';
  return (b / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];

  uploading.value = true;
  uploadProgress.value = 0;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const { data } = await api.post('/upload/media-asset', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      },
    });
    // Open metadata modal
    pendingUpload.value = data;
    assetForm.value.title = data.fileName.replace(/\.[^/.]+$/, '');
    assetForm.value.category = guessCategory(data.mimeType);
  } catch (err) {
    console.error('Upload failed:', err);
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

function guessCategory(mimeType: string) {
  if (mimeType?.startsWith('video/')) return 'Video';
  if (mimeType?.startsWith('audio/')) return 'Audio';
  if (mimeType?.startsWith('image/')) return 'Image';
  if (mimeType?.includes('pdf') || mimeType?.includes('document')) return 'Document';
  return 'Other';
}

async function saveAsset() {
  saving.value = true;
  try {
    await api.post('/media/assets', {
      title: assetForm.value.title,
      category: assetForm.value.category,
      fileUrl: pendingUpload.value.fileUrl,
      fileType: pendingUpload.value.mimeType || 'application/octet-stream',
      fileSizeBytes: pendingUpload.value.fileSizeBytes,
      tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
    });
    pendingUpload.value = null;
    assetForm.value = { title: '', category: '' };
    tagsInput.value = '';
    await fetchAssets();
  } catch (err) {
    console.error('Failed to save asset:', err);
  } finally {
    saving.value = false;
  }
}

async function deleteAsset(id: string) {
  try {
    await api.delete(`/media/assets/${id}`);
    await fetchAssets();
  } catch (err) {
    console.error('Failed to delete asset:', err);
  }
}

async function fetchAssets() {
  try {
    const { data } = await api.get('/media/assets');
    assets.value = data;
  } catch (err) {
    console.error('Failed to load assets:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAssets);
</script>
