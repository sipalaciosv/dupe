import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Expedition, ExpeditionItem, ExpeditionStatus, ExpeditionItemStatus } from '@/types'
import {
    expeditionsCollection,
    expeditionDoc,
    expeditionItemsCollection,
    createDocument,
    queryDocuments,
    updateDocument,
    orderBy,
    where,
    Timestamp,
} from '@/services/firebase/firestore'
import { getDocs, addDoc, doc, updateDoc } from 'firebase/firestore'

export const useExpeditions = () => {
    const authStore = useAuthStore()
    const error = ref<string | null>(null)
    const isLoading = ref(false)
    const expeditions = ref<Expedition[]>([])
    const currentExpedition = ref<Expedition | null>(null)
    const expeditionItems = ref<ExpeditionItem[]>([])

    const loadExpeditions = async (groupId: string) => {
        try {
            isLoading.value = true
            error.value = null

            const docs = await queryDocuments(
                expeditionsCollection(groupId),
                orderBy('fecha', 'desc')
            )

            expeditions.value = docs as Expedition[]

            // Find active expedition
            const active = expeditions.value.find(e => e.estado === 'activa')
            currentExpedition.value = active || null
        } catch (err: any) {
            error.value = err.message || 'Error al cargar expediciones'
            console.error('Load expeditions error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const createExpedition = async (groupId: string, nombre: string): Promise<Expedition | null> => {
        if (!authStore.userId) {
            error.value = 'Debes iniciar sesión'
            return null
        }

        try {
            isLoading.value = true
            error.value = null

            const expeditionData: Omit<Expedition, 'id'> = {
                groupId,
                nombre,
                fecha: Timestamp.now(),
                estado: 'activa' as ExpeditionStatus,
                createdBy: authStore.userId,
                createdAt: Timestamp.now(),
            }

            const docRef = await createDocument(expeditionsCollection(groupId), expeditionData)
            const newExpedition = { id: docRef.id, ...expeditionData } as Expedition

            expeditions.value.unshift(newExpedition)
            currentExpedition.value = newExpedition

            return newExpedition
        } catch (err: any) {
            error.value = err.message || 'Error al crear expedición'
            console.error('Create expedition error:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    const closeExpedition = async (groupId: string, expeditionId: string): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            await updateDocument(expeditionDoc(groupId, expeditionId), {
                estado: 'cerrada' as ExpeditionStatus,
            })

            // Update local state
            const index = expeditions.value.findIndex(e => e.id === expeditionId)
            if (index !== -1) {
                expeditions.value[index].estado = 'cerrada'
            }

            if (currentExpedition.value?.id === expeditionId) {
                currentExpedition.value = null
            }

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al cerrar expedición'
            console.error('Close expedition error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    const loadExpeditionItems = async (groupId: string, expeditionId: string) => {
        try {
            isLoading.value = true
            error.value = null

            const itemsSnapshot = await getDocs(expeditionItemsCollection(groupId, expeditionId))
            expeditionItems.value = itemsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as ExpeditionItem[]
        } catch (err: any) {
            error.value = err.message || 'Error al cargar items'
            console.error('Load expedition items error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const addExpeditionItem = async (
        groupId: string,
        expeditionId: string,
        dupeId?: string,
        nombre?: string,
        originalId?: string
    ): Promise<ExpeditionItem | null> => {
        if (!authStore.userId) {
            error.value = 'Debes iniciar sesión'
            return null
        }

        try {
            isLoading.value = true
            error.value = null

            // Check for duplicates
            const isDuplicate = expeditionItems.value.some(item => {
                if (dupeId && item.dupeId === dupeId) return true
                if (originalId && item.originalId === originalId) return true
                if (nombre && item.nombre === nombre) return true
                return false
            })

            if (isDuplicate) {
                alert('Este perfume ya está en la expedición')
                return null
            }

            const itemData: any = {
                expeditionId,
                status: 'por_probar' as ExpeditionItemStatus,
                updatedAt: Timestamp.now(),
                updatedBy: authStore.userId,
            }

            // Only add optional fields if they have values
            if (dupeId) itemData.dupeId = dupeId
            if (nombre) itemData.nombre = nombre
            if (originalId) itemData.originalId = originalId

            const docRef = await addDoc(expeditionItemsCollection(groupId, expeditionId), itemData)
            const newItem = { id: docRef.id, ...itemData } as ExpeditionItem

            expeditionItems.value.push(newItem)

            return newItem
        } catch (err: any) {
            error.value = err.message || 'Error al agregar item'
            console.error('Add expedition item error:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    const updateItemStatus = async (
        groupId: string,
        expeditionId: string,
        itemId: string,
        status: ExpeditionItemStatus,
        notasRapidas?: string
    ): Promise<boolean> => {
        if (!authStore.userId) {
            error.value = 'Debes iniciar sesión'
            return false
        }

        try {
            isLoading.value = true
            error.value = null

            const itemRef = doc(expeditionItemsCollection(groupId, expeditionId), itemId)
            const updates: any = {
                status,
                updatedAt: Timestamp.now(),
                updatedBy: authStore.userId,
            }

            // Only add notasRapidas if provided
            if (notasRapidas !== undefined) {
                updates.notasRapidas = notasRapidas
            }

            await updateDoc(itemRef, updates)

            // Update local state
            const index = expeditionItems.value.findIndex(item => item.id === itemId)
            if (index !== -1) {
                expeditionItems.value[index].status = status
                if (notasRapidas !== undefined) {
                    expeditionItems.value[index].notasRapidas = notasRapidas
                }
                expeditionItems.value[index].updatedAt = Timestamp.now()
            }

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al actualizar item'
            console.error('Update item status error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    return {
        error,
        isLoading,
        expeditions,
        currentExpedition,
        expeditionItems,
        loadExpeditions,
        createExpedition,
        closeExpedition,
        loadExpeditionItems,
        addExpeditionItem,
        updateItemStatus,
    }
}
