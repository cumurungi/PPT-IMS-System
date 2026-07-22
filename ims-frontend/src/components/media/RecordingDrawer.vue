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

      <div v-else-if="notFound" class="px-6 py-10 text-center">
        <p class="text-4xl mb-3">🎬</p>
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">This recording could not be found.</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">It may have been removed or the link is no longer valid.</p>
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

        <!-- Assignees (editable by manager) -->
        <div class="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Team Assignments</p>
            <button v-if="auth.isManager" @click="showAssignPanel = !showAssignPanel"
              class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              {{ showAssignPanel ? 'Cancel' : 'Edit' }}
            </button>
          </div>

          <!-- Read-only display -->
          <div v-if="!showAssignPanel" class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400 w-24">🎙️ Recorder:</span>
              <span v-if="rec.recordingAssignee" class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ rec.recordingAssignee.name }}</span>
              <span v-else class="text-sm text-gray-300 dark:text-gray-600 italic">Not assigned</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400 w-24">✏️ Editor:</span>
              <span v-if="rec.editor" class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ rec.editor.name }}</span>
              <span v-else class="text-sm text-gray-300 dark:text-gray-600 italic">Not assigned</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400 w-24">📆 Due:</span>
              <span v-if="rec.editingDueDate" class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ formatDate(rec.editingDueDate) }}</span>
              <span v-else class="text-sm text-gray-300 dark:text-gray-600 italic">No deadline</span>
            </div>
          </div>

          <!-- Editable panel (manager only) -->
          <div v-if="showAssignPanel" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Recording Assignee</label>
              <select v-model="assignRecorderId"
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">— None —</option>
                <option v-for="u in teamMembers" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Editor</label>
              <select v-model="assignEditorId"
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">— None —</option>
                <option v-for="u in teamMembers" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Editing Deadline</label>
              <input v-model="editingDueDate" type="date"
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <button @click="saveAssignments" :disabled="acting"
              class="w-full py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium">
              {{ acting ? 'Saving...' : 'Save Assignments' }}
            </button>
          </div>
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
          <div v-if="rec.editedVideoUrl" class="mb-3">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Approval link{{ rec.approvalVideoSource ? ` (${rec.approvalVideoSource})` : '' }}
            </p>
            <a :href="rec.editedVideoUrl" target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Watch video for approval
            </a>
          </div>
          <select
            v-model="approvalVideoSource"
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Link source not decided yet</option>
            <option value="YouTube">YouTube</option>
            <option value="Synology">Synology</option>
            <option value="Other">Other</option>
          </select>
          <input
            v-model="editedVideoUrl"
            type="url"
            placeholder="Paste YouTube or Synology link"
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button @click="saveEditedVideoLink" :disabled="acting"
            class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium mb-3">
            {{ acting ? 'Saving...' : 'Save Approval Link' }}
          </button>
          <button @click="updateProgress" :disabled="acting"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
            {{ localProgress === 100 ? 'Mark as Edited (100%)' : 'Save Progress' }}
          </button>
        </div>

        <!-- EDITED → Approve / Reject (managers only) -->
        <!-- EDITED → Send to preacher for approval -->
        <div v-if="rec.status === 'EDITED'" class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
            ✏️ Editing complete. Send to the preacher for approval.
          </p>
          <!-- Video option: link OR upload -->
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Provide video for review</label>
            <div class="flex gap-2 mb-2">
              <button @click="videoMethod = 'link'" :class="['flex-1 py-1.5 text-xs rounded-lg border font-medium', videoMethod === 'link' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400']">
                🔗 Paste Link
              </button>
              <button @click="videoMethod = 'upload'" :class="['flex-1 py-1.5 text-xs rounded-lg border font-medium', videoMethod === 'upload' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400']">
                📁 Upload from Synology
              </button>
            </div>
            <input v-if="videoMethod === 'link'" v-model="editedVideoUrl" type="url" placeholder="Paste YouTube/private link"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <div v-else>
              <label class="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ uploadedFileName || '📁 Click to select video file' }}</span>
                <input type="file" class="hidden" accept="video/*" @change="handleVideoUpload" />
              </label>
              <div v-if="videoUploading" class="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                <div class="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent"></div>
                Uploading...
              </div>
            </div>
          </div>
          <!-- Select preacher -->
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Select preacher to approve *</label>
            <select v-model="selectedPreacherId"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">— Choose preacher —</option>
              <option v-for="u in evangelismUsers" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <button @click="sendForApproval" :disabled="acting || !selectedPreacherId || (!editedVideoUrl && videoMethod === 'link')"
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {{ acting ? 'Sending...' : '📨 Send to Preacher for Approval' }}
          </button>
          <p v-if="sentForApproval" class="mt-2 text-sm text-green-600 dark:text-green-400">✅ Sent! The preacher will get an email.</p>
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
const notFound = ref(false);
const localProgress = ref(0);
const approvalNotes = ref('');
const rejectionReason = ref('');
const showReject = ref(false);
const editedVideoUrl = ref('');
const approvalVideoSource = ref('');
const showAssignPanel = ref(false);
const assignRecorderId = ref('');
const assignEditorId = ref('');
const editingDueDate = ref('');
const teamMembers = ref<any[]>([]);
const selectedPreacherId = ref('');
const evangelismUsers = ref<any[]>([]);
const sentForApproval = ref(false);
const videoMethod = ref<'link' | 'upload'>('link');
const videoUploading = ref(false);
const uploadedFileName = ref('');

const workflowSteps = [
  { value: 'CAPTURED', label: 'Captured' },
  { value: 'IN_EDITING', label: 'Editing' },
  { value: 'EDITED', label: 'Edited' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PUBLISHED', label: 'Published' },
];

onMounted(fetchRecording);

async function fetchRecording() {
  notFound.value = false;
  if (!props.recordingId) {
    notFound.value = true;
    loading.value = false;
    return;
  }

  try {
    const [recRes, teamRes, evangRes] = await Promise.all([
      api.get(`/media/recordings/${props.recordingId}`),
      api.get('/media/assignable-users'),
      api.get('/media/evangelism-users').catch(() => ({ data: [] })),
    ]);
    rec.value = recRes.data;
    localProgress.value = recRes.data.editingProgress;
    editedVideoUrl.value = recRes.data.editedVideoUrl || '';
    approvalVideoSource.value = recRes.data.approvalVideoSource || '';
    assignRecorderId.value = recRes.data.recordingAssigneeId || '';
    assignEditorId.value = recRes.data.editorId || '';
    editingDueDate.value = recRes.data.editingDueDate ? recRes.data.editingDueDate.slice(0, 10) : '';
    teamMembers.value = teamRes.data;
    evangelismUsers.value = evangRes.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      notFound.value = true;
    } else {
      console.error('Failed to load recording:', err);
    }
  } finally {
    loading.value = false;
  }
}

function stepReached(status: string) {
  const order = workflowSteps.map(s => s.value);
  return order.indexOf(rec.value?.status) >= order.indexOf(status);
}

async function sendForApproval() {
  acting.value = true;
  try {
    await api.post(`/media/recordings/${props.recordingId}/send-for-approval`, {
      preacherUserId: selectedPreacherId.value,
      videoLink: editedVideoUrl.value || undefined,
    });
    sentForApproval.value = true;
    emit('updated');
  } catch (err) { console.error(err); }
  finally { acting.value = false; }
}

async function handleVideoUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  videoUploading.value = true;
  uploadedFileName.value = input.files[0].name;
  const formData = new FormData();
  formData.append('file', input.files[0]);
  try {
    const { data } = await api.post('/upload/media-asset', formData);
        editedVideoUrl.value = (import.meta.env.VITE_API_BASE_URL || '') + data.fileUrl;
  } catch (err) { console.error(err); }
  finally { videoUploading.value = false; input.value = ''; }
}

async function saveAssignments() {
  acting.value = true;
  try {
    await api.patch(`/media/recordings/${props.recordingId}`, {
      recordingAssigneeId: assignRecorderId.value || null,
      editorId: assignEditorId.value || null,
      editingDueDate: editingDueDate.value ? new Date(editingDueDate.value + 'T23:59:59').toISOString() : null,
    });
    await fetchRecording();
    showAssignPanel.value = false;
    emit('updated');
  } catch (err) { console.error(err); }
  finally { acting.value = false; }
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

async function saveEditedVideoLink() {
  acting.value = true;
  try {
    await api.patch(`/media/recordings/${props.recordingId}`, {
      editedVideoUrl: editedVideoUrl.value.trim() || null,
      approvalVideoSource: approvalVideoSource.value || null,
    });
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>
