<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useExpeditions } from '@/composables/useExpeditions'
import { useCurrentGroupStore } from '@/stores/currentGroup'
import type { ExpeditionItemStatus } from '@/types'

const router = useRouter()
const currentGroupStore = useCurrentGroupStore()
const {
  expeditions,
  currentExpedition,
  expeditionItems,
  loadExpeditions,
  createExpedition,
  closeExpedition,
  loadExpeditionItems,
  updateItemStatus,
  addExpeditionItem,
} = useExpeditions()

const showCreateExpedition = ref(false)
const newExpeditionName = ref(`ZOFRI ${new Date().toLocaleDateString()}`)
const showAddItemForm = ref(false)
const newItemName = ref('')

const handleCreateExpedition = async () => {
  if (!currentGroupStore.groupId) return
  
  const expedition = await createExpedition(currentGroupStore.groupId, newExpeditionName.value)
  if (expedition) {
    showCreateExpedition.value = false
    await loadExpeditionItems(currentGroupStore.groupId, expedition.id)
  }
}

const handleCloseExpedition = async () => {
  if (!currentExpedition.value || !currentGroupStore.groupId) return
  
  if (confirm('¿Cerrar esta expedición?')) {
    await closeExpedition(currentGroupStore.groupId, currentExpedition.value.id)
  }
}

const handleAddManualItem = async () => {
  if (!currentExpedition.value || !currentGroupStore.groupId || !newItemName.value.trim()) return
  
  const item = await addExpeditionItem(
    currentGroupStore.groupId,
    currentExpedition.value.id,
    undefined, // dupeId
    newItemName.value.trim(), // nombre
    undefined // originalId
  )
  
  if (item) {
    newItemName.value = ''
    showAddItemForm.value = false
  }
}

const handleUpdateNotes = async (itemId: string, notes: string) => {
  if (!currentExpedition.value || !currentGroupStore.groupId) return
  
  await updateItemStatus(
    currentGroupStore.groupId,
    currentExpedition.value.id,
    itemId,
    'por_probar',
    notes
  )
}

const removeItem = async (itemId: string) => {
  if (!currentExpedition.value || !currentGroupStore.groupId) return
  if (!confirm('¿Eliminar este item de la expedición?')) return
  
  try {
    const { deleteDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/services/firebase')
    
    await deleteDoc(doc(db, `groups/${currentGroupStore.groupId}/expeditions/${currentExpedition.value.id}/items/${itemId}`))
    
    expeditionItems.value = expeditionItems.value.filter(item => item.id !== itemId)
  } catch (err) {
    console.error('Error removing item:', err)
  }
}

const getStatusColor = (status: ExpeditionItemStatus) => {
  switch (status) {
    case 'por_probar':
      return 'bg-gray-100 text-gray-700'
    case 'probado':
      return 'bg-blue-100 text-blue-700'
    case 'no_encontre':
      return 'bg-red-100 text-red-700'
    case 'me_lo_llevo':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getStatusLabel = (status: ExpeditionItemStatus) => {
  switch (status) {
    case 'por_probar':
      return 'Por probar'
    case 'probado':
      return 'Probado'
    case 'no_encontre':
      return 'No encontré'
    case 'me_lo_llevo':
      return 'Me lo llevo'
    default:
      return status
  }
}

onMounted(async () => {
  if (!currentGroupStore.groupId) {
    router.push({ name: 'home' })
    return
  }
  
  await loadExpeditions(currentGroupStore.groupId)
  
  if (currentExpedition.value) {
    await loadExpeditionItems(currentGroupStore.groupId, currentExpedition.value.id)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <TopBar />
    
    <div class="px-4 py-4 pb-20">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Expedición ZOFRI</h1>
        <p class="text-gray-600">Organiza tu salida de compras</p>
      </div>

      <!-- No Active Expedition -->
      <div v-if="!currentExpedition && !showCreateExpedition" class="text-center py-12">
        <div class="text-6xl mb-4">📋</div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">No hay expedición activa</h2>
        <p class="text-gray-600 mb-6">Crea una nueva expedición para empezar</p>
        <button
          @click="showCreateExpedition = true"
          class="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
        >
          Nueva Expedición
        </button>
      </div>

      <!-- Create Expedition Form -->
      <div v-if="showCreateExpedition" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 class="font-semibold text-gray-900 mb-3">Nueva Expedición</h3>
        <input
          v-model="newExpeditionName"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
        />
        <div class="flex gap-2">
          <button
            @click="handleCreateExpedition"
            class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Crear
          </button>
          <button
            @click="showCreateExpedition = false"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>

      <!-- Active Expedition -->
      <div v-if="currentExpedition">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-semibold text-gray-900">{{ currentExpedition.nombre }}</h3>
              <p class="text-sm text-gray-600">{{ currentExpedition.fecha.toDate().toLocaleDateString() }}</p>
            </div>
            <button
              @click="handleCloseExpedition"
              class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              Cerrar
            </button>
        </div>

          <!-- Add Item Section -->
          <div class="mt-4">
            <button
              v-if="!showAddItemForm"
              @click="showAddItemForm = true"
              class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
            >
              + Agregar Item
            </button>

            <!-- Add Item Form -->
            <div v-else class="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 class="font-medium text-gray-900">Agregar Item</h4>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del perfume</label>
                <input
                  v-model="newItemName"
                  type="text"
                  placeholder="Ej: Dior Sauvage"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div class="flex gap-2">
                <button
                  @click="handleAddManualItem"
                  :disabled="!newItemName.trim()"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar
                </button>
                <button
                  @click="showAddItemForm = false; newItemName = ''"
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>

              <div class="text-sm text-gray-600">
                <p class="mb-1">💡 También puedes agregar desde:</p>
                <button
                  @click="router.push({ name: 'home' })"
                  class="text-primary-600 hover:text-primary-700 underline"
                >
                  Ver lista de perfumes →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Items List -->
        <div class="space-y-3">
          <div v-if="expeditionItems.length === 0" class="text-center py-8 text-gray-600">
            No hay items en esta expedición
          </div>

          <div
            v-for="item in expeditionItems"
            :key="item.id"
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div class="flex justify-between items-start mb-3">
              <h4 class="font-medium text-gray-900 flex-1">{{ item.nombre || 'Item sin nombre' }}</h4>
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getStatusColor(item.status)"
                >
                  {{ getStatusLabel(item.status) }}
                </span>
                <button
                  @click="removeItem(item.id)"
                  class="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Eliminar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Notes Textarea -->
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                :value="item.notasRapidas || ''"
                @blur="(e) => handleUpdateNotes(item.id, (e.target as HTMLTextAreaElement).value)"
                rows="3"
                placeholder="Escribe tus notas sobre este perfume..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Past Expeditions -->
        <div v-if="expeditions.filter(e => e.estado === 'cerrada').length > 0" class="mt-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Expediciones Anteriores</h3>
          <div class="space-y-2">
            <div
              v-for="exp in expeditions.filter(e => e.estado === 'cerrada')"
              :key="exp.id"
              class="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
            >
              <h4 class="font-medium text-gray-900">{{ exp.nombre }}</h4>
              <p class="text-sm text-gray-600">{{ exp.fecha.toDate().toLocaleDateString() }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
