<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
    <!-- Sidebar -->
    <aside class="w-64 bg-indigo-900 dark:bg-gray-800 text-white flex flex-col flex-shrink-0">
      <div class="px-6 py-5 border-b border-indigo-700 dark:border-gray-700">
        <h1 class="text-xl font-bold">IMS</h1>
        <p class="text-xs text-indigo-300 dark:text-gray-400 mt-0.5">Management System</p>
      </div>
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="block px-3 py-2 rounded text-sm text-indigo-100 hover:bg-indigo-700 dark:hover:bg-gray-700 transition-colors"
          active-class="bg-indigo-700 dark:bg-gray-700 text-white"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <div class="px-4 py-3 border-t border-indigo-700 dark:border-gray-700 text-xs">
        <p>{{ auth.user?.name }}</p>
        <p class="text-indigo-300 dark:text-gray-400">{{ auth.user?.role }} · {{ auth.user?.department || 'All' }}</p>
        <button class="mt-2 text-indigo-300 dark:text-gray-400 hover:text-white" @click="handleLogout">Sign out</button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm px-6 py-3 flex items-center justify-between flex-shrink-0 transition-colors">
        <span class="text-lg font-semibold text-gray-800 dark:text-gray-100">Integrated Management System</span>
        <div class="flex items-center gap-4">
          <!-- Theme toggle -->
          <button
            @click="theme.toggle()"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <!-- Sun icon (shown in dark mode) -->
            <svg v-if="theme.isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <!-- Moon icon (shown in light mode) -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ auth.user?.role }}</span>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView, RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';

const auth = useAuthStore();
const theme = useThemeStore();
const router = useRouter();

function handleLogout() {
  auth.logout();
  router.push('/login');
}

const links = [
  { to: '/dashboard', label: '🏠 Dashboard' },
  { to: '/tasks', label: '✅ Tasks' },
  { to: '/projects', label: '📁 Projects' },
  { to: '/media/recordings', label: '🎬 Recordings' },
  { to: '/media/library', label: '🗃️ Media Library' },
  { to: '/evangelism', label: '📅 Evangelism' },
  { to: '/hr', label: '👥 HR / Finance' },
  { to: '/it', label: '🎫 IT' },
  { to: '/reports', label: '📊 Reports' },
  { to: '/notifications', label: '🔔 Notifications' },
  { to: '/admin/users', label: '⚙️ Users (Admin)' },
  { to: '/admin/audit-logs', label: '📋 Audit Logs' },
];
</script>
