# Cómo Agregar Tiendas a Perfumes Existentes

## Problema
Actualmente solo puedes agregar tienda al CREAR un perfume. Si ya existe, no puedes agregarle más tiendas.

## Solución: Botón "+ Agregar Tienda" en Vista de Detalle

### Paso 1: Agregar función updateOriginal/updateDupe

Ya existe `updateOriginal` y `updateDupe` en los composables. Solo necesitas usarlos.

### Paso 2: Agregar UI en OriginalDetail.vue y DupeDetail.vue

**Ubicación:** Después de mostrar la información básica (nombre, marca, ML)

**UI propuesta:**
```vue
<!-- Tiendas Disponibles -->
<div class="bg-white rounded-lg p-4 shadow-sm mb-4">
  <h2 class="text-lg font-semibold mb-3">Disponible en:</h2>
  
  <!-- Lista de tiendas -->
  <div v-if="original.tiendas && original.tiendas.length > 0" class="space-y-2 mb-3">
    <div v-for="(tienda, index) in original.tiendas" :key="index" 
      class="flex justify-between items-center p-2 bg-gray-50 rounded">
      <div>
        <span class="font-medium">{{ tienda.tiendaNombre }}</span>
        <span class="text-sm text-gray-500 ml-2">
          {{ formatDate(tienda.fecha) }}
        </span>
      </div>
      <span class="text-lg font-bold text-primary-600">
        ${{ tienda.precio.toLocaleString() }}
      </span>
    </div>
  </div>
  <p v-else class="text-gray-500 text-sm mb-3">
    No hay tiendas registradas
  </p>
  
  <!-- Botón agregar -->
  <button v-if="canEdit" @click="showAddStoreForm = !showAddStoreForm"
    class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
    + Agregar Tienda
  </button>
  
  <!-- Formulario inline -->
  <div v-if="showAddStoreForm" class="mt-3 p-3 bg-gray-50 rounded-lg">
    <div class="grid grid-cols-2 gap-2 mb-2">
      <input v-model="newStore.nombre" list="storesList" placeholder="Tienda"
        class="px-3 py-2 border rounded-lg" />
      <input v-model.number="newStore.precio" type="number" placeholder="Precio"
        class="px-3 py-2 border rounded-lg" />
    </div>
    <datalist id="storesList">
      <option v-for="store in stores" :key="store.id" :value="store.nombre" />
    </datalist>
    <div class="flex gap-2">
      <button @click="handleAddStore" 
        class="flex-1 py-2 bg-green-600 text-white rounded-lg">
        Guardar
      </button>
      <button @click="showAddStoreForm = false"
        class="flex-1 py-2 bg-gray-300 rounded-lg">
        Cancelar
      </button>
    </div>
  </div>
</div>
```

### Paso 3: Lógica en script

```typescript
import { useStores } from '@/composables/useStores'
import { Timestamp } from '@/services/firebase/firestore'

const { stores, loadStores } = useStores()
const showAddStoreForm = ref(false)
const newStore = ref({ nombre: '', precio: null })

const handleAddStore = async () => {
  if (!newStore.value.nombre || !newStore.value.precio) return
  
  // Agregar a array de tiendas
  const updatedTiendas = [
    ...(original.value.tiendas || []),
    {
      tiendaNombre: newStore.value.nombre,
      precio: newStore.value.precio,
      fecha: Timestamp.now(),
    }
  ]
  
  // Actualizar en Firestore
  await updateOriginal(
    currentGroupStore.groupId,
    original.value.id,
    { tiendas: updatedTiendas }
  )
  
  // Reset
  newStore.value = { nombre: '', precio: null }
  showAddStoreForm.value = false
  
  // Reload
  await loadOriginal(currentGroupStore.groupId, route.params.id)
}

onMounted(async () => {
  // ... código existente
  await loadStores(currentGroupStore.groupId)
})
```

## Implementación Rápida (10 min)

1. ✅ Reglas Firestore actualizadas
2. Agregar UI en `OriginalDetail.vue`  
3. Agregar UI en `DupeDetail.vue`
4. Usar `updateOriginal`/`updateDupe` para guardar

## Bonus: Mostrar Precio Mínimo

En las cards (Home), mostrar:
```vue
<div v-if="original.tiendas && original.tiendas.length > 0">
  <span class="text-sm text-gray-600">
    Desde ${{ Math.min(...original.tiendas.map(t => t.precio)).toLocaleString() }}
  </span>
  <span class="text-xs text-gray-500 ml-1">
    en {{ original.tiendas.length }} {{ original.tiendas.length === 1 ? 'tienda' : 'tiendas' }}
  </span>
</div>
```
