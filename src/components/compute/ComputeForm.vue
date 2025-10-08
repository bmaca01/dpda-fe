<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { computeSchema } from '@/schemas/dpda.schema'
import { useComputation } from '@/composables/useComputation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, FormItem, FormControl } from '@/components/ui/form'
import { Loader2, AlertTriangle, Info } from 'lucide-vue-next'
import type { ComputeFormData } from '@/schemas/dpda.schema'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { ComputeRequest, ComputeResponse } from '@/api/types'

interface Props {
  dpdaId: string
  computeMutation: UseMutationReturnType<ComputeResponse, Error, ComputeRequest, unknown>
}

const props = defineProps<Props>()

// Use computation composable only for validation query
const { validateQuery } = useComputation(props.dpdaId)

// Form setup with VeeValidate + Zod
const { handleSubmit, defineField, errors, values } = useForm<ComputeFormData>({
  validationSchema: toTypedSchema(computeSchema),
  initialValues: {
    inputString: '',
    maxSteps: 10000,
    showTrace: false,
  },
})

// Define form fields
const [inputString] = defineField('inputString')
const [maxSteps] = defineField('maxSteps')

// Use useField for checkbox with explicit boolean handling
const { value: showTraceValue, handleChange: handleShowTraceChange } = useField<boolean>(
  'showTrace',
  undefined,
  {
    type: 'checkbox',
    checkedValue: true,
    uncheckedValue: false,
  }
)

// Destructure mutation/query properties for reactivity
const { isPending: isComputing } = props.computeMutation
const { data: validationResult, isLoading: isValidating, isError: validationError } = validateQuery

// Computed properties
const isDPDAValid = computed(() => validationResult.value?.is_valid ?? false)
const canCompute = computed(() => isDPDAValid.value && !isComputing.value)

// Form submission
const onSubmit = handleSubmit((values) => {
  const payload = {
    input_string: values.inputString,
    max_steps: values.maxSteps,
    show_trace: values.showTrace,
  }

  props.computeMutation.mutate(payload)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Validation Status -->
    <div v-if="isValidating" class="flex items-center gap-2" data-testid="validation-loading">
      <Loader2 class="h-4 w-4 animate-spin" />
      <span class="text-sm text-muted-foreground">Checking DPDA validity...</span>
    </div>

    <Alert v-else-if="validationError" variant="destructive" data-testid="validation-error">
      <AlertTriangle class="h-4 w-4" />
      <AlertDescription>
        Failed to validate DPDA. Please check your configuration.
      </AlertDescription>
    </Alert>

    <Alert v-else-if="!isDPDAValid" variant="destructive" data-testid="validation-warning">
      <AlertTriangle class="h-4 w-4" />
      <AlertDescription>
        <strong>DPDA is invalid.</strong> {{ validationResult?.message }}
        <div v-if="validationResult?.violations?.length" class="mt-2 text-sm">
          <div
            v-for="(violation, index) in validationResult.violations"
            :key="index"
            class="mt-1"
          >
            • {{ violation.description }}
          </div>
        </div>
      </AlertDescription>
    </Alert>

    <Alert v-else>
      <Info class="h-4 w-4" />
      <AlertDescription> DPDA is valid and ready for computation. </AlertDescription>
    </Alert>

    <!-- Compute Form -->
    <form @submit.prevent="onSubmit" class="space-y-4">
      <!-- Input String -->
      <div class="space-y-2">
        <Label for="input-string">Input String</Label>
        <Input
          id="input-string"
          v-model="inputString"
          data-testid="input-string"
          placeholder="Enter string to test (e.g., 0011)"
          :disabled="isComputing"
        />
        <p class="text-sm text-muted-foreground">
          Leave empty to test the empty string (ε)
        </p>
        <p v-if="errors.inputString" class="text-sm text-destructive">
          {{ errors.inputString }}
        </p>
      </div>

      <!-- Max Steps -->
      <div class="space-y-2">
        <Label for="max-steps">Maximum Steps</Label>
        <Input
          id="max-steps"
          v-model.number="maxSteps"
          type="number"
          data-testid="max-steps"
          :disabled="isComputing"
          min="1"
          max="1000000"
        />
        <p class="text-sm text-muted-foreground">
          Maximum number of computation steps (default: 10000)
        </p>
        <p v-if="errors.maxSteps" class="text-sm text-destructive">
          {{ errors.maxSteps }}
        </p>
      </div>

      <!-- Show Trace -->
      <FormItem>
        <div class="flex items-center space-x-2">
          <FormControl>
            <Checkbox
              id="show-trace"
              :checked="showTraceValue"
              @update:modelValue="handleShowTraceChange"
              data-testid="show-trace"
              :disabled="isComputing"
            />
          </FormControl>
          <Label for="show-trace" class="cursor-pointer">
            Show step-by-step trace
          </Label>
        </div>
      </FormItem>

      <!-- Submit Button -->
      <Button
        type="submit"
        data-testid="compute-button"
        :disabled="!canCompute"
        class="w-full"
      >
        <Loader2 v-if="isComputing" class="mr-2 h-4 w-4 animate-spin" />
        {{ isComputing ? 'Computing...' : 'Compute' }}
      </Button>
    </form>
  </div>
</template>
