<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDPDA } from '@/composables/useDPDA'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateAlphabetsFull } from '@/api/endpoints/configuration'
import { alphabetConfigSchema } from '@/schemas/dpda.schema'
import type { AlphabetConfigFormData } from '@/schemas/dpda.schema'

defineOptions({
  name: 'AlphabetTable',
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

// Computed: counts
const inputAlphabetCount = computed(() => {
  return getQuery.data.value?.input_alphabet?.length ?? 0
})

const stackAlphabetCount = computed(() => {
  return getQuery.data.value?.stack_alphabet?.length ?? 0
})

// Computed: has alphabets configured
const hasAlphabets = computed(() => {
  return (
    (getQuery.data.value?.input_alphabet && getQuery.data.value.input_alphabet.length > 0) ||
    (getQuery.data.value?.stack_alphabet && getQuery.data.value.stack_alphabet.length > 0)
  )
})

// Computed: check if symbol is initial stack symbol
const isInitialStackSymbol = (symbol: string): boolean => {
  return symbol === getQuery.data.value?.initial_stack_symbol
}

// Update mutation
const updateMutation = useMutation({
  mutationFn: (data: {
    input_alphabet: string[]
    stack_alphabet: string[]
    initial_stack_symbol: string
  }) => updateAlphabetsFull(props.dpdaId, data),
  onSuccess: () => {
    successMessage.value = 'Alphabets updated successfully!'
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
    errorMessage.value = error.message || 'Failed to update alphabets'
    successMessage.value = null
  },
})

// Open edit dialog and pre-fill form
const openEditDialog = () => {
  if (getQuery.data.value) {
    inputAlphabetInput.value = getQuery.data.value.input_alphabet?.join(', ') || ''
    stackAlphabetInput.value = getQuery.data.value.stack_alphabet?.join(', ') || ''
    initialStackSymbolInput.value = getQuery.data.value.initial_stack_symbol || ''
  }

  showEditDialog.value = true
  errorMessage.value = null
  validationErrors.value = {}
}

// Computed form data
const formData = computed(
  (): AlphabetConfigFormData => ({
    inputAlphabet: parseCommaSeparated(inputAlphabetInput.value),
    stackAlphabet: parseCommaSeparated(stackAlphabetInput.value),
    initialStackSymbol: initialStackSymbolInput.value.trim(),
  })
)

// Handle edit form submission
const handleEditSubmit = async () => {
  // Clear previous messages
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
  updateMutation.mutate({
    input_alphabet: result.data.inputAlphabet,
    stack_alphabet: result.data.stackAlphabet,
    initial_stack_symbol: result.data.initialStackSymbol,
  })
}

// Expose for testing
defineExpose({
  showEditDialog,
  inputAlphabetInput,
  stackAlphabetInput,
  initialStackSymbolInput,
  validationErrors,
  handleEditSubmit,
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Current Alphabets</h3>
      <Button
        v-if="hasAlphabets"
        variant="outline"
        size="sm"
        data-testid="edit-alphabets-button"
        @click="openEditDialog"
      >
        <Edit2 class="h-4 w-4 mr-2" />
        Edit
      </Button>
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
      <span class="ml-2 text-muted-foreground">Loading alphabets...</span>
    </div>

    <!-- Error State -->
    <Alert v-else-if="getQuery.isError.value" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>
        Failed to load alphabets: {{ getQuery.error.value?.message }}
      </AlertDescription>
    </Alert>

    <!-- Empty State -->
    <div
      v-else-if="!hasAlphabets"
      class="text-center p-8 border border-dashed rounded-lg"
    >
      <p class="text-muted-foreground">No alphabets configured yet</p>
      <p class="text-sm text-muted-foreground mt-1">
        Configure alphabets using the form below
      </p>
    </div>

    <!-- Alphabets Tables -->
    <div v-else class="space-y-6">
      <!-- Input Alphabet -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold">Input Alphabet</h4>
          <p class="text-sm text-muted-foreground" v-if="inputAlphabetCount > 0">
            {{ inputAlphabetCount }} {{ inputAlphabetCount === 1 ? 'symbol' : 'symbols' }}
          </p>
        </div>
        <div
          v-if="!getQuery.data.value?.input_alphabet || getQuery.data.value.input_alphabet.length === 0"
          class="text-sm text-muted-foreground italic p-4 border border-dashed rounded"
        >
          No input symbols defined
        </div>
        <div v-else class="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="symbol in getQuery.data.value.input_alphabet"
                :key="symbol"
              >
                <TableCell class="font-medium">{{ symbol }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <!-- Stack Alphabet -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold">Stack Alphabet</h4>
          <p class="text-sm text-muted-foreground" v-if="stackAlphabetCount > 0">
            {{ stackAlphabetCount }} {{ stackAlphabetCount === 1 ? 'symbol' : 'symbols' }}
          </p>
        </div>
        <div
          v-if="!getQuery.data.value?.stack_alphabet || getQuery.data.value.stack_alphabet.length === 0"
          class="text-sm text-muted-foreground italic p-4 border border-dashed rounded"
        >
          No stack symbols defined
        </div>
        <div v-else class="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="symbol in getQuery.data.value.stack_alphabet"
                :key="symbol"
              >
                <TableCell class="font-medium">{{ symbol }}</TableCell>
                <TableCell>
                  <Badge v-if="isInitialStackSymbol(symbol)" variant="default">
                    Initial
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Alphabets</DialogTitle>
          <DialogDescription>
            Update the alphabets configuration for this DPDA.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <!-- Input Alphabet Input -->
          <div class="space-y-2">
            <Label for="edit-input-alphabet">Input Alphabet</Label>
            <Input
              id="edit-input-alphabet"
              v-model="inputAlphabetInput"
              data-testid="edit-input-alphabet-input"
              placeholder="0, 1, a, b"
            />
            <p class="text-sm text-muted-foreground">
              Enter input symbols as comma-separated values
            </p>
            <p v-if="validationErrors.inputAlphabet" class="text-sm text-destructive">
              {{ validationErrors.inputAlphabet }}
            </p>
          </div>

          <!-- Stack Alphabet Input -->
          <div class="space-y-2">
            <Label for="edit-stack-alphabet">Stack Alphabet</Label>
            <Input
              id="edit-stack-alphabet"
              v-model="stackAlphabetInput"
              data-testid="edit-stack-alphabet-input"
              placeholder="$, A, B"
            />
            <p class="text-sm text-muted-foreground">
              Enter stack symbols as comma-separated values
            </p>
            <p v-if="validationErrors.stackAlphabet" class="text-sm text-destructive">
              {{ validationErrors.stackAlphabet }}
            </p>
          </div>

          <!-- Initial Stack Symbol Input -->
          <div class="space-y-2">
            <Label for="edit-initial-stack-symbol">Initial Stack Symbol</Label>
            <Input
              id="edit-initial-stack-symbol"
              v-model="initialStackSymbolInput"
              data-testid="edit-initial-stack-symbol-input"
              placeholder="$"
            />
            <p class="text-sm text-muted-foreground">
              Must be one of the stack symbols above
            </p>
            <p v-if="validationErrors.initialStackSymbol" class="text-sm text-destructive">
              {{ validationErrors.initialStackSymbol }}
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
