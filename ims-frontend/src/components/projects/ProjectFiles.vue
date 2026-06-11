<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
        Files ({{ fileCount }})
      </label>
      <div class="flex items-center gap-2">
        <!-- Upload files -->
        <label class="cursor-pointer text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
          📄 Upload Files
          <input type="file" multiple class="hidden" @change="handleFileUpload" />
        </label>
        <!-- Upload folder -->
        <label class="cursor-pointer text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
          📁 Upload Folder
          <input type="file" webkitdirectory class="hidden" @change="handleFolderUpload" />
        </label>
      </div>
    </div>

    <!-- Upload progress -->
    <div v-if="uploading" class="mb-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
      <div class="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 mb-1">
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
        Uploading {{ uploadingCount }} file(s)...
      </div>
      <div class="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-1.5">
        <div class="bg-indigo-600 h-1.5 rounded-full transition-all" :style="{ width: uploadProgress + '%' }"></div>
      </div>
    </div>

    <!-- File tree -->
    <div v-if="loading" class="text-center py-4 text-sm text-gray-400">Loading files...</div>
    <div v-else-if="tree && tree.children?.length" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <FileTreeNode v-for="node in tree.children" :key="node.name" :node="node" :depth="0" @delete="deleteFile" />
    </div>
    <div v-else class="text-center py-6 text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
      <p class="text-2xl mb-2">📂</p>
      <p>No files uploaded yet.</p>
      <p class="text-xs mt-1">Upload files or an entire folder to get started.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import FileTreeNode from './FileTreeNode.vue';

const props = defineProps<{ projectId: string }>();

const tree = ref<any>(null);
const fileCount = ref(0);
const loading = ref(true);
const uploading = ref(false);
const uploadingCount = ref(0);
const uploadProgress = ref(0);

onMounted(fetchFiles);

async function fetchFiles() {
  try {
    const { data } = await api.get(`/upload/project/${props.projectId}/files`);
    tree.value = data.tree;
    fileCount.value = data.files.length;
  } catch (err) {
    console.error('Failed to load files:', err);
  } finally {
    loading.value = false;
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  await uploadFiles(Array.from(input.files));
  input.value = '';
}

async function handleFolderUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  await uploadFiles(Array.from(input.files));
  input.value = '';
}

async function uploadFiles(files: File[]) {
  uploading.value = true;
  uploadingCount.value = files.length;
  uploadProgress.value = 0;

  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
    // webkitRelativePath gives us the folder path
    formData.append('filePaths', (file as any).webkitRelativePath || file.name);
  }

  try {
    await api.post(`/upload/project/${props.projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      },
    });
    await fetchFiles();
  } catch (err) {
    console.error('Upload failed:', err);
  } finally {
    uploading.value = false;
  }
}

async function deleteFile(fileId: string) {
  try {
    await api.delete(`/upload/project/${props.projectId}/files/${fileId}`);
    await fetchFiles();
  } catch (err) {
    console.error('Failed to delete file:', err);
  }
}
</script>
