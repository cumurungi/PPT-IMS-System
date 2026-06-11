<template>
  <div class="fixed inset-0 z-50 flex justify-end" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="relative w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
        <RecordingStatusBadge v-if="rec" :status="rec.status" />
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
      </div>

      <div v-else-if="rec" class="px-6 py-5 space-y-6">
        <!-- Title + meta -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ rec.title }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ rec.format }} · {{ formatDuration(rec.durationSeconds) }} · {{ new Date(rec.recordingDate).toLocaleDateString() }}
          </p>
          <p v-if="rec.event" class="text-xs text-gray-500 dark:text-gray-400 mt-1">📅 {{ rec.event.title }}</p>
        </div>

        <!-- Workflow progress -->
        <div class="bg-gray-50 dark:bg-gray-750 rounded-xl p-4">
          <div class="flex items-center justify-between">
            <div v-for="(step, i) in workflowSteps" :key="step.value" class="flex-1 flex flex-col items-center relative">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10',
                stepReached(step.value) ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-400']">
                {{ i + 1 }}
              </div>
              <span class="text-xs mt-1 text-gray-600 dark:text-gray-400 text-center">{{ step.label }}</span>
              <div v-if="i < workflowSteps.length - 1"
                :class="['absolute top-4 left-1/2 w-full h-0.5 -z-0', stepReached(workflowSteps[i+1].value) ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600']">
              </div>
            </div>
          </div>
        </div>

        <!-- WORKFLOW ACTIONS -->

        <!-- CAPTURED → Start editing -->
        <div v-if="rec.status === 'CAPTURED'" class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">This recording is ready to be edited.</p>
          <button @click="startEditing" :disabled="acting"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
            {{ acting ? 'Starting...' : '✏️ Start Editing' }}
          </button>
        </div>

        <!-- IN_EDITING → Update progress -->
        <div v-if="rec.status === 'IN_EDITING'" class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-700 dark:text-gray-300">Editing Progress</span>
            <span class="font-bold text-blue-600 dark:text-blue-400">{{ localProgress }}%</span>
          </div>
          <input type="range" min="0" max="100" step="5" v-model.number="localProgress"
            class="w-full accent-blue-600 mb-3" />
          <p v-if="rec.editor" class="text-xs text-gray-500 dark:text-gray-400 mb-3">Editor: {{ rec.editor.name }}</p>
          <button @click="updateProgress" :disabled="acting"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
            {{ localProgress === 100 ? 'Mark as Edited (100%)' : 'Save Progress' }}
          </button>
        </div>

        <!-- EDITED → Approve / Reject (managers only) -->
        <div v-if="rec.status === 'EDITED'" class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
            ⏳ This recording is awaiting approval.
          </p>
          <template v-if="auth.isManager">
            <textarea v-model="approvalNotes" rows="2" placeholder="Approval notes (optional)..."
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mb-3 resize-none"></textarea>
            <div class="flex gap-2">
              <button @click="approve(true)" :disabled="acting"
                class="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
                ✅ Approve
              </button>
              <button @click="showReject = true" :disabled="acting"
                class="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
                ❌ Reject
              </button>
            </div>
            <!-- Reject reason -->
            <div v-if="showReject" class="mt-3">
              <textarea v-model="rejectionReason" rows="2" placeholder="Reason for rejection..."
                class="w-full border border-red-200 dark:border-red-800 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mb-2 resize-none"></textarea>
              <button @click="approve(false)" :disabled="acting || !rejectionReason"
                class="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
                Confirm Rejection
              </button>
            </div>
          </template>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400">Waiting for a manager to review.</p>
        </div>

        <!-- APPROVED -->
        <div v-if="rec.status === 'APPROVED'" class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <p class="text-sm text-green-700 dark:text-green-300">✅ Approved and added to the IT publishing queue.</p>
        </div>

        <!-- PUBLISHED -->
        <div v-if="rec.status === 'PUBLISHED'" class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
          <p class="text-sm text-emerald-700 dark:text-emerald-300">🎉 This recording has been published.</p>
        </div>

        <!-- Approval history -->
        <div v-if="rec.approvals?.length">
          <label class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Approval History</label>
          <div class="mt-2 space-y-2">
            <div v-for="a in rec.approvals" :key="a.id"
              class="p-3 rounded-lg border border-gray-100 dark:border-gray-700 text-sm">
              <div class="flex items-center justify-between">
                <span :class="a.decision ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ a.decision ? '✅ Approved' : '❌ Rejected' }} by {{ a.approver?.name }}
                </span>
                <span class="text-xs text-gray-400">{{ timeAgo(a.createdAt) }}</span>
              </div>
              <p v-if="a.notes" class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ a.notes }}</p>
              <p v-if="a.rejectionReason" class="text-xs text-red-600 dark:text-red-400 mt-1">Reason: {{ a.rejectionReason }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import RecordingStatusBadge from './RecordingStatusBadge.vue';

const props = defineProps<{ recordingId: string }>();
const emit = defineEmits(['close', 'updated']);

const auth = useAuthStore();
const rec = ref<any>(null);
const loading = ref(true);
const acting = ref(false);
const localProgress = ref(0);
const approvalNotes = ref('');
const rejectionReason = ref('');
const showReject = ref(false);

const workflowSteps = [
  { value: 'CAPTURED', label: 'Captured' },
  { value: 'IN_EDITING', label: 'Editing' },
  { value: 'EDITED', label: 'Edited' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PUBLISHED', label: 'Published' },
];

onMounted(fetchRecording);

async function fetchRecording() {
  try {
    const { data } = await api.get(`/media/recordings/${props.recordingId}`);
    rec.value = data;
    localProgress.value = data.editingProgress;
  } catch (err) {
    console.error('Failed to load recording:', err);
  } finally {
    loading.value = false;
  }
}

function stepReached(status: string) {
  const order = workflowSteps.map(s => s.value);
  return order.indexOf(rec.value?.status) >= order.indexOf(status);
}

async function startEditing() {
  acting.value = true;
  try {
    await api.post(`/media/recordings/${props.recordingId}/start-editing`, {});
    await fetchRecording();
    emit('updated');
  } catch (err) { console.error(err); }
  finally { acting.value = false; }
}

async function updateProgress() {
  acting.value = true;
  try {
    await api.patch(`/media/recordings/${props.recordingId}`, { editingProgress: localProgress.value });
    await fetchRecording();
    emit('updated');
  } catch (err) { console.error(err); }
  finally { acting.value = false; }
}

async function approve(decision: boolean) {
  acting.value = true;
  try {
    await api.post(`/media/recordings/${props.recordingId}/approve`, {
      decision,
      notes: approvalNotes.value || undefined,
      rejectionReason: decision ? undefined : rejectionReason.value,
    });
    await fetchRecording();
    emit('updated');
  } catch (err) { console.error(err); }
  finally { acting.value = false; showReject.value = false; }
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
</script>
