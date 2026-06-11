<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p class="text-6xl font-bold text-gray-200">404</p>
      <h1 class="text-2xl font-bold text-gray-900 mt-4">Page not found</h1>
      <RouterLink to="/" class="text-indigo-600 hover:underline mt-4 block">Go home</RouterLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>
