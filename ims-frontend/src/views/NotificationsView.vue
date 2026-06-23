<template>
  <div class="h-full flex flex-col max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ unreadCount > 0 ? `${unreadCount} unread` : 'All caught up' }}
        </p>
      </div>
      <button v-if="unreadCount > 0" @click="markAllRead" :disabled="acting"
        class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">
        Mark all as read
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-4 flex-shrink-0">
      <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
        :class="['px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
          activeTab === tab.value
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600']">
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <p class="text-5xl mb-3">🔔</p>
      <p class="text-sm">{{ activeTab === 'unread' ? 'No unread notifications.' : 'No notifications yet.' }}</p>
    </div>

    <!-- List -->
    <div v-else class="flex-1 overflow-y-auto space-y-2">
      <div v-for="n in paginatedNotifs" :key="n.id"
        :class="['bg-white dark:bg-gray-800 rounded-xl border px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750',
          n.isRead
            ? 'border-gray-200 dark:border-gray-700'
            : 'border-indigo-200 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-900/10']"
        @click="markRead(n)">
        <!-- Icon -->
        <div :class="['w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0',
          n.isRead ? 'bg-gray-100 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900/40']">
          {{ notifIcon(n.type) }}
        </div>
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p :class="['text-sm', n.isRead ? 'text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-gray-100']">
            {{ n.title }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ n.body }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ timeAgo(n.createdAt) }}</p>
        </div>
        <!-- Unread dot -->
        <div v-if="!n.isRead" class="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5"></div>
      </div>
      <!-- Load more button -->
      <div v-if="filtered.length > visibleCount" class="text-center py-3">
        <button @click="visibleCount += 20"
          class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          Load more ({{ filtered.length - visibleCount }} remaining)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';

const notifications = ref<any[]>([]);
const loading = ref(true);
const acting = ref(false);
const activeTab = ref<'all' | 'unread'>('all');
const visibleCount = ref(20);

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);
const filtered = computed(() =>
  activeTab.value === 'unread' ? notifications.value.filter(n => !n.isRead) : notifications.value
);
const paginatedNotifs = computed(() => filtered.value.slice(0, visibleCount.value));

const ICONS: Record<string, string> = {
  TASK_ASSIGNED: '✅', TASK_DEADLINE: '⏰', TASK_MENTION: '💬', TASK_STATUS: '🔄',
  APPROVAL_REQUIRED: '⏳', APPROVAL_RESULT: '✓', REPORT_DUE: '📊',
  REPORT_SUBMITTED: '📝', WORKFLOW_ALERT: '⚡', SYSTEM: '🔔',
};
function notifIcon(type: string) { return ICONS[type] ?? '🔔'; }

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function markRead(n: any) {
  if (n.isRead) return;
  try {
    await api.patch(`/notifications/${n.id}/read`);
    n.isRead = true;
  } catch (err) { console.error(err); }
}

async function markAllRead() {
  acting.value = true;
  try {
    await api.patch('/notifications/read-all');
    notifications.value.forEach(n => (n.isRead = true));
  } catch (err) { console.error(err); }
  finally { acting.value = false; }
}

async function fetchNotifications() {
  loading.value = true;
  try {
    const { data } = await api.get('/notifications');
    notifications.value = data;
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
}

onMounted(fetchNotifications);
</script>
