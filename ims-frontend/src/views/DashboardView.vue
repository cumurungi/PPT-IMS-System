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
        <StatCard icon="✅" label="My Tasks" :value="stats.personal.totalTasks" color="blue" />
        <StatCard icon="🎯" label="Tasks Completed" :value="stats.personal.completedTasks" color="green" />
        <StatCard icon="⚠️" label="Overdue" :value="stats.personal.overdueTasks" color="red" />
        <StatCard icon="🔔" label="Notifications" :value="stats.personal.unreadNotifications" color="yellow" />
      </div>

      <!-- Upcoming Deadlines -->
      <div v-if="upcomingTasks.length > 0" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">⏰ Due Soon</h3>
          <RouterLink to="/tasks" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View all →</RouterLink>
        </div>
        <div class="space-y-2">
          <div v-for="task in upcomingTasks" :key="task.id"
            class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div class="flex items-center gap-3 min-w-0">
              <span :class="['w-2 h-2 rounded-full flex-shrink-0', task.isOverdue ? 'bg-red-500' : task.isToday ? 'bg-orange-500' : 'bg-blue-500']"></span>
              <div class="min-w-0">
                <p class="text-sm text-gray-900 dark:text-gray-100 truncate">{{ task.title }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ task.project }}</p>
              </div>
            </div>
            <span :class="['text-xs font-medium whitespace-nowrap ml-3', task.isOverdue ? 'text-red-600' : task.isToday ? 'text-orange-600' : 'text-gray-500 dark:text-gray-400']">
              {{ task.dueLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- ADMIN DASHBOARD -->
      <template v-if="stats.admin">
        <!-- Organization Overview -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Organization Overview</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon="👥" label="Total Users" :value="stats.admin.totalUsers" color="purple" />
            <StatCard icon="📁" label="Active Projects" :value="stats.admin.totalProjects" color="blue" />
            <StatCard icon="📊" label="Completion Rate" :value="stats.admin.completionRate + '%'" color="green" />
            <StatCard icon="🎫" label="Open Tickets" :value="stats.admin.openTickets" color="orange" />
            <StatCard icon="⏰" label="All Overdue" :value="stats.admin.overdueTasks" color="red" />
          </div>
        </div>

        <!-- Pending Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Pending Actions</h3>
            <div class="space-y-3">
              <PendingItem label="Leave Requests" :count="stats.admin.pendingLeave" icon="🏖️" />
              <PendingItem label="Expense Approvals" :count="stats.admin.pendingExpenses" icon="💰" />
              <PendingItem v-if="stats.media" label="Content Approvals" :count="stats.media.pendingApproval" icon="🎬" />
              <PendingItem v-if="stats.it" label="Critical Tickets" :count="stats.it.criticalTickets" icon="🚨" />
            </div>
          </div>

          <!-- Department Breakdown -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 lg:col-span-2">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Departments</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DeptCard
                v-for="d in stats.admin.departments"
                :key="d.department"
                :dept="d"
              />
            </div>
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
            <StatCard icon="👥" label="Team Members" :value="stats.manager.teamMembers" color="purple" />
            <StatCard icon="📁" label="Projects" :value="stats.manager.projects" color="blue" />
            <StatCard icon="📊" label="Completion" :value="stats.manager.completionRate + '%'" color="green" />
            <StatCard icon="📋" label="Pending Approvals" :value="stats.manager.pendingApprovals" color="orange" />
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

      <!-- Quick Actions (all users) -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RouterLink to="/tasks" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
            <span class="text-2xl">✅</span>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">My Tasks</span>
          </RouterLink>
          <RouterLink to="/notifications" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
            <span class="text-2xl">🔔</span>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Notifications</span>
          </RouterLink>
          <RouterLink to="/reports" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
            <span class="text-2xl">📊</span>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Reports</span>
          </RouterLink>
          <RouterLink to="/it" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
            <span class="text-2xl">🎫</span>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Support Ticket</span>
          </RouterLink>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/axios';
import StatCard from '@/components/dashboard/StatCard.vue';
import PendingItem from '@/components/dashboard/PendingItem.vue';
import DeptCard from '@/components/dashboard/DeptCard.vue';

const auth = useAuthStore();
const stats = ref<any>(null);
const loading = ref(true);
const upcomingTasks = ref<any[]>([]);

onMounted(async () => {
  try {
    const [dashRes, tasksRes] = await Promise.all([
      api.get('/dashboard/stats'),
      api.get('/tasks'),
    ]);
    stats.value = dashRes.data;

    // Process upcoming tasks (due within 7 days or overdue)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400000);
    upcomingTasks.value = (tasksRes.data || [])
      .filter((t: any) => t.status !== 'COMPLETED' && t.deadline)
      .map((t: any) => {
        const deadline = new Date(t.deadline);
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
        return {
          id: t.id,
          title: t.title,
          project: t.project?.name || '—',
          isOverdue: diffDays < 0,
          isToday: diffDays === 0,
          dueLabel: diffDays < 0 ? `${Math.abs(diffDays)}d overdue` : diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays}d left`,
          deadline,
        };
      })
      .filter((t: any) => t.isOverdue || t.deadline <= weekFromNow)
      .sort((a: any, b: any) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 5);
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
