import { ref, computed } from 'vue';

export function usePagination<T>(items: () => T[], pageSize = 10) {
  const page = ref(1);
  const filterMonth = ref(0);
  const filterYear = ref(0);

  const dateFiltered = computed(() => {
    let result = items();
    if (filterMonth.value || filterYear.value) {
      result = result.filter((item: any) => {
        const dateField = item.createdAt || item.date || item.scheduledDate || item.deadline || item.recordingDate;
        if (!dateField) return true;
        const d = new Date(dateField);
        if (filterYear.value && d.getFullYear() !== filterYear.value) return false;
        if (filterMonth.value && d.getMonth() + 1 !== filterMonth.value) return false;
        return true;
      });
    }
    return result;
  });

  const total = computed(() => dateFiltered.value.length);
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
  const paginatedItems = computed(() => {
    const start = (page.value - 1) * pageSize;
    return dateFiltered.value.slice(start, start + pageSize);
  });

  function setPage(p: number) {
    page.value = Math.max(1, Math.min(p, totalPages.value));
  }

  function resetPage() { page.value = 1; }

  return { page, filterMonth, filterYear, total, totalPages, paginatedItems, setPage, resetPage, dateFiltered };
}
