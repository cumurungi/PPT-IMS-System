<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Department Performance</h3>
    <div v-if="!departments || departments.length === 0" class="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
      No department data available yet.
    </div>
    <div v-else class="relative h-72">
      <canvas ref="chartRef"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from 'chart.js';

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

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

const COLORS = [
  'rgba(99, 102, 241, 0.85)',
  'rgba(16, 185, 129, 0.85)',
  'rgba(245, 158, 11, 0.85)',
  'rgba(239, 68, 68, 0.85)',
];

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
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: totalData,
            backgroundColor: COLORS.slice(0, labels.length),
            borderColor: 'rgba(255, 255, 255, 1)',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#9ca3af',
              padding: 20,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const dept = props.departments[ctx.dataIndex];
                if (!dept) return ctx.label;
                return `${ctx.label}: ${dept.completed} / ${dept.total} ${dept.metricLabel || ''}`;
              },
            },
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
