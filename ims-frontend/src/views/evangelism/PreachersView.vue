<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div><h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Preachers</h2><p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage preacher directory and event assignments</p></div>
      <button v-if="auth.isManager" @click="showCreate = true" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><span>+</span> Add Preacher</button>
    </div>
    <div class="mb-4 flex-shrink-0 flex items-center gap-3">
      <input v-model="search" type="text" placeholder="Search preachers..." class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-56 focus:ring-2 focus:ring-indigo-500 outline-none" />
      <DateFilter v-model:month="filterMonth" v-model:year="filterYear" />
    </div>
    <div v-if="loading" class="flex-1 flex items-center justify-center"><div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>
    <div v-else class="flex-1 overflow-auto">
      <div v-if="paginatedItems.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500"><p class="text-4xl mb-3">🎤</p><p class="text-sm">No preachers yet.</p></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="p in paginatedItems" :key="p.id" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between"><div class="flex-1 min-w-0"><p class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ p.name }}</p><p class="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">{{ p.specialization }}</p></div><div class="ml-3 flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg px-2 py-1 text-center"><p class="text-lg font-bold text-indigo-600 dark:text-indigo-400">{{ p._count?.events ?? 0 }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Events</p></div></div>
          <div class="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400"><p v-if="p.email">✉️ {{ p.email }}</p><p v-if="p.phone">📞 {{ p.phone }}</p><p v-if="p.notes" class="mt-2 text-gray-600 dark:text-gray-300 italic line-clamp-2">{{ p.notes }}</p></div>
          <div v-if="auth.isManager" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
            <button @click="openEdit(p)" class="flex-1 text-xs text-center py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Edit</button>
            <button @click="confirmDelete(p)" class="flex-1 text-xs text-center py-1.5 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">Delete</button>
          </div>
        </div>
      </div>
      <Pagination :page="page" :page-size="12" :total="total" @change="setPage" />
    </div>
    <PreacherModal v-if="showCreate || editTarget" :preacher="editTarget" @close="closeModal" @saved="onSaved" />
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="deleteTarget = null">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Preacher</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Remove <strong>{{ deleteTarget.name }}</strong>?</p>
        <div class="flex gap-3"><button @click="deleteTarget = null" class="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button><button @click="doDelete" :disabled="deleting" class="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg">{{ deleting ? 'Deleting...' : 'Delete' }}</button></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import PreacherModal from '@/components/evangelism/PreacherModal.vue';
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';

const auth = useAuthStore();
const preachers = ref<any[]>([]);
const loading = ref(true);
const search = ref('');
const showCreate = ref(false);
const editTarget = ref<any>(null);
const deleteTarget = ref<any>(null);
const deleting = ref(false);

const filtered = computed(() => { if (!search.value) return preachers.value; const q = search.value.toLowerCase(); return preachers.value.filter(p => p.name.toLowerCase().includes(q) || p.specialization.toLowerCase().includes(q)); });
const { page, filterMonth, filterYear, total, paginatedItems, setPage } = usePagination(() => filtered.value, 12);

function openEdit(p: any) { editTarget.value = p; }
function confirmDelete(p: any) { deleteTarget.value = p; }
function closeModal() { showCreate.value = false; editTarget.value = null; }
function onSaved() { closeModal(); fetchPreachers(); }
async function doDelete() { if (!deleteTarget.value) return; deleting.value = true; try { await api.delete(`/evangelism/preachers/${deleteTarget.value.id}`); deleteTarget.value = null; await fetchPreachers(); } catch (err) { console.error(err); } finally { deleting.value = false; } }
async function fetchPreachers() { loading.value = true; try { const { data } = await api.get('/evangelism/preachers'); preachers.value = data; } catch (err) { console.error(err); } finally { loading.value = false; } }
onMounted(fetchPreachers);
</script>
