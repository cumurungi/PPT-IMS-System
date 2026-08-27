<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {{ auth.user?.name }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here's what's happening {{ auth.user?.role === 'ADMIN' ? 'across the organization' : 'in your department' }} today.
        </p>
      </div>
      <div class="text-right">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
          {{ auth.user?.role }}
        </span>
        <p v-if="auth.user?.department" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ formatDepartment(auth.user.department) }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <template v-else-if="stats">
      <!-- Personal Stats (all users see this) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🔔" label="Notifications" :value="stats.personal.unreadNotifications" color="yellow" to="/notifications" />
        <StatCard v-if="stats.media" icon="🎬" label="Recordings" :value="stats.media.recordings" color="purple" to="/media" />
        <StatCard v-if="stats.it" icon="🎫" label="Open Tickets" :value="stats.it.openTickets" color="orange" to="/it" />
        <StatCard v-if="stats.hr" icon="🏖️" label="Pending Leave" :value="stats.hr.pendingLeave" color="blue" to="/hr" />
      </div>

      <!-- ADMIN DASHBOARD -->
      <template v-if="stats.admin">
        <!-- Organization Overview -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Organization Overview</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon="👥" label="Total Users" :value="stats.admin.totalUsers" color="purple" to="/admin/users" />
            <StatCard icon="📁" label="Active Projects" :value="stats.admin.totalProjects" color="blue" to="/projects" />
            <StatCard icon="🏖️" label="Pending Leave" :value="stats.admin.pendingLeave" color="yellow" to="/hr" />
            <StatCard icon="💰" label="Pending Expenses" :value="stats.admin.pendingExpenses" color="green" to="/hr" />
            <StatCard icon="🎫" label="Open Tickets" :value="stats.admin.openTickets" color="orange" to="/it" />
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Recent Activity</h3>
          <div v-if="stats.admin.recentActivity.length === 0" class="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
            No recent activity
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="log in stats.admin.recentActivity"
              :key="log.id"
              class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <div class="flex items-center gap-3">
                <span class="text-lg">{{ actionIcon(log.action) }}</span>
                <div>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    <strong>{{ log.user.name }}</strong> {{ log.action.toLowerCase().replace('_', ' ') }} a {{ log.entityType }}
                  </p>
                </div>
              </div>
              <span class="text-xs text-gray-400 dark:text-gray-500">{{ timeAgo(log.createdAt) }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- MANAGER DASHBOARD -->
      <template v-if="stats.manager">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {{ formatDepartment(stats.manager.department) }} Department
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Team Members" :value="stats.manager.teamMembers" color="purple" to="/admin/users" />
            <StatCard icon="📁" label="Projects" :value="stats.manager.projects" color="blue" to="/projects" />
            <StatCard icon="📊" label="Completion" :value="stats.manager.completionRate + '%'" color="green" to="/projects" />
            <StatCard icon="📋" label="Pending Approvals" :value="stats.manager.pendingApprovals" color="orange" to="/media" />
          </div>
        </div>
      </template>

      <!-- DEPARTMENT-SPECIFIC MODULES (visible to department members + admin) -->

      <!-- Media Module -->
      <template v-if="stats.media">
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">🎬 Media Overview</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.media.recordings }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Recordings</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-yellow-600">{{ stats.media.pendingApproval }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Awaiting Approval</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600">{{ stats.media.published }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Published</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Evangelism Module -->
      <template v-if="stats.evangelism">
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">📅 Evangelism Overview</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600">{{ stats.evangelism.upcomingEvents }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Scheduled (Waiting to Record)</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600">{{ stats.evangelism.completedEvents }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Recorded</p>
            </div>
          </div>
        </div>
      </template>

      <!-- IT Module -->
      <template v-if="stats.it">
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">🎫 IT Overview</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-orange-600">{{ stats.it.openTickets }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Open Tickets</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-red-600">{{ stats.it.criticalTickets }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Critical</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-purple-600">{{ stats.it.publishingQueueSize }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Publish Queue</p>
            </div>
          </div>
        </div>
      </template>

      <!-- HR Module -->
      <template v-if="stats.hr">
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">👥 HR / Finance Overview</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600">{{ stats.hr.totalEmployees }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Employees</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-yellow-600">{{ stats.hr.pendingLeave }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Pending Leave</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-orange-600">{{ stats.hr.pendingExpenses }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Pending Expenses</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Department Performance -->
      <div class="grid grid-cols-1 gap-4">
        <DepartmentChart v-if="stats.admin.departments" :departments="stats.admin.departments" />
      </div>

      <!-- Predictive Insights -->
      <PredictionsView />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/axios';
import StatCard from '@/components/dashboard/StatCard.vue';
import DepartmentChart from '@/components/dashboard/DepartmentChart.vue';
import PredictionsView from '@/components/dashboard/PredictionsView.vue';

const auth = useAuthStore();
const stats = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/stats');
    stats.value = data;
  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
  } finally {
    loading.value = false;
  }
});

function formatDepartment(dept: string) {
  const map: Record<string, string> = {
    MEDIA: 'Media',
    EVANGELISM: 'Evangelism',
    IT: 'IT',
    HR_FINANCE: 'HR / Finance',
  };
  return map[dept] || dept;
}

function actionIcon(action: string) {
  const icons: Record<string, string> = {
    CREATE: '➕',
    UPDATE: '✏️',
    DELETE: '🗑️',
    APPROVE: '✅',
    REJECT: '❌',
    LOGIN_SUCCESS: '🔑',
    PERMISSION_CHANGE: '🔒',
  };
  return icons[action] || '📋';
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
</script>
