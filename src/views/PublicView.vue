import { ref, computed, onMounted } from 'vue'
import CardOriginal from '@/components/cards/CardOriginal.vue'
import CardDupe from '@/components/cards/CardDupe.vue'
import { useGroups } from '@/composables/useGroups'
import { useOriginals } from '@/composables/useOriginals'
import { useDupes } from '@/composables/useDupes'
import { useCurrentGroupStore } from '@/stores/currentGroup'
import type { Group } from '@/types'

const route = useRoute()
const router = useRouter()
const currentGroupStore = useCurrentGroupStore()
const { getGroupByPublicSlug } = useGroups()
const { originals, loadOriginals } = useOriginals()
const { dupes, loadDupes } = useDupes()

const group = ref<Group | null>(null)
const isLoading = ref(true)
const searchQuery = ref('')
const viewMode = ref<'originals' | 'dupes'>('originals')

const filteredOriginals = computed(() => {
  let result = originals.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(o => 
      o.nombre.toLowerCase().includes(query) ||
      o.marca?.toLowerCase().includes(query)
    )
  }
  
  return result
})

const filteredDupes = computed(() => {
  let result = dupes.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(d => 
      d.nombre.toLowerCase().includes(query) ||
      d.marca?.toLowerCase().includes(query)
    )
  }
  
  return result
})

onMounted(async () => {
  isLoading.value = true
  const publicSlug = route.params.publicSlug as string
  
  group.value = await getGroupByPublicSlug(publicSlug)
  
  if (!group.value) {
    router.push({ name: 'login' })
    return
  }
  
  // Set as current group in public view mode
  currentGroupStore.setCurrentGroup(group.value)
  currentGroupStore.setPublicView(true)
  
  // Load data
  await Promise.all([
    loadOriginals(group.value.id),
    loadDupes(group.value.id)
  ])
  
  isLoading.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Public Header -->
    <div class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
      <div class="flex items-center justify-between px-4 py-3">
        <div>
          <h1 class="text-xl font-bold text-primary-600">DupeZOFRI</h1>
          <p v-if="group" class="text-sm text-gray-600">{{ group.name }}</p>
        </div>
        <span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          Vista Pública
        </span>
      </div>
    </div>
    
    <div class="pt-16 px-4 py-4">
      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p class="text-gray-600 mt-4">Cargando...</p>
      </div>

      <!-- Content -->
      <div v-else-if="group">
        <!-- Info Banner -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-blue-800">
            📖 Estás viendo la versión pública de este grupo. Solo puedes ver promedios y datos generales.
          </p>
          <p class="text-xs text-blue-600 mt-2">
            Para votar y ver detalles completos, inicia sesión y únete al grupo.
          </p>
        </div>

        <!-- Search -->
        <div class="mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar perfumes..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- View Toggle -->
        <div class="flex gap-2 mb-4">
          <button
            @click="viewMode = 'originals'"
            class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            :class="viewMode === 'originals' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
          >
            Originales
          </button>
          <button
            @click="viewMode = 'dupes'"
            class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            :class="viewMode === 'dupes' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
          >
            Dupes
          </button>
        </div>

        <!-- Originals List -->
        <div v-if="viewMode === 'originals'" class="space-y-3">
          <div v-if="filteredOriginals.length === 0" class="text-center py-12">
            <p class="text-gray-600">No hay originales registrados</p>
          </div>
          <CardOriginal
            v-for="original in filteredOriginals"
            :key="original.id"
            :original="original"
            :dupes-count="dupes.filter(d => d.originalId === original.id).length"
          />
        </div>

        <!-- Dupes List -->
        <div v-else class="space-y-3">
          <div v-if="filteredDupes.length === 0" class="text-center py-12">
            <p class="text-gray-600">No hay dupes registrados</p>
          </div>
          <CardDupe
            v-for="dupe in filteredDupes"
            :key="dupe.id"
            :dupe="dupe"
            :original-nombre="originals.find(o => o.id === dupe.originalId)?.nombre"
            :show-original="true"
          />
        </div>

        <!-- Login CTA -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8 text-center">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">¿Quieres participar?</h3>
          <p class="text-gray-600 mb-4">Inicia sesión para votar, comentar y acceder a todas las funciones</p>
          <button
            @click="router.push({ name: 'login' })"
            class="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
