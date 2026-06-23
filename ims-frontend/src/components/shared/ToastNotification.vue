<template>
  <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium min-w-[280px] max-w-sm',
          typeClasses[toast.type]
        ]"
      >
        <span class="text-base leading-none">{{ typeIcons[toast.type] }}</span>
        <span class="flex-1">{{ toast.message }}</span>
        <button
          @click="removeToast(toast.id)"
          class="ml-2 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
          aria-label="Close notification"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { toasts, removeToast } = useToast();

const typeClasses: Record<string, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-600 text-white',
};

const typeIcons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
