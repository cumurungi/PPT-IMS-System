import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
  function addToast(message: string, type: ToastType = 'info', duration = 4000) {
    const id = nextId++;
    toasts.value.push({ id, message, type });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  function success(message: string, duration?: number) {
    addToast(message, 'success', duration);
  }

  function error(message: string, duration?: number) {
    addToast(message, 'error', duration);
  }

  function warning(message: string, duration?: number) {
    addToast(message, 'warning', duration);
  }

  function info(message: string, duration?: number) {
    addToast(message, 'info', duration);
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
