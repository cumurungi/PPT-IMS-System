<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Recordings</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Captured sermons waiting to start editing</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <span>+</span> New Recording
      </button>
    </div>

    <!-- Workflow stats -->
    <div class="grid grid-cols-6 gap-2 mb-4 flex-shrink-0">
      <MiniStat label="Total" :value="stats.total" />
      <MiniStat label="Captured" :value="stats.captured" color="gray" />
      <MiniStat label="Editing" :value="stats.inEditing" color="blue" />
      <MiniStat label="Edited" :value="stats.edited" color="yellow" />
      <MiniStat label="Approved" :value="stats.approved" color="green" />
      <MiniStat label="Published" :value="stats.published" color="green" />
    </div>

    <!-- Filter -->
    <div class="flex items-center gap-3 mb-4 flex-shrink-0 flex-wrap">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search recordings..."
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <select
        v-model="filterStatus"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        <option value="">All Status</option>
        <option value="CAPTURED">Captured</option>
      </select>
      <!-- Managers can toggle between all recordings and their own -->
      <button v-if="auth.isManager" @click="showMineOnly = !showMineOnly; refresh()"
        :class="['px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
          showMineOnly
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600']">
        {{ showMineOnly ? '👤 My recordings' : '👥 All recordings' }}
      </button>
      <DateFilter v-model:month="filterMonth" v-model:year="filterYear" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Recordings grid -->
    <div v-else class="flex-1 overflow-y-auto">
      <div v-if="paginatedItems.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">🎬</p>
        <p class="text-sm">No recordings found. Create one to start the workflow.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="rec in paginatedItems"
          :key="rec.id"
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow cursor-pointer"
          @click="openRecording(rec)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{{ rec.title }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ rec.event?.title || 'No event' }} · {{ formatDuration(rec.durationSeconds) }}
              </p>
            </div>
            <RecordingStatusBadge :status="rec.status" />
          </div>

          <!-- Editing progress bar (only when in editing) -->
          <div v-if="rec.status === 'IN_EDITING'" class="mb-3">
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Editing progress</span>
              <span class="font-medium">{{ rec.editingProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-blue-500 h-2 rounded-full transition-all" :style="{ width: rec.editingProgress + '%' }"></div>
            </div>
          </div>

          <!-- Workflow steps indicator -->
          <div class="flex items-center gap-1 mb-3">
            <div v-for="step in workflowSteps" :key="step"
              :class="['flex-1 h-1.5 rounded-full', stepReached(rec.status, step) ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700']">
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{{ rec.format }}</span>
            <span>{{ formatDate(rec.recordingDate) }}</span>
          </div>
          <!-- People assigned -->
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-if="rec.recordingAssignee"
              class="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
              🎙️ {{ rec.recordingAssignee.name }}
            </span>
            <span v-if="rec.editor"
              class="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">
              ✏️ {{ rec.editor.name }}
            </span>
            <span v-if="!rec.recordingAssignee && !rec.editor"
              class="text-xs text-gray-300 dark:text-gray-600 italic">Not assigned</span>
          </div>
        </div>
      </div>
    </div>
    <Pagination :page="page" :page-size="12" :total="total" @change="setPage" />

    <!-- Recording Detail Drawer -->
    <RecordingDrawer
      v-if="selectedRecording"
      :recording-id="selectedRecording.id"
      @close="selectedRecording = null"
      @updated="refresh"
    />

    <!-- Create Modal -->
    <CreateRecordingModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import MiniStat from '@/components/tasks/MiniStat.vue';
import RecordingStatusBadge from '@/components/media/RecordingStatusBadge.vue';
import RecordingDrawer from '@/components/media/RecordingDrawer.vue';
import CreateRecordingModal from '@/components/media/CreateRecordingModal.vue';
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';

const auth = useAuthStore();

const recordings = ref<any[]>([]);
const stats = ref({ total: 0, captured: 0, inEditing: 0, edited: 0, approved: 0, published: 0 });
const loading = ref(true);
const searchQuery = ref('');
const filterStatus = ref('');
const selectedRecording = ref<any>(null);
const showCreateModal = ref(false);
const showMineOnly = ref(false);

const workflowSteps = ['CAPTURED', 'IN_EDITING', 'EDITED', 'APPROVED', 'PUBLISHED'];

const filteredRecordings = computed(() => {
  let result = recordings.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(r => r.title.toLowerCase().includes(q));
  }
  if (filterStatus.value) {
    result = result.filter(r => r.status === filterStatus.value);
  }
  return result;
});

const { page, filterMonth, filterYear, total, paginatedItems, setPage } = usePagination(() => filteredRecordings.value, 12);

function stepReached(currentStatus: string, step: string) {
  return workflowSteps.indexOf(currentStatus) >= workflowSteps.indexOf(step);
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function openRecording(rec: any) {
  selectedRecording.value = rec;
}

async function fetchData() {
  try {
    const params: any = { stage: 'capture' };
    if (showMineOnly.value) params.mine = 'true';
    const [recRes, statsRes] = await Promise.all([
      api.get('/media/recordings', { params }),
      api.get('/media/recordings/stats'),
    ]);
    recordings.value = recRes.data;
    stats.value = statsRes.data;
  } catch (err) {
    console.error('Failed to load recordings:', err);
  } finally {
    loading.value = false;
  }
}

async function refresh() {
  showCreateModal.value = false;
  selectedRecording.value = null;
  loading.value = true;
  await fetchData();
}

onMounted(fetchData);
</script>
