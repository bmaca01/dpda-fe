<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDPDA } from '@/composables/useDPDA'
import { useComputation } from '@/composables/useComputation'
import PageLayout from '@/components/layout/PageLayout.vue'
import ComputeForm from '@/components/compute/ComputeForm.vue'
import ComputeResult from '@/components/compute/ComputeResult.vue'
import TraceViewer from '@/components/compute/TraceViewer.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-vue-next'

// Get DPDA ID from route
const route = useRoute()
const dpdaId = route.params.id as string

// Fetch DPDA info
const { getQuery: dpdaQuery, canValidate } = useDPDA(dpdaId)
const { data: dpda, isLoading, isError, error } = dpdaQuery

// Get computation functionality
const { computeMutation, validateQuery } = useComputation(dpdaId)
const { data: validationResult } = validateQuery

// Computed properties for reactive access to mutation data
// IMPORTANT: mutation.data is a nested ref - use .value to unwrap it
const computeResult = computed(() => computeMutation.data.value)
const dpdaName = computed(() => dpda.value?.name ?? 'DPDA')
const isValid = computed(() => validationResult.value?.is_valid ?? null)
const hasTrace = computed(() => {
  const result = computeMutation.data.value
  return !!result?.trace && Array.isArray(result.trace) && result.trace.length > 0
})

// Event handlers for PageLayout (these would be implemented but are stubs for now)
const handleValidate = () => {
  // Validation is automatic via validateQuery
}

const handleExport = () => {
  // TODO: Implement export functionality
}

const handleDelete = () => {
  // TODO: Implement delete functionality
}
</script>

<template>
  <PageLayout
    :show-sidebar="true"
    :dpda-id="dpdaId"
    :dpda-name="dpdaName"
    :is-valid="isValid"
    :can-validate="canValidate"
    current-view="compute"
    @validate="handleValidate"
    @export="handleExport"
    @delete="handleDelete"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      <span class="ml-3 text-muted-foreground">Loading DPDA...</span>
    </div>

    <!-- Error State -->
    <Alert v-else-if="isError" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertDescription>
        Error loading DPDA: {{ error?.message || 'Unknown error' }}
      </AlertDescription>
    </Alert>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Compute Form -->
      <section>
        <h2 class="text-2xl font-bold mb-4">Test String Acceptance</h2>
        <ComputeForm :dpda-id="dpdaId" :compute-mutation="computeMutation" />
      </section>

      <!-- Computation Result -->
      <section>
        <ComputeResult :result="computeResult" />
      </section>

      <!-- Execution Trace (conditional) -->
      <section v-if="hasTrace">
        <TraceViewer :trace="computeResult?.trace" />
      </section>
    </div>
  </PageLayout>
</template>
