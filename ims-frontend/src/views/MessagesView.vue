<template>
  <div class="h-full flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
    <!-- Sidebar: conversations list -->
    <div class="w-72 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">Messages</h2>
        <button @click="showNewChat = true"
          class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg font-medium">
          + New
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="conversations.length === 0" class="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
          No conversations yet.
        </div>
        <button v-for="c in conversations" :key="c.user.id"
          @click="selectConversation(c.user)"
          :class="['w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors',
            activeUserId === c.user.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : '']">
          <div class="flex items-center justify-between">
            <p class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{{ c.user.name }}</p>
            <span v-if="c.unread > 0"
              class="bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
              {{ c.unread }}
            </span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ c.lastMessage }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {{ c.user.department || 'Admin' }} · {{ timeAgo(c.lastDate) }}
          </p>
        </button>
      </div>
    </div>

    <!-- Chat area -->
    <div class="flex-1 flex flex-col">
      <div v-if="!activeUserId" class="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div class="text-center">
          <p class="text-4xl mb-3">💬</p>
          <p class="text-sm">Select a conversation or start a new one.</p>
        </div>
      </div>

      <template v-else>
        <!-- Chat header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
            {{ activeUser?.name?.charAt(0) }}
          </div>
          <div>
            <p class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ activeUser?.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ activeUser?.department || 'Admin' }} · {{ activeUser?.role }}</p>
          </div>
        </div>

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3" ref="messagesContainer">
          <div v-if="loadingMessages" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
          </div>
          <div v-for="m in messages" :key="m.id"
            :class="['max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
              m.senderId === auth.user?.id
                ? 'ml-auto bg-indigo-600 text-white rounded-br-md'
                : 'mr-auto bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md']">
            <p>{{ m.body }}</p>
            <p :class="['text-xs mt-1',
              m.senderId === auth.user?.id ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500']">
              {{ timeShort(m.createdAt) }}
            </p>
          </div>
        </div>

        <!-- Input -->
        <form @submit.prevent="sendMessage" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <input v-model="newMessage" type="text" placeholder="Type a message..."
            class="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          <button type="submit" :disabled="!newMessage.trim() || sending"
            class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium">
            Send
          </button>
        </form>
      </template>
    </div>

    <!-- New conversation modal -->
    <div v-if="showNewChat" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showNewChat = false">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">New Message</h2>
          <button @click="showNewChat = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <div class="px-4 py-3">
          <input v-model="userSearch" type="text" placeholder="Search people..."
            class="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div class="max-h-60 overflow-y-auto px-2 pb-4">
          <button v-for="u in filteredUsers" :key="u.id"
            @click="startChat(u)"
            class="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
              {{ u.name.charAt(0) }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ u.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ u.department || 'Admin' }} · {{ u.role }}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();

const conversations = ref<any[]>([]);
const allUsers = ref<any[]>([]);
const messages = ref<any[]>([]);
const activeUserId = ref<string | null>(null);
const activeUser = ref<any>(null);
const newMessage = ref('');
const sending = ref(false);
const loadingMessages = ref(false);
const showNewChat = ref(false);
const userSearch = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const filteredUsers = computed(() => {
  const q = userSearch.value.toLowerCase();
  return allUsers.value
    .filter(u => u.id !== auth.user?.id)
    .filter(u => !q || u.name.toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q));
});

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function timeShort(date: string) {
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

async function selectConversation(user: any) {
  activeUserId.value = user.id;
  activeUser.value = user;
  showNewChat.value = false;
  await loadMessages();
}

function startChat(user: any) {
  selectConversation(user);
}

async function loadMessages() {
  if (!activeUserId.value) return;
  loadingMessages.value = true;
  try {
    const { data } = await api.get(`/messages/${activeUserId.value}`);
    messages.value = data;
    await nextTick();
    scrollToBottom();
    // Refresh conversations to update unread counts
    await fetchConversations();
  } catch (err) { console.error(err); }
  finally { loadingMessages.value = false; }
}

async function sendMessage() {
  if (!newMessage.value.trim() || !activeUserId.value) return;
  sending.value = true;
  try {
    const { data } = await api.post(`/messages/${activeUserId.value}`, { body: newMessage.value.trim() });
    messages.value.push(data);
    newMessage.value = '';
    await nextTick();
    scrollToBottom();
    await fetchConversations();
  } catch (err) { console.error(err); }
  finally { sending.value = false; }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function fetchConversations() {
  try {
    const { data } = await api.get('/messages/conversations');
    conversations.value = data;
  } catch (err) { console.error(err); }
}

async function fetchAllUsers() {
  try {
    const { data } = await api.get('/messages/users/all');
    allUsers.value = data;
  } catch (err) { console.error(err); }
}

onMounted(async () => {
  await Promise.all([fetchConversations(), fetchAllUsers()]);
});
</script>
