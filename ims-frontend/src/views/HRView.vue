<template>
  <div class="h-full flex flex-col">
    <div class="mb-6 flex-shrink-0">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">HR / Finance</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Attendance, leave, and expense management</p>
    </div>

    <!-- Tabs (Charmante only sees Attendance) -->
    <div v-if="visibleTabs.length > 1" class="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <button v-for="tab in visibleTabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2',
          activeTab === tab.id
            ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300']">
        {{ tab.label }}
      </button>
    </div>

    <div class="flex-1 overflow-hidden">
      <AttendanceTab v-if="activeTab === 'attendance'" />
      <LeaveTab      v-else-if="activeTab === 'leave'" />
      <ExpensesTab   v-else-if="activeTab === 'expenses'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const AttendanceTab = defineAsyncComponent(() => import('@/components/hr/AttendanceTab.vue'));
const LeaveTab      = defineAsyncComponent(() => import('@/components/hr/LeaveTab.vue'));
const ExpensesTab   = defineAsyncComponent(() => import('@/components/hr/ExpensesTab.vue'));

const isHR = computed(() => auth.user?.department === 'HR_FINANCE' || auth.user?.role === 'ADMIN');
const isManager = computed(() => auth.user?.role === 'MANAGER' || auth.user?.role === 'ADMIN');

type TabId = 'attendance' | 'leave' | 'expenses';
const activeTab = ref<TabId>('leave');

const allTabs: Array<{ id: TabId; label: string }> = [
  { id: 'attendance', label: '⏱️ Attendance' },
  { id: 'leave',      label: '🏖️ Leave Requests' },
  { id: 'expenses',   label: '💰 Expenses' },
];

// HR department members and managers see all tabs, others see Leave + Expenses only
const visibleTabs = computed(() => {
  if (isHR.value || isManager.value) return allTabs;
  return allTabs.filter(t => t.id === 'leave' || t.id === 'expenses');
});
</script>
