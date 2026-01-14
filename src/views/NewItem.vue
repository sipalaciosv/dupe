<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useOriginals } from '@/composables/useOriginals'
import { useDupes } from '@/composables/useDupes'
import { useStores } from '@/composables/useStores'
import { useCurrentGroupStore } from '@/stores/currentGroup'
import { Timestamp } from '@/services/firebase/firestore'

const router = useRouter()
const currentGroupStore = useCurrentGroupStore()
const { canCreateOriginal, canCreateDupe } = usePermissions()
const { createOriginal, originals, loadOriginals } = useOriginals()
const { createDupe } = useDupes()
const { stores, loadStores, getOrCreateStore } = useStores()

type FormType = 'original' | 'dupe' | null

const activeForm = ref<FormType>(null)
const isSubmitting = ref(false)

// Original form
const originalForm = ref({
  nombre: '',
  marca: '',
  ml: null as number | null,
  urlFragrantica: '',
  tags: [] as string[],
  imageFile: null as File | null,
  tiendaNombre: '',
  precio: null as number | null,
})
const tagInput = ref('')
const originalImagePreview = ref<string | null>(null)

// Dupe form
const dupeForm = ref({
  originalId: '',
  nombre: '',
  marca: '',
  ml: null as number | null,
  imageFile: null as File | null,
  urls: {
    fragrantica: '',
    marca: '',
    otros: [] as string[],
  },
  tags: [] as string[],
  tiendaNombre: '',
  precio: null as number | null,
})
const dupeTagInput = ref('')
const imagePreview = ref<string | null>(null)

const addTag = () => {
  if (tagInput.value.trim() && !originalForm.value.tags.includes(tagInput.value.trim())) {
    originalForm.value.tags.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  originalForm.value.tags = originalForm.value.tags.filter(t => t !== tag)
}

const addDupeTag = () => {
  if (dupeTagInput.value.trim() && !dupeForm.value.tags.includes(dupeTagInput.value.trim())) {
    dupeForm.value.tags.push(dupeTagInput.value.trim())
    dupeTagInput.value = ''
  }
}

const removeDupeTag = (tag: string) => {
  dupeForm.value.tags = dupeForm.value.tags.filter(t => t !== tag)
}

const handleOriginalImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    originalForm.value.imageFile = file
    const reader = new FileReader()
    reader.onload = (e) => {
      originalImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    dupeForm.value.imageFile = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleCreateOriginal = async () => {
  if (!currentGroupStore.groupId || !originalForm.value.nombre.trim()) return

  isSubmitting.value = true
  
  // Build tiendas array if store info provided
  const tiendas = []
  if (originalForm.value.tiendaNombre && originalForm.value.precio) {
    tiendas.push({
      tiendaNombre: originalForm.value.tiendaNombre,
      precio: originalForm.value.precio,
      fecha: Timestamp.now(),
    })
    // Save store to group stores if new
    if (originalForm.value.tiendaNombre.trim()) {
      await getOrCreateStore(currentGroupStore.groupId, originalForm.value.tiendaNombre, 'fisica')
    }
  }

  const result = await createOriginal(currentGroupStore.groupId, {
    nombre: originalForm.value.nombre,
    marca: originalForm.value.marca,
    ml: originalForm.value.ml,
    urlFragrantica: originalForm.value.urlFragrantica,
    tags: originalForm.value.tags,
    imageFile: originalForm.value.imageFile,
    tiendas: tiendas.length > 0 ? tiendas : undefined,
  })

  if (result) {
    // Reset form
    originalForm.value = {
      nombre: '',
      marca: '',
      ml: null,
      urlFragrantica: '',
      tags: [],
      imageFile: null,
      tiendaNombre: '',
      precio: null,
    }
    originalImagePreview.value = null
    activeForm.value = null
    router.push({ name: 'home' })
  }
  isSubmitting.value = false
}

const handleCreateDupe = async () => {
  if (!currentGroupStore.groupId || !dupeForm.value.nombre.trim() || !dupeForm.value.originalId) return

  isSubmitting.value = true
  
  // Build tiendas array if store info provided
  const tiendas = []
  if (dupeForm.value.tiendaNombre && dupeForm.value.precio) {
    tiendas.push({
      tiendaNombre: dupeForm.value.tiendaNombre,
      precio: dupeForm.value.precio,
      fecha: Timestamp.now(),
    })
    // Save store to group stores if new
    if (dupeForm.value.tiendaNombre.trim()) {
      await getOrCreateStore(currentGroupStore.groupId, dupeForm.value.tiendaNombre, 'fisica')
    }
  }

  const result = await createDupe(currentGroupStore.groupId, {
    ...dupeForm.value,
    tiendas: tiendas.length > 0 ? tiendas : undefined,
  })

  if (result) {
    // Reset form
    dupeForm.value = {
      originalId: '',
      nombre: '',
      marca: '',
      ml: null,
      imageFile: null,
      urls: {
        fragrantica: '',
        marca: '',
        otros: [],
      },
      tags: [],
      tiendaNombre: '',
      precio: null,
    }
    imagePreview.value = null
    activeForm.value = null
    router.push({ name: 'home' })
  }
  isSubmitting.value = false
}

onMounted(async () => {
  if (currentGroupStore.groupId) {
    await loadOriginals(currentGroupStore.groupId)
    await loadStores(currentGroupStore.groupId)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <TopBar />

    <div class="px-4 py-4 pb-20">
      <!-- Menu or Form -->
      <div v-if="!activeForm">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Crear Nuevo</h1>
          <p class="text-gray-600">¿Qué deseas agregar?</p>
        </div>

        <!-- Action Cards -->
        <div class="space-y-3">
          <!-- Create Original -->
          <button v-if="canCreateOriginal()" @click="activeForm = 'original'"
            class="w-full bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 text-left hover:border-primary-500 hover:shadow-md transition-all">
            <div class="flex items-center gap-4">
              <div class="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full">
                <span class="text-3xl">✨</span>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">Perfume Original</h3>
                <p class="text-sm text-gray-600">Registra un perfume caro para comparar</p>
              </div>
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <!-- Create Dupe -->
          <button v-if="canCreateDupe()" @click="activeForm = 'dupe'"
            class="w-full bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 text-left hover:border-primary-500 hover:shadow-md transition-all">
            <div class="flex items-center gap-4">
              <div class="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full">
                <span class="text-3xl">🧴</span>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">Dupe (Perfume Árabe)</h3>
                <p class="text-sm text-gray-600">Agrega una alternativa económica</p>
              </div>
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <!-- No permissions -->
          <div v-if="!canCreateOriginal() && !canCreateDupe()" class="text-center py-12">
            <p class="text-gray-600">No tienes permisos para crear elementos</p>
            <p class="text-sm text-gray-500 mt-2">Contacta al administrador del grupo</p>
          </div>
        </div>
      </div>

      <!-- Original Form -->
      <div v-else-if="activeForm === 'original'" class="space-y-4">
        <button @click="activeForm = null" class="flex items-center gap-2 text-primary-600 mb-4">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <h2 class="text-xl font-bold text-gray-900 mb-4">Nuevo Perfume Original</h2>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
            <input v-model="originalForm.nombre" type="text" placeholder="Ej: Aventus"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Marca</label>
            <input v-model="originalForm.marca" type="text" placeholder="Ej: Creed"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ML</label>
            <input v-model.number="originalForm.ml" type="number" placeholder="Ej: 100"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">URL Fragrantica</label>
            <input v-model="originalForm.urlFragrantica" type="url" placeholder="https://www.fragrantica.com/..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
            <input type="file" accept="image/*" @change="handleOriginalImageSelect"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <img v-if="originalImagePreview" :src="originalImagePreview"
              class="mt-2 w-32 h-32 object-cover rounded-lg" />
          </div>

          <!-- Store & Price -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tienda</label>
              <input v-model="originalForm.tiendaNombre" type="text" list="storesList" placeholder="Ej: JPT"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <datalist id="storesList">
                <option v-for="store in stores" :key="store.id" :value="store.nombre" />
              </datalist>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio</label>
              <input v-model.number="originalForm.precio" type="number" placeholder="$"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div class="flex gap-2 mb-2">
              <input v-model="tagInput" type="text" placeholder="Agregar tag" @keyup.enter="addTag"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button @click="addTag" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                +
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in originalForm.tags" :key="tag"
                class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-2">
                {{ tag }}
                <button @click="removeTag(tag)" class="text-gray-500 hover:text-gray-700">×</button>
              </span>
            </div>
          </div>

          <button @click="handleCreateOriginal" :disabled="isSubmitting || !originalForm.nombre.trim()"
            class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {{ isSubmitting ? 'Creando...' : 'Crear Original' }}
          </button>
        </div>
      </div>

      <!-- Dupe Form -->
      <div v-else-if="activeForm === 'dupe'" class="space-y-4">
        <button @click="activeForm = null" class="flex items-center gap-2 text-primary-600 mb-4">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <h2 class="text-xl font-bold text-gray-900 mb-4">Nuevo Dupe</h2>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Perfume Original *</label>
            <select v-model="dupeForm.originalId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Selecciona un perfume</option>
              <option v-for="orig in originals" :key="orig.id" :value="orig.id">
                {{ orig.nombre }} {{ orig.marca ? `(${orig.marca})` : '' }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Dupe *</label>
            <input v-model="dupeForm.nombre" type="text" placeholder="Ej: Shaghaf Oud"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Marca</label>
            <input v-model="dupeForm.marca" type="text" placeholder="Ej: Swiss Arabian"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ML</label>
            <input v-model.number="dupeForm.ml" type="number" placeholder="Ej: 100"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
            <input type="file" accept="image/*" @change="handleImageSelect"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <img v-if="imagePreview" :src="imagePreview" class="mt-2 w-32 h-32 object-cover rounded-lg" />
          </div>

          <!-- Store & Price -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tienda</label>
              <input v-model="dupeForm.tiendaNombre" type="text" list="storesList" placeholder="Ej: JPT"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio</label>
              <input v-model.number="dupeForm.precio" type="number" placeholder="$"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">URL Fragrantica (dupe)</label>
            <input v-model="dupeForm.urls.fragrantica" type="url" placeholder="https://www.fragrantica.com/..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div class="flex gap-2 mb-2">
              <input v-model="dupeTagInput" type="text" placeholder="Agregar tag" @keyup.enter="addDupeTag"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button @click="addDupeTag" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                +
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in dupeForm.tags" :key="tag"
                class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-2">
                {{ tag }}
                <button @click="removeDupeTag(tag)" class="text-gray-500 hover:text-gray-700">×</button>
              </span>
            </div>
          </div>

          <button @click="handleCreateDupe" :disabled="isSubmitting || !dupeForm.nombre.trim() || !dupeForm.originalId"
            class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {{ isSubmitting ? 'Creando...' : 'Crear Dupe' }}
          </button>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
