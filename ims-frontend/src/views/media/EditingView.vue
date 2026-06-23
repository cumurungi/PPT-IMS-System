<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Editing Management</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage editing projects and tasks</p>
      </div>
      <button
        v-if="isManager"
        @click="showCreateProjectModal = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <span>+</span> New Project
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-4 mb-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
      <button
        @click="activeTab = 'projects'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'projects'
            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        ]"
      >
        Projects
      </button>
      <button
        @click="activeTab = 'tasks'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'tasks'
            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        ]"
      >
        Tasks
      </button>
    </div>

    <!-- Projects Tab -->
    <div v-if="activeTab === 'projects'" class="flex-1 flex flex-col overflow-hidden">
      <!-- Stats -->
      <div class="grid grid-cols-5 gap-2 mb-4 flex-shrink-0">
        <StatCard icon="📊" label="Total" :value="stats.total" color="blue" />
        <StatCard icon="⏳" label="Pending" :value="stats.pending" color="orange" />
        <StatCard icon="🔄" label="In Progress" :value="stats.inProgress" color="blue" />
        <StatCard icon="✅" label="Completed" :value="stats.completed" color="green" />
        <StatCard icon="⏸️" label="On Hold" :value="stats.onHold" color="yellow" />
      </div>

      <!-- Filter -->
      <div class="flex items-center gap-3 mb-4 flex-shrink-0">
        <input
          v-model="projectSearch"
          type="text"
          placeholder="Search projects..."
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <select
          v-model="projectStatusFilter"
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loadingProjects" class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
      </div>

      <!-- Projects list -->
      <div v-else class="flex-1 overflow-y-auto">
        <div v-if="filteredProjects.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
          <p class="text-4xl mb-3">📋</p>
          <p class="text-sm">No projects found. Create one to get started.</p>
        </div>
        <div class="space-y-3">
          <div
            v-for="project in filteredProjects"
            :key="project.id"
            @click="selectProject(project)"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{{ project.title }}</h3>
                <p v-if="project.description" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {{ project.description }}
                </p>
              </div>
              <StatusBadge :status="project.status" />
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{{ project._count?.tasks || 0 }} tasks</span>
              <span>📅 {{ formatDate(project.deadline) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tasks Tab -->
    <div v-else-if="activeTab === 'tasks'" class="flex-1 flex flex-col overflow-hidden">
      <!-- Header with Create Button -->
      <div class="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Editing Tasks</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage tasks to edit videos and content</p>
        </div>
        <button
          v-if="isManager"
          @click="showCreateTaskModal = true"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <span>+</span> New Task
        </button>
      </div>

      <!-- Filter -->
      <div class="flex items-center gap-3 mb-4 flex-shrink-0">
        <input
          v-model="taskSearch"
          type="text"
          placeholder="Search tasks..."
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <select
          v-model="taskStatusFilter"
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
        <select
          v-model="taskPriorityFilter"
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loadingTasks" class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
      </div>

      <!-- Tasks list -->
      <div v-else class="flex-1 overflow-y-auto">
        <div v-if="filteredTasks.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
          <p class="text-4xl mb-3">✅</p>
          <p class="text-sm">No tasks found. Create one to assign editing work.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            @click="selectTask(task)"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{{ task.title }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  🗂️ {{ task.project?.title || 'No project' }}
                </p>
              </div>
              <StatusBadge :status="task.status" />
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <PriorityBadge :priority="task.priority" />
              <span>👤 {{ task.assignee?.name || 'Unassigned' }}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <div v-if="task.fileUrl" class="text-gray-500 dark:text-gray-400">
                📹 File attached
              </div>
              <div v-if="task.deadline" class="text-gray-500 dark:text-gray-400">
                📅 {{ formatDate(task.deadline) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Project Modal -->
    <div v-if="showCreateProjectModal" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showCreateProjectModal = false">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Project</h2>
        </div>
        <form @submit.prevent="createProject" class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              v-model="projectForm.title"
              type="text"
              required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Project title"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              v-model="projectForm.description"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Project description"
              rows="3"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline *</label>
            <input
              v-model="projectForm.deadline"
              type="datetime-local"
              required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="showCreateProjectModal = false"
              class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create Task Modal -->
    <div v-if="showCreateTaskModal" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showCreateTaskModal = false">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-screen overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Editing Task</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Assign a video to be edited</p>
        </div>
        <form @submit.prevent="createTask" class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project *</label>
            <select
              v-model="taskForm.projectId"
              required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select project</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              v-model="taskForm.title"
              type="text"
              required
              placeholder="e.g., Edit Sunday Service Video"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              v-model="taskForm.description"
              placeholder="What needs to be edited?"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              rows="2"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To *</label>
            <select
              v-model="taskForm.assigneeId"
              required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">— Select team member —</option>
              <option v-for="m in mediaMembers" :key="m.id" :value="m.id">{{ m.name }} ({{ m.role }})</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select
              v-model="taskForm.priority"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="LOW">🟢 Low</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HIGH">🔴 High</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
            <input
              v-model="taskForm.deadline"
              type="datetime-local"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video File URL</label>
            <input
              v-model="taskForm.fileUrl"
              type="url"
              placeholder="URL of the video to edit (from Media Library)"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 Upload video in Media Library first, then paste the URL here</p>
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="showCreateTaskModal = false"
              class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Task Detail Drawer -->
    <div v-if="selectedEditingTask" class="fixed inset-0 z-50 flex justify-end" @click.self="closeTaskDetail">
      <div class="absolute inset-0 bg-black/30" @click="closeTaskDetail"></div>
      <div class="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
        <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Details</h2>
          <button @click="closeTaskDetail" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
        </div>
        <div class="px-6 py-5 space-y-5">
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ selectedEditingTask.title }}</h3>
            <p v-if="selectedEditingTask.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ selectedEditingTask.description }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 uppercase">Status</label>
              <p class="mt-1"><StatusBadge :status="selectedEditingTask.status" /></p>
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 uppercase">Priority</label>
              <p class="mt-1"><PriorityBadge :priority="selectedEditingTask.priority" /></p>
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 uppercase">Assignee</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">{{ selectedEditingTask.assignee?.name || 'Unassigned' }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 uppercase">Project</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">{{ selectedEditingTask.project?.title || '—' }}</p>
            </div>
            <div v-if="selectedEditingTask.deadline">
              <label class="text-xs text-gray-500 dark:text-gray-400 uppercase">Deadline</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">{{ formatDate(selectedEditingTask.deadline) }}</p>
            </div>
          </div>
          <div v-if="selectedEditingTask.fileUrl">
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase">Video File</label>
            <a :href="selectedEditingTask.fileUrl" target="_blank" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-1 block truncate">
              {{ selectedEditingTask.fileUrl }}
            </a>
          </div>
          <!-- Status change buttons -->
          <div v-if="isManager">
            <label class="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2 block">Change Status</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']" :key="s"
                @click="updateTaskStatus(selectedEditingTask.id, s)"
                :class="['px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  selectedEditingTask.status === s
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300']">
                {{ s.replace('_', ' ') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getEditingProjects, getEditingTasks, createEditingProject, createEditingTask, getEditingStats } from '@/api/editing.api';
import api from '@/api/axios';
import StatusBadge from '@/components/media/StatusBadge.vue';
import PriorityBadge from '@/components/media/PriorityBadge.vue';
import StatCard from '@/components/dashboard/StatCard.vue';

const route = useRoute();

interface EditingProject {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  deadline: string;
  createdBy: { id: string; name: string };
  _count?: { tasks: number };
}

interface EditingTask {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline?: string;
  fileUrl?: string;
  project: { id: string; title: string };
  assignee: { id: string; name: string };
  _count?: { comments: number };
}

// State
const activeTab = ref<'projects' | 'tasks'>('projects');
const projects = ref<EditingProject[]>([]);
const tasks = ref<EditingTask[]>([]);
const stats = ref({ total: 0, pending: 0, inProgress: 0, completed: 0, onHold: 0 });
const loadingProjects = ref(false);
const loadingTasks = ref(false);
const showCreateProjectModal = ref(false);
const showCreateTaskModal = ref(false);
const mediaMembers = ref<any[]>([]);
const selectedProject = ref<EditingProject | null>(null);
const selectedEditingTask = ref<EditingTask | null>(null);

// Filters
const projectSearch = ref('');
const projectStatusFilter = ref('');
const taskSearch = ref('');
const taskStatusFilter = ref('');
const taskPriorityFilter = ref('');

// Forms
const projectForm = ref({
  title: '',
  description: '',
  deadline: '',
});

const taskForm = ref({
  projectId: '',
  title: '',
  description: '',
  assigneeId: '',
  priority: 'MEDIUM',
  deadline: '',
  fileUrl: '',
});

// Check if user is manager
const isManager = computed(() => {
  const userRole = localStorage.getItem('userRole');
  return userRole === 'MANAGER' || userRole === 'ADMIN';
});

// Filtered data
const filteredProjects = computed(() => {
  return projects.value.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(projectSearch.value.toLowerCase());
    const matchStatus = !projectStatusFilter.value || p.status === projectStatusFilter.value;
    return matchSearch && matchStatus;
  });
});

const filteredTasks = computed(() => {
  return tasks.value.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(taskSearch.value.toLowerCase());
    const matchStatus = !taskStatusFilter.value || t.status === taskStatusFilter.value;
    const matchPriority = !taskPriorityFilter.value || t.priority === taskPriorityFilter.value;
    return matchSearch && matchStatus && matchPriority;
  });
});

// Methods
const loadProjects = async () => {
  loadingProjects.value = true;
  try {
    projects.value = await getEditingProjects();
  } catch (error) {
    console.error('Failed to load projects:', error);
  } finally {
    loadingProjects.value = false;
  }
};

const loadTasks = async () => {
  loadingTasks.value = true;
  try {
    tasks.value = await getEditingTasks();
  } catch (error) {
    console.error('Failed to load tasks:', error);
  } finally {
    loadingTasks.value = false;
  }
};

const loadStats = async () => {
  try {
    stats.value = await getEditingStats();
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const createProject = async () => {
  try {
    await createEditingProject({
      title: projectForm.value.title,
      description: projectForm.value.description,
      deadline: projectForm.value.deadline,
    });
    showCreateProjectModal.value = false;
    projectForm.value = { title: '', description: '', deadline: '' };
    await loadProjects();
    await loadStats();
  } catch (error) {
    console.error('Failed to create project:', error);
  }
};

const createTask = async () => {
  try {
    await createEditingTask({
      projectId: taskForm.value.projectId,
      title: taskForm.value.title,
      description: taskForm.value.description,
      assigneeId: taskForm.value.assigneeId,
      priority: taskForm.value.priority as 'LOW' | 'MEDIUM' | 'HIGH',
      deadline: taskForm.value.deadline,
      fileUrl: taskForm.value.fileUrl,
    });
    showCreateTaskModal.value = false;
    taskForm.value = {
      projectId: '',
      title: '',
      description: '',
      assigneeId: '',
      priority: 'MEDIUM',
      deadline: '',
      fileUrl: '',
    };
    await loadTasks();
  } catch (error) {
    console.error('Failed to create task:', error);
  }
};

const selectProject = (project: EditingProject) => {
  selectedProject.value = project;
  // Switch to tasks tab filtered by this project
  activeTab.value = 'tasks';
  taskSearch.value = '';
};

const selectTask = (task: EditingTask) => {
  selectedEditingTask.value = task;
};

const closeTaskDetail = () => {
  selectedEditingTask.value = null;
};

const updateTaskStatus = async (taskId: string, newStatus: string) => {
  try {
    await api.patch(`/media/editing/tasks/${taskId}`, { status: newStatus });
    await loadTasks();
    if (selectedEditingTask.value?.id === taskId) {
      selectedEditingTask.value = { ...selectedEditingTask.value, status: newStatus as any };
    }
  } catch (error) {
    console.error('Failed to update task status:', error);
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const loadMediaMembers = async () => {
  try {
    const { data } = await api.get('/media/assignable-users');
    mediaMembers.value = data;
  } catch (error) {
    console.error('Failed to load team members:', error);
  }
};

// Lifecycle
onMounted(() => {
  loadProjects();
  loadTasks();
  loadStats();
  loadMediaMembers();
});
</script>
