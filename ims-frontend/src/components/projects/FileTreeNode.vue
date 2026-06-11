<template>
  <div>
    <!-- Folder -->
    <div v-if="node.type === 'folder'"
      class="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <button
        @click="expanded = !expanded"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        :style="{ paddingLeft: (depth * 16 + 12) + 'px' }"
      >
        <span class="text-xs transition-transform" :class="expanded ? 'rotate-90' : ''">▶</span>
        <span>📁</span>
        <span class="font-medium">{{ node.name }}</span>
        <span class="text-xs text-gray-400 ml-auto">{{ node.children?.length }} items</span>
      </button>
      <div v-if="expanded">
        <FileTreeNode
          v-for="child in node.children"
          :key="child.name + (child.id || '')"
          :node="child"
          :depth="depth + 1"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>

    <!-- File -->
    <div v-else
      class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
      :style="{ paddingLeft: (depth * 16 + 12) + 'px' }"
    >
      <span>{{ fileIcon(node.mimeType) }}</span>
      <span class="flex-1 truncate">{{ node.name }}</span>
      <span class="text-xs text-gray-400">{{ formatSize(node.size) }}</span>
      <button
        @click.stop="$emit('delete', node.id)"
        class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity"
        title="Delete"
      >🗑️</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ node: any; depth: number }>();
defineEmits(['delete']);

const expanded = ref(true);

function fileIcon(mimeType: string | null) {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📙';
  return '📄';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}
</script>
