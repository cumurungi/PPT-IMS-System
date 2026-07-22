<template>
  <div class="h-full flex flex-col">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Media Department</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Manage media library, recordings, and coverage requests</p>
    </div>

    <div class="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="tab in mediaTabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2',
          activeTab === tab.id
            ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        ]"
      >
        {{ tab.label }}
        <!-- Pending badge on Requests tab -->
        <span v-if="tab.id === 'requests' && pendingRequestsCount > 0"
          class="bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {{ pendingRequestsCount }}
        </span>
      </button>
    </div>

    <div class="flex-1 overflow-hidden">
      <div v-if="activeTab === 'library'" class="h-full">
        <MediaLibraryView />
      </div>
      <div v-else-if="activeTab === 'recordings'" class="h-full">
        <RecordingsView />
      </div>
      <div v-else-if="activeTab === 'requests'" class="h-full">
        <MediaRequestsView @pending-count="pendingRequestsCount = $event" />
      </div>
      <div v-else-if="activeTab === 'editing'" class="h-full">
        <EditingView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api/axios';
import MediaLibraryView from './media/MediaLibraryView.vue';
import RecordingsView from './media/RecordingsView.vue';
import MediaRequestsView from './media/MediaRequestsView.vue';
import EditingView from './media/EditingView.vue';

type TabId = 'library' | 'recordings' | 'requests' | 'editing';

const activeTab = ref<TabId>('library');
const pendingRequestsCount = ref(0);
const route = useRoute();

const mediaTabs: Array<{ id: TabId; label: string }> = [
  { id: 'library', label: 'Media Library' },
  { id: 'recordings', label: 'Recordings' },
  { id: 'requests', label: '📬 Coverage Requests' },
  { id: 'editing', label: '✂️ Editing' },
];

// Load pending count on mount so badge shows even before clicking the tab
onMounted(async () => {
  // Honour ?tab= query so notification links open the right sub-tab
  const tab = route.query.tab as TabId | undefined;
  if (tab && mediaTabs.some((t) => t.id === tab)) activeTab.value = tab;
  try {
    const { data } = await api.get('/media/requests');
    pendingRequestsCount.value = data.filter((r: any) => r.status === 'PENDING').length;
  } catch {
    // silently ignore — user may not have MEDIA dept access
  }
});
</script>
