import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Dupe, DupeFormData } from '@/types'
import {
    dupesCollection,
    dupeDoc,
    createDocument,
    queryDocuments,
    getDocument,
    updateDocument,
    deleteDocument,
    orderBy,
    where,
    Timestamp,
} from '@/services/firebase/firestore'
import { uploadImage, getDupeImagePath } from '@/services/firebase/storage'

const normalizeSlug = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '-')
}

export const useDupes = () => {
    const authStore = useAuthStore()
    const error = ref<string | null>(null)
    const isLoading = ref(false)
    const dupes = ref<Dupe[]>([])

    const loadDupes = async (groupId: string, originalId?: string) => {
        try {
            isLoading.value = true
            error.value = null

            const constraints = originalId
                ? [where('originalId', '==', originalId), orderBy('nombre', 'asc')]
                : [orderBy('nombre', 'asc')]

            const docs = await queryDocuments(dupesCollection(groupId), ...constraints)
            dupes.value = docs as Dupe[]
        } catch (err: any) {
            error.value = err.message || 'Error al cargar dupes'
            console.error('Load dupes error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const getDupe = async (groupId: string, dupeId: string): Promise<Dupe | null> => {
        try {
            const doc = await getDocument(dupeDoc(groupId, dupeId))
            return doc as Dupe | null
        } catch (err: any) {
            error.value = err.message || 'Error al cargar dupe'
            console.error('Get dupe error:', err)
            return null
        }
    }

    const checkDuplicateSlug = async (groupId: string, slug: string): Promise<boolean> => {
        const docs = await queryDocuments(dupesCollection(groupId))
        return docs.some((doc: any) => doc.slug === slug)
    }

    const createDupe = async (groupId: string, formData: DupeFormData): Promise<Dupe | null> => {
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
            }

            // Upload image if provided
            let imagenPrincipal: string | undefined
            if (formData.imageFile) {
                const tempId = Date.now().toString()
                const imagePath = getDupeImagePath(groupId, tempId, formData.imageFile.name)
                imagenPrincipal = await uploadImage(formData.imageFile, imagePath)
            }

            // Clean urls - Firestore doesn't allow undefined values
            const cleanUrls: any = {}
            if (formData.urls?.fragrantica?.trim()) {
                cleanUrls.fragrantica = formData.urls.fragrantica.trim()
            }
            if (formData.urls?.marca?.trim()) {
                cleanUrls.marca = formData.urls.marca.trim()
            }
            if (formData.urls?.otros && formData.urls.otros.length > 0) {
                const filtered = formData.urls.otros.filter(u => u && u.trim())
                if (filtered.length > 0) {
                    cleanUrls.otros = filtered
                }
            }

            const dupeData: any = {
                groupId,
                originalId: formData.originalId,
                nombre: formData.nombre,
                tags: formData.tags || [],
                slug,
                createdAt: Timestamp.now(),
                createdBy: authStore.userId,
                createdByName: authStore.displayName || 'Usuario',
            }

            // Only add optional fields if they have values
            if (formData.marca) dupeData.marca = formData.marca
            if (formData.ml) dupeData.ml = formData.ml
            if (imagenPrincipal) dupeData.imagenPrincipal = imagenPrincipal
            if (Object.keys(cleanUrls).length > 0) dupeData.urls = cleanUrls
            if (formData.tiendas && formData.tiendas.length > 0) dupeData.tiendas = formData.tiendas
            if (authStore.photoURL) dupeData.createdByPhoto = authStore.photoURL

            const docRef = await createDocument(dupesCollection(groupId), dupeData)
            const newDupe = { id: docRef.id, ...dupeData } as Dupe

            dupes.value.push(newDupe)

            return newDupe
        } catch (err: any) {
            error.value = err.message || 'Error al crear dupe'
            console.error('Create dupe error:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    const updateDupe = async (
        groupId: string,
        dupeId: string,
        formData: Partial<DupeFormData>
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
            if (formData.urls !== undefined) updates.urls = formData.urls
            if (formData.tags !== undefined) updates.tags = formData.tags
            if (formData.tiendas !== undefined) updates.tiendas = formData.tiendas

            // Upload new image if provided
            if (formData.imageFile) {
                const imagePath = getDupeImagePath(groupId, dupeId, formData.imageFile.name)
                const imageUrl = await uploadImage(formData.imageFile, imagePath)
                updates.imagenPrincipal = imageUrl
            }

            await updateDocument(dupeDoc(groupId, dupeId), updates)

            // Update local state
            const index = dupes.value.findIndex(d => d.id === dupeId)
            if (index !== -1) {
                dupes.value[index] = { ...dupes.value[index], ...updates }
            }

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al actualizar dupe'
            console.error('Update dupe error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    const deleteDupe = async (groupId: string, dupeId: string): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            await deleteDocument(dupeDoc(groupId, dupeId))

            // Update local state
            dupes.value = dupes.value.filter(d => d.id !== dupeId)

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al eliminar dupe'
            console.error('Delete dupe error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    const updateDupeAverages = async (
        groupId: string,
        dupeId: string,
        avgParecido: number,
        avgGustoAlAplicar: number,
        avgGustoDespues: number,
        votesCount: number
    ): Promise<void> => {
        try {
            await updateDocument(dupeDoc(groupId, dupeId), {
                avgParecido,
                avgGustoAlAplicar,
                avgGustoDespues,
                votesCount,
            })
        } catch (err: any) {
            console.error('Update averages error:', err)
        }
    }

    return {
        error,
        isLoading,
        dupes,
        loadDupes,
        getDupe,
        createDupe,
        updateDupe,
        deleteDupe,
        checkDuplicateSlug,
        updateDupeAverages,
    }
}
