/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from 'vue';
const props = defineProps();
const map = {
    CAPTURED: { class: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', label: 'Captured' },
    IN_EDITING: { class: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', label: 'In Editing' },
    EDITED: { class: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', label: 'Edited' },
    APPROVED: { class: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', label: 'Approved' },
    PUBLISHED: { class: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', label: 'Published' },
};
const colorClass = computed(() => map[props.status]?.class || 'bg-gray-100 text-gray-700');
const label = computed(() => map[props.status]?.label || props.status);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: (['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', __VLS_ctx.colorClass]) },
});
(__VLS_ctx.label);
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            colorClass: colorClass,
            label: label,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
