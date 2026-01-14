<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.name)

const navigate = (routeName: string) => {
  router.push({ name: routeName })
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20 pb-safe">
    <div class="flex justify-around items-center h-16">
      <!-- Home -->
      <button
        @click="navigate('home')"
        class="flex flex-col items-center justify-center flex-1 h-full transition-colors"
        :class="currentRoute === 'home' ? 'text-primary-600' : 'text-gray-500'"
      >
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-xs font-medium">Inicio</span>
      </button>

      <!-- Expedition -->
      <button
        @click="navigate('expedition')"
        class="flex flex-col items-center justify-center flex-1 h-full transition-colors"
        :class="currentRoute === 'expedition' ? 'text-primary-600' : 'text-gray-500'"
      >
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span class="text-xs font-medium">Expedición</span>
      </button>

      <!-- New Item -->
      <button
        @click="navigate('new-item')"
        class="flex flex-col items-center justify-center flex-1 h-full transition-colors"
        :class="currentRoute === 'new-item' ? 'text-primary-600' : 'text-gray-500'"
      >
        <div class="flex items-center justify-center w-12 h-12 bg-primary-500 rounded-full -mt-6 mb-1">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span class="text-xs font-medium">Nuevo</span>
      </button>

      <!-- Profile -->
      <button
        @click="navigate('profile')"
        class="flex flex-col items-center justify-center flex-1 h-full transition-colors"
        :class="currentRoute === 'profile' ? 'text-primary-600' : 'text-gray-500'"
      >
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-xs font-medium">Perfil</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
