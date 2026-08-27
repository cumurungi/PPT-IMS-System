<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Department Performance</h3>
    <div v-if="!departments || departments.length === 0" class="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
      No department data available yet.
    </div>
    <div v-else class="space-y-2">
      <div v-for="d in departments" :key="d.department" class="flex items-center justify-between text-sm">
        <span class="text-gray-700 dark:text-gray-300">{{ formatDeptName(d.department) }}</span>
        <span class="text-gray-500 dark:text-gray-400">{{ d.metricLabel || d.department }}: {{ d.completed }} / {{ d.total }}</span>
      </div>
      <div class="relative h-64">
        <canvas ref="chartRef"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
  Tooltip,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

const props = defineProps<{
  departments: Array<{
    department: string;
    metricLabel: string;
    completedLabel: string;
    completed: number;
    total: number;
  }>;
}>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

function formatDeptName(dept: string): string {
  const map: Record<string, string> = {
    MEDIA: 'Media',
    EVANGELISM: 'Evangelism',
    IT: 'IT',
    HR_FINANCE: 'HR / Finance',
  };
  return map[dept] || dept;
}

async function renderChart() {
  if (!chartRef.value) return;
  if (!props.departments || props.departments.length === 0) return;

  await nextTick();
  const ctx = chartRef.value.getContext('2d');
  if (!ctx) return;

  if (chart) {
    chart.destroy();
    chart = null;
  }

  try {
    const labels = props.departments.map(d => formatDeptName(d.department));
    const completedData = props.departments.map(d => d.completed);
    const totalData = props.departments.map(d => d.total);

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Completed',
            data: completedData,
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Total',
            data: totalData,
            backgroundColor: 'rgba(156, 163, 175, 0.5)',
            borderColor: 'rgba(156, 163, 175, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#9ca3af',
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(156, 163, 175, 0.1)' },
          },
          y: {
            ticks: { color: '#9ca3af', stepSize: 1 },
            grid: { color: 'rgba(156, 163, 175, 0.1)' },
            beginAtZero: true,
          },
        },
      },
    });
  } catch (err) {
    console.error('Failed to render department chart:', err);
  }
}

watch(() => props.departments, () => {
  renderChart();
}, { deep: true });

onMounted(() => {
  renderChart();
});

onUnmounted(() => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
});
</script>
