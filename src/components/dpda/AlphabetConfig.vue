<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useDPDA } from '@/composables/useDPDA'
import { setAlphabets } from '@/api/endpoints/configuration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Info } from 'lucide-vue-next'
import type { AlphabetConfigFormData } from '@/schemas/dpda.schema'
import { alphabetConfigSchema } from '@/schemas/dpda.schema'
import AlphabetTable from './AlphabetTable.vue'

interface Props {
  dpdaId: string
}

const props = defineProps<Props>()

const queryClient = useQueryClient()
const { getQuery } = useDPDA(props.dpdaId)

const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})

// Computed: check if DPDA has alphabets configured
// We check stack_alphabet since it's required
const hasAlphabets = computed(() => {
  return (getQuery.data.value?.stack_alphabet?.length ?? 0) > 0
})

// Form inputs (raw strings)
const inputAlphabetInput = ref('')
const stackAlphabetInput = ref('')
const initialStackSymbolInput = ref('')

// Helper to parse comma-separated string to array
const parseCommaSeparated = (value: string): string[] => {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// Computed form data
const formData = computed(
  (): AlphabetConfigFormData => ({
    inputAlphabet: parseCommaSeparated(inputAlphabetInput.value),
    stackAlphabet: parseCommaSeparated(stackAlphabetInput.value),
    initialStackSymbol: initialStackSymbolInput.value.trim(),
  })
)

// Mutation for setting alphabets
const setAlphabetsMutation = useMutation({
  mutationFn: (data: { input_alphabet: string[]; stack_alphabet: string[]; initial_stack_symbol: string }) =>
    setAlphabets(props.dpdaId, data),
  onSuccess: () => {
    successMessage.value = 'Alphabets saved successfully!'
    errorMessage.value = null
    validationErrors.value = {}
    queryClient.invalidateQueries({ queryKey: ['dpda', props.dpdaId] })

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  },
  onError: (error: Error) => {
    errorMessage.value = error.message || 'Failed to save alphabets'
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
  const result = alphabetConfigSchema.safeParse(formData.value)

  if (!result.success) {
    // Extract validation errors
    result.error.errors.forEach((err) => {
      const path = err.path.join('.')
      validationErrors.value[path] = err.message
    })
    return
  }

  // Submit to API
  setAlphabetsMutation.mutate({
    input_alphabet: result.data.inputAlphabet,
    stack_alphabet: result.data.stackAlphabet,
    initial_stack_symbol: result.data.initialStackSymbol,
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Current Configuration (Table View) -->
    <AlphabetTable :dpda-id="dpdaId" />

    <!-- Divider -->
    <div v-if="!hasAlphabets" class="border-t"></div>

    <!-- Informational Message (when alphabets exist) -->
    <Alert v-if="hasAlphabets" class="bg-blue-50 border-blue-200">
      <Info class="h-4 w-4 text-blue-600" />
      <AlertDescription class="text-blue-800">
        Alphabets are configured. Use the <strong>Edit</strong> button above to modify the configuration.
      </AlertDescription>
    </Alert>

    <!-- Update Configuration (Form) - Only show when no alphabets exist -->
    <div v-if="!hasAlphabets" class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold">Configure Alphabets</h3>
        <p class="text-sm text-muted-foreground">
          Define the input and stack alphabets for your DPDA, including the initial stack symbol.
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
        <!-- Input Alphabet Input -->
        <div class="space-y-2">
          <Label for="inputAlphabet">Input Alphabet</Label>
          <Input
            id="inputAlphabet"
            v-model="inputAlphabetInput"
            data-testid="input-alphabet-input"
            placeholder="0, 1, a, b"
          />
          <p class="text-sm text-muted-foreground">
            Enter input symbols as comma-separated values (e.g., 0, 1, a, b). Leave empty for epsilon-only transitions.
          </p>
          <p v-if="validationErrors.inputAlphabet" class="text-sm text-destructive">
            {{ validationErrors.inputAlphabet }}
          </p>
        </div>

        <!-- Stack Alphabet Input -->
        <div class="space-y-2">
          <Label for="stackAlphabet">Stack Alphabet</Label>
          <Input
            id="stackAlphabet"
            v-model="stackAlphabetInput"
            data-testid="stack-alphabet-input"
            placeholder="$, A, B"
          />
          <p class="text-sm text-muted-foreground">
            Enter stack symbols as comma-separated values (e.g., $, A, B). At least one symbol is required.
          </p>
          <p v-if="validationErrors.stackAlphabet" class="text-sm text-destructive">
            {{ validationErrors.stackAlphabet }}
          </p>
        </div>

        <!-- Initial Stack Symbol Input -->
        <div class="space-y-2">
          <Label for="initialStackSymbol">Initial Stack Symbol</Label>
          <Input
            id="initialStackSymbol"
            v-model="initialStackSymbolInput"
            data-testid="initial-stack-symbol-input"
            placeholder="$"
          />
          <p class="text-sm text-muted-foreground">
            The symbol initially on the stack (must be one of the stack symbols above)
          </p>
          <p v-if="validationErrors.initialStackSymbol" class="text-sm text-destructive">
            {{ validationErrors.initialStackSymbol }}
          </p>
        </div>

        <!-- Submit Button -->
        <Button
          type="submit"
          data-testid="submit-button"
          :disabled="setAlphabetsMutation.isPending.value"
        >
          {{ setAlphabetsMutation.isPending.value ? 'Saving...' : 'Save Alphabets' }}
        </Button>
      </form>
    </div>
  </div>
</template>
