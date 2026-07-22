/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api/axios';
import MediaLibraryView from './media/MediaLibraryView.vue';
import RecordingsView from './media/RecordingsView.vue';
import MediaRequestsView from './media/MediaRequestsView.vue';
import EditingView from './media/EditingView.vue';
const activeTab = ref('library');
const pendingRequestsCount = ref(0);
const route = useRoute();
const mediaTabs = [
    { id: 'library', label: 'Media Library' },
    { id: 'recordings', label: 'Recordings' },
    { id: 'requests', label: '📬 Coverage Requests' },
    { id: 'editing', label: '✂️ Editing' },
];
// Load pending count on mount so badge shows even before clicking the tab
onMounted(async () => {
    // Honour ?tab= query so notification links open the right sub-tab
    const tab = route.query.tab;
    if (tab && mediaTabs.some((t) => t.id === tab))
        activeTab.value = tab;
    try {
        const { data } = await api.get('/media/requests');
        pendingRequestsCount.value = data.filter((r) => r.status === 'PENDING').length;
    }
    catch {
        // silently ignore — user may not have MEDIA dept access
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-full flex flex-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-2xl font-bold text-gray-900 dark:text-gray-100" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-gray-500 dark:text-gray-400 mt-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700" },
});
for (const [tab] of __VLS_getVForSourceType((__VLS_ctx.mediaTabs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activeTab = tab.id;
            } },
        key: (tab.id),
        ...{ class: ([
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2',
                __VLS_ctx.activeTab === tab.id
                    ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            ]) },
    });
    (tab.label);
    if (tab.id === 'requests' && __VLS_ctx.pendingRequestsCount > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" },
        });
        (__VLS_ctx.pendingRequestsCount);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 overflow-hidden" },
});
if (__VLS_ctx.activeTab === 'library') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h-full" },
    });
    /** @type {[typeof MediaLibraryView, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(MediaLibraryView, new MediaLibraryView({}));
    const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
else if (__VLS_ctx.activeTab === 'recordings') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h-full" },
    });
    /** @type {[typeof RecordingsView, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(RecordingsView, new RecordingsView({}));
    const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
}
else if (__VLS_ctx.activeTab === 'requests') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h-full" },
    });
    /** @type {[typeof MediaRequestsView, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(MediaRequestsView, new MediaRequestsView({
        ...{ 'onPendingCount': {} },
    }));
    const __VLS_7 = __VLS_6({
        ...{ 'onPendingCount': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    let __VLS_9;
    let __VLS_10;
    let __VLS_11;
    const __VLS_12 = {
        onPendingCount: (...[$event]) => {
            if (!!(__VLS_ctx.activeTab === 'library'))
                return;
            if (!!(__VLS_ctx.activeTab === 'recordings'))
                return;
            if (!(__VLS_ctx.activeTab === 'requests'))
                return;
            __VLS_ctx.pendingRequestsCount = $event;
        }
    };
    var __VLS_8;
}
else if (__VLS_ctx.activeTab === 'editing') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h-full" },
    });
    /** @type {[typeof EditingView, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(EditingView, new EditingView({}));
    const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
}
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-yellow-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            MediaLibraryView: MediaLibraryView,
            RecordingsView: RecordingsView,
            MediaRequestsView: MediaRequestsView,
            EditingView: EditingView,
            activeTab: activeTab,
            pendingRequestsCount: pendingRequestsCount,
            mediaTabs: mediaTabs,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
