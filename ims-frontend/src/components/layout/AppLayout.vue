<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors overflow-hidden">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="fixed inset-0 bg-black/50 z-40 lg:hidden" @click="sidebarOpen = false"></div>
    <aside :class="['w-64 bg-indigo-900 dark:bg-gray-800 text-white flex flex-col flex-shrink-0 fixed lg:relative inset-y-0 left-0 z-50 transform transition-transform lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']">
      <!-- Branding -->
      <div class="px-6 py-5 border-b border-indigo-700 dark:border-gray-700">
        <h1 class="text-xl font-bold">PPT IMS</h1>
        <p class="text-xs text-indigo-300 dark:text-gray-400 mt-0.5">Integrated Management System</p>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <!-- Section label -->
        <template v-for="section in navSections" :key="section.label">
          <p class="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 dark:text-gray-500 first:pt-1">
            {{ section.label }}
          </p>
          <RouterLink
            v-for="link in section.links"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-indigo-100 dark:text-gray-300 hover:bg-indigo-700 dark:hover:bg-gray-700 transition-colors relative"
            active-class="bg-indigo-700 dark:bg-gray-700 text-white font-medium"
          >
            <span class="w-5 text-center text-base leading-none">{{ link.icon }}</span>
            <span>{{ link.label }}</span>
            <!-- Unread notification badge -->
            <span v-if="link.to === '/notifications' && unreadNotifCount > 0"
              class="absolute right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
              {{ unreadNotifCount > 99 ? '99+' : unreadNotifCount }}
            </span>
            <!-- Unread messages badge -->
            <span v-if="link.to === '/messages' && unreadMsgCount > 0"
              class="absolute right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
              {{ unreadMsgCount > 99 ? '99+' : unreadMsgCount }}
            </span>
          </RouterLink>
        </template>
      </nav>

      <!-- User info -->
      <div class="px-4 py-4 border-t border-indigo-700 dark:border-gray-700">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-indigo-600 dark:bg-gray-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {{ auth.user?.name?.charAt(0) ?? '?' }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ auth.user?.name }}</p>
            <p class="text-xs text-indigo-300 dark:text-gray-400 truncate">
              {{ roleLabel }} · {{ deptLabel }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <RouterLink to="/profile"
            class="flex-1 text-xs text-indigo-300 dark:text-gray-400 hover:text-white py-1 text-center transition-colors">
            ⚙️ Profile
          </RouterLink>
          <button
            class="flex-1 text-xs text-indigo-300 dark:text-gray-400 hover:text-white py-1 text-center transition-colors"
            @click="handleLogout">
            ← Sign out
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm px-6 py-3 flex items-center justify-between flex-shrink-0 transition-colors">
        <div class="flex items-center gap-3">
          <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span class="text-base font-semibold text-gray-800 dark:text-gray-100">
            {{ currentPageTitle }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <!-- Global search -->
          <div class="relative hidden sm:block">
            <input
              v-model="globalSearch"
              @keyup.enter="performSearch"
              type="text"
              placeholder="Search..."
              class="w-48 lg:w-64 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none pl-8"
            />
            <svg class="absolute left-2.5 top-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <!-- Theme toggle -->
          <button
            @click="theme.toggle()"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <svg v-if="theme.isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { RouterView, RouterLink, useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import api from '@/api/axios';
import ToastNotification from '@/components/shared/ToastNotification.vue';

const auth = useAuthStore();
const theme = useThemeStore();
const router = useRouter();
const route = useRoute();
const unreadNotifCount = ref(0);
const unreadMsgCount = ref(0);
const sidebarOpen = ref(false);
const globalSearch = ref('');
function performSearch() {
  if (globalSearch.value.trim()) {
    router.push({ path: '/tasks', query: { search: globalSearch.value.trim() } });
    globalSearch.value = '';
  }
}

// Fetch unread notification count on mount and poll every 30s
async function fetchUnreadCount() {
  try {
    const { data } = await api.get('/notifications');
    unreadNotifCount.value = data.filter((n: any) => !n.isRead).length;
  } catch {}
}

async function fetchUnreadMessages() {
  try {
    const { data } = await api.get('/messages/conversations');
    unreadMsgCount.value = data.reduce((sum: number, c: any) => sum + (c.unread || 0), 0);
  } catch {}
}

onMounted(() => {
  fetchUnreadCount();
  fetchUnreadMessages();
  setInterval(fetchUnreadCount, 30000);
  setInterval(fetchUnreadMessages, 30000);
});

function handleLogout() {
  auth.logout();
  router.push('/login');
}

const role = computed(() => auth.user?.role ?? '');
const dept = computed(() => auth.user?.department ?? '');
const isAdmin = computed(() => role.value === 'ADMIN');

const roleLabel = computed(() => {
  const map: Record<string, string> = { ADMIN: 'Admin', MANAGER: 'Manager', EMPLOYEE: 'Employee' };
  return map[role.value] ?? role.value;
});

const deptLabel = computed(() => {
  const map: Record<string, string> = {
    MEDIA: 'Media', EVANGELISM: 'Evangelism', IT: 'IT', HR_FINANCE: 'HR / Finance',
  };
  return dept.value ? (map[dept.value] ?? dept.value) : 'All Departments';
});

// ─── Nav definition ──────────────────────────────────────────────────────────
// Each link has an optional `depts` array (which departments can see it) and
// an optional `roles` array. Admin always sees everything.

interface NavLink {
  to: string;
  icon: string;
  label: string;
  depts?: string[];   // if set, only these departments see it (+ admin)
  roles?: string[];   // if set, only these roles see it (+ admin)
}

const allLinks: NavLink[] = [
  // ── Common (everyone)
  { to: '/dashboard',     icon: '🏠', label: 'Dashboard' },
  { to: '/tasks',         icon: '✅', label: 'Tasks' },
  { to: '/projects',      icon: '📁', label: 'Projects' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/messages',      icon: '💬', label: 'Messages' },
  { to: '/reports',       icon: '📊', label: 'Reports' },
  { to: '/it',            icon: '🎫', label: 'IT Support' },

  // ── Department-specific
  { to: '/media',         icon: '🎥', label: 'Media',        depts: ['MEDIA'] },
  { to: '/evangelism',    icon: '📖', label: 'Evangelism',   depts: ['EVANGELISM'] },
  { to: '/hr',            icon: '👥', label: 'HR / Finance' },

  // ── Admin only
  { to: '/admin/users',      icon: '⚙️',  label: 'User Management', roles: ['ADMIN'] },
  { to: '/admin/audit-logs', icon: '📋', label: 'Audit Logs',       roles: ['ADMIN'] },
];

function canSee(link: NavLink): boolean {
  if (isAdmin.value) return true;
  if (link.roles && !link.roles.includes(role.value)) return false;
  if (link.depts && !link.depts.includes(dept.value)) return false;
  return true;
}

// Group links into labelled sections
const navSections = computed(() => {
  const visible = allLinks.filter(canSee);

  const common    = visible.filter(l => !l.depts && !l.roles);
  const deptLinks = visible.filter(l => l.depts);
  const adminLinks= visible.filter(l => l.roles);

  const sections = [];
  if (common.length)     sections.push({ label: 'General',    links: common });
  if (deptLinks.length)  sections.push({ label: 'Department', links: deptLinks });
  if (adminLinks.length) sections.push({ label: 'Admin',      links: adminLinks });
  return sections;
});

// Page title from current route
const currentPageTitle = computed(() => {
  const map: Record<string, string> = {
    '/dashboard':         'Dashboard',
    '/tasks':             'Tasks',
    '/projects':          'Projects',
    '/notifications':     'Notifications',
    '/reports':           'Reports',
    '/media':             'Media Department',
    '/evangelism':        'Evangelism Department',
    '/hr':                'HR / Finance Department',
    '/it':                'IT Department',
    '/admin/users':       'User Management',
    '/admin/audit-logs':  'Audit Logs',
    '/profile':           'My Profile',
  };
  return map[route.path] ?? 'IMS';
});
</script>
