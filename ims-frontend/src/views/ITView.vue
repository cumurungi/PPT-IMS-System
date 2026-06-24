<template>
  <div class="h-full flex flex-col">
    <div class="mb-6 flex-shrink-0">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">IT Support</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
        {{ isIT ? 'Manage support tickets, publishing queue, and platforms' : 'Submit and track your support tickets' }}
      </p>
    </div>

    <!-- Tabs (IT dept sees all tabs) -->
    <div v-if="isIT" class="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2',
          activeTab === tab.id
            ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300']">
        {{ tab.label }}
        <span v-if="tab.id === 'tickets' && openTickets > 0"
          class="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {{ openTickets }}
        </span>
      </button>
    </div>

    <div class="flex-1 overflow-hidden">
      <!-- Non-IT users: only see the submit form -->
      <div v-if="!isIT" class="h-full flex flex-col">
        <div class="max-w-lg mx-auto w-full">
          <!-- Success message -->
          <div v-if="ticketSent" class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
            <p class="text-4xl mb-3">✅</p>
            <p class="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Ticket Submitted</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your support request has been sent to the IT team. They will get back to you.
            </p>
            <button @click="ticketSent = false; fetchMyTickets()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Submit Another Ticket
            </button>
          </div>

          <!-- Submit form -->
          <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Submit Support Ticket</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Describe your issue and the IT team will be notified immediately.
            </p>
            <form @submit.prevent="submitTicket" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input v-model="form.title" type="text" required placeholder="Brief summary of the issue"
                  class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea v-model="form.description" rows="4" required placeholder="Describe the problem in detail..."
                  class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority *</label>
                  <select v-model="form.priority" required
                    class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select v-model="form.category" required
                    class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="HARDWARE">Hardware</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="NETWORK">Network</option>
                    <option value="ACCESS">Access / Permissions</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <p v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
              <button type="submit" :disabled="submitting"
                class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">
                {{ submitting ? 'Submitting...' : '🎫 Submit Ticket' }}
              </button>
            </form>
          </div>

          <!-- My Tickets History -->
          <div v-if="myTickets.length > 0" class="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">My Tickets</h3>
            <div class="space-y-2">
              <div v-for="t in myTickets" :key="t.id"
                class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-gray-900 dark:text-gray-100 truncate">{{ t.title }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ t.category }} · {{ timeAgo(t.createdAt) }}</p>
                </div>
                <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', ticketStatusClass(t.status)]">
                  {{ t.status.replace('_', ' ') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- IT users: full tabbed view -->
      <template v-else>
        <TicketsTab v-if="!isIT || activeTab === 'tickets'" @open-count="openTickets = $event" />
        <QueueTab v-else-if="activeTab === 'queue'" />
        <PlatformsTab v-else-if="activeTab === 'platforms'" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/axios';

const auth = useAuthStore();
const TicketsTab   = defineAsyncComponent(() => import('@/components/it/TicketsTab.vue'));
const QueueTab     = defineAsyncComponent(() => import('@/components/it/QueueTab.vue'));
const PlatformsTab = defineAsyncComponent(() => import('@/components/it/PlatformsTab.vue'));

const isIT = computed(() => auth.user?.department === 'IT' || auth.user?.role === 'ADMIN');
const isITManager = computed(() =>
  auth.user?.role === 'ADMIN' || (auth.user?.department === 'IT' && auth.user?.role === 'MANAGER')
);

type TabId = 'tickets' | 'queue' | 'platforms';
const activeTab  = ref<TabId>('tickets');
const openTickets = ref(0);

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'tickets',   label: '🎫 Support Tickets' },
  { id: 'queue',     label: '📡 Publishing Queue' },
  { id: 'platforms', label: '🌐 Platforms' },
];

// Non-IT ticket submission
const form = ref({ title: '', description: '', priority: 'MEDIUM', category: 'SOFTWARE' });
const formError = ref('');
const submitting = ref(false);
const ticketSent = ref(false);
const myTickets = ref<any[]>([]);

async function submitTicket() {
  formError.value = '';
  submitting.value = true;
  try {
    await api.post('/it/tickets', form.value);
    form.value = { title: '', description: '', priority: 'MEDIUM', category: 'SOFTWARE' };
    ticketSent.value = true;
    await fetchMyTickets();
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Failed to submit ticket';
  } finally {
    submitting.value = false;
  }
}

async function fetchMyTickets() {
  try {
    const { data } = await api.get('/it/tickets/mine');
    myTickets.value = data;
  } catch {}
}

function ticketStatusClass(status: string) {
  const map: Record<string, string> = {
    OPEN: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    WAITING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    CLOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Load my tickets on mount for non-IT users
import { onMounted } from 'vue';
onMounted(() => { if (!isIT.value) fetchMyTickets(); });
</script>
