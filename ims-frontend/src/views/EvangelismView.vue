<template>
  <div class="h-full flex flex-col">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Evangelism Department</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Manage events, preachers, and approvals</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2',
          activeTab === tab.id
            ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="flex-1 overflow-hidden">
      <div v-if="activeTab === 'events'" class="h-full">
        <EventsView />
      </div>
      <div v-else-if="activeTab === 'preachers'" class="h-full">
        <PreachersView />
      </div>
      <div v-else-if="activeTab === 'approvals'" class="h-full">
        <ApprovalsView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EventsView from './evangelism/EventsView.vue';
import PreachersView from './evangelism/PreachersView.vue';
import ApprovalsView from './evangelism/ApprovalsView.vue';

type TabId = 'events' | 'preachers' | 'approvals';

const activeTab = ref<TabId>('events');

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'events', label: '📅 Schedule' },
  { id: 'preachers', label: '🎤 Preachers' },
  { id: 'approvals', label: '✅ Approvals' },
];
</script>
