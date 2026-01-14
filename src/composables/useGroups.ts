import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import type { Group, Member, MemberRole } from '@/types'
import {
    groupsCollection,
    groupDoc,
    groupMembersCollection,
    memberDoc,
    createDocument,
    setDocument,
    getDocument,
    queryDocuments,
    updateDocument,
    where,
    Timestamp,
} from '@/services/firebase/firestore'
import { getDocs } from 'firebase/firestore'

export const useGroups = () => {
    const authStore = useAuthStore()
    const groupsStore = useGroupsStore()
    const error = ref<string | null>(null)
    const isLoading = ref(false)

    const generateInviteCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase()
    }

    const generatePublicSlug = () => {
        return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    }

    const createGroup = async (name: string) => {
        if (!authStore.userId) {
            error.value = 'Debes iniciar sesión'
            return null
        }

        try {
            isLoading.value = true
            error.value = null

            const groupData: Omit<Group, 'id'> = {
                name,
                ownerId: authStore.userId,
                inviteCode: generateInviteCode(),
                publicRead: false,
                publicSlug: generatePublicSlug(),
                createdAt: Timestamp.now(),
                createdBy: authStore.userId,
            }

            const docRef = await createDocument(groupsCollection(), groupData)

            // Add creator as owner member
            await setDocument(memberDoc(docRef.id, authStore.userId), {
                userId: authStore.userId,
                role: 'owner' as MemberRole,
                joinedAt: Timestamp.now(),
                displayName: authStore.displayName,
                photoURL: authStore.photoURL,
            })

            const newGroup = { id: docRef.id, ...groupData } as Group
            groupsStore.addGroup(newGroup)

            return newGroup
        } catch (err: any) {
            error.value = err.message || 'Error al crear grupo'
            console.error('Create group error:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    const joinGroupByCode = async (inviteCode: string) => {
        if (!authStore.userId) {
            error.value = 'Debes iniciar sesión'
            return null
        }

        try {
            isLoading.value = true
            error.value = null

            const groups = await queryDocuments(
                groupsCollection(),
                where('inviteCode', '==', inviteCode.toUpperCase())
            )

            if (groups.length === 0) {
                error.value = 'Código de invitación no válido'
                return null
            }

            const group = groups[0] as Group

            // Check if already a member
            const existingMember = await getDocument(memberDoc(group.id, authStore.userId))
            if (existingMember) {
                error.value = 'Ya eres miembro de este grupo'
                return group
            }

            // Add as viewer by default
            await setDocument(memberDoc(group.id, authStore.userId), {
                userId: authStore.userId,
                role: 'viewer' as MemberRole,
                joinedAt: Timestamp.now(),
                displayName: authStore.displayName,
                photoURL: authStore.photoURL,
            })

            groupsStore.addGroup(group)

            return group
        } catch (err: any) {
            error.value = err.message || 'Error al unirse al grupo'
            console.error('Join group error:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    const loadUserGroups = async () => {
        if (!authStore.userId) return

        try {
            isLoading.value = true

            // Get all groups where user is a member (via subcollection)
            const allGroups = await queryDocuments(groupsCollection())
            const userGroups: Group[] = []

            for (const group of allGroups) {
                const memberRef = memberDoc(group.id, authStore.userId)
                const member = await getDocument(memberRef)
                if (member) {
                    userGroups.push(group as Group)
                }
            }

            groupsStore.setGroups(userGroups)
        } catch (err: any) {
            error.value = err.message || 'Error al cargar grupos'
            console.error('Load groups error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const getGroupMembers = async (groupId: string): Promise<Member[]> => {
        try {
            const membersSnapshot = await getDocs(groupMembersCollection(groupId))
            return membersSnapshot.docs.map(doc => ({ ...doc.data() } as Member))
        } catch (err: any) {
            error.value = err.message || 'Error al cargar miembros'
            console.error('Load members error:', err)
            return []
        }
    }

    const updateMemberRole = async (groupId: string, userId: string, role: MemberRole) => {
        try {
            isLoading.value = true
            await updateDocument(memberDoc(groupId, userId), { role })
        } catch (err: any) {
            error.value = err.message || 'Error al actualizar rol'
            console.error('Update role error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const togglePublicAccess = async (groupId: string, publicRead: boolean) => {
        try {
            isLoading.value = true
            await updateDocument(groupDoc(groupId), { publicRead })
            groupsStore.updateGroup(groupId, { publicRead })
        } catch (err: any) {
            error.value = err.message || 'Error al actualizar acceso público'
            console.error('Toggle public error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const getGroupByPublicSlug = async (publicSlug: string): Promise<Group | null> => {
        try {
            const groups = await queryDocuments(
                groupsCollection(),
                where('publicSlug', '==', publicSlug),
                where('publicRead', '==', true)
            )

            if (groups.length === 0) return null
            return groups[0] as Group
        } catch (err: any) {
            error.value = err.message || 'Error al cargar grupo público'
            console.error('Get public group error:', err)
            return null
        }
    }

    return {
        error,
        isLoading,
        createGroup,
        joinGroupByCode,
        loadUserGroups,
        getGroupMembers,
        updateMemberRole,
        togglePublicAccess,
        getGroupByPublicSlug,
    }
}
