import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Vote, VoteFormData } from '@/types'
import {
    votesCollection,
    voteDoc,
    setDocument,
    queryDocuments,
    getDocument,
    Timestamp,
} from '@/services/firebase/firestore'
import { getDocs } from 'firebase/firestore'

export const useVotes = () => {
    const authStore = useAuthStore()
    const error = ref<string | null>(null)
    const isLoading = ref(false)
    const votes = ref<Vote[]>([])
    const userVote = ref<Vote | null>(null)

    const averages = computed(() => {
        if (votes.value.length === 0) {
            return {
                parecido: 0,
                gustoAlAplicar: 0,
                gustoDespues: 0,
                count: 0,
            }
        }

        const sum = votes.value.reduce(
            (acc, vote) => ({
                parecido: acc.parecido + vote.parecido,
                gustoAlAplicar: acc.gustoAlAplicar + vote.gustoAlAplicar,
                gustoDespues: acc.gustoDespues + vote.gustoDespues,
            }),
            { parecido: 0, gustoAlAplicar: 0, gustoDespues: 0 }
        )

        const count = votes.value.length

        return {
            parecido: sum.parecido / count,
            gustoAlAplicar: sum.gustoAlAplicar / count,
            gustoDespues: sum.gustoDespues / count,
            count,
        }
    })

    const loadVotes = async (groupId: string, dupeId: string) => {
        try {
            isLoading.value = true
            error.value = null

            const votesSnapshot = await getDocs(votesCollection(groupId, dupeId))
            votes.value = votesSnapshot.docs.map(doc => ({
                userId: doc.id,
                ...doc.data(),
            })) as Vote[]

            // Load user's vote if exists
            if (authStore.userId) {
                const userVoteDoc = await getDocument(voteDoc(groupId, dupeId, authStore.userId))
                userVote.value = userVoteDoc as Vote | null
            }
        } catch (err: any) {
            error.value = err.message || 'Error al cargar votos'
            console.error('Load votes error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const saveVote = async (
        groupId: string,
        dupeId: string,
        formData: VoteFormData
    ): Promise<boolean> => {
        if (!authStore.userId) {
            error.value = 'Debes iniciar sesión'
            return false
        }

        try {
            isLoading.value = true
            error.value = null

            const voteData: any = {
                userId: authStore.userId,
                dupeId,
                parecido: formData.parecido,
                gustoAlAplicar: formData.gustoAlAplicar,
                gustoDespues: formData.gustoDespues,
                updatedAt: Timestamp.now(),
                displayName: authStore.displayName,
            }

            // Only add optional fields if they have values
            if (formData.comentario) voteData.comentario = formData.comentario
            if (authStore.photoURL) voteData.photoURL = authStore.photoURL

            await setDocument(voteDoc(groupId, dupeId, authStore.userId), voteData)

            // Update local state
            userVote.value = voteData as Vote

            // Reload all votes to update averages
            await loadVotes(groupId, dupeId)

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al guardar voto'
            console.error('Save vote error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Original perfume votes
    const loadOriginalVotes = async (groupId: string, originalId: string) => {
        try {
            isLoading.value = true
            error.value = null

            const { collection, doc } = await import('firebase/firestore')
            const { db } = await import('@/services/firebase')

            const votesRef = collection(db, `groups/${groupId}/originals/${originalId}/votes`)
            const votesSnapshot = await getDocs(votesRef)
            votes.value = votesSnapshot.docs.map(d => ({
                userId: d.id,
                ...d.data(),
            })) as Vote[]

            // Load user's vote if exists
            if (authStore.userId) {
                const userVoteDocRef = doc(db, `groups/${groupId}/originals/${originalId}/votes/${authStore.userId}`)
                const userVoteSnap = await getDocument(userVoteDocRef as any)
                userVote.value = userVoteSnap as Vote | null
            }
        } catch (err: any) {
            error.value = err.message || 'Error al cargar votos'
            console.error('Load original votes error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const saveOriginalVote = async (
        groupId: string,
        originalId: string,
        formData: VoteFormData
    ): Promise<boolean> => {
        if (!authStore.userId) {
            error.value = 'Debes iniciar sesión'
            return false
        }

        try {
            isLoading.value = true
            error.value = null

            const voteData: any = {
                userId: authStore.userId,
                originalId,
                parecido: formData.parecido,
                gustoAlAplicar: formData.gustoAlAplicar,
                gustoDespues: formData.gustoDespues,
                updatedAt: Timestamp.now(),
                displayName: authStore.displayName,
            }

            // Only add optional fields if they have values
            if (formData.comentario) voteData.comentario = formData.comentario
            if (authStore.photoURL) voteData.photoURL = authStore.photoURL

            const { doc } = await import('firebase/firestore')
            const { db } = await import('@/services/firebase')
            const voteDocRef = doc(db, `groups/${groupId}/originals/${originalId}/votes/${authStore.userId}`)

            await setDocument(voteDocRef as any, voteData)

            // Update local state
            userVote.value = voteData as Vote

            // Reload all votes to update averages
            await loadOriginalVotes(groupId, originalId)

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al guardar voto'
            console.error('Save original vote error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    return {
        error,
        isLoading,
        votes,
        userVote,
        averages,
        loadVotes,
        saveVote,
        loadOriginalVotes,
        saveOriginalVote,
    }
}
