<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Coverage Requests</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Requests from the Evangelism team for media coverage
        </p>
      </div>
      <!-- Pending badge -->
      <div v-if="pendingCount > 0"
        class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium px-3 py-1.5 rounded-full">
        {{ pendingCount }} pending
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex items-center gap-3 mb-4 flex-shrink-0">
      <div class="flex gap-2">
        <button v-for="f in filters" :key="f.value"
          @click="activeFilter = f.value"
          :class="[
            'px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
            activeFilter === f.value
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]">
          {{ f.label }}
        </button>
      </div>
      <DateFilter v-model:month="filterMonth" v-model:year="filterYear" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="paginatedItems.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <p class="text-4xl mb-3">📬</p>
      <p class="text-sm">No {{ activeFilter === '' ? '' : activeFilter.toLowerCase() + ' ' }}requests.</p>
    </div>

    <!-- List -->
    <div v-else class="flex-1 overflow-y-auto space-y-3">
      <div v-for="req in paginatedItems" :key="req.id"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- Event info -->
            <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">
              📖 {{ req.event?.title ?? 'Unknown Sermon' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              📅 {{ formatDate(req.event?.date) }}
              &nbsp;·&nbsp;
              📍 {{ req.event?.location ?? '—' }}
            </p>
            <!-- Request details -->
            <div class="mt-2 flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span>🎬 <strong>Type:</strong> {{ req.recordingType }}</span>
              <span>📆 <strong>Needed by:</strong> {{ formatDate(req.requestedDate) }}</span>
              <span>👤 <strong>From:</strong> {{ req.requestedBy?.name }}
                <span class="text-xs text-gray-400 dark:text-gray-500">({{ req.requestedBy?.department }})</span>
              </span>
            </div>
            <p v-if="req.declineReason" class="mt-2 text-xs text-red-600 dark:text-red-400 italic">
              Decline reason: {{ req.declineReason }}
            </p>
          </div>

          <!-- Status badge -->
          <div class="flex-shrink-0">
            <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', statusClass(req.status)]">
              {{ req.status }}
            </span>
          </div>
        </div>

        <!-- Actions (only for pending, managers only) -->
        <div v-if="req.status === 'PENDING' && auth.isManager" class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div v-if="respondingId === req.id" class="space-y-3">

            <!-- Assign team member -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign to team member <span class="text-gray-400">(required to accept)</span>
              </label>
              <select v-model="assignedToId"
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">— Select team member —</option>
                <option v-for="m in teamMembers" :key="m.id" :value="m.id">
                  {{ m.name }} ({{ m.role }})
                </option>
              </select>
            </div>

            <!-- Decline reason -->
            <textarea v-model="declineReason" rows="2" placeholder="Reason for declining (required if declining)..."
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>

            <div class="flex gap-2">
              <button @click="respond(req.id, 'ACCEPTED')"
                :disabled="acting || !assignedToId"
                :title="!assignedToId ? 'Select a team member first' : ''"
                class="flex-1 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium">
                ✅ Accept & Assign
              </button>
              <button @click="respond(req.id, 'DECLINED')" :disabled="acting || !declineReason"
                class="flex-1 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium">
                ❌ Decline
              </button>
              <button @click="respondingId = null; declineReason = ''; assignedToId = ''"
                class="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
            </div>
          </div>
          <button v-else @click="openRespond(req.id)"
            class="w-full py-2 text-sm border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium">
            Respond to Request
          </button>
        </div>

        <!-- Accepted: show who is assigned -->
        <div v-if="req.status === 'ACCEPTED' && req.assignedTo"
          class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>👤 Assigned to:</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ req.assignedTo.name }}</span>
        </div>
      </div>
      <Pagination :page="page" :page-size="10" :total="total" @change="setPage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';

const auth = useAuthStore();

const requests   = ref<any[]>([]);
const teamMembers = ref<any[]>([]);
const loading    = ref(true);
const activeFilter  = ref('');
const respondingId  = ref<string | null>(null);
const declineReason = ref('');
const assignedToId  = ref('');
const acting = ref(false);

const filters = [
  { value: '',         label: 'All' },
  { value: 'PENDING',  label: '⏳ Pending' },
  { value: 'ACCEPTED', label: '✅ Accepted' },
  { value: 'DECLINED', label: '❌ Declined' },
];

const filtered = computed(() =>
  activeFilter.value ? requests.value.filter(r => r.status === activeFilter.value) : requests.value
);
const pendingCount = computed(() => requests.value.filter(r => r.status === 'PENDING').length);

const { page, filterMonth, filterYear, total, paginatedItems, setPage } = usePagination(() => filtered.value, 10);

function statusClass(status: string) {
  if (status === 'ACCEPTED') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (status === 'DECLINED') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function openRespond(id: string) {
  respondingId.value = id;
  declineReason.value = '';
  assignedToId.value = '';
}

async function respond(id: string, status: 'ACCEPTED' | 'DECLINED') {
  acting.value = true;
  try {
    const payload: any = { status };
    if (status === 'DECLINED') payload.declineReason = declineReason.value;
    if (status === 'ACCEPTED') payload.assignedToId = assignedToId.value;

    const { data } = await api.patch(`/media/requests/${id}`, payload);

    const idx = requests.value.findIndex(r => r.id === id);
    if (idx !== -1) requests.value[idx] = { ...requests.value[idx], ...data };

    respondingId.value = null;
    declineReason.value = '';
    assignedToId.value = '';
  } catch (err) {
    console.error('Failed to respond:', err);
  } finally {
    acting.value = false;
  }
}

async function fetchRequests() {
  loading.value = true;
  try {
    const [reqRes, teamRes] = await Promise.all([
      api.get('/media/requests'),
      api.get('/media/assignable-users'),
    ]);
    requests.value = reqRes.data;
    teamMembers.value = teamRes.data;
  } catch (err) {
    console.error('Failed to load requests:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchRequests);
</script>
