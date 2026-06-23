<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Sermon Schedule</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Schedule sermons for studio recording — Media team is notified automatically
        </p>
      </div>
      <button @click="showCreate = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
        <span>+</span> Schedule Sermon
      </button>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4 flex-shrink-0">
      <div v-for="s in statCards" :key="s.label"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold" :class="s.color">{{ stats[s.key] ?? '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ s.label }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4 flex-shrink-0 flex-wrap">
      <input v-model="search" type="text" placeholder="Search sermons..."
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-52 focus:ring-2 focus:ring-indigo-500 outline-none" />
      <select v-model="filterStatus"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All Statuses</option>
        <option value="PLANNED">Scheduled</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="IN_PROGRESS">Recording</option>
        <option value="COMPLETED">Recorded</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <select v-model="filterSeries"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All Series</option>
        <option v-for="s in allSeries" :key="s" :value="s">{{ s }}</option>
      </select>
      <DateFilter v-model:month="filterMonth" v-model:year="filterYear" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Table -->
    <div v-else class="flex-1 overflow-auto">
      <div v-if="paginatedItems.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">📖</p>
        <p class="text-sm">No sermons scheduled yet. Click "Schedule Sermon" to get started.</p>
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
            <th class="pb-2 pr-4 font-medium">Sermon Title</th>
            <th class="pb-2 pr-4 font-medium">Date &amp; Time</th>
            <th class="pb-2 pr-4 font-medium">Type</th>
            <th class="pb-2 pr-4 font-medium">Preacher(s)</th>
            <th class="pb-2 pr-4 font-medium">Status</th>
            <th class="pb-2 pr-4 font-medium">Media</th>
            <th class="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="sermon in paginatedItems" :key="sermon.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
            @click="openDetail(sermon)">
            <td class="py-3 pr-4">
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ sermon.title }}</p>
            </td>
            <td class="py-3 pr-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {{ formatDateTime(sermon.scheduledDate || sermon.date) }}
            </td>
            <td class="py-3 pr-4">
              <span class="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                {{ sermon.series || sermon.eventType }}
              </span>
            </td>
            <td class="py-3 pr-4 text-gray-600 dark:text-gray-400 text-xs">
              <span v-if="sermon.preachers?.length">
                {{ sermon.preachers.map((p: any) => p.preacher?.name).filter(Boolean).join(', ') }}
              </span>
              <span v-else class="text-gray-300 dark:text-gray-600 italic">Not assigned</span>
            </td>
            <td class="py-3 pr-4">
              <EventStatusBadge :status="sermon.status" />
            </td>
            <td class="py-3 pr-4">
              <!-- Media request indicator -->
              <span v-if="sermon.mediaRequests?.length"
                :class="['text-xs px-2 py-0.5 rounded-full', mediaReqClass(sermon.mediaRequests)]">
                {{ mediaReqLabel(sermon.mediaRequests) }}
              </span>
              <span v-else class="text-xs text-gray-400 dark:text-gray-500">—</span>
            </td>
            <td class="py-3" @click.stop>
              <button @click="openDetail(sermon)"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Details</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Pagination :page="page" :page-size="15" :total="total" @change="setPage" />

    <!-- Create Modal -->
    <CreateEventModal v-if="showCreate" :preachers="preachers"
      @close="showCreate = false" @created="onCreated" />

    <!-- Drawer -->
    <EventDrawer v-if="selectedSermon" :event="selectedSermon" :preachers="preachers"
      @close="selectedSermon = null" @updated="onUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import EventStatusBadge from '@/components/evangelism/EventStatusBadge.vue';
import CreateEventModal from '@/components/evangelism/CreateEventModal.vue';
import EventDrawer from '@/components/evangelism/EventDrawer.vue';
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';

const auth = useAuthStore();

const sermons = ref<any[]>([]);
const preachers = ref<any[]>([]);
const stats = ref<any>({});
const loading = ref(true);
const search = ref('');
const filterStatus = ref('');
const filterSeries = ref('');
const showCreate = ref(false);
const selectedSermon = ref<any>(null);

const statCards = [
  { key: 'total',      label: 'Total',      color: 'text-gray-900 dark:text-gray-100' },
  { key: 'scheduled',  label: 'Scheduled',  color: 'text-blue-600 dark:text-blue-400' },
  { key: 'confirmed',  label: 'Confirmed',  color: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'recording',  label: 'Recording',  color: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'recorded',   label: 'Recorded',   color: 'text-green-600 dark:text-green-400' },
  { key: 'cancelled',  label: 'Cancelled',  color: 'text-red-600 dark:text-red-400' },
];

const allSeries = computed(() => {
  const s = new Set(sermons.value.map((e: any) => e.series || e.eventType).filter(Boolean));
  return Array.from(s).sort();
});

const filtered = computed(() => {
  let result = sermons.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.scriptureReference || '').toLowerCase().includes(q)
    );
  }
  if (filterStatus.value) result = result.filter(e => e.status === filterStatus.value);
  if (filterSeries.value) result = result.filter(e => (e.series || e.eventType) === filterSeries.value);
  return result;
});

const { page, filterMonth, filterYear, total, paginatedItems, setPage } = usePagination(() => filtered.value, 15);

function formatDateTime(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function mediaReqClass(reqs: any[]) {
  if (reqs.some(r => r.status === 'ACCEPTED'))
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (reqs.some(r => r.status === 'PENDING'))
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
}

function mediaReqLabel(reqs: any[]) {
  if (reqs.some(r => r.status === 'ACCEPTED')) return '✓ Confirmed';
  if (reqs.some(r => r.status === 'PENDING')) return '⏳ Pending';
  return '✕ Declined';
}

function openDetail(sermon: any) { selectedSermon.value = sermon; }

function onCreated() { showCreate.value = false; fetchAll(); }
function onUpdated() { selectedSermon.value = null; fetchAll(); }

async function fetchAll() {
  loading.value = true;
  try {
    const [sermonsRes, preachersRes, statsRes] = await Promise.all([
      api.get('/evangelism/sermons'),
      api.get('/evangelism/preachers'),
      api.get('/evangelism/sermons/stats'),
    ]);
    sermons.value = sermonsRes.data;
    preachers.value = preachersRes.data;
    stats.value = statsRes.data;
  } catch (err) {
    console.error('Failed to load sermon schedule:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAll);
</script>
