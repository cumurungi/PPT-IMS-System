<template>
  <div class="fixed inset-0 z-50 flex justify-end" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="relative w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">

      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
        <div class="flex items-center gap-2">
          <EventStatusBadge :status="s.status" />
          <span v-if="editingDetails" class="text-xs text-indigo-600 dark:text-indigo-300">Editing</span>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="!editingDetails" @click="beginEdit"
            class="px-3 py-1.5 text-xs rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20">
            Edit
          </button>
          <button v-if="editingDetails" @click="cancelEdit"
            class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50">
            Cancel
          </button>
          <button v-if="editingDetails" @click="saveDetails" :disabled="acting"
            class="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
            {{ acting ? 'Saving...' : 'Save' }}
          </button>
          <button @click="deleteSermon"
            class="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20">
            Delete
          </button>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
        </div>
      </div>

      <div class="px-6 py-5 space-y-6">

        <!-- Sermon details -->
        <div>
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100" v-if="!editingDetails">{{ s.title }}</h2>
              <input v-if="editingDetails" v-model="editedSermon.title" type="text" placeholder="Sermon title"
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <p v-if="s.series && !editingDetails" class="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">{{ s.series }}</p>
              <input v-if="editingDetails" v-model="editedSermon.series" type="text" placeholder="Series / type"
                class="mt-2 w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div v-if="!editingDetails" class="mt-3">
            <p v-if="s.location" class="text-sm text-gray-500 dark:text-gray-400">
              🎙️ {{ s.location }} &nbsp;·&nbsp; 📅 {{ formatDateTime(s.scheduledDate || s.date) }}
            </p>
            <p v-if="s.scriptureReference" class="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">
              📖 {{ s.scriptureReference }}
            </p>
            <p v-if="s.description" class="text-sm text-gray-500 dark:text-gray-400 mt-2">{{ s.description }}</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Location</label>
              <input v-model="editedSermon.location" type="text" placeholder="Studio"
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date & time</label>
              <input v-model="editedSermon.scheduledDate" type="datetime-local"
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div v-if="editingDetails" class="mt-3">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Scripture Reference</label>
            <input v-model="editedSermon.scriptureReference" type="text" placeholder="e.g. Revelation 14:6-12"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div v-if="editingDetails" class="mt-3">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Brief outline</label>
            <textarea v-model="editedSermon.description" rows="3"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
          </div>

          <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Scheduled by {{ s.createdBy?.name }}</p>
          <p v-if="saveError" class="text-sm text-red-600 dark:text-red-400 mt-2">{{ saveError }}</p>
        </div>

        <!-- Preacher(s) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Preacher(s)</p>
            <button @click="editingPreachers = !editingPreachers"
              class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              {{ editingPreachers ? 'Cancel' : s.preachers?.length ? 'Edit' : '+ Assign' }}
            </button>
          </div>

          <!-- Editable checklist -->
          <div v-if="editingPreachers" class="border border-gray-200 dark:border-gray-600 rounded-lg p-2 space-y-1 mb-2 max-h-40 overflow-y-auto">
            <p v-if="!props.preachers?.length" class="text-xs text-gray-400 dark:text-gray-500 p-1">No preachers in the directory yet.</p>
            <label v-for="p in props.preachers" :key="p.id"
              class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1.5 rounded">
              <input type="checkbox" :value="p.id" v-model="selectedPreacherIds"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">{{ p.name }}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">— {{ p.specialization }}</span>
            </label>
          </div>
          <button v-if="editingPreachers" @click="savePreachers" :disabled="acting"
            class="w-full py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium mb-2">
            {{ acting ? 'Saving...' : 'Save Preachers' }}
          </button>

          <!-- Read-only display -->
          <div v-if="!editingPreachers">
            <div v-if="s.preachers?.length" class="flex flex-wrap gap-2">
              <span v-for="ep in s.preachers" :key="ep.preacher?.id ?? ep.id"
                class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-full font-medium">
                {{ ep.preacher?.name }}
                <span class="text-indigo-400 dark:text-indigo-500 font-normal ml-1">· {{ ep.preacher?.specialization }}</span>
              </span>
            </div>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500">No preacher assigned yet</p>
          </div>
        </div>

        <!-- Recording pipeline status -->
        <div class="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4">
          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-3">Recording Pipeline</p>

          <!-- Media request status -->
          <div class="flex items-center gap-3 mb-3">
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
              mediaRequestStatus === 'ACCEPTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : mediaRequestStatus === 'DECLINED' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : mediaRequestStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400']">
              {{ mediaRequestStatus === 'ACCEPTED' ? '✓' : mediaRequestStatus === 'DECLINED' ? '✕' : '1' }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200">Media Request</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ mediaRequestStatus === 'ACCEPTED' ? 'Accepted by Media team'
                  : mediaRequestStatus === 'DECLINED' ? 'Declined — check with Media team'
                  : mediaRequestStatus === 'PENDING' ? 'Awaiting Media team confirmation'
                  : 'Not yet sent' }}
              </p>
            </div>
          </div>

          <!-- Recording status -->
          <div v-if="s.recordings?.length" class="space-y-2">
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Recordings ({{ s.recordings.length }})</p>
            <div v-for="r in s.recordings" :key="r.id"
              class="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-sm">
              <span class="text-gray-700 dark:text-gray-300 truncate mr-2">{{ r.title }}</span>
              <div class="flex items-center gap-2 flex-shrink-0">
                <div v-if="r.status === 'IN_EDITING'" class="flex items-center gap-1.5">
                  <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div class="bg-blue-500 h-1.5 rounded-full" :style="{ width: (r.editingProgress || 0) + '%' }"></div>
                  </div>
                  <span class="text-xs text-blue-600 dark:text-blue-400">{{ r.editingProgress || 0 }}%</span>
                </div>
                <span :class="['text-xs px-2 py-0.5 rounded-full', recordingStatusClass(r.status)]">
                  {{ r.status.replace('_', ' ') }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Recording will appear here once Media team starts it.
          </p>
        </div>

        <!-- Sermon status controls (managers only) -->
        <div v-if="auth.isManager && allowedTransitions.length > 0" class="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Update Status</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="st in allowedTransitions" :key="st"
              @click="changeStatus(st)" :disabled="acting"
              class="px-3 py-1.5 text-xs rounded-lg border font-medium disabled:opacity-50 transition-colors"
              :class="statusBtnClass(st)">
              {{ STATUS_LABELS[st] ?? st.replace('_', ' ') }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import EventStatusBadge from './EventStatusBadge.vue';

const props = defineProps<{ event: any; preachers: any[] }>();
const emit = defineEmits(['close', 'updated']);

const auth = useAuthStore();
const s = ref({ ...props.event }); // s = sermon
const acting = ref(false);
const editingPreachers = ref(false);
const editingDetails = ref(false);
const saveError = ref('');
const editedSermon = ref<any>({
  title: props.event.title || '',
  scheduledDate: props.event.scheduledDate || props.event.date || '',
  series: props.event.series || '',
  location: props.event.location || '',
  description: props.event.description || '',
  scriptureReference: props.event.scriptureReference || '',
});
const selectedPreacherIds = ref<string[]>(
  (props.event.preachers ?? []).map((ep: any) => ep.preacher?.id).filter(Boolean)
);

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PLANNED:     ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:   ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED:   [],
  CANCELLED:   ['PLANNED'],
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED:     'Mark Scheduled',
  CONFIRMED:   'Confirm',
  IN_PROGRESS: 'Mark Recording',
  COMPLETED:   'Mark Recorded',
  CANCELLED:   'Cancel',
};

const allowedTransitions = computed(() => STATUS_TRANSITIONS[s.value.status] ?? []);

const mediaRequestStatus = computed(() => {
  const reqs = s.value.mediaRequests;
  if (!reqs?.length) return null;
  // Show most favourable status
  if (reqs.some((r: any) => r.status === 'ACCEPTED')) return 'ACCEPTED';
  if (reqs.some((r: any) => r.status === 'PENDING')) return 'PENDING';
  return 'DECLINED';
});

function formatDateTime(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusBtnClass(status: string) {
  if (status === 'CANCELLED') return 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20';
  if (status === 'COMPLETED') return 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20';
  return 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20';
}

function recordingStatusClass(status: string) {
  const map: Record<string, string> = {
    CAPTURED:   'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    IN_EDITING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    EDITED:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    APPROVED:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    PUBLISHED:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

function beginEdit() {
  editingDetails.value = true;
  saveError.value = '';
  editedSermon.value = {
    title: s.value.title || '',
    scheduledDate: s.value.scheduledDate || s.value.date || '',
    series: s.value.series || '',
    location: s.value.location || '',
    description: s.value.description || '',
    scriptureReference: s.value.scriptureReference || '',
  };
}

function cancelEdit() {
  editingDetails.value = false;
  saveError.value = '';
}

async function saveDetails() {
  acting.value = true;
  saveError.value = '';
  try {
    const payload: any = {
      title: editedSermon.value.title,
      series: editedSermon.value.series,
      location: editedSermon.value.location,
      description: editedSermon.value.description,
      scriptureReference: editedSermon.value.scriptureReference,
    };
    if (editedSermon.value.scheduledDate) {
      payload.scheduledDate = new Date(editedSermon.value.scheduledDate).toISOString();
    }
    const { data } = await api.patch(`/evangelism/sermons/${s.value.id}`, payload);
    s.value = data;
    editingDetails.value = false;
    emit('updated');
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to save changes';
  } finally {
    acting.value = false;
  }
}

async function deleteSermon() {
  if (!confirm('Delete this sermon? This cannot be undone.')) return;
  acting.value = true;
  try {
    await api.delete(`/evangelism/sermons/${s.value.id}`);
    emit('updated');
    emit('close');
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to delete sermon';
  } finally {
    acting.value = false;
  }
}

async function savePreachers() {
  acting.value = true;
  try {
    const { data } = await api.patch(`/evangelism/sermons/${s.value.id}`, {
      preacherIds: selectedPreacherIds.value,
    });
    s.value = data;
    editingPreachers.value = false;
    emit('updated');
  } catch (err) { console.error(err); }
  finally { acting.value = false; }
}

async function changeStatus(status: string) {
  acting.value = true;
  try {
    const { data } = await api.patch(`/evangelism/sermons/${s.value.id}`, { status });
    s.value = data;
    emit('updated');
  } catch (err) { console.error(err); }
  finally { acting.value = false; }
}

async function fetchFull() {
  try {
    const { data } = await api.get(`/evangelism/sermons/${s.value.id}`);
    s.value = data;
  } catch (err) { console.error(err); }
}

onMounted(fetchFull);
</script>
