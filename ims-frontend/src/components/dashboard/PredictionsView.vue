<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Predictive Insights</h3>
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
    </div>
    <div v-else-if="!predictions" class="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
      No predictions available
    </div>
    <div v-else class="space-y-3">
      <InsightCard
        v-if="predictions.tasks"
        title="Tasks"
        :insight="predictions.tasks.insight"
        :metrics="[
          { label: 'Completion Rate', value: predictions.tasks.completionRate + '%' },
          { label: 'Overdue Risk', value: predictions.tasks.overdueRisk + '%' },
        ]"
      />
      <InsightCard
        v-if="predictions.media"
        title="Media"
        :insight="predictions.media.insight"
        :metrics="[
          { label: 'Editing Backlog', value: String(predictions.media.editingBacklog) },
          { label: 'Published Rate', value: predictions.media.publishedRate + '%' },
        ]"
      />
      <InsightCard
        v-if="predictions.evangelism"
        title="Evangelism"
        :insight="predictions.evangelism.insight"
        :metrics="[
          { label: 'Upcoming Events', value: String(predictions.evangelism.upcomingEvents) },
          { label: 'Completion Rate', value: predictions.evangelism.completionRate + '%' },
        ]"
      />
      <InsightCard
        v-if="predictions.it"
        title="IT"
        :insight="predictions.it.insight"
        :metrics="[
          { label: 'Open Tickets', value: String(predictions.it.openTickets) },
          { label: 'Resolution Rate', value: predictions.it.resolutionRate + '%' },
        ]"
      />
      <InsightCard
        v-if="predictions.hr"
        title="HR / Finance"
        :insight="predictions.hr.insight"
        :metrics="[
          { label: 'Pending Leave', value: String(predictions.hr.pendingLeave) },
          { label: 'Pending Expenses', value: String(predictions.hr.pendingExpenses) },
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';
import InsightCard from '@/components/dashboard/InsightCard.vue';

const predictions = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/predictions');
    predictions.value = data;
  } catch (err) {
    console.error('Failed to load predictions:', err);
  } finally {
    loading.value = false;
  }
});
</script>
