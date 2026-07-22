/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, defineAsyncComponent } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
const auth = useAuthStore();
const AttendanceTab = defineAsyncComponent(() => import('@/components/hr/AttendanceTab.vue'));
const LeaveTab = defineAsyncComponent(() => import('@/components/hr/LeaveTab.vue'));
const ExpensesTab = defineAsyncComponent(() => import('@/components/hr/ExpensesTab.vue'));
const isHR = computed(() => auth.user?.department === 'HR_FINANCE' || auth.user?.role === 'ADMIN');
const isManager = computed(() => auth.user?.role === 'MANAGER' || auth.user?.role === 'ADMIN');
const activeTab = ref('leave');
const allTabs = [
    { id: 'attendance', label: '⏱️ Attendance' },
    { id: 'leave', label: '🏖️ Leave Requests' },
    { id: 'expenses', label: '💰 Expenses' },
];
// HR department members and managers see all tabs, others see Leave + Expenses only
const visibleTabs = computed(() => {
    if (isHR.value || isManager.value)
        return allTabs;
    return allTabs.filter(t => t.id === 'leave' || t.id === 'expenses');
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-full flex flex-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-6 flex-shrink-0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-2xl font-bold text-gray-900 dark:text-gray-100" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-sm text-gray-500 dark:text-gray-400 mt-0.5" },
});
if (__VLS_ctx.visibleTabs.length > 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0" },
    });
    for (const [tab] of __VLS_getVForSourceType((__VLS_ctx.visibleTabs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.visibleTabs.length > 1))
                        return;
                    __VLS_ctx.activeTab = tab.id;
                } },
            key: (tab.id),
            ...{ class: (['px-4 py-2 text-sm font-medium transition-colors border-b-2',
                    __VLS_ctx.activeTab === tab.id
                        ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300']) },
        });
        (tab.label);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 overflow-hidden" },
});
if (__VLS_ctx.activeTab === 'attendance') {
    const __VLS_0 = {}.AttendanceTab;
    /** @type {[typeof __VLS_components.AttendanceTab, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
else if (__VLS_ctx.activeTab === 'leave') {
    const __VLS_4 = {}.LeaveTab;
    /** @type {[typeof __VLS_components.LeaveTab, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
    const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
}
else if (__VLS_ctx.activeTab === 'expenses') {
    const __VLS_8 = {}.ExpensesTab;
    /** @type {[typeof __VLS_components.ExpensesTab, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({}));
    const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AttendanceTab: AttendanceTab,
            LeaveTab: LeaveTab,
            ExpensesTab: ExpensesTab,
            activeTab: activeTab,
            visibleTabs: visibleTabs,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
