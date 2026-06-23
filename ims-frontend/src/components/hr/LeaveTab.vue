<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div class="flex items-center gap-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ isHR ? 'Review and approve leave requests.' : 'Request and track your leave.' }}</p>
        <DateFilter v-model:month="filterMonth" v-model:year="filterYear" />
      </div>
      <button v-if="!isHR" @click="showCreate = true" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><span>+</span> Request Leave</button>
    </div>
    <div v-if="loading" class="flex-1 flex items-center justify-center"><div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>
    <div v-else class="flex-1 overflow-auto space-y-3">
      <div v-if="paginatedItems.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500"><p class="text-3xl mb-2">🏖️</p><p class="text-sm">No leave requests.</p></div>
      <div v-for="l in paginatedItems" :key="l.id" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-start justify-between gap-4 mb-2">
          <div><p class="font-semibold text-gray-900 dark:text-gray-100">{{ l.leaveType.replace('_', ' ') }}</p><p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ formatDate(l.startDate) }} → {{ formatDate(l.endDate) }}</p><p v-if="auth.isManager" class="text-xs text-gray-500 dark:text-gray-400">by {{ l.user?.name }}</p></div>
          <span :class="['text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0', leaveStatusClass(l.status)]">{{ l.status }}</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ l.reason }}</p>
        <p v-if="l.reviewerComment" class="text-xs italic text-gray-500 dark:text-gray-400 mb-3">Manager note: {{ l.reviewerComment }}</p>
        <div v-if="isHR && l.status === 'PENDING'" class="border-t border-gray-100 dark:border-gray-700 pt-3">
          <div v-if="reviewingId === l.id" class="space-y-2">
            <textarea v-model="reviewComment" rows="1" placeholder="Optional comment..." class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
            <div class="flex gap-2">
              <button @click="reviewLeave(l.id, 'APPROVED')" :disabled="acting" class="flex-1 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium">✅ Approve</button>
              <button @click="reviewLeave(l.id, 'REJECTED')" :disabled="acting" class="flex-1 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium">❌ Reject</button>
              <button @click="reviewingId = null" class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400">Cancel</button>
            </div>
          </div>
          <button v-else @click="reviewingId = l.id" class="w-full py-2 text-sm border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium">Review Request</button>
        </div>
      </div>
      <Pagination :page="page" :page-size="10" :total="total" @change="setPage" />
    </div>
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showCreate = false">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"><h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Request Leave</h2><button @click="showCreate = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button></div>
        <form @submit.prevent="createLeave" class="px-6 py-5 space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Leave Type *</label><select v-model="form.leaveType" required class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"><option value="VACATION">Vacation</option><option value="SICK_LEAVE">Sick Leave</option><option value="PERSONAL_LEAVE">Personal Leave</option><option value="OTHER">Other</option></select></div>
          <div class="grid grid-cols-2 gap-3"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label><input v-model="form.startDate" type="date" required class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date *</label><input v-model="form.endDate" type="date" required class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div></div>
          <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason *</label><textarea v-model="form.reason" rows="3" required class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"></textarea></div>
          <p v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
          <div class="flex justify-end gap-3 pt-2"><button type="button" @click="showCreate = false" class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button><button type="submit" :disabled="submitting" class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">{{ submitting ? 'Submitting...' : 'Submit Request' }}</button></div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';

const auth = useAuthStore();
const isHR = computed(() => (auth.user?.department === 'HR_FINANCE' && auth.user?.role === 'MANAGER') || auth.user?.role === 'ADMIN');
const leaves = ref<any[]>([]);
const loading = ref(true);
const showCreate = ref(false);
const submitting = ref(false);
const formError = ref('');
const acting = ref(false);
const reviewingId = ref<string | null>(null);
const reviewComment = ref('');
const form = ref({ leaveType: 'VACATION', startDate: '', endDate: '', reason: '' });

const { page, filterMonth, filterYear, total, paginatedItems, setPage } = usePagination(() => leaves.value, 10);

const LEAVE_STATUS: Record<string, string> = { PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
function leaveStatusClass(s: string) { return LEAVE_STATUS[s] ?? ''; }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }

async function createLeave() { formError.value = ''; submitting.value = true; try { await api.post('/hr/leave', form.value); showCreate.value = false; form.value = { leaveType: 'VACATION', startDate: '', endDate: '', reason: '' }; await fetchLeaves(); } catch (e: any) { formError.value = e.response?.data?.message || 'Failed to submit'; } finally { submitting.value = false; } }
async function reviewLeave(id: string, status: string) { acting.value = true; try { await api.patch(`/hr/leave/${id}`, { status, reviewerComment: reviewComment.value || null }); reviewingId.value = null; reviewComment.value = ''; await fetchLeaves(); } catch (err) { console.error(err); } finally { acting.value = false; } }
async function fetchLeaves() { loading.value = true; try { const { data } = await api.get('/hr/leave'); leaves.value = data; } catch (err) { console.error(err); } finally { loading.value = false; } }
onMounted(fetchLeaves);
</script>
