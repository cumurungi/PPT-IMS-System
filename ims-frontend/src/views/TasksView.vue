<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ auth.user?.role === 'ADMIN' ? 'All tasks across departments' : 'Your department tasks' }}
        </p>
      </div>
      <button
        v-if="auth.isManager"
        @click="showCreateModal = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <span>+</span> New Task
      </button>
    </div>

    <!-- Toolbar: View toggle + Filters -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <!-- View toggle -->
      <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          @click="viewMode = 'list'"
          :class="[viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : '', 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-all']"
        >☰ List</button>
        <button
          @click="viewMode = 'board'"
          :class="[viewMode === 'board' ? 'bg-white dark:bg-gray-700 shadow-sm' : '', 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-all']"
        >▦ Board</button>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tasks..."
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <select
          v-model="filterStatus"
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <select
          v-if="auth.user?.role === 'ADMIN'"
          v-model="filterDept"
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Departments</option>
          <option value="MEDIA">Media</option>
          <option value="EVANGELISM">Evangelism</option>
          <option value="IT">IT</option>
          <option value="HR_FINANCE">HR / Finance</option>
        </select>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="grid grid-cols-6 gap-2 mb-4 flex-shrink-0">
      <MiniStat label="Total" :value="taskStats.total" />
      <MiniStat label="To Do" :value="taskStats.todo" color="gray" />
      <MiniStat label="In Progress" :value="taskStats.inProgress" color="blue" />
      <MiniStat label="In Review" :value="taskStats.inReview" color="yellow" />
      <MiniStat label="Completed" :value="taskStats.completed" color="green" />
      <MiniStat label="Overdue" :value="taskStats.overdue" color="red" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- LIST VIEW -->
    <div v-else-if="viewMode === 'list'" class="flex-1 overflow-y-auto">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Table header -->
        <div class="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <div class="col-span-4">Task</div>
          <div class="col-span-2">Project</div>
          <div class="col-span-2">Assignee</div>
          <div class="col-span-1">Status</div>
          <div class="col-span-1">Priority</div>
          <div class="col-span-1">Due</div>
          <div class="col-span-1">Actions</div>
        </div>
        <!-- Empty state -->
        <div v-if="filteredTasks.length === 0" class="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          No tasks found. {{ auth.isManager ? 'Create one to get started.' : '' }}
        </div>
        <!-- Task rows -->
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors items-center"
          @click="openTask(task)"
        >
          <div class="col-span-4">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ task.title }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ task.description }}</p>
          </div>
          <div class="col-span-2">
            <span class="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ task.project?.name }}</span>
          </div>
          <div class="col-span-2 flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
              {{ task.assignee?.name?.charAt(0) }}
            </div>
            <span class="text-xs text-gray-700 dark:text-gray-300 truncate">{{ task.assignee?.name }}</span>
          </div>
          <div class="col-span-1">
            <StatusBadge :status="task.status" />
          </div>
          <div class="col-span-1">
            <span :class="['text-xs font-medium', isOverdue(task) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400']">
              {{ isOverdue(task) ? '⚠️' : '' }}
            </span>
          </div>
          <div class="col-span-1">
            <span :class="['text-xs', isOverdue(task) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400']">
              {{ formatDate(task.deadline) }}
            </span>
          </div>
          <div class="col-span-1 flex items-center gap-1">
            <span v-if="task._count?.comments" class="text-xs text-gray-400">💬{{ task._count.comments }}</span>
            <span v-if="task._count?.attachments" class="text-xs text-gray-400">📎{{ task._count.attachments }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- BOARD VIEW (Kanban) -->
    <div v-else-if="viewMode === 'board'" class="flex-1 overflow-x-auto">
      <div class="flex gap-4 h-full min-w-max pb-4">
        <KanbanColumn
          v-for="col in boardColumns"
          :key="col.status"
          :title="col.title"
          :status="col.status"
          :color="col.color"
          :tasks="getTasksByStatus(col.status)"
          @open="openTask"
          @update-status="updateTaskStatus"
        />
      </div>
    </div>

    <!-- Task Detail Drawer -->
    <TaskDrawer
      v-if="selectedTask"
      :task="selectedTask"
      @close="selectedTask = null"
      @updated="refreshTasks"
    />

    <!-- Create Task Modal -->
    <CreateTaskModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="refreshTasks"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/axios';
import StatusBadge from '@/components/tasks/StatusBadge.vue';
import MiniStat from '@/components/tasks/MiniStat.vue';
import KanbanColumn from '@/components/tasks/KanbanColumn.vue';
import TaskDrawer from '@/components/tasks/TaskDrawer.vue';
import CreateTaskModal from '@/components/tasks/CreateTaskModal.vue';

const auth = useAuthStore();
const tasks = ref<any[]>([]);
const taskStats = ref({ total: 0, todo: 0, inProgress: 0, inReview: 0, completed: 0, blocked: 0, overdue: 0 });
const loading = ref(true);
const viewMode = ref<'list' | 'board'>('list');
const searchQuery = ref('');
const filterStatus = ref('');
const filterDept = ref('');
const selectedTask = ref<any>(null);
const showCreateModal = ref(false);

const boardColumns = [
  { status: 'TODO', title: 'To Do', color: 'gray' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: 'blue' },
  { status: 'IN_REVIEW', title: 'In Review', color: 'yellow' },
  { status: 'COMPLETED', title: 'Completed', color: 'green' },
  { status: 'BLOCKED', title: 'Blocked', color: 'red' },
];

const filteredTasks = computed(() => {
  let result = tasks.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }
  if (filterStatus.value) {
    result = result.filter(t => t.status === filterStatus.value);
  }
  if (filterDept.value) {
    result = result.filter(t => t.project?.department === filterDept.value);
  }
  return result;
});

function getTasksByStatus(status: string) {
  return filteredTasks.value.filter(t => t.status === status);
}

function isOverdue(task: any) {
  return task.status !== 'COMPLETED' && new Date(task.deadline) < new Date();
}

function formatDate(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < -1) return `${Math.abs(diff)}d overdue`;
  if (diff <= 7) return `${diff}d left`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function fetchTasks() {
  try {
    const [tasksRes, statsRes] = await Promise.all([
      api.get('/tasks'),
      api.get('/tasks/stats'),
    ]);
    tasks.value = tasksRes.data;
    taskStats.value = statsRes.data;
  } catch (err) {
    console.error('Failed to load tasks:', err);
  } finally {
    loading.value = false;
  }
}

function openTask(task: any) {
  selectedTask.value = task;
}

async function updateTaskStatus(taskId: string, newStatus: string) {
  try {
    await api.patch(`/tasks/${taskId}`, { status: newStatus });
    await fetchTasks();
  } catch (err) {
    console.error('Failed to update task:', err);
  }
}

async function refreshTasks() {
  showCreateModal.value = false;
  selectedTask.value = null;
  loading.value = true;
  await fetchTasks();
}

onMounted(fetchTasks);
</script>
