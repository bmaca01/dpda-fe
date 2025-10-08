<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDPDA } from '@/composables/useDPDA'
import { useVisualization } from '@/composables/useVisualization'
import PageLayout from '@/components/layout/PageLayout.vue'
import CytoscapeGraph from '@/components/visualization/CytoscapeGraph.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-vue-next'

// Get DPDA ID from route
const route = useRoute()
const dpdaId = route.params.id as string

// Fetch DPDA info
const { getQuery: dpdaQuery } = useDPDA(dpdaId)
const { data: dpda, isLoading, isError, error } = dpdaQuery

// Fetch visualization data
const { visualizeQuery } = useVisualization(dpdaId)
const {
  data: visualizationData,
  isLoading: visualizationLoading,
  isError: visualizationError,
  error: visualizationErrorMessage,
} = visualizeQuery

// Computed properties for reactive access
const dpdaName = computed(() => dpda.value?.name ?? 'DPDA')
const isValid = computed(() => dpda.value?.is_valid ?? null)
const graphData = computed(() => visualizationData.value?.data)

// Event handlers for PageLayout (placeholders for now)
const handleValidate = () => {
  // TODO: Implement validation functionality
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
    current-view="visualize"
    @validate="handleValidate"
    @export="handleExport"
    @delete="handleDelete"
  >
    <!-- Loading State (DPDA) -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      <span class="ml-3 text-muted-foreground">Loading DPDA...</span>
    </div>

    <!-- Error State (DPDA) -->
    <Alert v-else-if="isError" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertDescription>
        Error loading DPDA: {{ error?.message || 'Unknown error' }}
      </AlertDescription>
    </Alert>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Page Title -->
      <section>
        <h2 class="text-2xl font-bold mb-2">DPDA State Diagram</h2>
        <p class="text-muted-foreground">
          Interactive visualization of the deterministic pushdown automaton
        </p>
      </section>

      <!-- Graph Visualization -->
      <section>
        <CytoscapeGraph
          :data="graphData"
          :is-loading="visualizationLoading"
          :error="visualizationErrorMessage"
        />
      </section>

      <!-- Legend (if graph is displayed) -->
      <section v-if="graphData && !visualizationLoading && !visualizationError" class="mt-6">
        <h3 class="text-lg font-semibold mb-3">Legend</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-full bg-[#10b981] border-4 border-[#059669]"></div>
            <span class="text-sm">Initial State</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-full bg-[#3b82f6] border-4 border-[#2563eb]"></div>
            <span class="text-sm">Accept State</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-full bg-[#8b5cf6] border-4 border-[#7c3aed]"></div>
            <span class="text-sm">Initial & Accept</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-full bg-[#666]"></div>
            <span class="text-sm">Regular State</span>
          </div>
        </div>
      </section>
    </div>
  </PageLayout>
</template>
