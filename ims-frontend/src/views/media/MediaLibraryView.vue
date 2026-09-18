<template>
  <div class="h-full flex flex-col">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Sermon List</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          One shared production record: Evangelism creates it, Media records and edits it, IT publishes it.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 flex-shrink-0">
      <MiniStat label="Total" :value="stats.total" />
      <MiniStat label="Rendered" :value="stats.rendered" color="green" />
      <MiniStat label="YouTube" :value="stats.youtube" color="red" />
      <MiniStat label="Website" :value="stats.website" color="blue" />
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-4 flex-shrink-0">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search title, serie, preacher, language..."
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-72 focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <input
        v-model="filterLanguage"
        type="text"
        placeholder="Language"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-40 focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <select
        v-model="filterRendered"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        <option value="">Rendered: all</option>
        <option value="true">Rendered</option>
        <option value="false">Not rendered</option>
      </select>
      <DateFilter v-model:month="filterMonth" v-model:year="filterYear" />
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <div v-else-if="paginatedItems.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <p class="text-sm">No sermons found.</p>
    </div>

    <div v-else class="flex-1 overflow-auto -mx-6 px-6">
      <div class="min-w-[1180px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300">
            <tr>
              <th class="px-4 py-3 font-semibold">Title</th>
              <th class="px-4 py-3 font-semibold">Serie</th>
              <th class="px-4 py-3 font-semibold">Preacher</th>
              <th class="px-4 py-3 font-semibold">Language</th>
              <th class="px-4 py-3 font-semibold">Shooting</th>
              <th class="px-4 py-3 font-semibold">Editing</th>
              <th class="px-4 py-3 font-semibold">Storage</th>
              <th class="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="sermon in paginatedItems" :key="sermon.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="px-4 py-3 align-top">
                <p class="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[220px]">{{ sermon.title }}</p>
                <p v-if="sermon.event?.title" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ sermon.event.title }}</p>
              </td>
              <td class="px-4 py-3 align-top text-gray-700 dark:text-gray-200">{{ sermon.series || '-' }}</td>
              <td class="px-4 py-3 align-top text-gray-700 dark:text-gray-200">{{ sermon.preacher || '-' }}</td>
              <td class="px-4 py-3 align-top text-gray-700 dark:text-gray-200">{{ sermon.language || '-' }}</td>
              <td class="px-4 py-3 align-top">
                <p class="text-gray-700 dark:text-gray-200">{{ formatDate(sermon.recordingDate) }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Camera: {{ sermon.cameraman || sermon.recordingAssignee?.name || '-' }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Storage: {{ sermon.shootingStorage || sermon.storageLocation || '-' }}</p>
              </td>
              <td class="px-4 py-3 align-top">
                <p class="text-gray-700 dark:text-gray-200">Editor: {{ sermon.editor?.name || '-' }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reviser: {{ sermon.reviser || '-' }}</p>
                <span :class="['inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium', sermon.rendered ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300']">
                  {{ sermon.rendered ? 'Rendered' : 'Not rendered' }}
                </span>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <a :class="storageClass(sermon.youtubeUrl)" :href="sermon.youtubeUrl || undefined" target="_blank">YouTube</a>
                  <a :class="storageClass(sermon.cloudUrl)" :href="sermon.cloudUrl || undefined" target="_blank">Cloud</a>
                  <a :class="storageClass(sermon.appUrl)" :href="sermon.appUrl || undefined" target="_blank">App</a>
                  <a :class="storageClass(sermon.websiteUrl)" :href="sermon.websiteUrl || undefined" target="_blank">Website</a>
                </div>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="flex justify-end gap-2">
                  <button class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline" @click="openEdit(sermon)">Edit</button>
                  <button class="text-xs font-medium text-red-600 dark:text-red-400 hover:underline" @click="deleteSermon(sermon)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination :page="page" :page-size="12" :total="total" @change="setPage" />
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ editingId ? 'Edit Sermon' : 'Add Sermon' }}</h2>
          <button class="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" @click="closeForm">Close</button>
        </div>

        <form class="p-5 space-y-5" @submit.prevent="saveSermon">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label class="text-sm">
              <span class="block text-gray-600 dark:text-gray-300 mb-1">Title</span>
              <input v-model="form.title" required class="form-input" />
            </label>
            <label class="text-sm">
              <span class="block text-gray-600 dark:text-gray-300 mb-1">Serie</span>
              <input v-model="form.series" class="form-input" />
            </label>
            <label class="text-sm">
              <span class="block text-gray-600 dark:text-gray-300 mb-1">Preacher</span>
              <input v-model="form.preacher" class="form-input" />
            </label>
            <label class="text-sm">
              <span class="block text-gray-600 dark:text-gray-300 mb-1">Language</span>
              <input v-model="form.language" class="form-input" />
            </label>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Shooting</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label class="text-sm">
                <span class="block text-gray-600 dark:text-gray-300 mb-1">Date</span>
                <input v-model="form.recordingDate" type="date" required class="form-input" />
              </label>
              <label class="text-sm">
                <span class="block text-gray-600 dark:text-gray-300 mb-1">Cameraman</span>
                <input v-model="form.cameraman" class="form-input" />
              </label>
              <label class="text-sm">
                <span class="block text-gray-600 dark:text-gray-300 mb-1">Storage</span>
                <input v-model="form.shootingStorage" class="form-input" />
              </label>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Editing</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label class="text-sm">
                <span class="block text-gray-600 dark:text-gray-300 mb-1">Editor</span>
                <select v-model="form.editorId" class="form-input">
                  <option value="">Not assigned</option>
                  <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
                </select>
              </label>
              <label class="text-sm">
                <span class="block text-gray-600 dark:text-gray-300 mb-1">Reviser</span>
                <input v-model="form.reviser" class="form-input" />
              </label>
              <label class="flex items-end gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input v-model="form.rendered" type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span class="pb-2">Rendered</span>
              </label>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Storage</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label class="text-sm">
                <span class="block text-gray-600 dark:text-gray-300 mb-1">YouTube</span>
                <input v-model="form.youtubeUrl" class="form-input" />
              </label>
              <label class="text-sm">
                <span class="block text-gray-600 dark:text-gray-300 mb-1">Cloud</span>
                <input v-model="form.cloudUrl" class="form-input" />
              </label>
              <label class="text-sm">
                <span class="block text-gray-600 dark:text-gray-300 mb-1">App</span>
                <input v-model="form.appUrl" class="form-input" />
              </label>
              <label class="text-sm">
                <span class="block text-gray-600 dark:text-gray-300 mb-1">Website</span>
                <input v-model="form.websiteUrl" class="form-input" />
              </label>
            </div>
          </div>

          <p v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>

          <div class="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" @click="closeForm">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
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
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';

type SermonForm = {
  title: string;
  series: string;
  preacher: string;
  language: string;
  recordingDate: string;
  cameraman: string;
  shootingStorage: string;
  editorId: string;
  reviser: string;
  rendered: boolean;
  youtubeUrl: string;
  cloudUrl: string;
  appUrl: string;
  websiteUrl: string;
};

const sermons = ref<any[]>([]);
const users = ref<any[]>([]);
const loading = ref(true);
const saving = ref(false);
const showForm = ref(false);
const editingId = ref<string | null>(null);
const formError = ref('');
const searchQuery = ref('');
const filterRendered = ref('');
const filterLanguage = ref('');

const emptyForm = (): SermonForm => ({
  title: '',
  series: '',
  preacher: '',
  language: '',
  recordingDate: new Date().toISOString().slice(0, 10),
  cameraman: '',
  shootingStorage: '',
  editorId: '',
  reviser: '',
  rendered: false,
  youtubeUrl: '',
  cloudUrl: '',
  appUrl: '',
  websiteUrl: '',
});

const form = ref<SermonForm>(emptyForm());

const filteredSermons = computed(() => {
  let result = sermons.value;
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((sermon) =>
      [
        sermon.title,
        sermon.series,
        sermon.preacher,
        sermon.language,
        sermon.cameraman,
        sermon.shootingStorage,
        sermon.editor?.name,
        sermon.reviser,
        sermon.youtubeUrl,
        sermon.cloudUrl,
        sermon.appUrl,
        sermon.websiteUrl,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }
  if (filterLanguage.value) {
    const language = filterLanguage.value.toLowerCase();
    result = result.filter((sermon) => String(sermon.language || '').toLowerCase().includes(language));
  }
  if (filterRendered.value !== '') result = result.filter((sermon) => String(sermon.rendered) === filterRendered.value);
  return result;
});

const stats = computed(() => ({
  total: filteredSermons.value.length,
  rendered: filteredSermons.value.filter((sermon) => sermon.rendered).length,
  youtube: filteredSermons.value.filter((sermon) => sermon.youtubeUrl).length,
  website: filteredSermons.value.filter((sermon) => sermon.websiteUrl).length,
}));

const { page, filterMonth, filterYear, total, paginatedItems, setPage } = usePagination(() => filteredSermons.value, 12);

function storageClass(value: string | null | undefined) {
  return value
    ? 'font-medium text-indigo-600 dark:text-indigo-400 hover:underline'
    : 'text-gray-400 dark:text-gray-500 pointer-events-none';
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toDateInput(value: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function openCreate() {
  editingId.value = null;
  form.value = emptyForm();
  formError.value = '';
  showForm.value = true;
}

function openEdit(sermon: any) {
  editingId.value = sermon.id;
  form.value = {
    title: sermon.title || '',
    series: sermon.series || '',
    preacher: sermon.preacher || '',
    language: sermon.language || '',
    recordingDate: toDateInput(sermon.recordingDate),
    cameraman: sermon.cameraman || sermon.recordingAssignee?.name || '',
    shootingStorage: sermon.shootingStorage || sermon.storageLocation || '',
    editorId: sermon.editorId || sermon.editor?.id || '',
    reviser: sermon.reviser || '',
    rendered: Boolean(sermon.rendered),
    youtubeUrl: sermon.youtubeUrl || '',
    cloudUrl: sermon.cloudUrl || '',
    appUrl: sermon.appUrl || '',
    websiteUrl: sermon.websiteUrl || '',
  };
  formError.value = '';
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  formError.value = '';
}

async function fetchSermons() {
  loading.value = true;
  try {
    const { data } = await api.get('/media/files');
    sermons.value = data;
  } catch (err) {
    console.error('Failed to load sermons:', err);
  } finally {
    loading.value = false;
  }
}

async function fetchUsers() {
  try {
    const { data } = await api.get('/users', { params: { limit: 200 } });
    users.value = Array.isArray(data) ? data : data.users || [];
  } catch {
    users.value = [];
  }
}

async function saveSermon() {
  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      ...form.value,
      storageLocation: form.value.shootingStorage,
      durationSeconds: 0,
      format: 'MP4',
    };

    if (editingId.value) {
      await api.patch(`/media/files/${editingId.value}`, payload);
    } else {
      await api.post('/media/files', payload);
    }
    closeForm();
    await fetchSermons();
  } catch (err: any) {
    formError.value = err?.response?.data?.message || 'Could not save sermon.';
  } finally {
    saving.value = false;
  }
}

async function deleteSermon(sermon: any) {
  if (!confirm(`Delete "${sermon.title}"?`)) return;
  try {
    await api.delete(`/media/files/${sermon.id}`);
    await fetchSermons();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Could not delete sermon.');
  }
}

onMounted(() => {
  fetchSermons();
  fetchUsers();
});
</script>

<style scoped>
.form-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(229 231 235);
  background: white;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(17 24 39);
  outline: none;
}

.form-input:focus {
  border-color: rgb(99 102 241);
  box-shadow: 0 0 0 2px rgb(99 102 241 / 0.25);
}

:global(.dark) .form-input {
  border-color: rgb(75 85 99);
  background: rgb(31 41 55);
  color: rgb(243 244 246);
}
</style>
