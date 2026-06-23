<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create and manage users across all departments</p>
      </div>
      <button
        @click="openCreate"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <span>+</span> New User
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4 flex-shrink-0">
      <MiniStat label="Total" :value="stats.total" />
      <MiniStat label="Active" :value="stats.active" color="green" />
      <MiniStat label="Admins" :value="stats.admins" color="purple" />
      <MiniStat label="Managers" :value="stats.managers" color="blue" />
      <MiniStat label="Employees" :value="stats.employees" color="gray" />
      <MiniStat label="Inactive" :value="stats.total - stats.active" color="red" />
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-4 flex-shrink-0 flex-wrap">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name or email..."
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-56 focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <select v-model="filterRole" class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All Roles</option>
        <option value="ADMIN">Admin</option>
        <option value="MANAGER">Manager</option>
        <option value="EMPLOYEE">Employee</option>
      </select>
      <select v-model="filterDept" class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All Departments</option>
        <option value="MEDIA">Media</option>
        <option value="EVANGELISM">Evangelism</option>
        <option value="IT">IT</option>
        <option value="HR_FINANCE">HR / Finance</option>
      </select>
      <select v-model="filterStatus" class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Users table -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <div class="col-span-3">Name</div>
          <div class="col-span-3">Email</div>
          <div class="col-span-2">Role</div>
          <div class="col-span-2">Department</div>
          <div class="col-span-1">Status</div>
          <div class="col-span-1 text-right">Actions</div>
        </div>
        <div v-if="filteredUsers.length === 0" class="px-4 py-12 text-center text-sm text-gray-400">No users found.</div>
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors items-center"
        >
          <div class="col-span-3 flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
              {{ user.name.charAt(0) }}
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ user.name }}</span>
          </div>
          <div class="col-span-3 text-sm text-gray-600 dark:text-gray-300 truncate">{{ user.email }}</div>
          <div class="col-span-2">
            <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', roleColor(user.role)]">{{ user.role }}</span>
            <span v-if="getUserPermsCount(user) > 0" class="ml-1 text-xs text-gray-400" :title="getUserPermsCount(user) + ' permissions'">
              🔑{{ getUserPermsCount(user) }}
            </span>
          </div>
          <div class="col-span-2 text-sm text-gray-600 dark:text-gray-300">{{ formatDept(user.department) }}</div>
          <div class="col-span-1">
            <span :class="['inline-flex w-2 h-2 rounded-full mr-1', user.isActive ? 'bg-green-500' : 'bg-gray-300']"></span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ user.isActive ? 'Active' : 'Inactive' }}</span>
          </div>
          <div class="col-span-1 flex items-center justify-end gap-2">
            <button @click="openEdit(user)" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline" title="Edit">Edit</button>
            <button @click="openResetPassword(user)" class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Reset password">🔑</button>
            <button @click="toggleActive(user)" :class="['text-xs', user.isActive ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-600']" :title="user.isActive ? 'Deactivate' : 'Activate'">
              {{ user.isActive ? '🚫' : '✓' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showModal = false">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ editingId ? 'Edit User' : 'Create User' }}</h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input v-model="form.name" type="text" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input v-model="form.email" type="email" required
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div v-if="!editingId">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
            <input v-model="form.password" type="text" required minlength="8"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Min 8 characters" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
              <select v-model="form.role" required
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department {{ form.role !== 'ADMIN' ? '*' : '' }}
              </label>
              <select v-model="form.department" :disabled="form.role === 'ADMIN'" :required="form.role !== 'ADMIN'"
                class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50">
                <option value="">{{ form.role === 'ADMIN' ? 'N/A (all access)' : 'Select' }}</option>
                <option value="MEDIA">Media</option>
                <option value="EVANGELISM">Evangelism</option>
                <option value="IT">IT</option>
                <option value="HR_FINANCE">HR / Finance</option>
              </select>
            </div>
          </div>

          <!-- Permissions -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
            <div class="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-3">
              <div v-for="group in permissionGroups" :key="group.name">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{{ group.name }}</p>
                <div class="space-y-1">
                  <label v-for="perm in group.permissions" :key="perm.id"
                    class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1">
                    <input type="checkbox" :value="perm.id" v-model="form.permissions"
                      class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                    <span class="text-xs text-gray-700 dark:text-gray-300">{{ perm.label }}</span>
                  </label>
                </div>
              </div>
              <p v-if="availablePermissions.length === 0" class="text-xs text-gray-400 italic">Loading permissions...</p>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {{ form.permissions.length }} permission{{ form.permissions.length !== 1 ? 's' : '' }} selected
              <span v-if="form.role === 'ADMIN'" class="text-purple-500 ml-1">· Admins have full access regardless</span>
            </p>
          </div>

          <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" :disabled="submitting"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {{ submitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Create User') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="resetUser" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="resetUser = null">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Reset Password</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">for {{ resetUser.name }}</p>
        </div>
        <form @submit.prevent="handleResetPassword" class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password *</label>
            <input v-model="newPassword" type="text" required minlength="8"
              class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Min 8 characters" />
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" @click="resetUser = null"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" :disabled="submitting"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">Reset</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import MiniStat from '@/components/tasks/MiniStat.vue';

const users = ref<any[]>([]);
const stats = ref({ total: 0, active: 0, admins: 0, managers: 0, employees: 0 });
const loading = ref(true);
const searchQuery = ref('');
const filterRole = ref('');
const filterDept = ref('');
const filterStatus = ref('');

const showModal = ref(false);
const editingId = ref<string | null>(null);
const form = ref({ name: '', email: '', password: '', role: 'EMPLOYEE', department: '', permissions: [] as string[] });
const error = ref('');
const submitting = ref(false);

const resetUser = ref<any>(null);
const newPassword = ref('');

const availablePermissions = ref<any[]>([]);
const permissionGroups = computed(() => {
  const groups: Record<string, { name: string; permissions: any[] }> = {};
  for (const p of availablePermissions.value) {
    if (!groups[p.group]) groups[p.group] = { name: p.group, permissions: [] };
    groups[p.group].permissions.push(p);
  }
  return Object.values(groups);
});

const filteredUsers = computed(() => {
  let result = users.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (filterRole.value) result = result.filter(u => u.role === filterRole.value);
  if (filterDept.value) result = result.filter(u => u.department === filterDept.value);
  if (filterStatus.value === 'active') result = result.filter(u => u.isActive);
  if (filterStatus.value === 'inactive') result = result.filter(u => !u.isActive);
  return result;
});

function roleColor(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    MANAGER: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    EMPLOYEE: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  };
  return map[role] || 'bg-gray-100 text-gray-700';
}

function formatDept(d: string | null) {
  if (!d) return '—';
  const map: Record<string, string> = { MEDIA: 'Media', EVANGELISM: 'Evangelism', IT: 'IT', HR_FINANCE: 'HR / Finance' };
  return map[d] || d;
}

function getUserPermsCount(user: any): number {
  if (!user.permissions) return 0;
  try {
    const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    return Array.isArray(perms) ? perms.length : 0;
  } catch { return 0; }
}

function openCreate() {
  editingId.value = null;
  form.value = { name: '', email: '', password: '', role: 'EMPLOYEE', department: '', permissions: [] };
  error.value = '';
  showModal.value = true;
}

function openEdit(user: any) {
  editingId.value = user.id;
  const perms = user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : [];
  form.value = { name: user.name, email: user.email, password: '', role: user.role, department: user.department || '', permissions: perms };
  error.value = '';
  showModal.value = true;
}

function openResetPassword(user: any) {
  resetUser.value = user;
  newPassword.value = '';
}

async function handleSubmit() {
  error.value = '';
  submitting.value = true;
  try {
    const payload: any = {
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      department: form.value.role === 'ADMIN' ? null : (form.value.department || null),
      permissions: form.value.permissions,
    };
    if (editingId.value) {
      await api.patch(`/users/${editingId.value}`, payload);
    } else {
      payload.password = form.value.password;
      await api.post('/users', payload);
    }
    showModal.value = false;
    await fetchData();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to save user';
  } finally {
    submitting.value = false;
  }
}

async function handleResetPassword() {
  submitting.value = true;
  try {
    await api.post(`/users/${resetUser.value.id}/reset-password`, { newPassword: newPassword.value });
    resetUser.value = null;
  } catch (e: any) {
    console.error('Failed to reset password:', e);
  } finally {
    submitting.value = false;
  }
}

async function toggleActive(user: any) {
  try {
    await api.patch(`/users/${user.id}/toggle-active`);
    await fetchData();
  } catch (err) {
    console.error('Failed to toggle status:', err);
  }
}

async function fetchData() {
  try {
    const [usersRes, statsRes] = await Promise.all([
      api.get('/users?limit=200'),
      api.get('/users/stats'),
    ]);
    users.value = usersRes.data.data;
    stats.value = statsRes.data;
    // Load permissions separately (non-blocking)
    try {
      const permsRes = await api.get('/users/permissions');
      availablePermissions.value = permsRes.data;
    } catch {}
  } catch (err) {
    console.error('Failed to load users:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
