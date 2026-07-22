<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Editing & Post-Production</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">All sermons from editing through publishing</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ countByStatus('IN_EDITING') }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">In Editing</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ countByStatus('EDITED') }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Edited</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ countByStatus('APPROVED') }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Approved</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
        <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ countByStatus('PUBLISHED') }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Published</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="flex items-center gap-3 mb-4 flex-shrink-0">
      <input v-model="searchQuery" type="text" placeholder="Search sermons..."
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none" />
      <select v-model="filterStatus"
        class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">All Stages</option>
        <option value="IN_EDITING">In Editing</option>
        <option value="EDITED">Edited</option>
        <option value="APPROVED">Approved</option>
        <option value="PUBLISHED">Published</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filtered.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <p class="text-4xl mb-3">✂️</p>
      <p class="text-sm">No recordings here yet. Start editing from the Recordings tab.</p>
    </div>

    <!-- Categorized sections -->
    <div v-else class="flex-1 overflow-y-auto space-y-6">
      <!-- IN_EDITING section -->
      <section v-if="byStatus('IN_EDITING').length > 0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          In Editing ({{ byStatus('IN_EDITING').length }})
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <RecordingCard v-for="rec in byStatus('IN_EDITING')" :key="rec.id" :rec="rec" @click="openRecording(rec)" />
        </div>
      </section>

      <!-- EDITED section -->
      <section v-if="byStatus('EDITED').length > 0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
          Edited — Awaiting Approval ({{ byStatus('EDITED').length }})
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <RecordingCard v-for="rec in byStatus('EDITED')" :key="rec.id" :rec="rec" @click="openRecording(rec)" />
        </div>
      </section>

      <!-- APPROVED section -->
      <section v-if="byStatus('APPROVED').length > 0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          Approved — Ready to Publish ({{ byStatus('APPROVED').length }})
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <RecordingCard v-for="rec in byStatus('APPROVED')" :key="rec.id" :rec="rec" @click="openRecording(rec)" />
        </div>
      </section>

      <!-- PUBLISHED section -->
      <section v-if="byStatus('PUBLISHED').length > 0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Published ({{ byStatus('PUBLISHED').length }})
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <RecordingCard v-for="rec in byStatus('PUBLISHED')" :key="rec.id" :rec="rec" @click="openRecording(rec)" />
        </div>
      </section>
    </div>

    <!-- Recording Detail Drawer -->
    <RecordingDrawer
      v-if="selectedRecording"
      :recording-id="selectedRecording.id"
      @close="selectedRecording = null"
      @updated="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import api from '@/api/axios';
import RecordingDrawer from '@/components/media/RecordingDrawer.vue';

// Inline RecordingCard component
const RecordingCard = defineComponent({
  props: { rec: { type: Object, required: true } },
  emits: ['click'],
  setup(props, { emit }) {
    function formatDate(date: string) {
      return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    return () => h('div', {
      class: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer',
      onClick: () => emit('click'),
    }, [
      // Title
      h('h4', { class: 'text-sm font-semibold text-gray-900 dark:text-gray-100 truncate' }, props.rec.title),
      // Sermon name
      h('p', { class: 'text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate' }, props.rec.event?.title || '—'),
      // Progress bar for IN_EDITING
      props.rec.status === 'IN_EDITING' ? h('div', { class: 'mt-2' }, [
        h('div', { class: 'flex justify-between text-xs text-gray-400 mb-0.5' }, [
          h('span', {}, 'Progress'),
          h('span', { class: 'font-medium' }, props.rec.editingProgress + '%'),
        ]),
        h('div', { class: 'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5' }, [
          h('div', { class: 'bg-blue-500 h-1.5 rounded-full', style: { width: props.rec.editingProgress + '%' } }),
        ]),
      ]) : null,
      // Footer: editor + date
      h('div', { class: 'flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400' }, [
          h('span', {}, props.rec.editor?.name || 'No editor'),
          h('span', {}, props.rec.editingDueDate ? `Due ${formatDate(props.rec.editingDueDate)}` : formatDate(props.rec.recordingDate)),
      ]),
    ]);
  },
});

const recordings = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const filterStatus = ref('');
const selectedRecording = ref<any>(null);

function countByStatus(status: string) {
  return recordings.value.filter(r => r.status === status).length;
}

function byStatus(status: string) {
  return filtered.value.filter(r => r.status === status);
}

const filtered = computed(() => {
  let result = recordings.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(r => r.title.toLowerCase().includes(q) || r.event?.title?.toLowerCase().includes(q));
  }
  if (filterStatus.value) {
    result = result.filter(r => r.status === filterStatus.value);
  }
  return result;
});

function openRecording(rec: any) {
  if (!rec?.id) return;
  selectedRecording.value = rec;
}

async function fetchData() {
  loading.value = true;
  selectedRecording.value = null;
  try {
    const { data } = await api.get('/media/recordings', { params: { stage: 'editing' } });
    recordings.value = data;
    // Fetch editing tasks and attach matching deadlines to recordings
    try {
      const { data: tasks } = await api.get('/media/editing/tasks');
      // For each recording, find a task with title starting with 'Edit: ' + recording.title
      recordings.value = recordings.value.map((rec: any) => {
        const match = tasks.find((t: any) => t.title && (t.title === `Edit: ${rec.title}` || t.title.includes(rec.title)));
        // Prefer an explicit editing deadline set on the recording, else fall back to the task deadline
        return { ...rec, editingDueDate: rec.editingDueDate || (match ? match.deadline : null) };
      });
    } catch (tErr) {
      // ignore task fetch errors
    }
  } catch (err) {
    console.error('Failed to load:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
