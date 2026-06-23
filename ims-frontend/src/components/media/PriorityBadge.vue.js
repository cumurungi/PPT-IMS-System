/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from 'vue';
const props = defineProps();
const map = {
    LOW: { class: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', label: '🟢 Low' },
    MEDIUM: { class: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', label: '🟡 Medium' },
    HIGH: { class: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300', label: '🔴 High' },
};
const colorClass = computed(() => map[props.priority]?.class || 'bg-gray-100 text-gray-700');
const label = computed(() => map[props.priority]?.label || props.priority);
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
