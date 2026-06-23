<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity Summary</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Tasks → Events flow · Week of {{ formatDate(weekStart) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="prevWeek" class="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">← Prev</button>
        <button @click="thisWeek" class="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">This Week</button>
        <button @click="nextWeek" class="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Next →</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-5 gap-3 mb-5 flex-shrink-0">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ data.stats?.tasksCompletedThisWeek ?? '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tasks Done</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ data.stats?.tasksInProgress ?? '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">In Progress</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ data.stats?.tasksUpcomingNextWeek ?? '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Next Week</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ data.stats?.eventsCreatedFromTasks ?? '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Events Created</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ data.stats?.upcomingEvents ?? '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upcoming Events</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <div v-else class="flex-1 overflow-auto space-y-6">
      <!-- Completed Tasks → Events (the main connection) -->
      <section v-if="data.completedTasks?.length > 0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          Completed Tasks → Events Created
        </h3>
        <div class="space-y-2">
          <div v-for="task in data.completedTasks" :key="task.id"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">✓ Completed</span>
                  <span class="text-xs text-gray-400">{{ formatDateTime(task.completedAt) }}</span>
                </div>
                <p class="font-medium text-gray-900 dark:text-gray-100 text-sm">{{ task.title }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ task.assignee?.name }} · {{ task.project?.name || 'No project' }}
                </p>
              </div>
              <!-- Arrow + Event (with edit button) -->
              <div v-if="task.linkedEvent" class="flex items-center gap-2 ml-4">
                <span class="text-gray-300 dark:text-gray-600">→</span>
                <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 min-w-[200px]">
                  <div class="flex items-center justify-between mb-1">
                    <p class="text-xs font-medium text-indigo-700 dark:text-indigo-300">📖 Event Created</p>
                    <button @click="openEditEvent(task.linkedEvent)"
                      class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">✏️ Edit</button>
                  </div>
                  <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">{{ task.linkedEvent.title }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span :class="['text-xs px-1.5 py-0.5 rounded-full', eventStatusClass(task.linkedEvent.status)]">
                      {{ task.linkedEvent.status }}
                    </span>
                    <span class="text-xs text-gray-400">{{ formatDate(task.linkedEvent.date) }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="flex items-center gap-2 ml-4">
                <span class="text-gray-300 dark:text-gray-600">→</span>
                <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 min-w-[200px]">
                  <p class="text-xs text-gray-400 italic">No event linked</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- In Progress Tasks -->
      <section v-if="data.inProgressTasks?.length > 0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          Currently In Progress
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div v-for="task in data.inProgressTasks" :key="task.id"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <p class="font-medium text-gray-900 dark:text-gray-100 text-sm">{{ task.title }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ task.assignee?.name }}</span>
              <span class="text-xs text-gray-300 dark:text-gray-600">·</span>
              <span :class="['text-xs', isOverdue(task.deadline) ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400']">
                Due {{ formatDate(task.deadline) }}
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-1 italic">Will create event when completed →</p>
          </div>
        </div>
      </section>

      <!-- Upcoming Tasks (Next Week) -->
      <section v-if="data.upcomingTasks?.length > 0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-orange-500"></span>
          Upcoming Next Week
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div v-for="task in data.upcomingTasks" :key="task.id"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <p class="font-medium text-gray-900 dark:text-gray-100 text-sm">{{ task.title }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ task.assignee?.name }}</span>
              <span class="text-xs text-gray-300 dark:text-gray-600">·</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">Due {{ formatDate(task.deadline) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Upcoming Events (sermons scheduled) -->
      <section v-if="data.upcomingEvents?.length > 0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-purple-500"></span>
          Upcoming Sermon Events
        </h3>
        <div class="space-y-2">
          <div v-for="event in data.upcomingEvents" :key="event.id"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100 text-sm">{{ event.title }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span :class="['text-xs px-1.5 py-0.5 rounded-full', eventStatusClass(event.status)]">
                  {{ event.status }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(event.date) }}</span>
                <span v-if="event.sourceTask" class="text-xs text-indigo-500">
                  ← from task "{{ event.sourceTask.title }}"
                </span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div v-if="event.mediaRequests?.length" class="text-right">
                <span :class="['text-xs px-2 py-0.5 rounded-full', mediaReqClass(event.mediaRequests)]">
                  {{ mediaReqLabel(event.mediaRequests) }}
                </span>
              </div>
              <button @click="openEditEvent(event)"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap">✏️ Edit</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty state -->
      <div v-if="!data.completedTasks?.length && !data.inProgressTasks?.length && !data.upcomingTasks?.length"
        class="text-center py-16 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">📋</p>
        <p class="text-sm">No evangelism activity this week yet.</p>
      </div>
    </div>

    <!-- Edit Event Modal -->
    <div v-if="editingEvent" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="editingEvent = null">
      <div class="absolute inset-0 bg-black/30" @click="editingEvent = null"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Event</h2>
          <button @click="editingEvent = null" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form @submit.prevent="saveEvent" class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input v-model="editForm.title" type="text" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input v-model="editForm.scheduledDate" type="datetime-local" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Series / Type</label>
            <input v-model="editForm.series" type="text"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Single Sermon, Evangelistic Series" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input v-model="editForm.location" type="text"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Studio" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select v-model="editForm.status"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="PLANNED">Planned</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div class="flex gap-2 pt-2">
            <button type="submit" :disabled="saving"
              class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <button type="button" @click="editingEvent = null"
              class="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';

const data = ref<any>({});
const loading = ref(true);
const weekStart = ref('');
const editingEvent = ref<any>(null);
const saving = ref(false);
const editForm = ref({
  title: '',
  scheduledDate: '',
  series: '',
  location: '',
  status: '',
});

function getMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(now);
  mon.setDate(now.getDate() - diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

const currentMonday = ref(getMonday());

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function isOverdue(deadline: string) {
  return new Date(deadline) < new Date();
}

function eventStatusClass(status: string) {
  const map: Record<string, string> = {
    PLANNED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    CONFIRMED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

function mediaReqClass(reqs: any[]) {
  if (reqs.some((r: any) => r.status === 'ACCEPTED'))
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (reqs.some((r: any) => r.status === 'PENDING'))
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
}

function mediaReqLabel(reqs: any[]) {
  if (reqs.some((r: any) => r.status === 'ACCEPTED')) return '✓ Media Confirmed';
  if (reqs.some((r: any) => r.status === 'PENDING')) return '⏳ Media Pending';
  return '✕ Declined';
}

function openEditEvent(event: any) {
  editingEvent.value = event;
  const dt = new Date(event.date || event.scheduledDate);
  editForm.value = {
    title: event.title || '',
    scheduledDate: dt.toISOString().slice(0, 16),
    series: event.eventType || event.series || 'Single Sermon',
    location: event.location || 'Studio',
    status: event.status || 'PLANNED',
  };
}

async function saveEvent() {
  if (!editingEvent.value) return;
  saving.value = true;
  try {
    await api.patch(`/evangelism/sermons/${editingEvent.value.id}`, {
      title: editForm.value.title,
      scheduledDate: new Date(editForm.value.scheduledDate).toISOString(),
      series: editForm.value.series,
      location: editForm.value.location,
      status: editForm.value.status,
    });
    editingEvent.value = null;
    fetchData(); // refresh the data
  } catch (err) {
    console.error('Failed to update event:', err);
  } finally {
    saving.value = false;
  }
}

function prevWeek() { currentMonday.value = new Date(currentMonday.value.getTime() - 7 * 86400000); fetchData(); }
function nextWeek() { currentMonday.value = new Date(currentMonday.value.getTime() + 7 * 86400000); fetchData(); }
function thisWeek() { currentMonday.value = getMonday(); fetchData(); }

async function fetchData() {
  loading.value = true;
  try {
    const ws = currentMonday.value.toISOString().split('T')[0];
    const { data: result } = await api.get(`/evangelism/activity-summary?weekStart=${ws}`);
    data.value = result;
    weekStart.value = result.weekStart;
  } catch (err) {
    console.error('Failed to load activity summary:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
