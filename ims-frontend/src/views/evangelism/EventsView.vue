<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Sermon Workflow</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Create, track, and update sermon work from one place without switching to a separate task flow.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button @click="viewMode = 'list'"
            :class="[viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : '', 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-all']">
            ☰ List
          </button>
          <button @click="viewMode = 'board'"
            :class="[viewMode === 'board' ? 'bg-white dark:bg-gray-700 shadow-sm' : '', 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-all']">
            ▦ Board
          </button>
        </div>
        <button @click="showCreate = true"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <span>+</span> New Sermon
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-4 flex-shrink-0">
      <div v-for="s in statCards" :key="s.label"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold" :class="s.color">{{ stats[s.key] ?? '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ s.label }}</p>
      </div>
    </div>

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

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <div v-else-if="viewMode === 'list'" class="flex-1 overflow-auto">
      <div v-if="paginatedItems.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">📖</p>
        <p class="text-sm">No sermons yet. Create the first sermon work item to get started.</p>
      </div>
      <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <div class="col-span-3">Sermon</div>
          <div class="col-span-2">Date</div>
          <div class="col-span-2">Type</div>
          <div class="col-span-2">Preacher(s)</div>
          <div class="col-span-1">Status</div>
          <div class="col-span-2">Actions</div>
        </div>
        <div v-for="sermon in paginatedItems" :key="sermon.id"
          class="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer transition-colors items-center"
          @click="openDetail(sermon)">
          <div class="col-span-3">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ sermon.title }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ sermon.description || 'No outline added yet' }}</p>
            <div class="mt-1 flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">Due: {{ formatDateTime(sermon.scheduledDate || sermon.date) }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full" :class="priorityClass(sermon)">{{ priorityLabel(sermon) }}</span>
              <span v-if="sermon.recordings && sermon.recordings.length > 0" class="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">Progress: {{ sermon.recordings[0].editingProgress ?? 0 }}%</span>
            </div>
          </div>
          <div class="col-span-2 text-sm text-gray-600 dark:text-gray-400">
            {{ formatDateTime(sermon.scheduledDate || sermon.date) }}
          </div>
          <div class="col-span-2">
            <span class="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
              {{ sermon.series || sermon.eventType }}
            </span>
          </div>
          <div class="col-span-2 text-xs text-gray-600 dark:text-gray-400">
            <span v-if="sermon.preachers?.length">{{ sermon.preachers.map((p: any) => p.preacher?.name).filter(Boolean).join(', ') }}</span>
            <span v-else class="text-gray-300 dark:text-gray-600 italic">Not assigned</span>
          </div>
          <div class="col-span-1">
            <EventStatusBadge :status="sermon.status" />
          </div>
          <div class="col-span-2 flex items-center gap-2" @click.stop>
            <button v-if="sermon.status !== 'IN_PROGRESS'" @click="quickUpdate(sermon, 'IN_PROGRESS')" class="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300">Start</button>
            <button v-if="sermon.status !== 'COMPLETED'" @click="quickUpdate(sermon, 'COMPLETED')" class="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300">Done</button>
            <button @click="openDetail(sermon)" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Details</button>
          </div>
        </div>
      </div>
      <Pagination :page="page" :page-size="15" :total="total" @change="setPage" />
    </div>

    <div v-else class="flex-1 overflow-x-auto">
      <div class="flex gap-4 h-full min-w-max pb-4">
        <div v-for="col in boardColumns" :key="col.status" class="w-72 flex-shrink-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/60 p-3">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ col.title }}</h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ getItemsByStatus(col.status).length }}</span>
          </div>
          <div v-if="getItemsByStatus(col.status).length === 0" class="text-center py-8 text-xs text-gray-400 dark:text-gray-500">
            No sermons here yet.
          </div>
          <div v-else class="space-y-2">
            <button v-for="sermon in getItemsByStatus(col.status)" :key="sermon.id"
              @click="openDetail(sermon)"
              class="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm hover:shadow-md transition-all">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ sermon.title }}</p>
                <EventStatusBadge :status="sermon.status" />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ formatDateTime(sermon.scheduledDate || sermon.date) }}</p>
              <p v-if="sermon.preachers?.length" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ sermon.preachers.map((p: any) => p.preacher?.name).filter(Boolean).join(', ') }}
              </p>
              <div class="mt-2 flex items-center gap-2" @click.stop>
                <button v-if="sermon.status !== 'IN_PROGRESS'" @click="quickUpdate(sermon, 'IN_PROGRESS')" class="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300">Start</button>
                <button v-if="sermon.status !== 'COMPLETED'" @click="quickUpdate(sermon, 'COMPLETED')" class="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300">Done</button>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <CreateEventModal v-if="showCreate" :preachers="preachers"
      @close="showCreate = false" @created="onCreated" />

    <EventDrawer v-if="selectedSermon" :event="selectedSermon" :preachers="preachers"
      @close="selectedSermon = null" @updated="onUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api/axios';
import EventStatusBadge from '@/components/evangelism/EventStatusBadge.vue';
import CreateEventModal from '@/components/evangelism/CreateEventModal.vue';
import EventDrawer from '@/components/evangelism/EventDrawer.vue';
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';

const sermons = ref<any[]>([]);
const preachers = ref<any[]>([]);
const stats = ref<any>({});
const loading = ref(true);
const search = ref('');
const filterStatus = ref('');
const filterSeries = ref('');
const showCreate = ref(false);
const selectedSermon = ref<any>(null);
const viewMode = ref<'list' | 'board'>('list');
const route = useRoute();

onMounted(() => {
  if (route.query.search) {
    search.value = String(route.query.search);
  }
});

watch(() => route.query.search, (newSearch) => {
  if (newSearch) {
    search.value = String(newSearch);
  }
});

const statCards = [
  { key: 'total', label: 'Total', color: 'text-gray-900 dark:text-gray-100' },
  { key: 'scheduled', label: 'Scheduled', color: 'text-blue-600 dark:text-blue-400' },
  { key: 'confirmed', label: 'Confirmed', color: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'recording', label: 'Recording', color: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'recorded', label: 'Recorded', color: 'text-green-600 dark:text-green-400' },
  { key: 'cancelled', label: 'Cancelled', color: 'text-red-600 dark:text-red-400' },
];

const boardColumns = [
  { status: 'PLANNED', title: 'Planned' },
  { status: 'CONFIRMED', title: 'Confirmed' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'COMPLETED', title: 'Completed' },
  { status: 'CANCELLED', title: 'Cancelled' },
];

const allSeries = computed(() => {
  const s = new Set(sermons.value.map((e: any) => e.series || e.eventType).filter(Boolean));
  return Array.from(s).sort();
});

const filtered = computed(() => {
  let result = sermons.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter((e: any) =>
      e.title.toLowerCase().includes(q) ||
      (e.scriptureReference || '').toLowerCase().includes(q)
    );
  }
  if (filterStatus.value) result = result.filter((e: any) => e.status === filterStatus.value);
  if (filterSeries.value) result = result.filter((e: any) => (e.series || e.eventType) === filterSeries.value);
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

function priorityLabel(sermon: any) {
  const d = sermon.scheduledDate || sermon.date;
  if (!d) return 'Normal';
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days <= 2) return 'High';
  if (days <= 7) return 'Medium';
  return 'Low';
}

function priorityClass(sermon: any) {
  const p = priorityLabel(sermon);
  if (p === 'High') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  if (p === 'Medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
}

function getItemsByStatus(status: string) {
  return filtered.value.filter((item: any) => item.status === status);
}

function openDetail(sermon: any) { selectedSermon.value = sermon; }

async function quickUpdate(sermon: any, status: string) {
  if (sermon.status === status) return;
  try {
    const { data } = await api.patch(`/evangelism/sermons/${sermon.id}`, { status });
    const index = sermons.value.findIndex((item: any) => item.id === sermon.id);
    if (index >= 0) sermons.value[index] = data;
    if (selectedSermon.value?.id === sermon.id) selectedSermon.value = data;
  } catch (err) {
    console.error('Failed to update sermon status:', err);
  }
}

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
    console.error('Failed to load sermon workflow:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAll);
</script>
