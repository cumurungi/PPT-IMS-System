<template>
  <div class="h-full flex flex-col">
    <div class="mb-4 flex-shrink-0">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Sermon Approvals</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Watch the edited sermon and approve or request changes</p>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <div v-else-if="recordings.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <p class="text-4xl mb-3">✅</p>
      <p class="text-sm">No sermons pending your approval.</p>
    </div>

    <div v-else class="flex-1 overflow-auto space-y-4">
      <div v-for="rec in recordings" :key="rec.id"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 text-lg">{{ rec.title }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ rec.event?.title ? '📅 ' + rec.event.title + ' · ' : '' }}
              Edited by {{ rec.editor?.name ?? 'Unknown' }}
            </p>
          </div>
          <span class="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-3 py-1 rounded-full font-medium">
            Awaiting Approval
          </span>
        </div>

        <!-- Video link -->
        <div v-if="rec.editedVideoUrl" class="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">🔗 Watch the edited sermon:</p>
          <a :href="rec.editedVideoUrl" target="_blank" rel="noopener noreferrer"
            class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all">
            {{ rec.editedVideoUrl }}
          </a>
        </div>
        <p v-else class="mb-4 text-sm text-gray-400 dark:text-gray-500 italic">No video link provided yet.</p>

        <!-- Approve / Reject -->
        <div v-if="activeId !== rec.id">
          <button @click="activeId = rec.id"
            class="w-full py-2.5 text-sm border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium">
            Review & Decide
          </button>
        </div>
        <div v-else class="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          <textarea v-model="notes" rows="2" placeholder="Notes or feedback (optional)..."
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
          <div class="flex gap-2">
            <button @click="approve(rec.id, true)" :disabled="acting"
              class="flex-1 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium">
              ✅ Approve — Ready to Publish
            </button>
            <button @click="showReject = true" :disabled="acting"
              class="flex-1 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium">
              ❌ Request Changes
            </button>
          </div>
          <div v-if="showReject" class="space-y-2">
            <textarea v-model="rejectionReason" rows="2" placeholder="What needs to change?..."
              class="w-full border border-red-200 dark:border-red-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-500 outline-none"></textarea>
            <button @click="approve(rec.id, false)" :disabled="acting || !rejectionReason"
              class="w-full py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium">
              Send Back for Editing
            </button>
          </div>
          <button @click="activeId = null; showReject = false; notes = ''; rejectionReason = ''"
            class="w-full py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:underline">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';

const recordings = ref<any[]>([]);
const loading = ref(true);
const acting = ref(false);
const activeId = ref<string | null>(null);
const notes = ref('');
const rejectionReason = ref('');
const showReject = ref(false);

async function approve(id: string, decision: boolean) {
  acting.value = true;
  try {
    await api.post(`/media/recordings/${id}/approve`, {
      decision,
      notes: notes.value || undefined,
      rejectionReason: decision ? undefined : rejectionReason.value,
    });
    activeId.value = null;
    notes.value = '';
    rejectionReason.value = '';
    showReject.value = false;
    await fetchRecordings();
  } catch (err) { console.error(err); }
  finally { acting.value = false; }
}

async function fetchRecordings() {
  loading.value = true;
  try {
    const { data } = await api.get('/evangelism/pending-approvals');
    recordings.value = data;
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
}

onMounted(fetchRecordings);
</script>
