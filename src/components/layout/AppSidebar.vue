<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  dpdaId: string
  dpdaName?: string
  currentView: 'editor' | 'compute' | 'visualize'
  isValid?: boolean | null
  canValidate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dpdaName: 'this DPDA',
  isValid: undefined,
  canValidate: true,
})

interface Emits {
  (e: 'validate'): void
  (e: 'export'): void
  (e: 'delete'): void
}

const emit = defineEmits<Emits>()

// Dialog state
const isDeleteDialogOpen = ref(false)

const isActive = (view: string) => computed(() => props.currentView === view)

// Compute link should only be accessible when DPDA is valid
// When isValid is undefined (not provided), allow access for backward compatibility
// Disable only when explicitly false or null
const canAccessCompute = computed(() => props.isValid !== false && props.isValid !== null)

// Handle delete confirmation
const confirmDelete = () => {
  isDeleteDialogOpen.value = true
}

const handleDelete = () => {
  isDeleteDialogOpen.value = false
  emit('delete')
}
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
            :to="canAccessCompute ? `/dpda/${dpdaId}/compute` : ''"
            class="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors"
            :class="{
              'bg-accent text-accent-foreground': isActive('compute').value,
              'hover:bg-accent hover:text-accent-foreground': canAccessCompute,
              'opacity-50 cursor-not-allowed pointer-events-none': !canAccessCompute,
            }"
            :aria-current="isActive('compute').value ? 'page' : undefined"
            :aria-disabled="!canAccessCompute ? 'true' : undefined"
            @click="(e: Event) => !canAccessCompute && e.preventDefault()"
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
            :disabled="!canValidate"
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
            @click="confirmDelete"
          >
            Delete DPDA
          </Button>
        </div>
      </nav>
    </div>

    <!-- Delete DPDA Confirmation Dialog -->
    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent data-testid="delete-confirmation-dialog">
        <DialogHeader>
          <DialogTitle>Delete DPDA</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ dpdaName }}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-testid="cancel-delete-button"
            @click="isDeleteDialogOpen = false"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            data-testid="confirm-delete-button"
            @click="handleDelete"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </aside>
</template>
