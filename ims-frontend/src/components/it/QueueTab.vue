<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center gap-3 mb-4 flex-shrink-0">
      <p class="text-sm text-gray-500 dark:text-gray-400">Approved recordings ready to be shared on your platforms.</p>
      <DateFilter v-model:month="filterMonth" v-model:year="filterYear" />
    </div>
    <div v-if="loading" class="flex-1 flex items-center justify-center"><div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>
    <div v-else-if="paginatedItems.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500"><p class="text-4xl mb-3">📡</p><p class="text-sm">Publishing queue is empty.</p></div>
    <div v-else class="flex-1 overflow-auto space-y-6">
      <!-- New (not published at all) -->
      <div v-if="newItems.length > 0">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3 flex items-center gap-2">
          🆕 New — Ready to Publish ({{ newItems.length }})
        </p>
        <div class="space-y-4">
          <div v-for="item in newItems" :key="item.id"
            class="bg-white dark:bg-gray-800 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 p-5">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div><p class="font-semibold text-gray-900 dark:text-gray-100 text-lg">{{ item.recording?.title ?? 'Untitled' }}</p><p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ item.recording?.format }} · Priority: {{ item.priority }}</p></div>
              <span class="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1 rounded-full font-medium flex-shrink-0">🆕 New</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">Select platforms:</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <label v-for="p in platforms" :key="p.id" class="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <input type="checkbox" :value="p.id" v-model="selectedPlatforms[item.id]" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ platformIcon(p.name) }} {{ p.name }}</span>
              </label>
            </div>
            <button @click="publishItem(item.id)" :disabled="!selectedPlatforms[item.id]?.length || publishing === item.id" class="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium">{{ publishing === item.id ? 'Publishing...' : '🚀 Mark as Published' }}</button>
          </div>
        </div>
      </div>

      <!-- Partially published -->
      <div v-if="partialItems.length > 0">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3 flex items-center gap-2">
          ⏳ Partially Published ({{ partialItems.length }})
        </p>
        <div class="space-y-4">
          <div v-for="item in partialItems" :key="item.id"
            class="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-700 p-5">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div><p class="font-semibold text-gray-900 dark:text-gray-100 text-lg">{{ item.recording?.title ?? 'Untitled' }}</p><p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ item.recording?.format }} · Priority: {{ item.priority }}</p></div>
              <span class="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-3 py-1 rounded-full font-medium flex-shrink-0">⏳ Partial</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Published on:</p>
            <div class="flex flex-wrap gap-2 mb-3"><span v-for="pp in item.platforms" :key="pp.id" class="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full">{{ platformIcon(pp.platform?.name) }} {{ pp.platform?.name }}</span></div>
            <div v-if="remainingPlatforms(item).length > 0">
              <button v-if="editingId !== item.id" @click="startEditing(item)" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">+ Add more platforms</button>
              <div v-else class="mt-2">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3"><label v-for="p in remainingPlatforms(item)" :key="p.id" class="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><input type="checkbox" :value="p.id" v-model="additionalPlatforms" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><span class="text-sm text-gray-700 dark:text-gray-300">{{ platformIcon(p.name) }} {{ p.name }}</span></label></div>
                <div class="flex gap-2"><button @click="addMorePlatforms(item.id)" :disabled="!additionalPlatforms.length || publishing === item.id" class="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium">{{ publishing === item.id ? 'Saving...' : '✓ Save' }}</button><button @click="editingId = null; additionalPlatforms = []" class="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400">Cancel</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fully published -->
      <div v-if="doneItems.length > 0">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3 flex items-center gap-2">
          ✅ Fully Published ({{ doneItems.length }})
        </p>
        <div class="space-y-3">
          <div v-for="item in doneItems" :key="item.id"
            class="bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-700 p-4">
            <div class="flex items-start justify-between gap-4">
              <div><p class="font-semibold text-gray-900 dark:text-gray-100">{{ item.recording?.title ?? 'Untitled' }}</p><p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ item.recording?.format }}</p></div>
              <span class="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full font-medium flex-shrink-0">✓ Done</span>
            </div>
            <div class="flex flex-wrap gap-2 mt-2"><span v-for="pp in item.platforms" :key="pp.id" class="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full">{{ platformIcon(pp.platform?.name) }} {{ pp.platform?.name }}</span></div>
          </div>
        </div>
      </div>

      <Pagination :page="page" :page-size="10" :total="total" @change="setPage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import api from '@/api/axios';
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';

const queue = ref<any[]>([]);
const platforms = ref<any[]>([]);
const loading = ref(true);
const publishing = ref<string | null>(null);
const selectedPlatforms = reactive<Record<string, string[]>>({});
const editingId = ref<string | null>(null);
const additionalPlatforms = ref<string[]>([]);

const { page, filterMonth, filterYear, total, paginatedItems, setPage } = usePagination(() => queue.value, 10);

// Group items into 3 categories
const newItems = computed(() => paginatedItems.value.filter(i => !i.publishedAt && (!i.platforms || i.platforms.length === 0)));
const partialItems = computed(() => paginatedItems.value.filter(i => i.publishedAt && remainingPlatforms(i).length > 0));
const doneItems = computed(() => paginatedItems.value.filter(i => i.publishedAt && remainingPlatforms(i).length === 0));

function platformIcon(name: string) { const icons: Record<string, string> = { YouTube: '▶️', Website: '🌐', App: '📱', Instagram: '📸', Facebook: '👥', TikTok: '🎵' }; return icons[name] || '📡'; }
function remainingPlatforms(item: any) { const ids = (item.platforms || []).map((pp: any) => pp.platform?.id || pp.platformId); return platforms.value.filter(p => !ids.includes(p.id)); }
function startEditing(item: any) { editingId.value = item.id; additionalPlatforms.value = []; }

async function addMorePlatforms(queueId: string) { publishing.value = queueId; try { await api.post(`/it/queue/${queueId}/publish`, { platformIds: additionalPlatforms.value }); editingId.value = null; additionalPlatforms.value = []; await fetchData(); } catch (err) { console.error(err); } finally { publishing.value = null; } }
async function publishItem(queueId: string) { publishing.value = queueId; try { await api.post(`/it/queue/${queueId}/publish`, { platformIds: selectedPlatforms[queueId] || [] }); await fetchData(); } catch (err) { console.error(err); } finally { publishing.value = null; } }

async function fetchData() {
  loading.value = true;
  try { const [q, p] = await Promise.all([api.get('/it/queue'), api.get('/it/platforms')]); queue.value = q.data; platforms.value = p.data; for (const item of q.data) { if (!item.publishedAt && !selectedPlatforms[item.id]) selectedPlatforms[item.id] = []; } }
  catch (err) { console.error(err); } finally { loading.value = false; }
}
onMounted(fetchData);
</script>
