<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

interface Props {
  showSidebar?: boolean
  dpdaId?: string
  dpdaName?: string
  isValid?: boolean | null
  currentView?: 'editor' | 'compute' | 'visualize'
  canValidate?: boolean
}

withDefaults(defineProps<Props>(), {
  showSidebar: false,
  isValid: null,
  canValidate: true,
})

interface Emits {
  (e: 'validate'): void
  (e: 'export'): void
  (e: 'delete'): void
}

const emit = defineEmits<Emits>()

const handleValidate = () => emit('validate')
const handleExport = () => emit('export')
const handleDelete = () => emit('delete')
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Header -->
    <AppHeader :dpda-id="dpdaId" :dpda-name="dpdaName" :is-valid="isValid" />

    <!-- Main Content Area -->
    <div class="flex flex-1">
      <!-- Sidebar (conditional) -->
      <AppSidebar
        v-if="showSidebar && dpdaId && currentView"
        :dpda-id="dpdaId"
        :current-view="currentView"
        :is-valid="isValid"
        :can-validate="canValidate"
        @validate="handleValidate"
        @export="handleExport"
        @delete="handleDelete"
      />

      <!-- Main Content -->
      <main class="flex-1 overflow-auto">
        <div class="container mx-auto p-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
