/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/axios';
import StatusBadge from '@/components/tasks/StatusBadge.vue';
import MiniStat from '@/components/tasks/MiniStat.vue';
import KanbanColumn from '@/components/tasks/KanbanColumn.vue';
import TaskDrawer from '@/components/tasks/TaskDrawer.vue';
import CreateTaskModal from '@/components/tasks/CreateTaskModal.vue';
import Pagination from '@/components/shared/Pagination.vue';
import DateFilter from '@/components/shared/DateFilter.vue';
import { usePagination } from '@/composables/usePagination';
const auth = useAuthStore();
const route = useRoute();
const tasks = ref([]);
const taskStats = ref({ total: 0, todo: 0, inProgress: 0, inReview: 0, completed: 0, blocked: 0, overdue: 0 });
const loading = ref(true);
const viewMode = ref('list');
const searchQuery = ref(route.query.search || '');
const filterStatus = ref('');
const filterDept = ref('');
const selectedTask = ref(null);
const showCreateModal = ref(false);
const boardColumns = [
    { status: 'TODO', title: 'To Do', color: 'gray' },
    { status: 'IN_PROGRESS', title: 'In Progress', color: 'blue' },
    { status: 'IN_REVIEW', title: 'In Review', color: 'yellow' },
    { status: 'COMPLETED', title: 'Completed', color: 'green' },
    { status: 'BLOCKED', title: 'Blocked', color: 'red' },
];
const filteredTasks = computed(() => {
    let result = tasks.value;
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (filterStatus.value) {
        result = result.filter(t => t.status === filterStatus.value);
    }
    if (filterDept.value) {
        result = result.filter(t => t.project?.department === filterDept.value);
    }
    return result;
});
const { page, filterMonth, filterYear, total, paginatedItems, setPage, resetPage } = usePagination(() => filteredTasks.value, 15);
function getTasksByStatus(status) {
    return filteredTasks.value.filter(t => t.status === status);
}
function isOverdue(task) {
    return task.status !== 'COMPLETED' && new Date(task.deadline) < new Date();
}
function priorityClass(task) {
    if (isOverdue(task))
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
}
function formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    if (diff === 0)
        return 'Today';
    if (diff === 1)
        return 'Tomorrow';
    if (diff === -1)
        return 'Yesterday';
    if (diff < -1)
        return `${Math.abs(diff)}d overdue`;
    if (diff <= 7)
        return `${diff}d left`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
async function fetchTasks() {
    try {
        const [tasksRes, statsRes] = await Promise.all([
            api.get('/tasks'),
            api.get('/tasks/stats'),
        ]);
        tasks.value = tasksRes.data;
        taskStats.value = statsRes.data;
    }
    catch (err) {
        console.error('Failed to load tasks:', err);
    }
    finally {
        loading.value = false;
    }
}
function openTask(task) {
    selectedTask.value = task;
}
function editTask(task) {
    // Open the task in the drawer (same as view — editing is done there)
    selectedTask.value = task;
}
async function confirmDelete(task) {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`))
        return;
    try {
        await api.delete(`/tasks/${task.id}`);
        await fetchTasks();
    }
    catch (err) {
        console.error('Failed to delete task:', err);
    }
}
async function updateTaskStatus(taskId, newStatus) {
    try {
        await api.patch(`/tasks/${taskId}`, { status: newStatus });
        await fetchTasks();
    }
    catch (err) {
        console.error('Failed to update task:', err);
    }
}
async function refreshTasks() {
    showCreateModal.value = false;
    selectedTask.value = null;
    loading.value = true;
    await fetchTasks();
}
onMounted(fetchTasks);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-full flex flex-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between mb-4 flex-shrink-0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-2xl font-bold text-gray-900 dark:text-gray-100" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-sm text-gray-500 dark:text-gray-400 mt-0.5" },
});
(__VLS_ctx.auth.user?.role === 'ADMIN' ? 'All tasks across departments' : 'Your department tasks');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showCreateModal = true;
        } },
    ...{ class: "bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between mb-4 flex-shrink-0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'list';
        } },
    ...{ class: ([__VLS_ctx.viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : '', 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-all']) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'board';
        } },
    ...{ class: ([__VLS_ctx.viewMode === 'board' ? 'bg-white dark:bg-gray-700 shadow-sm' : '', 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-all']) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "Search tasks...",
    ...{ class: "border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-indigo-500 outline-none" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filterStatus),
    ...{ class: "border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "TODO",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "IN_PROGRESS",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "IN_REVIEW",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "COMPLETED",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "BLOCKED",
});
/** @type {[typeof DateFilter, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(DateFilter, new DateFilter({
    month: (__VLS_ctx.filterMonth),
    year: (__VLS_ctx.filterYear),
}));
const __VLS_1 = __VLS_0({
    month: (__VLS_ctx.filterMonth),
    year: (__VLS_ctx.filterYear),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
if (__VLS_ctx.auth.user?.role === 'ADMIN') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.filterDept),
        ...{ class: "border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "MEDIA",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "EVANGELISM",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "IT",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "HR_FINANCE",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-6 gap-2 mb-4 flex-shrink-0" },
});
/** @type {[typeof MiniStat, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(MiniStat, new MiniStat({
    label: "Total",
    value: (__VLS_ctx.taskStats.total),
}));
const __VLS_4 = __VLS_3({
    label: "Total",
    value: (__VLS_ctx.taskStats.total),
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
/** @type {[typeof MiniStat, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(MiniStat, new MiniStat({
    label: "To Do",
    value: (__VLS_ctx.taskStats.todo),
    color: "gray",
}));
const __VLS_7 = __VLS_6({
    label: "To Do",
    value: (__VLS_ctx.taskStats.todo),
    color: "gray",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
/** @type {[typeof MiniStat, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(MiniStat, new MiniStat({
    label: "In Progress",
    value: (__VLS_ctx.taskStats.inProgress),
    color: "blue",
}));
const __VLS_10 = __VLS_9({
    label: "In Progress",
    value: (__VLS_ctx.taskStats.inProgress),
    color: "blue",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
/** @type {[typeof MiniStat, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(MiniStat, new MiniStat({
    label: "In Review",
    value: (__VLS_ctx.taskStats.inReview),
    color: "yellow",
}));
const __VLS_13 = __VLS_12({
    label: "In Review",
    value: (__VLS_ctx.taskStats.inReview),
    color: "yellow",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
/** @type {[typeof MiniStat, ]} */ ;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent(MiniStat, new MiniStat({
    label: "Completed",
    value: (__VLS_ctx.taskStats.completed),
    color: "green",
}));
const __VLS_16 = __VLS_15({
    label: "Completed",
    value: (__VLS_ctx.taskStats.completed),
    color: "green",
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
/** @type {[typeof MiniStat, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(MiniStat, new MiniStat({
    label: "Overdue",
    value: (__VLS_ctx.taskStats.overdue),
    color: "red",
}));
const __VLS_19 = __VLS_18({
    label: "Overdue",
    value: (__VLS_ctx.taskStats.overdue),
    color: "red",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-1 flex items-center justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" },
    });
}
else if (__VLS_ctx.viewMode === 'list') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-1 overflow-y-auto" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-span-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-span-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-span-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-span-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-span-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-span-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-span-2" },
    });
    if (__VLS_ctx.paginatedItems.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500" },
        });
    }
    for (const [task] of __VLS_getVForSourceType((__VLS_ctx.paginatedItems))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.viewMode === 'list'))
                        return;
                    __VLS_ctx.openTask(task);
                } },
            key: (task.id),
            ...{ class: "grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors items-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "col-span-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm font-medium text-gray-900 dark:text-gray-100 truncate" },
        });
        (task.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-xs text-gray-500 dark:text-gray-400 truncate" },
        });
        (task.description);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "col-span-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded" },
        });
        (task.project?.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "col-span-2 flex items-center gap-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300" },
        });
        (task.assignee?.name?.charAt(0));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-xs text-gray-700 dark:text-gray-300 truncate" },
        });
        (task.assignee?.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "col-span-1" },
        });
        /** @type {[typeof StatusBadge, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(StatusBadge, new StatusBadge({
            status: (task.status),
        }));
        const __VLS_22 = __VLS_21({
            status: (task.status),
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "col-span-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['text-xs font-medium px-1.5 py-0.5 rounded-full', __VLS_ctx.priorityClass(task)]) },
        });
        (__VLS_ctx.isOverdue(task) ? 'Urgent' : 'Normal');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "col-span-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (['text-xs', __VLS_ctx.isOverdue(task) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400']) },
        });
        (__VLS_ctx.formatDate(task.deadline));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: () => { } },
            ...{ class: "col-span-2 flex items-center gap-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.viewMode === 'list'))
                        return;
                    __VLS_ctx.openTask(task);
                } },
            title: "View",
            ...{ class: "p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.viewMode === 'list'))
                        return;
                    __VLS_ctx.openTask(task);
                } },
            title: "Edit",
            ...{ class: "p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" },
        });
        if (__VLS_ctx.auth.isManager) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.viewMode === 'list'))
                            return;
                        if (!(__VLS_ctx.auth.isManager))
                            return;
                        __VLS_ctx.confirmDelete(task);
                    } },
                title: "Delete",
                ...{ class: "p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" },
            });
        }
    }
    /** @type {[typeof Pagination, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(Pagination, new Pagination({
        ...{ 'onChange': {} },
        page: (__VLS_ctx.page),
        pageSize: (15),
        total: (__VLS_ctx.total),
    }));
    const __VLS_25 = __VLS_24({
        ...{ 'onChange': {} },
        page: (__VLS_ctx.page),
        pageSize: (15),
        total: (__VLS_ctx.total),
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    let __VLS_27;
    let __VLS_28;
    let __VLS_29;
    const __VLS_30 = {
        onChange: (__VLS_ctx.setPage)
    };
    var __VLS_26;
}
else if (__VLS_ctx.viewMode === 'board') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-1 overflow-x-auto" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex gap-4 h-full min-w-max pb-4" },
    });
    for (const [col] of __VLS_getVForSourceType((__VLS_ctx.boardColumns))) {
        /** @type {[typeof KanbanColumn, ]} */ ;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent(KanbanColumn, new KanbanColumn({
            ...{ 'onOpen': {} },
            ...{ 'onUpdateStatus': {} },
            key: (col.status),
            title: (col.title),
            status: (col.status),
            color: (col.color),
            tasks: (__VLS_ctx.getTasksByStatus(col.status)),
        }));
        const __VLS_32 = __VLS_31({
            ...{ 'onOpen': {} },
            ...{ 'onUpdateStatus': {} },
            key: (col.status),
            title: (col.title),
            status: (col.status),
            color: (col.color),
            tasks: (__VLS_ctx.getTasksByStatus(col.status)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
        let __VLS_34;
        let __VLS_35;
        let __VLS_36;
        const __VLS_37 = {
            onOpen: (__VLS_ctx.openTask)
        };
        const __VLS_38 = {
            onUpdateStatus: (__VLS_ctx.updateTaskStatus)
        };
        var __VLS_33;
    }
}
if (__VLS_ctx.selectedTask) {
    /** @type {[typeof TaskDrawer, ]} */ ;
    // @ts-ignore
    const __VLS_39 = __VLS_asFunctionalComponent(TaskDrawer, new TaskDrawer({
        ...{ 'onClose': {} },
        ...{ 'onUpdated': {} },
        task: (__VLS_ctx.selectedTask),
    }));
    const __VLS_40 = __VLS_39({
        ...{ 'onClose': {} },
        ...{ 'onUpdated': {} },
        task: (__VLS_ctx.selectedTask),
    }, ...__VLS_functionalComponentArgsRest(__VLS_39));
    let __VLS_42;
    let __VLS_43;
    let __VLS_44;
    const __VLS_45 = {
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.selectedTask))
                return;
            __VLS_ctx.selectedTask = null;
        }
    };
    const __VLS_46 = {
        onUpdated: (__VLS_ctx.refreshTasks)
    };
    var __VLS_41;
}
if (__VLS_ctx.showCreateModal) {
    /** @type {[typeof CreateTaskModal, ]} */ ;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent(CreateTaskModal, new CreateTaskModal({
        ...{ 'onClose': {} },
        ...{ 'onCreated': {} },
    }));
    const __VLS_48 = __VLS_47({
        ...{ 'onClose': {} },
        ...{ 'onCreated': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    let __VLS_50;
    let __VLS_51;
    let __VLS_52;
    const __VLS_53 = {
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.showCreateModal))
                return;
            __VLS_ctx.showCreateModal = false;
        }
    };
    const __VLS_54 = {
        onCreated: (__VLS_ctx.refreshTasks)
    };
    var __VLS_49;
}
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-48']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-6']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['border-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-12']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-750']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-3']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-1']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-1']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-1']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-12']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-750']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-indigo-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-indigo-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-1']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-1']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-1']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:hover:bg-indigo-900/20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-indigo-400']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:hover:bg-red-900/20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-max']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            StatusBadge: StatusBadge,
            MiniStat: MiniStat,
            KanbanColumn: KanbanColumn,
            TaskDrawer: TaskDrawer,
            CreateTaskModal: CreateTaskModal,
            Pagination: Pagination,
            DateFilter: DateFilter,
            auth: auth,
            taskStats: taskStats,
            loading: loading,
            viewMode: viewMode,
            searchQuery: searchQuery,
            filterStatus: filterStatus,
            filterDept: filterDept,
            selectedTask: selectedTask,
            showCreateModal: showCreateModal,
            boardColumns: boardColumns,
            page: page,
            filterMonth: filterMonth,
            filterYear: filterYear,
            total: total,
            paginatedItems: paginatedItems,
            setPage: setPage,
            getTasksByStatus: getTasksByStatus,
            isOverdue: isOverdue,
            priorityClass: priorityClass,
            formatDate: formatDate,
            openTask: openTask,
            confirmDelete: confirmDelete,
            updateTaskStatus: updateTaskStatus,
            refreshTasks: refreshTasks,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
