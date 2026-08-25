<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex">
    
    <!-- Left Branding Panel -->
    <div class="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 py-16 text-white relative overflow-hidden">
      <div class="absolute inset-0 bg-black/10"></div>
      <div class="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
      
      <div class="relative z-10">
        <div class="flex items-center gap-4 mb-8">
          <img src="/logo.png" alt="PPT Logo" class="w-14 h-14 object-contain rounded-xl bg-white/10 p-1.5 shadow-lg" />
          <div>
            <h1 class="text-2xl font-bold tracking-tight">PPT IMS</h1>
            <p class="text-xs text-indigo-200 tracking-widest uppercase">Precious Present Truth</p>
          </div>
        </div>

        <h2 class="text-3xl font-bold mb-4 leading-tight">Integrated Management<br>System</h2>
        <p class="text-indigo-200 text-base mb-10 leading-relaxed max-w-md">
          Built for Precious Present Truth to bring evangelism, media, IT, and administration together in one system.
        </p>

        <div class="space-y-5">
          <div class="flex items-start gap-3">
            <span class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">📖</span>
            <div>
              <p class="font-medium text-sm">Evangelism & Sermons</p>
              <p class="text-xs text-indigo-200">Schedule, record, and manage ministry events with ease.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">🎬</span>
            <div>
              <p class="font-medium text-sm">Media & Production</p>
              <p class="text-xs text-indigo-200">Capture, edit, and prepare recordings for ministry outreach.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">🎫</span>
            <div>
              <p class="font-medium text-sm">IT & Publishing</p>
              <p class="text-xs text-indigo-200">Publish content, manage platforms, provide tech support, and keep systems running.</p>
            </div>
          </div>
        </div>

        <p class="mt-10 text-xs text-indigo-300 italic">"But the God of all grace, who hath called us unto his eternal glory by Christ Jesus, after that ye have suffered a while, make you perfect, stablish, strengthen, settle you." — 1 Peter 5:10 KJV</p>
        <!-- v3 -->
      </div>
    </div>

    <!-- Right Login Panel -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-md">
        
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-2 mb-8">
          <img src="/logo.png" alt="PPT Logo" class="w-9 h-9 object-contain rounded-lg bg-indigo-600 p-1" />
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">PPT IMS</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">Precious Present Truth</p>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 sm:p-10">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Welcome back</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to your account</p>
          
          <!-- Already logged in banner -->
          <div v-if="auth.isAuthenticated" class="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-green-800 dark:text-green-300">You are already signed in as <span class="font-semibold">{{ auth.user?.name }}</span></p>
              <p class="text-xs text-green-600 dark:text-green-400">{{ auth.user?.email }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="continueToDashboard" class="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Continue</button>
              <button @click="logout" class="text-xs border border-green-300 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/40">Sign out</button>
            </div>
          </div>

          <form v-else @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input v-model="form.email" type="email" required
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="you@preciouspresenttruth.org" />
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

          <!-- Theme toggle -->
          <div class="mt-6 text-center">
            <button @click="theme.toggle()" class="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              {{ theme.isDark ? '☀️ Light Mode' : '🌙 Dark Mode' }}
            </button>
          </div>
        </div>

        <p class="mt-6 text-center text-xs text-indigo-200">© {{ new Date().getFullYear() }} PPT IMS — Precious Present Truth</p>
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

function continueToDashboard() {
  router.push('/dashboard');
}

function logout() {
  auth.logout();
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
