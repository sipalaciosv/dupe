import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { User as FirebaseUser } from 'firebase/auth'
import type { User, Member } from '@/types'

export const useAuthStore = defineStore('auth', () => {
    const firebaseUser = ref<FirebaseUser | null>(null)
    const userData = ref<User | null>(null)
    const currentMembership = ref<Member | null>(null)
    const isLoading = ref(true)

    const isAuthenticated = computed(() => firebaseUser.value !== null)
    const userId = computed(() => firebaseUser.value?.uid || null)
    const displayName = computed(() => firebaseUser.value?.displayName || 'Usuario')
    const email = computed(() => firebaseUser.value?.email || '')
    const photoURL = computed(() => firebaseUser.value?.photoURL || '')

    const setUser = (user: FirebaseUser | null) => {
        firebaseUser.value = user
        isLoading.value = false
    }

    const setUserData = (data: User | null) => {
        userData.value = data
    }

    const setCurrentMembership = (membership: Member | null) => {
        currentMembership.value = membership
    }

    const clearAuth = () => {
        firebaseUser.value = null
        userData.value = null
        currentMembership.value = null
    }

    return {
        firebaseUser,
        userData,
        currentMembership,
        isLoading,
        isAuthenticated,
        userId,
        displayName,
        email,
        photoURL,
        setUser,
        setUserData,
        setCurrentMembership,
        clearAuth,
    }
})
