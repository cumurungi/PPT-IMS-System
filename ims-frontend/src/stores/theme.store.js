import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
export const useThemeStore = defineStore('theme', () => {
    const isDark = ref(localStorage.getItem('ims_theme') === 'dark');
    function toggle() {
        isDark.value = !isDark.value;
    }
    // Apply class to <html> and persist
    watch(isDark, (dark) => {
        if (dark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('ims_theme', 'dark');
        }
        else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('ims_theme', 'light');
        }
    }, { immediate: true });
    return { isDark, toggle };
});
