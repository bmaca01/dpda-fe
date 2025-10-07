<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Props {
  dpdaId: string
  currentView: 'editor' | 'compute' | 'visualize'
}

const props = defineProps<Props>()

interface Emits {
  (e: 'validate'): void
  (e: 'export'): void
  (e: 'delete'): void
}

const emit = defineEmits<Emits>()

const isActive = (view: string) => computed(() => props.currentView === view)
</script>

<template>
  <aside class="w-64 border-r bg-background">
    <div class="flex h-full flex-col">
      <!-- Navigation Section -->
      <nav aria-label="DPDA workspace navigation" class="flex-1 space-y-1 p-4">
        <h2 class="mb-2 px-2 text-lg font-semibold tracking-tight">Views</h2>
        <div class="space-y-1">
          <RouterLink
            data-testid="sidebar-nav-editor"
            :to="`/dpda/${dpdaId}`"
            class="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            :class="{ 'bg-accent text-accent-foreground': isActive('editor').value }"
            :aria-current="isActive('editor').value ? 'page' : undefined"
          >
            Editor
          </RouterLink>

          <RouterLink
            data-testid="sidebar-nav-compute"
            :to="`/dpda/${dpdaId}/compute`"
            class="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            :class="{ 'bg-accent text-accent-foreground': isActive('compute').value }"
            :aria-current="isActive('compute').value ? 'page' : undefined"
          >
            Compute
          </RouterLink>

          <RouterLink
            data-testid="sidebar-nav-visualize"
            :to="`/dpda/${dpdaId}/visualize`"
            class="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            :class="{ 'bg-accent text-accent-foreground': isActive('visualize').value }"
            :aria-current="isActive('visualize').value ? 'page' : undefined"
          >
            Visualize
          </RouterLink>
        </div>

        <Separator class="my-4" />

        <!-- Quick Actions -->
        <h2 class="mb-2 px-2 text-lg font-semibold tracking-tight">Actions</h2>
        <div class="space-y-2">
          <Button
            data-testid="action-validate"
            variant="outline"
            size="sm"
            class="w-full justify-start"
            @click="emit('validate')"
          >
            Validate DPDA
          </Button>

          <Button
            data-testid="action-export"
            variant="outline"
            size="sm"
            class="w-full justify-start"
            @click="emit('export')"
          >
            Export
          </Button>

          <Button
            data-testid="action-delete"
            variant="outline"
            size="sm"
            class="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
            @click="emit('delete')"
          >
            Delete DPDA
          </Button>
        </div>
      </nav>
    </div>
  </aside>
</template>
