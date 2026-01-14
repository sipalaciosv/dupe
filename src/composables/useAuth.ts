import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { signInWithGoogle, signOut as firebaseSignOut, onAuthChange } from '@/services/firebase/auth'
import { userDoc, setDocument, getDocument } from '@/services/firebase/firestore'
import type { Member } from '@/types'

export const useAuth = () => {
    const authStore = useAuthStore()
    const error = ref<string | null>(null)
    const isLoading = ref(false)

    const signIn = async () => {
        try {
            isLoading.value = true
            error.value = null
            const user = await signInWithGoogle()

            // Create or update user document
            if (user) {
                const userDocRef = userDoc(user.uid)
                const existingUser = await getDocument(userDocRef)

                if (!existingUser) {
                    await setDocument(userDocRef, {
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                    })
                }
            }
        } catch (err: any) {
            error.value = err.message || 'Error al iniciar sesión'
            console.error('Sign in error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const signOut = async () => {
        try {
            isLoading.value = true
            error.value = null
            await firebaseSignOut()
            authStore.clearAuth()
        } catch (err: any) {
            error.value = err.message || 'Error al cerrar sesión'
            console.error('Sign out error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const loadMembership = async (groupId: string) => {
        if (!authStore.userId) return

        try {
            const { getDocument, memberDoc } = await import('@/services/firebase/firestore')
            const membership = await getDocument(memberDoc(groupId, authStore.userId))
            if (membership) {
                authStore.setCurrentMembership(membership as Member)
                console.log('Membership loaded:', membership)
            } else {
                console.warn('No membership found for user in this group')
                authStore.setCurrentMembership(null)
            }
        } catch (err) {
            console.error('Error loading membership:', err)
            authStore.setCurrentMembership(null)
        }
    }

    const initializeAuth = () => {
        return onAuthChange((user) => {
            authStore.setUser(user)
        })
    }

    return {
        error,
        isLoading,
        signIn,
        signOut,
        initAuth: initializeAuth,
        loadMembership,
    }
}
