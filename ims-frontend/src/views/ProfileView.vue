<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account settings</p>
    </div>

    <!-- Profile Info -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">Account Information</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">Name</label>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{{ auth.user?.name }}</p>
        </div>
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">Email</label>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{{ auth.user?.email }}</p>
        </div>
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">Role</label>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{{ auth.user?.role }}</p>
        </div>
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">Department</label>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{{ auth.user?.department || 'All Departments' }}</p>
        </div>
      </div>
    </div>

    <!-- Change Password -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">Change Password</h2>
      <form @submit.prevent="changePassword" class="space-y-4 max-w-sm">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
          <input v-model="passwords.current" type="password" required
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
          <input v-model="passwords.newPass" type="password" required minlength="8"
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
          <input v-model="passwords.confirm" type="password" required minlength="8"
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <p v-if="passError" class="text-sm text-red-600">{{ passError }}</p>
        <button type="submit" :disabled="saving"
          class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {{ saving ? 'Saving...' : 'Update Password' }}
        </button>
      </form>
    </div>

    <!-- Stats -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">My Activity</h2>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-2xl font-bold text-green-600">{{ myStats.completed }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-blue-600">{{ myStats.inProgress }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-red-600">{{ myStats.overdue }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import api from '@/api/axios';

const auth = useAuthStore();
const toast = useToast();
const saving = ref(false);
const passError = ref('');
const passwords = ref({ current: '', newPass: '', confirm: '' });
const myStats = ref({ completed: 0, inProgress: 0, overdue: 0 });

async function changePassword() {
  passError.value = '';
  if (passwords.value.newPass !== passwords.value.confirm) {
    passError.value = 'Passwords do not match';
    return;
  }
  saving.value = true;
  try {
    await api.post('/auth/change-password', {
      currentPassword: passwords.value.current,
      newPassword: passwords.value.newPass,
    });
    toast.success('Password updated successfully');
    passwords.value = { current: '', newPass: '', confirm: '' };
  } catch (e: any) {
    passError.value = e.response?.data?.message || 'Failed to change password';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/tasks/stats');
    myStats.value = {
      completed: data.completed || 0,
      inProgress: data.inProgress || 0,
      overdue: data.overdue || 0,
    };
  } catch {}
});
</script>
