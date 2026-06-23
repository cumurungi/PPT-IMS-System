<template>
  <div class="flex items-center gap-2">
    <select :value="month" @change="$emit('update:month', Number(($event.target as HTMLSelectElement).value))"
      class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none">
      <option :value="0">All Months</option>
      <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
    </select>
    <select :value="year" @change="$emit('update:year', Number(($event.target as HTMLSelectElement).value))"
      class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none">
      <option :value="0">All Years</option>
      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
defineProps<{ month: number; year: number }>();
defineEmits<{ (e: 'update:month', v: number): void; (e: 'update:year', v: number): void }>();

const months = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
</script>
