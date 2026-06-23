/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref } from 'vue';
const __VLS_props = defineProps();
const __VLS_emit = defineEmits(['delete']);
const expanded = ref(true);
function fileIcon(mimeType) {
    if (!mimeType)
        return '📄';
    if (mimeType.startsWith('image/'))
        return '🖼️';
    if (mimeType.startsWith('video/'))
        return '🎬';
    if (mimeType.startsWith('audio/'))
        return '🎵';
    if (mimeType.includes('pdf'))
        return '📕';
    if (mimeType.includes('zip') || mimeType.includes('rar'))
        return '📦';
    if (mimeType.includes('word') || mimeType.includes('document'))
        return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel'))
        return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
        return '📙';
    return '📄';
}
function formatSize(bytes) {
    if (bytes < 1024)
        return bytes + ' B';
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024)
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
if (__VLS_ctx.node.type === 'folder') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "border-b border-gray-100 dark:border-gray-700 last:border-b-0" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.node.type === 'folder'))
                    return;
                __VLS_ctx.expanded = !__VLS_ctx.expanded;
            } },
        ...{ class: "w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors" },
        ...{ style: ({ paddingLeft: (__VLS_ctx.depth * 16 + 12) + 'px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-xs transition-transform" },
        ...{ class: (__VLS_ctx.expanded ? 'rotate-90' : '') },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-medium" },
    });
    (__VLS_ctx.node.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-xs text-gray-400 ml-auto" },
    });
    (__VLS_ctx.node.children?.length);
    if (__VLS_ctx.expanded) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        for (const [child] of __VLS_getVForSourceType((__VLS_ctx.node.children))) {
            const __VLS_0 = {}.FileTreeNode;
            /** @type {[typeof __VLS_components.FileTreeNode, ]} */ ;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
                ...{ 'onDelete': {} },
                key: (child.name + (child.id || '')),
                node: (child),
                depth: (__VLS_ctx.depth + 1),
            }));
            const __VLS_2 = __VLS_1({
                ...{ 'onDelete': {} },
                key: (child.name + (child.id || '')),
                node: (child),
                depth: (__VLS_ctx.depth + 1),
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            let __VLS_4;
            let __VLS_5;
            let __VLS_6;
            const __VLS_7 = {
                onDelete: (...[$event]) => {
                    if (!(__VLS_ctx.node.type === 'folder'))
                        return;
                    if (!(__VLS_ctx.expanded))
                        return;
                    __VLS_ctx.$emit('delete', $event);
                }
            };
            var __VLS_3;
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group" },
        ...{ style: ({ paddingLeft: (__VLS_ctx.depth * 16 + 12) + 'px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.fileIcon(__VLS_ctx.node.mimeType));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "flex-1 truncate" },
    });
    (__VLS_ctx.node.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-xs text-gray-400" },
    });
    (__VLS_ctx.formatSize(__VLS_ctx.node.size));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.node.type === 'folder'))
                    return;
                __VLS_ctx.$emit('delete', __VLS_ctx.node.id);
            } },
        ...{ class: "opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity" },
        title: "Delete",
    });
}
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['last:border-b-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-750']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:hover:bg-gray-750']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['last:border-b-0']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            expanded: expanded,
            fileIcon: fileIcon,
            formatSize: formatSize,
        };
    },
    emits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
