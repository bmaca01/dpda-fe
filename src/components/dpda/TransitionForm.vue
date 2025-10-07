<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTransitions } from '@/composables/useTransitions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

defineOptions({
  name: 'TransitionForm',
})
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Info } from 'lucide-vue-next'
import type { TransitionFormData } from '@/schemas/dpda.schema'
import { transitionSchema, transitionFormToApiRequest } from '@/schemas/dpda.schema'

interface Props {
  dpdaId: string
  states?: string[]
  inputAlphabet?: string[]
  stackAlphabet?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  states: () => [],
  inputAlphabet: () => [],
  stackAlphabet: () => [],
})

const { addMutation } = useTransitions(props.dpdaId)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})

// Form inputs
const fromState = ref('')
const inputSymbol = ref('')
const stackTop = ref('')
const toState = ref('')
const stackPushInput = ref('')

// Helper to parse comma-separated string to array
const parseCommaSeparated = (value: string): string[] => {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// Constants for epsilon handling
const EPSILON_VALUE = '__epsilon__'

// Helper to convert epsilon placeholder to empty string
const epsilonToEmpty = (value: string): string => {
  return value === EPSILON_VALUE ? '' : value
}

// Computed form data
const formData = computed(
  (): TransitionFormData => ({
    fromState: fromState.value,
    inputSymbol: epsilonToEmpty(inputSymbol.value),
    stackTop: epsilonToEmpty(stackTop.value),
    toState: toState.value,
    stackPush: parseCommaSeparated(stackPushInput.value),
  })
)

const onSubmit = async (event: Event) => {
  event.preventDefault()

  // Clear previous messages
  successMessage.value = null
  errorMessage.value = null
  validationErrors.value = {}

  // Validate form data
  const result = transitionSchema.safeParse(formData.value)

  if (!result.success) {
    // Extract validation errors
    result.error.errors.forEach((err) => {
      const path = err.path.join('.')
      validationErrors.value[path] = err.message
    })
    return
  }

  // Convert to API format (empty string → null for epsilon)
  const apiRequest = transitionFormToApiRequest(result.data)

  try {
    await addMutation.mutateAsync(apiRequest)
    successMessage.value = 'Transition added successfully!'
    errorMessage.value = null
    validationErrors.value = {}

    // Clear form
    fromState.value = ''
    inputSymbol.value = ''
    stackTop.value = ''
    toState.value = ''
    stackPushInput.value = ''

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (error) {
    errorMessage.value = (error as Error).message || 'Failed to add transition'
    successMessage.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold">Add Transition</h3>
        <p class="text-sm text-muted-foreground">
          Define a new transition for your DPDA.
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
        <!-- From State -->
        <div class="space-y-2">
          <Label for="fromState">From State</Label>
          <Select v-model="fromState">
            <SelectTrigger id="fromState" data-testid="from-state-select">
              <SelectValue placeholder="Select from state" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="state in states" :key="state" :value="state">
                  {{ state }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p v-if="validationErrors.fromState" class="text-sm text-destructive">
            {{ validationErrors.fromState }}
          </p>
        </div>

        <!-- Input Symbol -->
        <div class="space-y-2">
          <Label for="inputSymbol">Input Symbol</Label>
          <Select v-model="inputSymbol">
            <SelectTrigger id="inputSymbol" data-testid="input-symbol-select">
              <SelectValue placeholder="Select input symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem :value="EPSILON_VALUE">ε (epsilon)</SelectItem>
                <SelectItem v-for="symbol in inputAlphabet" :key="symbol" :value="symbol">
                  {{ symbol }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            Select ε for epsilon transition (no input required)
          </p>
        </div>

        <!-- Stack Top -->
        <div class="space-y-2">
          <Label for="stackTop">Stack Top</Label>
          <Select v-model="stackTop">
            <SelectTrigger id="stackTop" data-testid="stack-top-select">
              <SelectValue placeholder="Select stack top" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem :value="EPSILON_VALUE">ε (epsilon)</SelectItem>
                <SelectItem v-for="symbol in stackAlphabet" :key="symbol" :value="symbol">
                  {{ symbol }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            Symbol to pop from stack (ε if no pop)
          </p>
        </div>

        <!-- To State -->
        <div class="space-y-2">
          <Label for="toState">To State</Label>
          <Select v-model="toState">
            <SelectTrigger id="toState" data-testid="to-state-select">
              <SelectValue placeholder="Select to state" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="state in states" :key="state" :value="state">
                  {{ state }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p v-if="validationErrors.toState" class="text-sm text-destructive">
            {{ validationErrors.toState }}
          </p>
        </div>

        <!-- Stack Push -->
        <div class="space-y-2">
          <Label for="stackPush">Stack Push</Label>
          <Input
            id="stackPush"
            v-model="stackPushInput"
            data-testid="stack-push-input"
            placeholder="B, A, $"
          />
          <Alert class="bg-blue-50 border-blue-200">
            <Info class="h-4 w-4 text-blue-600" />
            <AlertDescription class="text-blue-800 text-xs">
              Comma-separated symbols to push onto stack. <strong>First symbol is pushed last</strong> (ends up on top).
              Example: "B,A,$" pushes B last, so B ends on top.
            </AlertDescription>
          </Alert>
        </div>

        <!-- Submit Button -->
        <Button
          type="submit"
          data-testid="submit-button"
          :disabled="addMutation.isPending.value"
        >
          {{ addMutation.isPending.value ? 'Adding...' : 'Add Transition' }}
        </Button>
      </form>
    </div>
  </div>
</template>
