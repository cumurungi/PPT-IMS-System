<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-6 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Weekly Report</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Auto-generated from system activity {{ startDate.value && endDate.value ? `· ${formatDate(startDate.value)} – ${formatDate(endDate.value)}` : '' }}
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500 dark:text-gray-400">From:</label>
          <input
            v-model="startDate"
            type="date"
            @input="onDatePicked"
            class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500 dark:text-gray-400">To:</label>
          <input
            v-model="endDate"
            type="date"
            @input="onDatePicked"
            class="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button @click="prevWeek" class="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">← Previous</button>
        <button @click="thisWeek" class="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">This Week</button>
        <button @click="nextWeek" class="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Next →</button>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
    </div>

    <div v-else class="flex-1 overflow-auto space-y-6">
      <!-- Department sections -->
      <div v-for="(employees, dept) in data.departments" :key="dept">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">{{ deptIcon(dept) }}</span>
          <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ deptLabel(dept) }}</h2>
          <span class="text-xs text-gray-400 dark:text-gray-500">({{ employees.length }} members)</span>
        </div>

        <div class="space-y-3">
          <div v-for="r in employees" :key="r.user.id"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
                  {{ r.user.name.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-gray-100 text-sm">{{ r.user.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ r.user.role }}</p>
                </div>
              </div>
            </div>

            <!-- Stats: Done this week / In progress / Next week (consistent for all departments) -->
            <div class="grid grid-cols-4 gap-2 mb-3">
              <div class="bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1.5 text-center">
                <p class="text-lg font-bold text-green-700 dark:text-green-300">{{ r.summary.doneThisWeek }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Done This Week</p>
              </div>
              <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-2 py-1.5 text-center">
                <p class="text-lg font-bold text-yellow-700 dark:text-yellow-300">{{ r.summary.inProgress }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1.5 text-center">
                <p class="text-lg font-bold text-blue-700 dark:text-blue-300">{{ r.summary.nextWeekCount }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
              </div>
              <!-- Department-specific 4th stat -->
              <div v-if="r.user.department === 'MEDIA'" class="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-2 py-1.5 text-center">
                <p class="text-lg font-bold text-purple-700 dark:text-purple-300">{{ r.summary.recordingsWorked }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Recordings</p>
              </div>
              <div v-else-if="r.user.department === 'IT'" class="bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1.5 text-center">
                <p class="text-lg font-bold text-gray-700 dark:text-gray-300">{{ r.summary.ticketsHandled + r.summary.published }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Tickets + Published</p>
              </div>
              <div v-else-if="r.user.department === 'HR_FINANCE'" class="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-2 py-1.5 text-center">
                <p class="text-lg font-bold text-indigo-700 dark:text-indigo-300">{{ r.summary.doneThisWeek }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Approvals + Tasks</p>
              </div>
              <div v-else class="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-2 py-1.5 text-center">
                <p class="text-lg font-bold text-indigo-700 dark:text-indigo-300">{{ r.summary.totalCompleted }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Total Done</p>
              </div>
            </div>

            <!-- Detailed lists (consistent Done / In Progress / Next Week structure) -->
            <div class="space-y-2">
              <!-- ============ MEDIA ============ -->
              <template v-if="r.user.department === 'MEDIA'">
                <div v-if="r.details.recordingsDone?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Done This Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.recordingsDone" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-else-if="r.details.recentCompleted?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Recently Done (previous weeks):</p>
                  <ul class="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    <li v-for="t in r.details.recentCompleted" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.recordingsInProgress?.length > 0">
                  <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🔄 In Progress:</p>
                  <ul class="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                    <li v-for="t in r.details.recordingsInProgress" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.nextWeekRecordings?.length > 0" class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📅 Next Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.nextWeekRecordings" :key="t">🎬 {{ t }}</li>
                  </ul>
                </div>
              </template>

              <!-- ============ EVANGELISM ============ -->
              <template v-else-if="r.user.department === 'EVANGELISM'">
                <div v-if="r.details.eventsThisWeek?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Sermons Done / Recorded This Week:</p>
                  <ul class="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    <li v-for="e in r.details.eventsThisWeek" :key="e.title" class="flex items-center gap-2">
                      <span class="font-medium">{{ e.title }}</span>
                      <span class="text-gray-400">· {{ formatEventDate(e.date) }}</span>
                      <span class="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{{ e.recordings?.[0]?.status || 'DONE' }}</span>
                      <span v-if="e.fromTask" class="text-indigo-500 text-xs">← {{ e.fromTask }}</span>
                    </li>
                  </ul>
                </div>
                <div v-if="r.details.sermons?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">📖 Sermons Scheduled This Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.sermons" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.eventsFromTasks?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">🔗 Sermons Created from Completed Tasks:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.eventsFromTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.approvals?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Sermons Approved/Reviewed:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.approvals" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.eventsInProgress?.length > 0">
                  <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🔄 In Progress:</p>
                  <ul class="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <li v-for="e in r.details.eventsInProgress" :key="e.title" class="flex items-center gap-2">
                      <span class="font-medium">{{ e.title }}</span>
                      <span class="text-gray-400">· {{ formatEventDate(e.date) }}</span>
                      <span class="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{{ e.recordings?.[0]?.status || 'IN_EDITING' }}</span>
                      <span v-if="e.fromTask" class="text-indigo-500 text-xs">← {{ e.fromTask }}</span>
                    </li>
                  </ul>
                </div>
                <div v-if="r.details.eventsNextWeek?.length > 0" class="mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                  <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📆 Next Week — Sermons to Record:</p>
                  <ul class="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    <li v-for="e in r.details.eventsNextWeek" :key="e.title" class="flex items-center gap-2">
                      <span class="font-medium">{{ e.title }}</span>
                      <span class="text-gray-400">· {{ formatEventDate(e.date) }}</span>
                      <span class="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{{ e.recordings?.[0]?.status || 'CAPTURED' }}</span>
                      <span v-if="e.fromTask" class="text-indigo-500 text-xs">← {{ e.fromTask }}</span>
                    </li>
                  </ul>
                </div>
              </template>

              <!-- ============ IT ============ -->
              <template v-else-if="r.user.department === 'IT'">
                <div v-if="r.details.published?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Published on Platforms (Done):</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.published" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.completedTasks?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Tasks Completed This Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.completedTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-else-if="r.details.recentCompleted?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Recently Completed (previous weeks):</p>
                  <ul class="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    <li v-for="t in r.details.recentCompleted" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.tickets?.length > 0">
                  <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🔄 Tickets Handled (In Progress):</p>
                  <ul class="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                    <li v-for="t in r.details.tickets" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.inProgressTasks?.length > 0">
                  <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🔄 Tasks In Progress:</p>
                  <ul class="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                    <li v-for="t in r.details.inProgressTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.nextWeekTasks?.length > 0" class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📅 Next Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.nextWeekTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
              </template>

              <!-- ============ IT ============ -->
              <template v-else-if="r.user.department === 'IT'">
                <div v-if="r.details.published?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Published on Platforms (Done):</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.published" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.completedTasks?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Tasks Completed This Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.completedTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-else-if="r.details.recentCompleted?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Recently Completed (previous weeks):</p>
                  <ul class="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    <li v-for="t in r.details.recentCompleted" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.itTicketsByStatus?.length > 0">
                  <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🎫 Tickets Handled:</p>
                  <ul class="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                    <li v-for="t in r.details.itTicketsByStatus" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.tickets?.length > 0">
                  <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🔄 Ticket Details:</p>
                  <ul class="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                    <li v-for="t in r.details.tickets" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.itQueueItems?.length > 0">
                  <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📡 Publishing Queue:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.itQueueItems" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.inProgressTasks?.length > 0">
                  <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🔄 Tasks In Progress:</p>
                  <ul class="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                    <li v-for="t in r.details.inProgressTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.nextWeekTasks?.length > 0" class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📅 Next Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.nextWeekTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
              </template>

              <!-- ============ HR / FINANCE / ADMIN / OTHER ============ -->
              <template v-else-if="r.user.department === 'HR_FINANCE'">
                <div v-if="r.details.leaveProcessed?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">🏖️ Leave Requests Processed:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.leaveProcessed" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.expenseProcessed?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">💰 Expense Approvals Processed:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.expenseProcessed" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.attendanceUploaded?.length > 0">
                  <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📄 Attendance Reports Uploaded:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.attendanceUploaded" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.completedTasks?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Done This Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.completedTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-else-if="r.details.recentCompleted?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Recently Done (previous weeks):</p>
                  <ul class="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    <li v-for="t in r.details.recentCompleted" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.inProgressTasks?.length > 0">
                  <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🔄 In Progress:</p>
                  <ul class="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                    <li v-for="t in r.details.inProgressTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.tasksAssigned?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">📋 Tasks Assigned to Team:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.tasksAssigned" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.nextWeekTasks?.length > 0" class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📅 Next Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.nextWeekTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
              </template>

              <!-- ============ ADMIN / OTHER ============ -->
              <template v-else>
                <div v-if="r.details.completedTasks?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Done This Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.completedTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-else-if="r.details.recentCompleted?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">✅ Recently Done (previous weeks):</p>
                  <ul class="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    <li v-for="t in r.details.recentCompleted" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.inProgressTasks?.length > 0">
                  <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🔄 In Progress:</p>
                  <ul class="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                    <li v-for="t in r.details.inProgressTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.tasksAssigned?.length > 0">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">📋 Tasks Assigned to Team:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.tasksAssigned" :key="t">{{ t }}</li>
                  </ul>
                </div>
                <div v-if="r.details.nextWeekTasks?.length > 0" class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📅 Next Week:</p>
                  <ul class="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <li v-for="t in r.details.nextWeekTasks" :key="t">{{ t }}</li>
                  </ul>
                </div>
              </template>

              <p v-if="r.summary.doneThisWeek === 0 && r.summary.inProgress === 0 && r.summary.nextWeekCount === 0 && !r.details.recordingsDone?.length && !r.details.recordingsInProgress?.length && !r.details.itTicketsByStatus?.length && !r.details.itQueueItems?.length && !r.details.leaveProcessed?.length && !r.details.expenseProcessed?.length && !r.details.attendanceUploaded?.length"
                class="text-xs text-gray-400 dark:text-gray-500 italic">No activity this week.</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="Object.keys(data.departments || {}).length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">📊</p>
        <p class="text-sm">No activity data for this week.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/axios';

const data = ref<any>({ departments: {}, reports: [] });
const loading = ref(true);
const weekStart = ref('');
const startDate = ref('');
const endDate = ref('');

function getMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(now);
  mon.setDate(now.getDate() - diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function getSunday() {
  const mon = getMonday();
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return sun;
}

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function onDatePicked() {
  if (!startDate.value || !endDate.value) return;
  const start = parseDate(startDate.value);
  const end = parseDate(endDate.value);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
  if (end < start) {
    endDate.value = startDate.value;
  }
  fetchReport();
}

function shiftWeek(days: number) {
  if (!startDate.value || !endDate.value) return;
  const start = parseDate(startDate.value);
  const end = parseDate(endDate.value);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
  start.setDate(start.getDate() + days);
  end.setDate(end.getDate() + days);
  startDate.value = toISODate(start);
  endDate.value = toISODate(end);
  fetchReport();
}

function prevWeek() {
  shiftWeek(-7);
}
function nextWeek() {
  shiftWeek(7);
}
function thisWeek() {
  const mon = getMonday();
  const sun = getSunday();
  startDate.value = toISODate(mon);
  endDate.value = toISODate(sun);
  fetchReport();
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function deptIcon(dept: string | number) {
  const map: Record<string, string> = { MEDIA: '🎥', EVANGELISM: '📖', IT: '🎫', HR_FINANCE: '👥', ADMIN: '⚙️' };
  return map[dept] || '📁';
}

function deptLabel(dept: string | number) {
  const map: Record<string, string> = { MEDIA: 'Media', EVANGELISM: 'Evangelism', IT: 'IT', HR_FINANCE: 'HR / Finance', ADMIN: 'Administration' };
  return map[dept] || dept;
}

function formatEventDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function eventStatusDot(status: string) {
  const map: Record<string, string> = {
    PLANNED: 'w-1.5 h-1.5 rounded-full bg-blue-500',
    CONFIRMED: 'w-1.5 h-1.5 rounded-full bg-indigo-500',
    IN_PROGRESS: 'w-1.5 h-1.5 rounded-full bg-yellow-500',
    COMPLETED: 'w-1.5 h-1.5 rounded-full bg-green-500',
    CANCELLED: 'w-1.5 h-1.5 rounded-full bg-red-500',
  };
  return map[status] || 'w-1.5 h-1.5 rounded-full bg-gray-400';
}

function eventStatusBadge(status: string) {
  const map: Record<string, string> = {
    PLANNED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    CONFIRMED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

async function fetchReport() {
  loading.value = true;
  try {
    const params: any = {};
    if (startDate.value) params.startDate = startDate.value;
    if (endDate.value) params.endDate = endDate.value;
    const { data: result } = await api.get('/reports/auto-weekly', { params });
    data.value = result;
    weekStart.value = result.weekStart;
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
}

onMounted(() => {
  const mon = getMonday();
  const sun = getSunday();
  startDate.value = toISODate(mon);
  endDate.value = toISODate(sun);
  fetchReport();
});
</script>
