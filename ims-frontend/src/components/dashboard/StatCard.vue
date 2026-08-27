<template>
  <RouterLink v-if="to" :to="to" class="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
    <div :class="[iconBg, 'w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0']">
      {{ icon }}
    </div>
    <div>
      <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ value }}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ label }}</p>
    </div>
  </RouterLink>
  <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div :class="[iconBg, 'w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0']">
      {{ icon }}
    </div>
    <div>
      <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ value }}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps<{
  icon: string;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
  to?: string;
}>();

const iconBg = computed(() => {
  const map: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    green: 'bg-green-100 dark:bg-green-900/30',
    red: 'bg-red-100 dark:bg-red-900/30',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/30',
    orange: 'bg-orange-100 dark:bg-orange-900/30',
  };
  return map[props.color] || map.blue;
});
</script>
