<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDPDA } from '@/composables/useDPDA'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateStatesFull } from '@/api/endpoints/configuration'
import { stateConfigSchema } from '@/schemas/dpda.schema'
import type { StateConfigFormData } from '@/schemas/dpda.schema'

defineOptions({
  name: 'StateTable',
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
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Edit2, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

interface Props {
  dpdaId: string
}

const props = defineProps<Props>()

const queryClient = useQueryClient()
const { getQuery } = useDPDA(props.dpdaId)

const showEditDialog = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})

// Form inputs
const statesInput = ref('')
const initialStateInput = ref('')
const acceptStatesInput = ref('')

// Helper to parse comma-separated string to array
const parseCommaSeparated = (value: string): string[] => {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// Computed: state count
const stateCount = computed(() => {
  return getQuery.data.value?.states?.length ?? 0
})

// Computed: determine state type
const getStateType = (state: string): ('initial' | 'accept' | 'both' | 'regular') => {
  const isInitial = state === getQuery.data.value?.initial_state
  const isAccept = getQuery.data.value?.accept_states?.includes(state) ?? false

  if (isInitial && isAccept) return 'both'
  if (isInitial) return 'initial'
  if (isAccept) return 'accept'
  return 'regular'
}

// Update mutation
const updateMutation = useMutation({
  mutationFn: (data: { states: string[]; initial_state: string; accept_states: string[] }) =>
    updateStatesFull(props.dpdaId, data),
  onSuccess: () => {
    successMessage.value = 'States updated successfully!'
    errorMessage.value = null
    validationErrors.value = {}
    showEditDialog.value = false
    queryClient.invalidateQueries({ queryKey: ['dpda', props.dpdaId] })
    queryClient.invalidateQueries({ queryKey: ['dpdas'] })

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  },
  onError: (error: Error) => {
    errorMessage.value = error.message || 'Failed to update states'
    successMessage.value = null
  },
})

// Open edit dialog and pre-fill form
const openEditDialog = () => {
  if (getQuery.data.value) {
    statesInput.value = getQuery.data.value.states?.join(', ') || ''
    initialStateInput.value = getQuery.data.value.initial_state || ''
    acceptStatesInput.value = getQuery.data.value.accept_states?.join(', ') || ''
  }

  showEditDialog.value = true
  errorMessage.value = null
  validationErrors.value = {}
}

// Computed form data
const formData = computed(
  (): StateConfigFormData => ({
    states: parseCommaSeparated(statesInput.value),
    initialState: initialStateInput.value.trim(),
    acceptStates: parseCommaSeparated(acceptStatesInput.value),
  })
)

// Handle edit form submission
const handleEditSubmit = async () => {
  // Clear previous messages
  errorMessage.value = null
  validationErrors.value = {}

  // Validate form data
  const result = stateConfigSchema.safeParse(formData.value)

  if (!result.success) {
    // Extract validation errors
    result.error.errors.forEach((err) => {
      const path = err.path.join('.')
      validationErrors.value[path] = err.message
    })
    return
  }

  // Submit to API
  updateMutation.mutate({
    states: result.data.states,
    initial_state: result.data.initialState,
    accept_states: result.data.acceptStates,
  })
}

// Expose for testing
defineExpose({
  showEditDialog,
  statesInput,
  initialStateInput,
  acceptStatesInput,
  validationErrors,
  handleEditSubmit,
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Current States</h3>
      <div class="flex items-center gap-4">
        <p class="text-sm text-muted-foreground" v-if="stateCount > 0">
          {{ stateCount }} {{ stateCount === 1 ? 'state' : 'states' }}
        </p>
        <Button
          v-if="stateCount > 0"
          variant="outline"
          size="sm"
          data-testid="edit-states-button"
          @click="openEditDialog"
        >
          <Edit2 class="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
    </div>

    <!-- Success Message -->
    <Alert v-if="successMessage" class="bg-green-50 border-green-200">
      <CheckCircle2 class="h-4 w-4 text-green-600" />
      <AlertDescription class="text-green-800">
        {{ successMessage }}
      </AlertDescription>
    </Alert>

    <!-- Error Message -->
    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription> Error: {{ errorMessage }} </AlertDescription>
    </Alert>

    <!-- Loading State -->
    <div v-if="getQuery.isLoading.value" class="flex items-center justify-center p-8">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      <span class="ml-2 text-muted-foreground">Loading states...</span>
    </div>

    <!-- Error State -->
    <Alert v-else-if="getQuery.isError.value" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>
        Failed to load states: {{ getQuery.error.value?.message }}
      </AlertDescription>
    </Alert>

    <!-- Empty State -->
    <div
      v-else-if="!getQuery.data.value?.states || getQuery.data.value.states.length === 0"
      class="text-center p-8 border border-dashed rounded-lg"
    >
      <p class="text-muted-foreground">No states configured yet</p>
      <p class="text-sm text-muted-foreground mt-1">
        Configure states using the form below
      </p>
    </div>

    <!-- States Table -->
    <div v-else class="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>State</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="state in getQuery.data.value.states"
            :key="state"
          >
            <TableCell class="font-medium">{{ state }}</TableCell>
            <TableCell>
              <div class="flex gap-2">
                <Badge v-if="getStateType(state) === 'initial'" variant="default">
                  Initial
                </Badge>
                <Badge v-if="getStateType(state) === 'accept'" variant="secondary">
                  Accept
                </Badge>
                <Badge v-if="getStateType(state) === 'both'" variant="default">
                  Initial
                </Badge>
                <Badge v-if="getStateType(state) === 'both'" variant="secondary">
                  Accept
                </Badge>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit States</DialogTitle>
          <DialogDescription>
            Update the states configuration for this DPDA.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <!-- States Input -->
          <div class="space-y-2">
            <Label for="edit-states">States</Label>
            <Input
              id="edit-states"
              v-model="statesInput"
              data-testid="edit-states-input"
              placeholder="q0, q1, q2"
            />
            <p class="text-sm text-muted-foreground">
              Enter states as comma-separated values
            </p>
            <p v-if="validationErrors.states" class="text-sm text-destructive">
              {{ validationErrors.states }}
            </p>
          </div>

          <!-- Initial State Input -->
          <div class="space-y-2">
            <Label for="edit-initial-state">Initial State</Label>
            <Input
              id="edit-initial-state"
              v-model="initialStateInput"
              data-testid="edit-initial-state-input"
              placeholder="q0"
            />
            <p class="text-sm text-muted-foreground">
              Must be one of the states above
            </p>
            <p v-if="validationErrors.initialState" class="text-sm text-destructive">
              {{ validationErrors.initialState }}
            </p>
          </div>

          <!-- Accept States Input -->
          <div class="space-y-2">
            <Label for="edit-accept-states">Accept States</Label>
            <Input
              id="edit-accept-states"
              v-model="acceptStatesInput"
              data-testid="edit-accept-states-input"
              placeholder="q2, q3"
            />
            <p class="text-sm text-muted-foreground">
              Comma-separated, must be from states above
            </p>
            <p v-if="validationErrors.acceptStates" class="text-sm text-destructive">
              {{ validationErrors.acceptStates }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showEditDialog = false">Cancel</Button>
          <Button
            data-testid="confirm-edit-button"
            @click="handleEditSubmit"
            :disabled="updateMutation.isPending.value"
          >
            {{ updateMutation.isPending.value ? 'Updating...' : 'Update' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
