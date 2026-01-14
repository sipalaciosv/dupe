import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCurrentGroupStore } from '@/stores/currentGroup'
import type { Member, MemberRole } from '@/types'

export const usePermissions = () => {
    const authStore = useAuthStore()
    const currentGroupStore = useCurrentGroupStore()

    const canEdit = ref(false)
    const canManageMembers = ref(false)
    const canManagePublic = ref(false)

    const checkPermissions = (membership: Member | null) => {
        if (!membership) {
            canEdit.value = false
            canManageMembers.value = false
            canManagePublic.value = false
            return
        }

        const role = membership.role

        // Owner and Editor can edit
        canEdit.value = role === 'owner' || role === 'editor'

        // Only owner can manage members and public settings
        canManageMembers.value = role === 'owner'
        canManagePublic.value = role === 'owner'
    }

    const hasRole = (role: MemberRole): boolean => {
        const membership = authStore.currentMembership
        if (!membership) return false

        if (role === 'owner') {
            return membership.role === 'owner'
        } else if (role === 'editor') {
            return membership.role === 'owner' || membership.role === 'editor'
        } else if (role === 'viewer') {
            return membership.role === 'owner' || membership.role === 'editor' || membership.role === 'viewer'
        }

        return false
    }

    const canCreateOriginal = () => hasRole('viewer')
    const canEditOriginal = () => hasRole('editor')
    const canCreateDupe = () => hasRole('viewer')
    const canEditDupe = () => hasRole('editor')
    const canCreateOffer = () => hasRole('editor')
    const canVote = () => hasRole('viewer') // All members can vote
    const canCreateExpedition = () => hasRole('editor')

    return {
        canEdit,
        canManageMembers,
        canManagePublic,
        checkPermissions,
        hasRole,
        canCreateOriginal,
        canEditOriginal,
        canCreateDupe,
        canEditDupe,
        canCreateOffer,
        canVote,
        canCreateExpedition,
    }
}
