<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: number
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hoverRating = ref(0)

const sizeClasses = computed(() => {
  if (props.size === 'sm') return 'w-5 h-5'
  if (props.size === 'lg') return 'w-8 h-8'
  return 'w-6 h-6' // md
})

const setRating = (rating: number) => {
  if (!props.readonly) {
    emit('update:modelValue', rating)
  }
}

const onMouseEnter = (rating: number) => {
  if (!props.readonly) {
    hoverRating.value = rating
  }
}

const onMouseLeave = () => {
  hoverRating.value = 0
}

const displayRating = computed(() => {
  return hoverRating.value || props.modelValue
})
</script>

<template>
  <div class="flex items-center gap-1" @mouseleave="onMouseLeave">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      @click="setRating(star)"
      @mouseenter="onMouseEnter(star)"
      :disabled="readonly"
      :class="[
        sizeClasses,
        readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
      ]"
      class="focus:outline-none"
    >
      <svg
        :class="star <= displayRating ? 'text-yellow-400' : 'text-gray-300'"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  </div>
</template>
