<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div class="flex items-center gap-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ isHR ? 'Review and approve expense claims.' : 'Submit expense claims for reimbursement.' }}</p>
        <DateFilter v-if="isHR" v-model:month="filterMonth" v-model:year="filterYear" />
      </div>
    </div>

    <!-- Employee: just the form -->
    <div v-if="!isHR" class="max-w-lg">
      <div v-if="expenseSubmitted" class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
        <p class="text-4xl mb-3">✅</p>
        <p class="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Expense Submitted</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Your expense claim has been sent to HR for approval.</p>
        <button @click="expenseSubmitted = false" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Submit Another</button>
      </div>
      <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Submit Expense Claim</h2>
        <form @submit.prevent="createExpense" class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label><input v-model="form.description" type="text" required placeholder="What did you spend on?" class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (RWF) *</label><input v-model="form.amount" type="number" step="1" min="0" required class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label><select v-model="form.category" required class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"><option value="TRAVEL">Travel</option><option value="MEALS">Meals</option><option value="EQUIPMENT">Equipment</option><option value="SUPPLIES">Supplies</option><option value="OTHER">Other</option></select></div>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Date *</label><input v-model="form.expenseDate" type="date" required class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          <p v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
          <button type="submit" :disabled="submitting" class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">{{ submitting ? 'Submitting...' : '💰 Submit Expense' }}</button>
        </form>
      </div>
    </div>
    <!-- HR: sees the list -->
    <div v-if="isHR && loading" class="flex-1 flex items-center justify-center"><div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>
    <div v-else-if="isHR" class="flex-1 overflow-auto space-y-3">
      <div v-if="paginatedItems.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500"><p class="text-3xl mb-2">💰</p><p class="text-sm">No expense requests.</p></div>
      <div v-for="e in paginatedItems" :key="e.id" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-start justify-between gap-4 mb-2">
          <div><p class="font-semibold text-gray-900 dark:text-gray-100">{{ e.description }}</p><p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ e.category }} · {{ formatDate(e.expenseDate) }}<span v-if="auth.isManager"> · by {{ e.user?.name }}</span></p></div>
          <div class="text-right flex-shrink-0"><p class="font-bold text-lg text-gray-900 dark:text-gray-100">{{ Number(e.amount).toLocaleString() }} RWF</p><span :class="['text-xs px-2 py-0.5 rounded-full font-medium', expenseStatusClass(e.status)]">{{ e.status }}</span></div>
        </div>
        <p v-if="e.reviewerComment" class="text-xs italic text-gray-500 dark:text-gray-400 mb-3">Note: {{ e.reviewerComment }}</p>
        <div v-if="isHR && e.status === 'PENDING'" class="border-t border-gray-100 dark:border-gray-700 pt-3">
          <div v-if="reviewingId === e.id" class="space-y-2">
            <textarea v-model="reviewComment" rows="1" placeholder="Optional comment..." class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
            <div class="flex gap-2">
              <button @click="reviewExpense(e.id, 'APPROVED')" :disabled="acting" class="flex-1 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium">✅ Approve</button>
              <button @click="reviewExpense(e.id, 'REJECTED')" :disabled="acting" class="flex-1 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium">❌ Reject</button>
              <button @click="reviewingId = null" class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400">Cancel</button>
            </div>
          </div>
          <button v-else @click="reviewingId = e.id" class="w-full py-2 text-sm border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium">Review Expense</button>
        </div>
      </div>
      <Pagination :page="page" :page-size="10" :total="total" @change="setPage" />
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
const expenses = ref<any[]>([]);
const loading = ref(true);
const showCreate = ref(false);
const submitting = ref(false);
const formError = ref('');
const acting = ref(false);
const reviewingId = ref<string | null>(null);
const reviewComment = ref('');
const expenseSubmitted = ref(false);
const form = ref({ description: '', amount: '', category: 'OTHER', expenseDate: '', receiptUrl: 'N/A' });

const { page, filterMonth, filterYear, total, paginatedItems, setPage } = usePagination(() => expenses.value, 10);

const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', INFO_REQUESTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
function expenseStatusClass(s: string) { return STATUS_COLORS[s] ?? ''; }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }

async function createExpense() { formError.value = ''; submitting.value = true; try { await api.post('/hr/expenses', form.value); form.value = { description: '', amount: '', category: 'OTHER', expenseDate: '', receiptUrl: 'N/A' }; expenseSubmitted.value = true; } catch (e: any) { formError.value = e.response?.data?.message || 'Failed to submit'; } finally { submitting.value = false; } }
async function reviewExpense(id: string, status: string) { acting.value = true; try { await api.patch(`/hr/expenses/${id}`, { status, reviewerComment: reviewComment.value || null }); reviewingId.value = null; reviewComment.value = ''; await fetchExpenses(); } catch (err) { console.error(err); } finally { acting.value = false; } }
async function fetchExpenses() { loading.value = true; try { const { data } = await api.get('/hr/expenses'); expenses.value = data; } catch (err) { console.error(err); } finally { loading.value = false; } }
onMounted(fetchExpenses);
</script>
