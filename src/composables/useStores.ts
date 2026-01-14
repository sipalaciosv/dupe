import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { GroupStore } from '@/types'
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'

export const useStores = () => {
    const authStore = useAuthStore()
    const stores = ref<GroupStore[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Collection reference
    const storesCollection = (groupId: string) => collection(db, `groups/${groupId}/stores`)
    const storeDoc = (groupId: string, storeId: string) => doc(db, `groups/${groupId}/stores/${storeId}`)

    // Load stores for a group
    const loadStores = async (groupId: string) => {
        try {
            isLoading.value = true
            error.value = null

            const q = query(
                storesCollection(groupId),
                orderBy('nombre', 'asc')
            )

            const snapshot = await getDocs(q)
            stores.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as GroupStore[]

            return stores.value
        } catch (err: any) {
            error.value = err.message || 'Error al cargar tiendas'
            console.error('Load stores error:', err)
            return []
        } finally {
            isLoading.value = false
        }
    }

    // Create a new store
    const createStore = async (
        groupId: string,
        nombre: string,
        tipo: 'fisica' | 'online' = 'fisica'
    ): Promise<GroupStore | null> => {
        try {
            if (!authStore.userId) {
                error.value = 'Usuario no autenticado'
                return null
            }

            isLoading.value = true
            error.value = null

            // Check if store already exists (case insensitive)
            const existingStore = stores.value.find(
                s => s.nombre.toLowerCase() === nombre.toLowerCase()
            )
            if (existingStore) {
                error.value = 'Esta tienda ya existe'
                return null
            }

            const storeData: Omit<GroupStore, 'id'> = {
                groupId,
                nombre,
                tipo,
                createdBy: authStore.userId,
                createdAt: Timestamp.now(),
            }

            const docRef = await addDoc(storesCollection(groupId), storeData)
            const newStore = { id: docRef.id, ...storeData } as GroupStore

            stores.value.push(newStore)
            stores.value.sort((a, b) => a.nombre.localeCompare(b.nombre))

            return newStore
        } catch (err: any) {
            error.value = err.message || 'Error al crear tienda'
            console.error('Create store error:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    // Update a store
    const updateStore = async (
        groupId: string,
        storeId: string,
        updates: { nombre?: string; tipo?: 'fisica' | 'online' }
    ): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            await updateDoc(storeDoc(groupId, storeId), updates)

            const index = stores.value.findIndex(s => s.id === storeId)
            if (index !== -1) {
                stores.value[index] = { ...stores.value[index], ...updates }
                stores.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
            }

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al actualizar tienda'
            console.error('Update store error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Delete a store
    const deleteStore = async (groupId: string, storeId: string): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            await deleteDoc(storeDoc(groupId, storeId))

            stores.value = stores.value.filter(s => s.id !== storeId)

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al eliminar tienda'
            console.error('Delete store error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Get or create store by name
    const getOrCreateStore = async (
        groupId: string,
        nombre: string,
        tipo: 'fisica' | 'online' = 'fisica'
    ): Promise<GroupStore | null> => {
        // Check if exists
        const existing = stores.value.find(
            s => s.nombre.toLowerCase() === nombre.toLowerCase()
        )
        if (existing) return existing

        // Create new
        return await createStore(groupId, nombre, tipo)
    }

    return {
        stores,
        isLoading,
        error,
        loadStores,
        createStore,
        updateStore,
        deleteStore,
        getOrCreateStore,
    }
}
