import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Group } from '@/types'

export const useGroupsStore = defineStore('groups', () => {
    const groups = ref<Group[]>([])
    const isLoading = ref(false)

    const setGroups = (groupsList: Group[]) => {
        groups.value = groupsList
    }

    const addGroup = (group: Group) => {
        groups.value.push(group)
    }

    const updateGroup = (groupId: string, updates: Partial<Group>) => {
        const index = groups.value.findIndex(g => g.id === groupId)
        if (index !== -1) {
            groups.value[index] = { ...groups.value[index], ...updates }
        }
    }

    const removeGroup = (groupId: string) => {
        groups.value = groups.value.filter(g => g.id !== groupId)
    }

    const getGroupById = (groupId: string) => {
        return groups.value.find(g => g.id === groupId)
    }

    return {
        groups,
        isLoading,
        setGroups,
        addGroup,
        updateGroup,
        removeGroup,
        getGroupById,
    }
})
