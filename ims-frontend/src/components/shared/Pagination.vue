<template>
  <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
    <p class="text-xs text-gray-500 dark:text-gray-400">
      Showing {{ startItem }}–{{ endItem }} of {{ total }}
    </p>
    <div class="flex items-center gap-1">
      <button @click="$emit('change', page - 1)" :disabled="page <= 1"
        class="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
        ← Prev
      </button>
      <span class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
        {{ page }} / {{ totalPages }}
      </span>
      <button @click="$emit('change', page + 1)" :disabled="page >= totalPages"
        class="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
        Next →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ page: number; pageSize: number; total: number }>();
defineEmits<{ (e: 'change', page: number): void }>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
const startItem = computed(() => (props.page - 1) * props.pageSize + 1);
const endItem = computed(() => Math.min(props.page * props.pageSize, props.total));
</script>
