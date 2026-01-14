<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useAuth } from '@/composables/useAuth'
import { useGroups } from '@/composables/useGroups'
import { useGroupsStore } from '@/stores/groups'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const { signOut } = useAuth()
const { createGroup, joinGroupByCode, loadUserGroups, togglePublicAccess } = useGroups()

const showCreateGroup = ref(false)
const showJoinGroup = ref(false)
const newGroupName = ref('')
const inviteCode = ref('')
const isProcessing = ref(false)

const handleSignOut = async () => {
  await signOut()
  router.push({ name: 'login' })
}

const handleCreateGroup = async () => {
  if (!newGroupName.value.trim()) return

  isProcessing.value = true
  const group = await createGroup(newGroupName.value.trim())
  isProcessing.value = false

  if (group) {
    newGroupName.value = ''
    showCreateGroup.value = false
  }
}

const handleJoinGroup = async () => {
  if (!inviteCode.value.trim()) return

  isProcessing.value = true
  const group = await joinGroupByCode(inviteCode.value.trim())
  isProcessing.value = false

  if (group) {
    inviteCode.value = ''
    showJoinGroup.value = false
  }
}

const copyInviteCode = (code: string) => {
  navigator.clipboard.writeText(code)
  alert('Código copiado!')
}

const copyPublicLink = (slug: string) => {
  const url = `${window.location.origin}/public/${slug}`
  navigator.clipboard.writeText(url)
  alert('Link público copiado!')
}

const baseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
})

const handleTogglePublic = async (groupId: string, currentPublicRead: boolean) => {
  await togglePublicAccess(groupId, !currentPublicRead)
}

onMounted(async () => {
  await loadUserGroups()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <TopBar />

    <div class="px-4 py-4 pb-20">
      <!-- User Info -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="flex items-center gap-4">
          <img :src="authStore.photoURL || 'https://via.placeholder.com/64'" alt="Profile"
            class="w-16 h-16 rounded-full" />
          <div class="flex-1">
            <h2 class="text-lg font-semibold text-gray-900">{{ authStore.displayName }}</h2>
            <p class="text-sm text-gray-600">{{ authStore.email }}</p>
          </div>
          <button @click="handleSignOut"
            class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            Salir
          </button>
        </div>
      </div>

      <!-- Groups Section -->
      <div class="mb-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Mis Grupos</h3>

        <!-- Action Buttons -->
        <div class="flex gap-2 mb-4">
          <button @click="showCreateGroup = !showCreateGroup"
            class="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
            Crear Grupo
          </button>
          <button @click="showJoinGroup = !showJoinGroup"
            class="flex-1 px-4 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-lg font-medium hover:bg-primary-50">
            Unirse
          </button>
        </div>

        <!-- Create Group Form -->
        <div v-if="showCreateGroup" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h4 class="font-semibold text-gray-900 mb-3">Nuevo Grupo</h4>
          <input v-model="newGroupName" type="text" placeholder="Nombre del grupo"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
            @keyup.enter="handleCreateGroup" />
          <button @click="handleCreateGroup" :disabled="isProcessing || !newGroupName.trim()"
            class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {{ isProcessing ? 'Creando...' : 'Crear' }}
          </button>
        </div>

        <!-- Join Group Form -->
        <div v-if="showJoinGroup" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h4 class="font-semibold text-gray-900 mb-3">Unirse a un Grupo</h4>
          <input v-model="inviteCode" type="text" placeholder="Código de invitación"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
            @keyup.enter="handleJoinGroup" />
          <button @click="handleJoinGroup" :disabled="isProcessing || !inviteCode.trim()"
            class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {{ isProcessing ? 'Uniéndose...' : 'Unirse' }}
          </button>
        </div>

        <!-- Groups List -->
        <div class="space-y-3">
          <div v-if="groupsStore.groups.length === 0" class="text-center py-8 text-gray-600">
            No tienes grupos aún
          </div>

          <div v-for="group in groupsStore.groups" :key="group.id"
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="font-semibold text-gray-900">{{ group.name }}</h4>
                <p class="text-xs text-gray-500 mt-1">
                  {{ group.ownerId === authStore.userId ? 'Propietario' : 'Miembro' }}
                </p>
              </div>
            </div>

            <!-- Invite Code -->
            <div class="mb-3">
              <label class="text-xs text-gray-600 block mb-1">Código de invitación</label>
              <div class="flex gap-2">
                <input :value="group.inviteCode" readonly
                  class="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono" />
                <button @click="copyInviteCode(group.inviteCode)"
                  class="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                  Copiar
                </button>
              </div>
            </div>

            <!-- Public Access (Only for owner) -->
            <div v-if="group.ownerId === authStore.userId" class="border-t border-gray-200 pt-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Vista pública</span>
                <button @click="handleTogglePublic(group.id, group.publicRead)"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  :class="group.publicRead ? 'bg-primary-600' : 'bg-gray-300'">
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="group.publicRead ? 'translate-x-6' : 'translate-x-1'" />
                </button>
              </div>

              <div v-if="group.publicRead" class="flex gap-2">
                <input :value="`${baseUrl}/public/${group.publicSlug}`" readonly
                  class="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs truncate" />
                <button @click="copyPublicLink(group.publicSlug)"
                  class="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs">
                  Copiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
