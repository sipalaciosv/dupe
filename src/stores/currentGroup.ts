import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Group, Member } from '@/types'

export const useCurrentGroupStore = defineStore('currentGroup', () => {
    const currentGroup = ref<Group | null>(null)
    const members = ref<Member[]>([])
    const isPublicView = ref(false)

    const groupId = computed(() => currentGroup.value?.id || null)
    const groupName = computed(() => currentGroup.value?.name || 'Sin grupo')
    const isOwner = computed(() => {
        // Check if current user is owner
        return false // TODO: implement based on auth store
    })

    const setCurrentGroup = (group: Group | null) => {
        currentGroup.value = group
    }

    const setMembers = (membersList: Member[]) => {
        members.value = membersList
    }

    const setPublicView = (isPublic: boolean) => {
        isPublicView.value = isPublic
    }

    const clearCurrentGroup = () => {
        currentGroup.value = null
        members.value = []
        isPublicView.value = false
    }

    return {
        currentGroup,
        members,
        isPublicView,
        groupId,
        groupName,
        isOwner,
        setCurrentGroup,
        setMembers,
        setPublicView,
        clearCurrentGroup,
    }
})
