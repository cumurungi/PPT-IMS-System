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
    <div v-if="uploading" class="mb-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
          Uploading {{ uploadingCount }} file(s)...
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Overall: {{ uploadProgress }}%</div>
      </div>

      <div class="space-y-2">
        <div v-for="item in uploadItems" :key="item.id" class="flex items-center gap-3">
          <div class="flex-1">
            <div class="text-sm text-gray-800 dark:text-gray-100">{{ item.name }}</div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
              <div class="bg-indigo-600 h-1 rounded-full transition-all" :style="{ width: item.progress + '%' }"></div>
            </div>
          </div>
          <div class="w-12 text-right text-xs">
            <span v-if="item.status === 'uploading'" class="text-indigo-600">{{ item.progress }}%</span>
            <span v-else-if="item.status === 'done'" class="text-green-600">Done</span>
            <span v-else-if="item.status === 'error'" class="text-red-600">Error</span>
          </div>
        </div>
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
const uploadItems = ref<Array<{ id: string; name: string; progress: number; status: 'pending' | 'uploading' | 'done' | 'error' }>>([]);

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
  if (!files.length) return;
  uploading.value = true;
  uploadingCount.value = files.length;
  uploadProgress.value = 0;

  // Prepare upload items for UI feedback
  uploadItems.value = files.map((f, i) => ({ id: `tmp-${Date.now()}-${i}`, name: f.name, progress: 0, status: 'pending' }));

  // Upload files one by one so we can show per-file progress and not block the UI
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const item = uploadItems.value[i];
    item.status = 'uploading';

    const formData = new FormData();
    formData.append('files', file);
    formData.append('filePaths', (file as any).webkitRelativePath || file.name);

    try {
      await api.post(`/upload/project/${props.projectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e: any) => {
          if (e?.total) {
            const p = Math.round((e.loaded / e.total) * 100);
            item.progress = p;
            // update overall progress
            const totalProgress = Math.round(
              uploadItems.value.reduce((acc, it) => acc + it.progress, 0) / uploadItems.value.length
            );
            uploadProgress.value = totalProgress;
          }
        },
      });

      item.status = 'done';
    } catch (err) {
      console.error('Upload failed for', file.name, err);
      item.status = 'error';
    }
  }

  // Refresh files and reset upload UI
  await fetchFiles();
  uploading.value = false;
  uploadingCount.value = 0;
  uploadProgress.value = 0;
  uploadItems.value = [];
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
