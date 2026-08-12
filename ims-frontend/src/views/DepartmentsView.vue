<template>
  <div class="h-full flex flex-col">
    <div class="mb-6 flex-shrink-0">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Department Management</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Overview of all departments and their members</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <div v-else class="flex-1 overflow-auto space-y-4">
      <div v-for="dept in departments" :key="dept.department"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ formatDept(dept.department) }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ dept.memberCount }} members · {{ dept.projectCount || 0 }} projects</p>
          </div>
          <button @click="openDept(dept.department)"
            class="px-3 py-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-medium">
            View Details
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-for="member in (dept.members || []).slice(0, 5)" :key="member.id"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {{ member.name }} <span class="text-gray-400">{{ member.role === 'MANAGER' ? '👤' : '' }}</span>
          </span>
          <span v-if="(dept.members || []).length > 5" class="text-xs text-gray-400">
            +{{ (dept.members || []).length - 5 }} more
          </span>
        </div>
      </div>
    </div>

    <!-- Department Detail Modal -->
    <div v-if="selectedDept" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="selectedDept = null">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ formatDept(selectedDept.department) }} Department</h2>
          <button @click="selectedDept = null" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ selectedDept.memberCount }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Members</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ selectedDept.projectCount || 0 }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Projects</p>
            </div>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">Members</p>
            <div class="space-y-2 max-h-60 overflow-auto">
              <div v-for="m in selectedDept.members" :key="m.id"
                class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ m.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ m.email }}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{{ m.role }}</span>
              </div>
              <div v-if="!selectedDept.members?.length" class="text-sm text-gray-400 text-center py-4">No members</div>
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

interface Department {
  department: string;
  memberCount: number;
  projectCount?: number;
  members?: Array<{ id: string; name: string; email: string; role: string }>;
}

const departments = ref<Department[]>([]);
const loading = ref(true);
const selectedDept = ref<Department | null>(null);

function formatDept(d: string) {
  const map: Record<string, string> = {
    MEDIA: '🎬 Media',
    EVANGELISM: '📅 Evangelism',
    IT: '💻 IT',
    HR_FINANCE: '👥 HR/Finance',
  };
  return map[d] || d;
}

async function fetchDepartments() {
  loading.value = true;
  try {
    const { data } = await api.get('/departments');
    departments.value = data;
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
}

async function openDept(dept: string) {
  try {
    const { data } = await api.get(`/departments/${dept}`);
    selectedDept.value = data;
  } catch (err) { console.error(err); }
}

onMounted(fetchDepartments);
</script>