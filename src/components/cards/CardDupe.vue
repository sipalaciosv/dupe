<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExpeditions } from '@/composables/useExpeditions'
import { useCurrentGroupStore } from '@/stores/currentGroup'
import type { Dupe } from '@/types'

const props = defineProps<{
  dupe: Dupe
}>()

const router = useRouter()

const {
  currentExpedition,
  loadExpeditions,
  addExpeditionItem
} = useExpeditions()
const currentGroupStore = useCurrentGroupStore()

const availableStores = computed(() => {
  if (!props.dupe.tiendas || props.dupe.tiendas.length === 0) return []
  return props.dupe.tiendas.filter(t => !t.agotado).map(t => t.tiendaNombre)
})

const goToDetail = () => {
  router.push({ name: 'dupe-detail', params: { id: props.dupe.id } })
}

const addToExpedition = async (event: Event) => {
  event.stopPropagation()
  if (!currentExpedition.value || !currentGroupStore.groupId) {
    alert('No hay expedición activa')
    return
  }
  
  const result = await addExpeditionItem(
    currentGroupStore.groupId,
    currentExpedition.value.id,
    props.dupe.id,
    props.dupe.nombre,
    undefined
  )
  
  if (result) {
    alert('✅ Agregado a la expedición!')
  }
}

onMounted(async () => {
  if (currentGroupStore.groupId) {
    await loadExpeditions(currentGroupStore.groupId)
  }
})
</script>

<template>
  <div 
    @click="goToDetail()"
    class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
    <!-- Image -->
    <div v-if="dupe.imagenPrincipal" class="w-full h-48 bg-gray-100">
      <img
        :src="dupe.imagenPrincipal"
        :alt="dupe.nombre"
        class="w-full h-full object-contain"
      />
    </div>
    <div v-else class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
      <span class="text-6xl">🧴</span>
    </div>
    
    <!-- Content -->
    <div class="p-4">
      <h3 class="font-semibold text-lg text-gray-900 mb-1">{{ dupe.nombre }}</h3>
      <p v-if="dupe.marca" class="text-sm text-gray-600 mb-2">{{ dupe.marca }}</p>
      
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span v-if="dupe.ml">{{ dupe.ml }}ml</span>
      </div>

      <!-- Price and Stores -->
      <div v-if="dupe.tiendas && dupe.tiendas.length > 0" class="border-t border-gray-200 pt-3">
        <div class="flex items-baseline gap-2 mb-2">
          <span class="text-xs text-gray-500">Desde</span>
          <span class="text-lg font-bold text-primary-600">
            ${{ Math.min(...dupe.tiendas.filter(t => !t.agotado).map(t => t.precio)).toLocaleString() }}
          </span>
        </div>
        <div class="flex flex-wrap gap-1">
          <span v-for="(tienda, index) in dupe.tiendas.filter(t => !t.agotado).slice(0, 3)" :key="index"
            class="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
            {{ tienda.tiendaNombre }}
          </span>
          <span v-if="dupe.tiendas.filter(t => !t.agotado).length > 3" 
            class="text-xs px-2 py-1 text-gray-500">
            +{{ dupe.tiendas.filter(t => !t.agotado).length - 3 }}
          </span>
        </div>
      </div>

      <!-- Averages -->
      <div v-if="dupe.avgParecido" class="mt-3 pt-3 border-t border-gray-200">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">Parecido</span>
          <div class="flex items-center gap-1">
            <span class="text-yellow-500">⭐</span>
            <span class="font-medium text-gray-900">{{ dupe.avgParecido.toFixed(1) }}/10</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add to Expedition Button -->
    <button
      v-if="currentExpedition"
      @click="addToExpedition"
      class="mt-3 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
      title="Agregar a expedición"
    >
      + Agregar a Expedición
    </button>
  </div>
</template>
