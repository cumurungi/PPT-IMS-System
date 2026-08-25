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
        { path: '', redirect: '/login' },
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'tasks', name: 'tasks', component: () => import('@/views/TasksView.vue') },
        { path: 'projects', name: 'projects', component: () => import('@/views/ProjectsView.vue') },
        { 
          path: 'media', 
          name: 'media',
          component: () => import('@/views/MediaView.vue'),
          meta: { department: 'MEDIA' }
        },
        { path: 'evangelism', name: 'evangelism', component: () => import('@/views/EvangelismView.vue') },
        { path: 'hr', name: 'hr', component: () => import('@/views/HRView.vue') },
        { path: 'it', name: 'it', component: () => import('@/views/ITView.vue') },
        { path: 'reports', name: 'reports', component: () => import('@/views/ReportsView.vue') },
        { path: 'notifications', name: 'notifications', component: () => import('@/views/NotificationsView.vue') },
        { path: 'messages', name: 'messages', component: () => import('@/views/MessagesView.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
        { path: 'admin/users', name: 'admin-users', component: () => import('@/views/AdminUsersView.vue'), meta: { roles: ['ADMIN'] } },
        { path: 'admin/audit-logs', name: 'audit-logs', component: () => import('@/views/AuditLogsView.vue'), meta: { roles: ['ADMIN'] } },
        { path: 'admin/departments', name: 'admin-departments', component: () => import('@/views/DepartmentsView.vue'), meta: { roles: ['ADMIN'] } },
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
