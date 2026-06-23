<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Project</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleCreate" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name *</label>
          <input v-model="form.name" type="text" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g., Q1 Marketing Campaign" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
          <textarea v-model="form.description" rows="3" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            placeholder="What is this project about?"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
            <select v-model="form.department" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Select</option>
              <option value="MEDIA">Media</option>
              <option value="EVANGELISM">Evangelism</option>
              <option value="IT">IT</option>
              <option value="HR_FINANCE">HR / Finance</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline *</label>
            <input v-model="form.deadline" type="date" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Files</label>

          <div class="flex gap-3 items-center mb-3 relative">
            <button type="button" @click="showPickerMenu = !showPickerMenu"
              class="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-50">
              <span class="text-lg">📎</span>
              <span class="font-medium">Attach</span>
              <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
            </button>

            <div v-if="showPickerMenu" class="absolute z-50 mt-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg w-44 right-0">
              <button type="button" @click="triggerFileInput" class="w-full text-left px-3 py-2 text-sm bg-white dark:bg-white text-gray-800 hover:bg-gray-100 rounded-t-md">Select Files</button>
              <button type="button" @click="triggerFolderInput" class="w-full text-left px-3 py-2 text-sm bg-white dark:bg-white text-gray-800 border-t border-gray-100 hover:bg-gray-100 rounded-b-md">Select Folder</button>
            </div>

            <!-- Hidden inputs triggered by the menu -->
            <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileSelection" />
            <input ref="folderInput" type="file" webkitdirectory directory mozdirectory multiple class="hidden" @change="handleFileSelection" />
          </div>

          <div v-if="selectedFiles.length" class="border border-gray-100 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 p-3">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-gray-700 dark:text-gray-200">Selected Files</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ selectedFiles.length }} file(s)</div>
            </div>

            <ul class="space-y-2 max-h-40 overflow-auto">
              <li v-for="(file, idx) in selectedFiles" :key="idx" class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-600">📄</div>
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate" :title="file.name">{{ file.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatBytes(file.size) }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" @click="removeSelectedFile(idx)" class="text-xs text-red-600 hover:text-red-700">Remove</button>
                </div>
              </li>
            </ul>
          </div>
          <div v-else class="text-xs text-gray-500 dark:text-gray-400">No files selected. You can attach files or choose a folder.</div>
        </div>

        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" :disabled="submitting"
            class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {{ submitting ? 'Creating...' : 'Create Project' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api/axios';

const emit = defineEmits(['close', 'created']);

const form = ref({ name: '', description: '', department: '', deadline: '' });
const selectedFiles = ref<File[]>([]);
const error = ref('');
const submitting = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const showPickerMenu = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const folderInput = ref<HTMLInputElement | null>(null);

async function handleCreate() {
  error.value = '';
  submitting.value = true;
  try {
    const { data: project } = await api.post('/projects', {
      ...form.value,
      deadline: new Date(form.value.deadline).toISOString(),
    });

    if (selectedFiles.value.length) {
      uploading.value = true;
      uploadProgress.value = 0;

      const formData = new FormData();
      selectedFiles.value.forEach((file) => {
        formData.append('files', file);
        formData.append('filePaths', (file as any).webkitRelativePath || file.name);
      });

      await api.post(`/upload/project/${project.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e: any) => {
          if (e?.total) uploadProgress.value = Math.round((e.loaded / e.total) * 100);
        },
      });

      uploading.value = false;
      selectedFiles.value = [];
      uploadProgress.value = 0;
    }

    emit('created');
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to create project';
  } finally {
    submitting.value = false;
  }
}

function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  selectedFiles.value = Array.from(input.files);
  input.value = '';
}

function triggerFileInput() {
  showPickerMenu.value = false;
  fileInput.value?.click();
}

function triggerFolderInput() {
  showPickerMenu.value = false;
  folderInput.value?.click();
}

function removeSelectedFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
</script>
