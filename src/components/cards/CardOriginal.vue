<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExpeditions } from '@/composables/useExpeditions'
import { useCurrentGroupStore } from '@/stores/currentGroup'
import type { Original } from '@/types'

const props = defineProps<{
  original: Original
  dupesCount?: number
}>()

const router = useRouter()
const currentGroupStore = useCurrentGroupStore()
const { currentExpedition, addExpeditionItem, loadExpeditions } = useExpeditions()

const goToDetail = () => {
  router.push({ name: 'original-detail', params: { id: props.original.id } })
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
    undefined,
    props.original.nombre,
    props.original.id
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
    @click="goToDetail"
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
  >
    <!-- Image -->
    <div v-if="original.imagenPrincipal" class="mb-3">
      <img 
        :src="original.imagenPrincipal" 
        :alt="original.nombre"
        class="w-full h-48 object-contain rounded-lg bg-gray-50"
      />
    </div>

    <div class="flex justify-between items-start mb-2">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900">{{ original.nombre }}</h3>
        <p v-if="original.marca" class="text-sm text-gray-600">{{ original.marca }}</p>
      </div>
      
      <span class="ml-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
        {{ dupesCount || 0 }} dupes
      </span>
    </div>

    <div v-if="original.tags && original.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
      <span
        v-for="tag in original.tags.slice(0, 3)"
        :key="tag"
        class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
      >
        {{ tag }}
      </span>
      <span v-if="original.tags.length > 3" class="text-xs text-gray-500">
        +{{ original.tags.length - 3 }}
      </span>
    </div>

    <div v-if="original.urlFragrantica" class="mt-2">
      <a
        :href="original.urlFragrantica"
        target="_blank"
        rel="noopener"
        @click.stop
        class="text-xs text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
        Fragrantica
      </a>
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
