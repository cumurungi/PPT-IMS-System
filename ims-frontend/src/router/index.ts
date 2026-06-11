import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'tasks', name: 'tasks', component: () => import('@/views/TasksView.vue') },
        { path: 'projects', name: 'projects', component: () => import('@/views/ProjectsView.vue') },
        { path: 'media', redirect: '/media/recordings' },
        { path: 'media/recordings', name: 'recordings', component: () => import('@/views/media/RecordingsView.vue') },
        { path: 'media/library', name: 'media-library', component: () => import('@/views/media/MediaLibraryView.vue') },
        { path: 'evangelism', name: 'evangelism', component: () => import('@/views/EvangelismView.vue') },
        { path: 'hr', name: 'hr', component: () => import('@/views/HRView.vue') },
        { path: 'it', name: 'it', component: () => import('@/views/ITView.vue') },
        { path: 'reports', name: 'reports', component: () => import('@/views/ReportsView.vue') },
        { path: 'notifications', name: 'notifications', component: () => import('@/views/NotificationsView.vue') },
        { path: 'admin/users', name: 'admin-users', component: () => import('@/views/AdminUsersView.vue'), meta: { roles: ['ADMIN'] } },
        { path: 'admin/audit-logs', name: 'audit-logs', component: () => import('@/views/AuditLogsView.vue'), meta: { roles: ['ADMIN'] } },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { public: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.isAuthenticated) {
    if (!auth.token) return { name: 'login' };
    await auth.fetchMe();
    if (!auth.isAuthenticated) return { name: 'login' };
  }
  return true;
});

export default router;
