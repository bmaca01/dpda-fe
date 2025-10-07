<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTransitions } from '@/composables/useTransitions'

defineOptions({
  name: 'TransitionTable',
})

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Trash2, AlertCircle } from 'lucide-vue-next'

interface Props {
  dpdaId: string
}

const props = defineProps<Props>()

const { getQuery, deleteMutation } = useTransitions(props.dpdaId)
const showDeleteDialog = ref(false)
const deleteIndex = ref<number | null>(null)
const errorMessage = ref<string | null>(null)

// Helper to format epsilon (null) as ε symbol
const formatEpsilon = (value: string | null): string => {
  return value === null || value === '' ? 'ε' : value
}

// Helper to format stack push array
const formatStackPush = (stackPush: string[]): string => {
  if (!stackPush || stackPush.length === 0) {
    return '-'
  }
  return stackPush.join(', ')
}

// Computed: transition count
const transitionCount = computed(() => {
  return getQuery.data.value?.total ?? 0
})

// Handle delete button click
const confirmDelete = (index: number) => {
  deleteIndex.value = index
  showDeleteDialog.value = true
  errorMessage.value = null
}

// Handle actual deletion
const handleDelete = async (index: number) => {
  try {
    await deleteMutation.mutateAsync(index)
    showDeleteDialog.value = false
    deleteIndex.value = null
    errorMessage.value = null
  } catch (error) {
    errorMessage.value = (error as Error).message || 'Failed to delete transition'
  }
}

// Expose for testing
defineExpose({
  handleDelete,
  showDeleteDialog,
  deleteIndex,
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Transitions</h3>
      <p class="text-sm text-muted-foreground" v-if="transitionCount > 0">
        {{ transitionCount }} {{ transitionCount === 1 ? 'transition' : 'transitions' }}
      </p>
    </div>

    <!-- Error Message -->
    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription> Error: {{ errorMessage }} </AlertDescription>
    </Alert>

    <!-- Loading State -->
    <div v-if="getQuery.isLoading.value" class="flex items-center justify-center p-8">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Loading transitions...</span>
    </div>

    <!-- Error State -->
    <Alert v-else-if="getQuery.isError.value" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>
        Failed to load transitions: {{ getQuery.error.value?.message }}
      </AlertDescription>
    </Alert>

    <!-- Empty State -->
    <div
      v-else-if="!getQuery.data.value?.transitions || getQuery.data.value.transitions.length === 0"
      class="text-center p-8 border border-dashed rounded-lg"
    >
      <p class="text-muted-foreground">No transitions defined yet</p>
      <p class="text-sm text-muted-foreground mt-1">
        Add transitions using the form above
      </p>
    </div>

    <!-- Transitions Table -->
    <div v-else class="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From State</TableHead>
            <TableHead>Input</TableHead>
            <TableHead>Stack Top</TableHead>
            <TableHead>To State</TableHead>
            <TableHead>Stack Push</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(transition, index) in getQuery.data.value.transitions"
            :key="index"
          >
            <TableCell class="font-medium">{{ transition.from_state }}</TableCell>
            <TableCell>{{ formatEpsilon(transition.input_symbol) }}</TableCell>
            <TableCell>{{ formatEpsilon(transition.stack_top) }}</TableCell>
            <TableCell>{{ transition.to_state }}</TableCell>
            <TableCell>{{ formatStackPush(transition.stack_push) }}</TableCell>
            <TableCell class="text-right">
              <Button
                variant="ghost"
                size="sm"
                data-testid="delete-transition-button"
                @click="confirmDelete(index)"
                :disabled="deleteMutation.isPending.value"
              >
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Transition</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transition? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">Cancel</Button>
          <Button
            variant="destructive"
            data-testid="confirm-delete-button"
            @click="handleDelete(deleteIndex!)"
            :disabled="deleteMutation.isPending.value"
          >
            {{ deleteMutation.isPending.value ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
