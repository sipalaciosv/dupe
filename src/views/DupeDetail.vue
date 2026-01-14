```
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import StarRating from '@/components/StarRating.vue'
import { useAuthStore } from '@/stores/auth'
import { useDupes } from '@/composables/useDupes'
import { useOriginals } from '@/composables/useOriginals'
import { useOffers } from '@/composables/useOffers'
import { useStores } from '@/composables/useStores'
import { useVotes } from '@/composables/useVotes'
import { usePermissions } from '@/composables/usePermissions'
import { useCurrentGroupStore } from '@/stores/currentGroup'
import { Timestamp } from '@/services/firebase/firestore'
import type { Dupe, Original } from '@/types'

const router = useRouter()
const route = useRoute()
const currentGroupStore = useCurrentGroupStore()
const authStore = useAuthStore()
const { getDupe, updateDupe } = useDupes()
const { getOriginal } = useOriginals()
const { offers, loadOffers, getMinPrice } = useOffers()
const { votes, userVote, averages, loadVotes, saveVote } = useVotes()
const { stores, loadStores } = useStores()
const { canVote, canCreateDupe } = usePermissions()

const dupe = ref<Dupe | null>(null)
const original = ref<Original | null>(null)
const isLoading = ref(true)
const showVoteForm = ref(false)
const showAddStoreForm = ref(false)
const newStore = ref({ nombre: '', precio: null as number | null })
const editingStore = ref<number | null>(null)
const editPrice = ref<number | null>(null)

// Edit mode
const editMode = ref(false)
const editForm = ref({
  nombre: '',
  marca: '',
  ml: null as number | null,
})

const canEdit = computed(() => {
  if (!dupe.value || !authStore.userId) return false
  return dupe.value.createdBy === authStore.userId || canCreateDupe()
})

// Vote form data (using 1-5 star scale)
const voteForm = ref({
  parecido: 3,
  gustoAlAplicar: 3,
  gustoDespues: 3,
  comentario: '',
})

const minPrice = computed(() => getMinPrice())
const isPublicView = computed(() => currentGroupStore.isPublicView)
const isMember = computed(() => !isPublicView.value && authStore.isAuthenticated)

const handleSaveVote = async () => {
  if (!currentGroupStore.groupId || !dupe.value) return

  // Convert 1-5 star scale to 1-10 storage scale
  const success = await saveVote(currentGroupStore.groupId, dupe.value.id, {
    parecido: voteForm.value.parecido * 2,
    gustoAlAplicar: voteForm.value.gustoAlAplicar * 2,
    gustoDespues: voteForm.value.gustoDespues * 2,
    comentario: voteForm.value.comentario,
  })

  if (success) {
    showVoteForm.value = false
  }
}

onMounted(async () => {
  if (!currentGroupStore.groupId) {
    router.push({ name: 'home' })
    return
  }

  isLoading.value = true
  const dupeId = route.params.id as string

  dupe.value = await getDupe(currentGroupStore.groupId, dupeId)

  if (dupe.value) {
    original.value = await getOriginal(currentGroupStore.groupId, dupe.value.originalId)
    await Promise.all([
      loadOffers(currentGroupStore.groupId, dupeId),
      loadVotes(currentGroupStore.groupId, dupeId),
      loadStores(currentGroupStore.groupId)
    ])

    // Load existing vote into form (convert from 10-point to 5-star scale)
    if (userVote.value) {
      voteForm.value = {
        parecido: userVote.value.parecido / 2,
        gustoAlAplicar: userVote.value.gustoAlAplicar / 2,
        gustoDespues: userVote.value.gustoDespues / 2,
        comentario: userVote.value.comentario || '',
      }
    }
  }

  isLoading.value = false
})

const handleAddStore = async () => {
  if (!newStore.value.nombre || !newStore.value.precio || !dupe.value || !currentGroupStore.groupId) return
  
  const updatedTiendas = [
    ...(dupe.value.tiendas || []),
    {
      tiendaNombre: newStore.value.nombre,
      precio: newStore.value.precio,
      fecha: Timestamp.now(),
      agotado: false,
    }
  ]
  
  await updateDupe(
    currentGroupStore.groupId,
    dupe.value.id,
    { tiendas: updatedTiendas }
  )
  
  // Reload
  dupe.value = await getDupe(currentGroupStore.groupId, dupe.value.id)
  
  // Reset
  newStore.value = { nombre: '', precio: null }
  showAddStoreForm.value = false
}

const handleDeleteStore = async (index: number) => {
  if (!dupe.value || !currentGroupStore.groupId) return
  
  const updatedTiendas = dupe.value.tiendas?.filter((_, i) => i !== index) || []
  
  await updateDupe(
    currentGroupStore.groupId,
    dupe.value.id,
    { tiendas: updatedTiendas }
  )
  
  dupe.value = await getDupe(currentGroupStore.groupId, dupe.value.id)
}

const handleToggleAgotado = async (index: number) => {
  if (!dupe.value || !currentGroupStore.groupId || !dupe.value.tiendas) return
  
  const updatedTiendas = [...dupe.value.tiendas]
  updatedTiendas[index] = {
    ...updatedTiendas[index],
    agotado: !updatedTiendas[index].agotado
  }
  
  await updateDupe(
    currentGroupStore.groupId,
    dupe.value.id,
    { tiendas: updatedTiendas }
  )
  
  dupe.value = await getDupe(currentGroupStore.groupId, dupe.value.id)
}

const handleUpdateStorePrice = async (index: number) => {
  if (!dupe.value || !currentGroupStore.groupId || !dupe.value.tiendas || editPrice.value === null) return
  
  const updatedTiendas = [...dupe.value.tiendas]
  updatedTiendas[index] = {
    ...updatedTiendas[index],
    precio: editPrice.value
  }
  
  await updateDupe(
    currentGroupStore.groupId,
    dupe.value.id,
    { tiendas: updatedTiendas }
  )
  
  dupe.value = await getDupe(currentGroupStore.groupId, dupe.value.id)
  editingStore.value = null
  editPrice.value = null
}

const startEditPrice = (index: number, currentPrice: number) => {
  editingStore.value = index
  editPrice.value = currentPrice
}

const cancelEdit = () => {
  editingStore.value = null
  editPrice.value = null
}

const startEditMode = () => {
  if (!dupe.value) return
  editForm.value = {
    nombre: dupe.value.nombre,
    marca: dupe.value.marca || '',
    ml: dupe.value.ml || null,
  }
  editMode.value = true
}

const cancelEditMode = () => {
  editMode.value = false
}

const saveEdit = async () => {
  if (!dupe.value || !currentGroupStore.groupId) return

  const updates: any = {
    nombre: editForm.value.nombre,
    editedBy: authStore.userId,
    editedByName: authStore.displayName,
  }

  if (editForm.value.marca) updates.marca = editForm.value.marca
  if (editForm.value.ml) updates.ml = editForm.value.ml
  if (authStore.photoURL) updates.editedByPhoto = authStore.photoURL

  await updateDupe(currentGroupStore.groupId, dupe.value.id, updates)
  dupe.value = await getDupe(currentGroupStore.groupId, dupe.value.id)
  editMode.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <TopBar />

    <div class="px-4 py-4 pb-20">
      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>

      <!-- Content -->
      <div v-else-if="dupe && original">
       <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <button @click="router.back()" class="flex items-center gap-1 text-primary-600 hover:text-primary-700 mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver
          </button>

          <!-- Edit mode -->
          <div v-if="editMode">
            <div class="space-y-3 mb-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input v-model="editForm.nombre" type="text" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input v-model="editForm.marca" type="text" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">ML</label>
                <input v-model.number="editForm.ml" type="number" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="saveEdit" 
                class="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Guardar
              </button>
              <button @click="cancelEditMode" 
                class="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                Cancelar
              </button>
            </div>
          </div>

          <!-- Normal mode -->
          <div v-else>
            <div class="flex justify-between items-start mb-3">
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ dupe.nombre }}</h1>
                <p v-if="dupe.marca" class="text-lg text-gray-600">{{ dupe.marca }}</p>
                <p class="text-sm text-gray-500 mt-2">Dupe de: <span class="font-medium">{{ original.nombre }}</span></p>
                
                <!-- Creator info -->
                <div v-if="dupe.createdByName" class="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <img v-if="dupe.createdByPhoto" :src="dupe.createdByPhoto" class="w-5 h-5 rounded-full" />
                  <span>Agregado por: <span class="font-medium text-gray-700">{{ dupe.createdByName }}</span></span>
                </div>
                
                <!-- Editor info -->
                <div v-if="dupe.editedByName" class="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <img v-if="dupe.editedByPhoto" :src="dupe.editedByPhoto" class="w-5 h-5 rounded-full" />
                  <span>Editado por: <span class="font-medium text-gray-700">{{ dupe.editedByName }}</span></span>
                </div>
              </div>

              <!-- Edit button -->
              <button v-if="canEdit" @click="startEditMode" 
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar dupe">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Image -->
        <div v-if="dupe.imagenPrincipal" class="mb-6">
          <img :src="dupe.imagenPrincipal" :alt="dupe.nombre"
            class="w-full max-h-64 object-contain rounded-lg bg-gray-50" />
        </div>

        <!-- Tiendas Disponibles -->
        <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 class="text-lg font-semibold mb-3">Disponible en:</h2>
          
          <!-- Lista de tiendas -->
          <div v-if="dupe.tiendas && dupe.tiendas.length > 0" class="space-y-2 mb-3">
            <div v-for="(tienda, index) in dupe.tiendas" :key="index" 
              class="flex justify-between items-center p-3 rounded-lg"
              :class="tienda.agotado ? 'bg-red-50 border border-red-200' : 'bg-gray-50'">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium" :class="tienda.agotado ? 'text-gray-400 line-through' : 'text-gray-900'">
                    {{ tienda.tiendaNombre }}
                  </span>
                  <span v-if="tienda.agotado" class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                    Agotado
                  </span>
                </div>
                <span v-if="tienda.fecha" class="text-sm text-gray-500">
                  {{ new Date(tienda.fecha.toMillis()).toLocaleDateString() }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <!-- Edit mode -->
                <div v-if="editingStore === index" class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">$</span>
                  <input v-model.number="editPrice" type="number" 
                    class="w-24 px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    @keyup.enter="handleUpdateStorePrice(index)"
                    @keyup.esc="cancelEdit" />
                  <button @click="handleUpdateStorePrice(index)" 
                    class="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                    title="Guardar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>
                  <button @click="cancelEdit" 
                    class="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    title="Cancelar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <!-- Normal mode -->
                <template v-else>
                  <span class="text-lg font-bold" :class="tienda.agotado ? 'text-gray-400' : 'text-primary-600'">
                    ${{ tienda.precio.toLocaleString() }}
                  </span>
                  <button @click="startEditPrice(index, tienda.precio)" 
                    class="p-1 hover:bg-blue-100 rounded"
                    title="Editar precio">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button @click="handleToggleAgotado(index)" 
                    class="p-1 hover:bg-gray-200 rounded"
                    :title="tienda.agotado ? 'Marcar disponible' : 'Marcar agotado'">
                    <svg class="w-5 h-5" :class="tienda.agotado ? 'text-green-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>
                  <button @click="handleDeleteStore(index)" 
                    class="p-1 hover:bg-red-100 rounded"
                    title="Eliminar tienda">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </template>
              </div>
            </div>
          </div>
          <p v-else class="text-gray-500 text-sm mb-3">
            No hay tiendas registradas
          </p>
          
          <!-- Botón agregar -->
          <button v-if="canVote()" @click="showAddStoreForm = !showAddStoreForm"
            class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            {{ showAddStoreForm ? 'Cancelar' : '+ Agregar Tienda' }}
          </button>
          
          <!-- Formulario inline -->
          <div v-if="showAddStoreForm" class="mt-3 p-3 bg-gray-100 rounded-lg">
            <div class="grid grid-cols-2 gap-2 mb-2">
              <input v-model="newStore.nombre" list="storesListDupe" placeholder="Nombre tienda"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <input v-model.number="newStore.precio" type="number" placeholder="Precio"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <datalist id="storesListDupe">
              <option v-for="store in stores" :key="store.id" :value="store.nombre" />
            </datalist>
            <button @click="handleAddStore" 
              :disabled="!newStore.nombre || !newStore.precio"
              class="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Guardar
            </button>
          </div>
        </div>

        <!-- Averages (Always visible) -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 class="font-semibold text-gray-900 mb-4">Promedios del Grupo</h3>

          <div class="space-y-3 mb-4">
            <div>
              <div class="flex justify-between items-center text-sm mb-1">
                <span class="text-gray-600">Parecido</span>
                <div class="flex items-center gap-2">
                  <StarRating :modelValue="averages.parecido / 2" readonly size="sm" />
                  <span class="font-medium">{{ (averages.parecido / 2).toFixed(1) }}</span>
                </div>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-primary-600 h-2 rounded-full" :style="{ width: `${(averages.parecido / 10) * 100}%` }"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center text-sm mb-1">
                <span class="text-gray-600">Gusto al Aplicar</span>
                <div class="flex items-center gap-2">
                  <StarRating :modelValue="averages.gustoAlAplicar / 2" readonly size="sm" />
                  <span class="font-medium">{{ (averages.gustoAlAplicar / 2).toFixed(1) }}</span>
                </div>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-primary-600 h-2 rounded-full" :style="{ width: `${(averages.gustoAlAplicar / 10) * 100}%` }"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center text-sm mb-1">
                <span class="text-gray-600">Gusto Después</span>
                <div class="flex items-center gap-2">
                  <StarRating :modelValue="averages.gustoDespues / 2" readonly size="sm" />
                  <span class="font-medium">{{ (averages.gustoDespues / 2).toFixed(1) }}</span>
                </div>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-primary-600 h-2 rounded-full" :style="{ width: `${(averages.gustoDespues / 10) * 100}%` }"></div>
              </div>
            </div>
          </div>

          <p class="text-sm text-gray-500">{{ averages.count }} votos</p>

          <!-- Mi voto (si existe) -->
          <div v-if="userVote" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 class="font-semibold text-sm text-gray-900 mb-2">Mi Voto</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Parecido:</span>
                <div class="flex items-center gap-1">
                  <StarRating :modelValue="userVote.parecido / 2" readonly size="sm" />
                  <span class="font-medium">{{ (userVote.parecido / 2).toFixed(1) }}</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Gusto al Aplicar:</span>
                <div class="flex items-center gap-1">
                  <StarRating :modelValue="userVote.gustoAlAplicar / 2" readonly size="sm" />
                  <span class="font-medium">{{ (userVote.gustoAlAplicar / 2).toFixed(1) }}</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Gusto Después:</span>
                <div class="flex items-center gap-1">
                  <StarRating :modelValue="userVote.gustoDespues / 2" readonly size="sm" />
                  <span class="font-medium">{{ (userVote.gustoDespues / 2).toFixed(1) }}</span>
                </div>
              </div>
              <div v-if="userVote.comentario" class="mt-2 pt-2 border-t border-blue-200">
                <p class="text-gray-700 italic">"{{ userVote.comentario }}"</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Offers -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold text-gray-900">Ofertas</h3>
            <span v-if="minPrice" class="text-lg font-bold text-green-600">
              Min: ${{ minPrice.toLocaleString() }}
            </span>
          </div>

          <div v-if="offers.length === 0" class="text-center py-6 text-gray-600">
            No hay ofertas registradas
          </div>

          <div v-else class="space-y-2">
            <div v-for="offer in offers" :key="offer.id" class="border-l-4 border-primary-500 pl-3 py-2">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-gray-900">{{ offer.tienda }}</p>
                  <p v-if="offer.nota" class="text-sm text-gray-600">{{ offer.nota }}</p>
                </div>
                <p class="text-lg font-bold text-gray-900">${{ offer.precio.toLocaleString() }}</p>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                {{ typeof offer.fecha === 'string' ? offer.fecha : offer.fecha.toDate().toLocaleDateString() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Your Vote (Members only) -->
        <div v-if="isMember && canVote()" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 class="font-semibold text-gray-900 mb-4">Tu Voto</h3>

          <div v-if="!showVoteForm && !userVote" class="text-center py-4">
            <button @click="showVoteForm = true"
              class="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
              Votar
            </button>
          </div>

          <div v-else-if="showVoteForm || userVote" class="space-y-4">
            <!-- Formulario de voto -->
            <div v-if="showVoteForm" class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Parecido</label>
                <StarRating v-model="voteForm.parecido" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Gusto al Aplicar</label>
                <StarRating v-model="voteForm.gustoAlAplicar" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Gusto Después</label>
                <StarRating v-model="voteForm.gustoDespues" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Comentario (opcional)
                </label>
                <textarea v-model="voteForm.comentario" rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tus impresiones..." />
              </div>
            </div>

            <button @click="handleSaveVote"
              class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
              Guardar Voto
            </button>
          </div>
        </div>

        <!-- Group Opinions (Members only) -->
        <div v-if="isMember && votes.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900 mb-4">Opiniones del Grupo</h3>

          <div class="space-y-4">
            <div v-for="vote in votes" :key="vote.userId" class="border-b border-gray-200 pb-4 last:border-0">
              <div class="flex items-center gap-3 mb-2">
                <img :src="vote.photoURL || 'https://via.placeholder.com/32'" alt="" class="w-8 h-8 rounded-full" />
                <span class="font-medium text-gray-900">{{ vote.displayName || 'Usuario' }}</span>
              </div>

              <div class="grid grid-cols-3 gap-2 text-sm mb-2">
                <div>
                  <span class="text-gray-600">Parecido:</span>
                  <span class="font-medium ml-1">{{ vote.parecido }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Al aplicar:</span>
                  <span class="font-medium ml-1">{{ vote.gustoAlAplicar }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Después:</span>
                  <span class="font-medium ml-1">{{ vote.gustoDespues }}</span>
                </div>
              </div>

              <p v-if="vote.comentario" class="text-sm text-gray-700">{{ vote.comentario }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
