import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth.api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const token = ref<string | null>(localStorage.getItem('ims_token'));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isManager = computed(() => user.value?.role === 'MANAGER' || user.value?.role === 'ADMIN');

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const { data } = await authApi.login(email, password);
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('ims_token', data.token);
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe() {
    if (!token.value) return;
    try {
      const { data } = await authApi.me();
      user.value = data;
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('ims_token');
  }

  return { user, token, loading, isAuthenticated, isAdmin, isManager, login, fetchMe, logout };
});
