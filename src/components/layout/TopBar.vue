<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentGroupStore } from '@/stores/currentGroup'
import { useGroupsStore } from '@/stores/groups'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const currentGroupStore = useCurrentGroupStore()
const groupsStore = useGroupsStore()

const currentGroupName = computed(() => currentGroupStore.groupName)
const groups = computed(() => groupsStore.groups)

const switchGroup = async (groupId: string) => {
  const group = groupsStore.getGroupById(groupId)
  if (group) {
    currentGroupStore.setCurrentGroup(group)

    // Load user's membership for this group
    const authStore = useAuthStore()
    if (authStore.userId) {
      const { getDocument, memberDoc } = await import('@/services/firebase/firestore')
      const membership = await getDocument(memberDoc(groupId, authStore.userId))
      if (membership) {
        authStore.setCurrentMembership(membership as any)
      }
    }

    router.push({ name: 'home' })
  }
}
</script>

<template>
  <div class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex items-center space-x-3">
        <h1 class="text-xl font-bold text-primary-600">DupeZOFRI</h1>
      </div>

      <!-- Group Selector -->
      <div class="relative">
        <select v-if="groups.length > 0"
          class="px-3 py-1.5 pr-8 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
          :value="currentGroupStore.currentGroup?.id" @change="switchGroup(($event.target as HTMLSelectElement).value)">
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
        <div v-else class="text-sm font-medium text-gray-500">
          {{ currentGroupName }}
        </div>

        <svg v-if="groups.length > 0"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>

  <!-- Spacer to prevent content from going under the fixed topbar -->
  <div class="h-14"></div>
</template>
