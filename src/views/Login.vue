<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import TopBar from '@/components/layout/TopBar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'

const router = useRouter()
const { signIn, error, isLoading } = useAuth()

const handleSignIn = async () => {
  await signIn()
  if (!error.value) {
    router.push({ name: 'home' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
          <span class="text-4xl">🧴</span>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-2">DupeZOFRI</h1>
        <p class="text-gray-600">Perfumes Árabes - Gestión de Dupes</p>
      </div>

      <!-- Sign In Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6 text-center">Iniciar Sesión</h2>
        
        <button
          @click="handleSignIn"
          :disabled="isLoading"
          class="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{{ isLoading ? 'Iniciando sesión...' : 'Continuar con Google' }}</span>
        </button>

        <p v-if="error" class="mt-4 text-sm text-red-600 text-center">{{ error }}</p>

        <div class="mt-8 pt-6 border-t border-gray-200">
          <p class="text-sm text-gray-500 text-center">
            Crea grupos con amigos, registra dupes y compara precios en ZOFRI
          </p>
        </div>
      </div>

      <!-- Features -->
      <div class="mt-8 grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl mb-1">👥</div>
          <p class="text-xs text-gray-600">Grupos colaborativos</p>
        </div>
        <div>
          <div class="text-2xl mb-1">💰</div>
          <p class="text-xs text-gray-600">Compara precios</p>
        </div>
        <div>
          <div class="text-2xl mb-1">⭐</div>
          <p class="text-xs text-gray-600">Vota y opina</p>
        </div>
      </div>
    </div>
  </div>
</template>
