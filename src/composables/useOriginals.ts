import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Original, OriginalFormData } from '@/types'
import {
    originalsCollection,
    originalDoc,
    createDocument,
    queryDocuments,
    getDocument,
    updateDocument,
    deleteDocument,
    orderBy,
    Timestamp,
} from '@/services/firebase/firestore'

const normalizeSlug = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .trim()
        .replace(/\s+/g, '-')
}

export const useOriginals = () => {
    const authStore = useAuthStore()
    const error = ref<string | null>(null)
    const isLoading = ref(false)
    const originals = ref<Original[]>([])

    const loadOriginals = async (groupId: string) => {
        try {
            isLoading.value = true
            error.value = null

            const docs = await queryDocuments(
                originalsCollection(groupId),
                orderBy('nombre', 'asc')
            )

            originals.value = docs as Original[]
        } catch (err: any) {
            error.value = err.message || 'Error al cargar originales'
            console.error('Load originals error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const getOriginal = async (groupId: string, originalId: string): Promise<Original | null> => {
        try {
            const doc = await getDocument(originalDoc(groupId, originalId))
            return doc as Original | null
        } catch (err: any) {
            error.value = err.message || 'Error al cargar original'
            console.error('Get original error:', err)
            return null
        }
    }

    const checkDuplicateSlug = async (groupId: string, slug: string): Promise<boolean> => {
        const docs = await queryDocuments(originalsCollection(groupId))
        return docs.some((doc: any) => doc.slug === slug)
    }

    const createOriginal = async (groupId: string, formData: OriginalFormData): Promise<Original | null> => {
        if (!authStore.userId) {
            error.value = 'Debes iniciar sesión'
            return null
        }

        try {
            isLoading.value = true
            error.value = null

            const slug = normalizeSlug(formData.nombre)

            // Check for duplicate
            const isDuplicate = await checkDuplicateSlug(groupId, slug)
            if (isDuplicate) {
                console.warn('Duplicate slug detected:', slug)
                // Continue anyway, just warn
            }

            let imagenPrincipal: string | undefined

            // Upload image if provided
            if (formData.imageFile) {
                const { uploadImage, getDupeImagePath } = await import('@/services/firebase/storage')
                const tempId = `original-${Date.now()}`
                const imagePath = getDupeImagePath(groupId, tempId, formData.imageFile.name)
                imagenPrincipal = await uploadImage(formData.imageFile, imagePath)
            }

            const originalData: any = {
                groupId,
                nombre: formData.nombre,
                tags: formData.tags || [],
                slug,
                createdAt: Timestamp.now(),
                createdBy: authStore.userId,
                createdByName: authStore.displayName || 'Usuario',
            }

            // Only add optional fields if they have values
            if (formData.marca) originalData.marca = formData.marca
            if (formData.ml) originalData.ml = formData.ml
            if (formData.urlFragrantica) originalData.urlFragrantica = formData.urlFragrantica
            if (imagenPrincipal) originalData.imagenPrincipal = imagenPrincipal
            if (formData.tiendas && formData.tiendas.length > 0) originalData.tiendas = formData.tiendas
            if (authStore.photoURL) originalData.createdByPhoto = authStore.photoURL

            const docRef = await createDocument(originalsCollection(groupId), originalData)
            const newOriginal = { id: docRef.id, ...originalData } as Original

            originals.value.push(newOriginal)

            return newOriginal
        } catch (err: any) {
            error.value = err.message || 'Error al crear original'
            console.error('Create original error:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    const updateOriginal = async (
        groupId: string,
        originalId: string,
        formData: Partial<OriginalFormData>
    ): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            const updates: any = {}
            if (formData.nombre !== undefined) {
                updates.nombre = formData.nombre
                updates.slug = normalizeSlug(formData.nombre)
            }
            if (formData.marca !== undefined) updates.marca = formData.marca
            if (formData.ml !== undefined) updates.ml = formData.ml
            if (formData.urlFragrantica !== undefined) updates.urlFragrantica = formData.urlFragrantica
            if (formData.tags !== undefined) updates.tags = formData.tags
            if (formData.tiendas !== undefined) updates.tiendas = formData.tiendas

            await updateDocument(originalDoc(groupId, originalId), updates)

            // Update local state
            const index = originals.value.findIndex(o => o.id === originalId)
            if (index !== -1) {
                originals.value[index] = { ...originals.value[index], ...updates }
            }

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al actualizar original'
            console.error('Update original error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    const deleteOriginal = async (groupId: string, originalId: string): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            await deleteDocument(originalDoc(groupId, originalId))

            // Update local state
            originals.value = originals.value.filter(o => o.id !== originalId)

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al eliminar original'
            console.error('Delete original error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    return {
        error,
        isLoading,
        originals,
        loadOriginals,
        getOriginal,
        createOriginal,
        updateOriginal,
        deleteOriginal,
        checkDuplicateSlug,
    }
}
