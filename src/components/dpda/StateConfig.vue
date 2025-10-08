<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useDPDA } from '@/composables/useDPDA'
import { setStates } from '@/api/endpoints/configuration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Info } from 'lucide-vue-next'
import type { StateConfigFormData } from '@/schemas/dpda.schema'
import { stateConfigSchema } from '@/schemas/dpda.schema'
import StateTable from './StateTable.vue'

interface Props {
  dpdaId: string
}

const props = defineProps<Props>()

const queryClient = useQueryClient()
const { getQuery } = useDPDA(props.dpdaId)

const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})

// Computed: check if DPDA has states configured
const hasStates = computed(() => {
  return (getQuery.data.value?.states?.length ?? 0) > 0
})

// Form inputs (raw strings)
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

// Computed form data
const formData = computed(
  (): StateConfigFormData => ({
    states: parseCommaSeparated(statesInput.value),
    initialState: initialStateInput.value.trim(),
    acceptStates: parseCommaSeparated(acceptStatesInput.value),
  })
)

// Mutation for setting states
const setStatesMutation = useMutation({
  mutationFn: (data: { states: string[]; initial_state: string; accept_states: string[] }) =>
    setStates(props.dpdaId, data),
  onSuccess: () => {
    successMessage.value = 'States saved successfully!'
    errorMessage.value = null
    validationErrors.value = {}
    queryClient.invalidateQueries({ queryKey: ['dpda', props.dpdaId] })

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  },
  onError: (error: Error) => {
    errorMessage.value = error.message || 'Failed to save states'
    successMessage.value = null
  },
})

const onSubmit = (event: Event) => {
  event.preventDefault()

  // Clear previous messages
  successMessage.value = null
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
  setStatesMutation.mutate({
    states: result.data.states,
    initial_state: result.data.initialState,
    accept_states: result.data.acceptStates,
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Current Configuration (Table View) -->
    <StateTable :dpda-id="dpdaId" />

    <!-- Divider -->
    <div v-if="!hasStates" class="border-t"></div>

    <!-- Informational Message (when states exist) -->
    <Alert v-if="hasStates" class="bg-blue-50 border-blue-200">
      <Info class="h-4 w-4 text-blue-600" />
      <AlertDescription class="text-blue-800">
        States are configured. Use the <strong>Edit</strong> button above to modify the configuration.
      </AlertDescription>
    </Alert>

    <!-- Update Configuration (Form) - Only show when no states exist -->
    <div v-if="!hasStates" class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold">Configure States</h3>
        <p class="text-sm text-muted-foreground">
          Define the states for your DPDA, including the initial and accept states.
        </p>
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
        <XCircle class="h-4 w-4" />
        <AlertDescription> Error: {{ errorMessage }} </AlertDescription>
      </Alert>

      <form class="space-y-4" @submit="onSubmit">
        <!-- States Input -->
        <div class="space-y-2">
          <Label for="states">States</Label>
          <Input
            id="states"
            v-model="statesInput"
            data-testid="states-input"
            placeholder="q0, q1, q2"
          />
          <p class="text-sm text-muted-foreground">
            Enter states as comma-separated values (e.g., q0, q1, q2)
          </p>
          <p v-if="validationErrors.states" class="text-sm text-destructive">
            {{ validationErrors.states }}
          </p>
        </div>

        <!-- Initial State Input -->
        <div class="space-y-2">
          <Label for="initialState">Initial State</Label>
          <Input
            id="initialState"
            v-model="initialStateInput"
            data-testid="initial-state-input"
            placeholder="q0"
          />
          <p class="text-sm text-muted-foreground">
            The starting state of the DPDA (must be one of the states above)
          </p>
          <p v-if="validationErrors.initialState" class="text-sm text-destructive">
            {{ validationErrors.initialState }}
          </p>
        </div>

        <!-- Accept States Input -->
        <div class="space-y-2">
          <Label for="acceptStates">Accept States</Label>
          <Input
            id="acceptStates"
            v-model="acceptStatesInput"
            data-testid="accept-states-input"
            placeholder="q2, q3"
          />
          <p class="text-sm text-muted-foreground">
            Final states that indicate acceptance (comma-separated, must be from states above)
          </p>
          <p v-if="validationErrors.acceptStates" class="text-sm text-destructive">
            {{ validationErrors.acceptStates }}
          </p>
        </div>

        <!-- Submit Button -->
        <Button
          type="submit"
          data-testid="submit-button"
          :disabled="setStatesMutation.isPending.value"
        >
          {{ setStatesMutation.isPending.value ? 'Saving...' : 'Save States' }}
        </Button>
      </form>
    </div>
  </div>
</template>
