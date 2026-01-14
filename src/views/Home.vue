<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import CardOriginal from '@/components/cards/CardOriginal.vue'
import CardDupe from '@/components/cards/CardDupe.vue'
import { useAuth } from '@/composables/useAuth'
import { useGroups } from '@/composables/useGroups'
import { useOriginals } from '@/composables/useOriginals'
import { useDupes } from '@/composables/useDupes'
import { useCurrentGroupStore } from '@/stores/currentGroup'
import { useGroupsStore } from '@/stores/groups'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const currentGroupStore = useCurrentGroupStore()
const { loadUserGroups } = useGroups()
const { loadMembership } = useAuth()
const { originals, loadOriginals } = useOriginals()
const { dupes, loadDupes } = useDupes()

const searchQuery = ref('')
const viewMode = ref<'originals' | 'dupes'>('originals')
const selectedOriginalFilter = ref<string>('')
const isLoading = ref(true)

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

  if (selectedOriginalFilter.value) {
    result = result.filter(d => d.originalId === selectedOriginalFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(d =>
      d.nombre.toLowerCase().includes(query) ||
      d.marca?.toLowerCase().includes(query)
    )
  }

  return result
})

const hasGroup = computed(() => currentGroupStore.currentGroup !== null)

onMounted(async () => {
  isLoading.value = true

  // Wait a bit for auth to initialize if needed
  if (authStore.isLoading) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }

  // Load user's groups
  await loadUserGroups()

  // Set first group as current if available and none selected
  if (!currentGroupStore.currentGroup && groupsStore.groups.length > 0) {
    currentGroupStore.setCurrentGroup(groupsStore.groups[0])
    // Load user's membership for this group to setup permissions
    if (currentGroupStore.groupId && authStore.userId) {
      await loadMembership(currentGroupStore.groupId)
    }
  }

  // Load data if group is selected
  if (currentGroupStore.groupId) {
    await Promise.all([
      loadOriginals(currentGroupStore.groupId),
      loadDupes(currentGroupStore.groupId)
    ])
  }

  isLoading.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <TopBar />

    <div class="px-4 py-4 pb-20">
      <!-- No Group State -->
      <div v-if="!hasGroup && !isLoading" class="text-center py-12">
        <div class="text-6xl mb-4">📦</div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">No tienes grupos</h2>
        <p class="text-gray-600 mb-6">Crea un grupo o únete con un código de invitación</p>
        <button @click="router.push({ name: 'profile' })"
          class="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
          Ir a Perfil
        </button>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Search -->
        <div class="mb-4">
          <input v-model="searchQuery" type="text" placeholder="Buscar perfumes..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <!-- View Toggle -->
        <div class="flex gap-2 mb-4">
          <button @click="viewMode = 'originals'" class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            :class="viewMode === 'originals' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-300'">
            Originales
          </button>
          <button @click="viewMode = 'dupes'" class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            :class="viewMode === 'dupes' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border border-gray-300'">
            Dupes
          </button>
        </div>

        <!-- Original Filter (when viewing dupes) -->
        <div v-if="viewMode === 'dupes'" class="mb-4">
          <select v-model="selectedOriginalFilter"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Todos los originales</option>
            <option v-for="orig in originals" :key="orig.id" :value="orig.id">
              {{ orig.nombre }}
            </option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p class="text-gray-600 mt-4">Cargando...</p>
        </div>

        <!-- Originals List -->
        <div v-else-if="viewMode === 'originals'" class="space-y-3">
          <div v-if="filteredOriginals.length === 0" class="text-center py-12">
            <p class="text-gray-600">No hay originales registrados</p>
          </div>
          <CardOriginal v-for="original in filteredOriginals" :key="original.id" :original="original"
            :dupes-count="dupes.filter(d => d.originalId === original.id).length" />
        </div>

        <!-- Dupes List -->
        <div v-else class="space-y-3">
          <div v-if="filteredDupes.length === 0" class="text-center py-12">
            <p class="text-gray-600">No hay dupes registrados</p>
          </div>
          <CardDupe v-for="dupe in filteredDupes" :key="dupe.id" :dupe="dupe"
            :original-nombre="originals.find(o => o.id === dupe.originalId)?.nombre"
            :show-original="!selectedOriginalFilter" />
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
