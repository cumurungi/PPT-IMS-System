<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ auth.user?.role === 'ADMIN' ? 'All projects across departments' : 'Your department projects' }}
        </p>
      </div>
      <button
        v-if="auth.isManager"
        @click="showCreateModal = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <span>+</span> New Project
      </button>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          @click="viewMode = 'grid'"
          :class="[viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : '', 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-all']"
        >▦ Grid</button>
        <button
          @click="viewMode = 'list'"
          :class="[viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : '', 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-all']"
        >☰ List</button>
      </div>

      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search projects..."
          class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
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

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- GRID VIEW -->
    <div v-else-if="viewMode === 'grid'" class="flex-1 overflow-y-auto">
      <div v-if="filteredProjects.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">📁</p>
        <p class="text-sm">No projects found. {{ auth.isManager ? 'Create one to get started.' : '' }}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow cursor-pointer group"
          @click="openProject(project)"
        >
          <!-- Project header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                {{ project.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ project.description }}</p>
            </div>
            <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', deptColor(project.department)]">
              {{ formatDept(project.department) }}
            </span>
          </div>

          <!-- Progress bar -->
          <div class="mb-3">
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span class="font-medium">{{ project.progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                :class="['h-2 rounded-full transition-all', progressColor(project.progress)]"
                :style="{ width: project.progress + '%' }"
              ></div>
            </div>
          </div>

          <!-- Task breakdown mini chart -->
          <div class="flex gap-1 mb-3 h-1.5">
            <div
              v-if="project.statusBreakdown.COMPLETED"
              class="bg-green-500 rounded-full"
              :style="{ flex: project.statusBreakdown.COMPLETED }"
            ></div>
            <div
              v-if="project.statusBreakdown.IN_PROGRESS"
              class="bg-blue-500 rounded-full"
              :style="{ flex: project.statusBreakdown.IN_PROGRESS }"
            ></div>
            <div
              v-if="project.statusBreakdown.IN_REVIEW"
              class="bg-yellow-500 rounded-full"
              :style="{ flex: project.statusBreakdown.IN_REVIEW }"
            ></div>
            <div
              v-if="project.statusBreakdown.TODO"
              class="bg-gray-300 dark:bg-gray-600 rounded-full"
              :style="{ flex: project.statusBreakdown.TODO }"
            ></div>
            <div
              v-if="project.statusBreakdown.BLOCKED"
              class="bg-red-500 rounded-full"
              :style="{ flex: project.statusBreakdown.BLOCKED }"
            ></div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-3">
              <span>✅ {{ project.completedTasks }}/{{ project.taskCount }} tasks</span>
            </div>
            <span :class="isOverdue(project) ? 'text-red-600 dark:text-red-400 font-medium' : ''">
              📅 {{ formatDate(project.deadline) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- LIST VIEW -->
    <div v-else-if="viewMode === 'list'" class="flex-1 overflow-y-auto">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <div class="col-span-3">Project</div>
          <div class="col-span-2">Department</div>
          <div class="col-span-2">Progress</div>
          <div class="col-span-2">Tasks</div>
          <div class="col-span-1">Owner</div>
          <div class="col-span-2">Deadline</div>
        </div>
        <div v-if="filteredProjects.length === 0" class="px-4 py-12 text-center text-sm text-gray-400">No projects found.</div>
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors items-center"
          @click="openProject(project)"
        >
          <div class="col-span-3">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ project.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ project.description }}</p>
          </div>
          <div class="col-span-2">
            <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', deptColor(project.department)]">
              {{ formatDept(project.department) }}
            </span>
          </div>
          <div class="col-span-2">
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div :class="['h-2 rounded-full', progressColor(project.progress)]" :style="{ width: project.progress + '%' }"></div>
              </div>
              <span class="text-xs text-gray-600 dark:text-gray-300 font-medium w-8 text-right">{{ project.progress }}%</span>
            </div>
          </div>
          <div class="col-span-2 text-sm text-gray-600 dark:text-gray-300">
            {{ project.completedTasks }}/{{ project.taskCount }}
          </div>
          <div class="col-span-1 text-xs text-gray-600 dark:text-gray-300 truncate">
            {{ project.createdBy?.name }}
          </div>
          <div class="col-span-2">
            <span :class="['text-xs', isOverdue(project) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400']">
              {{ formatDate(project.deadline) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Detail Drawer -->
    <ProjectDrawer
      v-if="selectedProject"
      :project-id="selectedProject.id"
      @close="selectedProject = null"
    />

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="refreshProjects"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/axios';
import ProjectDrawer from '@/components/projects/ProjectDrawer.vue';
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue';

const auth = useAuthStore();
const projects = ref<any[]>([]);
const loading = ref(true);
const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const filterDept = ref('');
const selectedProject = ref<any>(null);
const showCreateModal = ref(false);

const filteredProjects = computed(() => {
  let result = projects.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (filterDept.value) {
    result = result.filter(p => p.department === filterDept.value);
  }
  return result;
});

function isOverdue(project: any) {
  return project.progress < 100 && new Date(project.deadline) < new Date();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDept(d: string) {
  const map: Record<string, string> = { MEDIA: 'Media', EVANGELISM: 'Evangelism', IT: 'IT', HR_FINANCE: 'HR/Finance' };
  return map[d] || d;
}

function deptColor(d: string) {
  const map: Record<string, string> = {
    MEDIA: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    EVANGELISM: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    IT: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    HR_FINANCE: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  };
  return map[d] || 'bg-gray-100 text-gray-700';
}

function progressColor(progress: number) {
  if (progress >= 75) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-yellow-500';
  return 'bg-gray-400';
}

function openProject(project: any) {
  selectedProject.value = project;
}

async function fetchProjects() {
  try {
    const { data } = await api.get('/projects');
    projects.value = data;
  } catch (err) {
    console.error('Failed to load projects:', err);
  } finally {
    loading.value = false;
  }
}

async function refreshProjects() {
  showCreateModal.value = false;
  loading.value = true;
  await fetchProjects();
}

onMounted(fetchProjects);
</script>
