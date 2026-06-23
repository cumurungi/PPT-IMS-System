<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div class="flex items-center gap-3 flex-wrap">
        <input v-model="search" type="text" placeholder="Search tickets..."
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none" />
        <select v-model="filterStatus"
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Status</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="filterPriority"
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Priority</option>
          <option v-for="p in priorities" :key="p" :value="p">{{ p }}</option>
        </select>
        <DateFilter v-model:month="filterMonth" v-model:year="filterYear" />
      </div>
      <button @click="showCreate = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
        <span>+</span> New Ticket
      </button>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <div v-else class="flex-1 overflow-auto">
      <div v-if="paginatedItems.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">🎫</p><p class="text-sm">No tickets found.</p>
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
            <th class="pb-2 pr-4 font-medium">Title</th>
            <th class="pb-2 pr-4 font-medium">From</th>
            <th class="pb-2 pr-4 font-medium">Category</th>
            <th class="pb-2 pr-4 font-medium">Priority</th>
            <th class="pb-2 pr-4 font-medium">Status</th>
            <th class="pb-2 pr-4 font-medium">Assigned To</th>
            <th v-if="isIT" class="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="t in paginatedItems" :key="t.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="py-3 pr-4">
              <p class="font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">{{ t.title }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ t.description?.slice(0, 50) }}</p>
            </td>
            <td class="py-3 pr-4 text-xs text-gray-600 dark:text-gray-400">
              <p>{{ t.createdBy?.name ?? '—' }}</p>
              <p class="text-gray-400 dark:text-gray-500">{{ t.createdBy?.department ?? '' }}</p>
            </td>
            <td class="py-3 pr-4 text-gray-600 dark:text-gray-400 text-xs">{{ t.category }}</td>
            <td class="py-3 pr-4">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', priorityClass(t.priority)]">{{ t.priority }}</span>
            </td>
            <td class="py-3 pr-4">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', statusClass(t.status)]">{{ t.status }}</span>
            </td>
            <td class="py-3 pr-4 text-xs text-gray-600 dark:text-gray-400">{{ t.assignee?.name || '—' }}</td>
            <td v-if="isIT" class="py-3">
              <div class="flex items-center gap-2">
                <select @change="assignTicket(t.id, ($event.target as HTMLSelectElement).value)" :value="t.assigneeId || ''"
                  class="text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none w-24">
                  <option value="">Assign</option>
                  <option v-for="m in itTeam" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
                <select @change="updateStatus(t.id, ($event.target as HTMLSelectElement).value)" :value="t.status"
                  class="text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none w-28">
                  <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination :page="page" :page-size="10" :total="total" @change="setPage" />
    </div>

    <!-- Create ticket modal -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showCreate = false">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">New Support Ticket</h2>
          <button @click="showCreate = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form @submit.prevent="createTicket" class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input v-model="form.title" type="text" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
            <textarea v-model="form.description" rows="3" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority *</label>
              <select v-model="form.priority" required
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option v-for="p in priorities" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
              <select v-model="form.category" required
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
          </div>
          <p v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showCreate = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" :disabled="submitting"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {{ submitting ? 'Submitting...' : 'Submit Ticket' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';

const emit = defineEmits<{ (e: 'open-count', v: number): void }>();
const auth = useAuthStore();

const tickets = ref<any[]>([]);
const itTeam = ref<any[]>([]);
const loading = ref(true);
const search = ref('');
const filterStatus = ref('');
const filterPriority = ref('');
const showCreate = ref(false);
const submitting = ref(false);
const formError = ref('');

const isIT = computed(() => auth.user?.department === 'IT' || auth.user?.role === 'ADMIN');

const statuses   = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const categories = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'OTHER'];

const form = ref({ title: '', description: '', priority: 'MEDIUM', category: 'SOFTWARE' });

const filtered = computed(() => {
  let r = tickets.value;
  if (search.value) { const q = search.value.toLowerCase(); r = r.filter(t => t.title.toLowerCase().includes(q)); }
  if (filterStatus.value)   r = r.filter(t => t.status === filterStatus.value);
  if (filterPriority.value) r = r.filter(t => t.priority === filterPriority.value);
  return r;
});

const { page, filterMonth, filterYear, total, paginatedItems, setPage } = usePagination(() => filtered.value, 10);

watch(tickets, (v) => emit('open-count', v.filter(t => t.status === 'OPEN').length), { immediate: true });

const PRIORITY_COLORS: Record<string, string> = { LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
const STATUS_COLORS: Record<string, string> = { OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', WAITING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', CLOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
function priorityClass(p: string) { return PRIORITY_COLORS[p] ?? ''; }
function statusClass(s: string) { return STATUS_COLORS[s] ?? ''; }

async function updateStatus(id: string, status: string) { try { await api.patch(`/it/tickets/${id}`, { status }); await fetchTickets(); } catch (err) { console.error(err); } }
async function assignTicket(id: string, assigneeId: string) { try { await api.patch(`/it/tickets/${id}`, { assigneeId: assigneeId || null }); await fetchTickets(); } catch (err) { console.error(err); } }

async function createTicket() {
  formError.value = ''; submitting.value = true;
  try { await api.post('/it/tickets', form.value); showCreate.value = false; form.value = { title: '', description: '', priority: 'MEDIUM', category: 'SOFTWARE' }; await fetchTickets(); }
  catch (e: any) { formError.value = e.response?.data?.message || 'Failed to create ticket'; }
  finally { submitting.value = false; }
}

async function fetchTickets() {
  loading.value = true;
  try { const { data } = await api.get('/it/tickets'); tickets.value = data; if (isIT.value) { try { const t = await api.get('/it/team'); itTeam.value = t.data; } catch {} } }
  catch (err) { console.error(err); }
  finally { loading.value = false; }
}

onMounted(fetchTickets);
</script>
