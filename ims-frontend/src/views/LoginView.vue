<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Welcome back</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">Sign in to IMS</p>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input v-model="form.email" type="email" required
            class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="you@example.com" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input v-model="form.password" type="password" required
            class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="••••••••" />
        </div>
        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        <button type="submit" :disabled="auth.loading"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {{ auth.loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <!-- Forgot password -->
      <div class="mt-4">
        <button v-if="!showForgot" @click="showForgot = true" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          Forgot password?
        </button>
        <div v-else class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
          <p class="text-sm text-gray-700 dark:text-gray-300">Enter your email to request a password reset from your administrator.</p>
          <input v-model="resetEmail" type="email" placeholder="Your email address"
            class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          <div class="flex gap-2">
            <button @click="requestReset" :disabled="!resetEmail || resetSending"
              class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg">
              {{ resetSending ? 'Sending...' : 'Request Reset' }}
            </button>
            <button @click="showForgot = false" class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
          </div>
          <p v-if="resetMessage" :class="['text-xs', resetSuccess ? 'text-green-600' : 'text-red-600']">{{ resetMessage }}</p>
        </div>
      </div>

      <!-- Theme toggle on login page -->
      <div class="mt-6 text-center">
        <button @click="theme.toggle()" class="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          {{ theme.isDark ? '☀️ Light Mode' : '🌙 Dark Mode' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import api from '@/api/axios';

const auth = useAuthStore();
const theme = useThemeStore();
const router = useRouter();
const form = ref({ email: '', password: '' });
const error = ref('');
const showForgot = ref(false);
const resetEmail = ref('');
const resetSending = ref(false);
const resetMessage = ref('');
const resetSuccess = ref(false);

async function handleLogin() {
  error.value = '';
  try {
    await auth.login(form.value.email, form.value.password);
    router.push('/dashboard');
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Login failed';
  }
}

async function requestReset() {
  resetSending.value = true;
  resetMessage.value = '';
  try {
    await api.post('/auth/forgot-password', { email: resetEmail.value });
    resetSuccess.value = true;
    resetMessage.value = 'Reset request sent. Your admin will be notified to reset your password.';
  } catch (e: any) {
    resetSuccess.value = false;
    resetMessage.value = e.response?.data?.message || 'Failed to send reset request';
  } finally {
    resetSending.value = false;
  }
}
</script>
