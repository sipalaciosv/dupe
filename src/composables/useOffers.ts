import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Offer, OfferFormData } from '@/types'
import {
    offersCollection,
    offerDoc,
    createDocument,
    queryDocuments,
    deleteDocument,
    orderBy,
    Timestamp,
} from '@/services/firebase/firestore'

export const useOffers = () => {
    const authStore = useAuthStore()
    const error = ref<string | null>(null)
    const isLoading = ref(false)
    const offers = ref<Offer[]>([])

    const loadOffers = async (groupId: string, dupeId: string) => {
        try {
            isLoading.value = true
            error.value = null

            const docs = await queryDocuments(
                offersCollection(groupId, dupeId),
                orderBy('fecha', 'desc')
            )

            offers.value = docs as Offer[]
        } catch (err: any) {
            error.value = err.message || 'Error al cargar ofertas'
            console.error('Load offers error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const createOffer = async (
        groupId: string,
        dupeId: string,
        formData: OfferFormData
    ): Promise<Offer | null> => {
        if (!authStore.userId) {
            error.value = 'Debes iniciar sesión'
            return null
        }

        try {
            isLoading.value = true
            error.value = null

            const offerData: Omit<Offer, 'id'> = {
                dupeId,
                tienda: formData.tienda,
                precio: formData.precio,
                fecha: formData.fecha || Timestamp.now(),
                urlTienda: formData.urlTienda || undefined,
                nota: formData.nota || undefined,
                createdBy: authStore.userId,
                createdAt: Timestamp.now(),
            }

            const docRef = await createDocument(offersCollection(groupId, dupeId), offerData)
            const newOffer = { id: docRef.id, ...offerData } as Offer

            offers.value.push(newOffer)

            return newOffer
        } catch (err: any) {
            error.value = err.message || 'Error al crear oferta'
            console.error('Create offer error:', err)
            return null
        } finally {
            isLoading.value = false
        }
    }

    const deleteOffer = async (groupId: string, dupeId: string, offerId: string): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            await deleteDocument(offerDoc(groupId, dupeId, offerId))

            // Update local state
            offers.value = offers.value.filter(o => o.id !== offerId)

            return true
        } catch (err: any) {
            error.value = err.message || 'Error al eliminar oferta'
            console.error('Delete offer error:', err)
            return false
        } finally {
            isLoading.value = false
        }
    }

    const getMinPrice = (): number | undefined => {
        if (offers.value.length === 0) return undefined
        return Math.min(...offers.value.map(o => o.precio))
    }

    const getPricesByStore = (): Record<string, Offer[]> => {
        return offers.value.reduce((acc, offer) => {
            if (!acc[offer.tienda]) {
                acc[offer.tienda] = []
            }
            acc[offer.tienda].push(offer)
            return acc
        }, {} as Record<string, Offer[]>)
    }

    return {
        error,
        isLoading,
        offers,
        loadOffers,
        createOffer,
        deleteOffer,
        getMinPrice,
        getPricesByStore,
    }
}
