<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="mb-6 flex-shrink-0">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Full record of all system actions</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-4 flex-shrink-0">
      <input v-model="search" type="text" placeholder="Search user or entity..."
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-52 focus:ring-2 focus:ring-indigo-500 outline-none" />
      <select v-model="filterAction"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All Actions</option>
        <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
      </select>
      <select v-model="filterEntity"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All Entities</option>
        <option v-for="e in entityTypes" :key="e" :value="e">{{ e }}</option>
      </select>
      <button @click="fetchLogs"
        class="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
        Refresh
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Table -->
    <div v-else class="flex-1 overflow-auto">
      <div v-if="filtered.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">📋</p>
        <p class="text-sm">No audit logs found.</p>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="sticky top-0 bg-white dark:bg-gray-900 z-10">
          <tr class="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
            <th class="pb-2 pr-4 font-medium">Time</th>
            <th class="pb-2 pr-4 font-medium">User</th>
            <th class="pb-2 pr-4 font-medium">Action</th>
            <th class="pb-2 pr-4 font-medium">Entity</th>
            <th class="pb-2 pr-4 font-medium">IP Address</th>
            <th class="pb-2 font-medium">Details</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="log in filtered" :key="log.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="py-2.5 pr-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
              {{ formatDate(log.createdAt) }}
            </td>
            <td class="py-2.5 pr-4">
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ log.user?.name ?? '—' }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500">{{ log.user?.email }}</p>
            </td>
            <td class="py-2.5 pr-4">
              <span :class="['inline-flex px-2 py-0.5 rounded-full text-xs font-medium', actionClass(log.action)]">
                {{ log.action }}
              </span>
            </td>
            <td class="py-2.5 pr-4 text-gray-600 dark:text-gray-400">
              <span class="font-medium">{{ log.entityType }}</span>
              <span v-if="log.entityId" class="text-xs text-gray-400 dark:text-gray-500 ml-1">
                #{{ log.entityId.slice(0, 8) }}
              </span>
            </td>
            <td class="py-2.5 pr-4 text-gray-500 dark:text-gray-400 text-xs font-mono">
              {{ log.ipAddress || '—' }}
            </td>
            <td class="py-2.5 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
              {{ log.details ? JSON.stringify(log.details) : '—' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
        <span>Page {{ page }}</span>
        <div class="flex gap-2">
          <button @click="prevPage" :disabled="page === 1"
            class="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
            ← Prev
          </button>
          <button @click="nextPage" :disabled="logs.length < pageSize"
            class="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
            Next →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';

const logs = ref<any[]>([]);
const loading = ref(true);
const page = ref(1);
const pageSize = 50;
const search = ref('');
const filterAction = ref('');
const filterEntity = ref('');

const actions = ['LOGIN_SUCCESS', 'LOGIN_FAIL', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'PERMISSION_CHANGE'];
const entityTypes = computed(() => {
  const s = new Set(logs.value.map(l => l.entityType).filter(Boolean));
  return Array.from(s).sort();
});

const filtered = computed(() => {
  let result = logs.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(l =>
      l.user?.name?.toLowerCase().includes(q) ||
      l.user?.email?.toLowerCase().includes(q) ||
      l.entityType?.toLowerCase().includes(q)
    );
  }
  if (filterAction.value) result = result.filter(l => l.action === filterAction.value);
  if (filterEntity.value) result = result.filter(l => l.entityType === filterEntity.value);
  return result;
});

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  LOGIN_FAIL:       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  LOGOUT:           'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  CREATE:           'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  UPDATE:           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  DELETE:           'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  APPROVE:          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  REJECT:           'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  PERMISSION_CHANGE:'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};
function actionClass(action: string) { return ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-600'; }

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

async function fetchLogs() {
  loading.value = true;
  try {
    const { data } = await api.get('/audit-logs', { params: { page: page.value, limit: pageSize } });
    logs.value = data;
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
}

function nextPage() { page.value++; fetchLogs(); }
function prevPage() { if (page.value > 1) { page.value--; fetchLogs(); } }

onMounted(fetchLogs);
</script>
