<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-vue-next'

interface Props {
  data?: {
    elements: ElementDefinition[]
  }
  isLoading?: boolean
  error?: { message: string } | null
}

const props = defineProps<Props>()

// eslint-disable-next-line no-undef
const containerRef = ref<HTMLDivElement | null>(null)
const cy = ref<Core | null>(null)

/**
 * Initialize Cytoscape with graph data
 */
const initCytoscape = () => {
  // Cleanup existing instance
  if (cy.value) {
    cy.value.destroy()
    cy.value = null
  }

  // Don't initialize if no container or no data
  if (!containerRef.value || !props.data) {
    return
  }

  // Initialize Cytoscape
  cy.value = cytoscape({
    container: containerRef.value,
    elements: props.data.elements,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#666',
          label: 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          color: '#fff',
          'font-size': '14px',
          width: '50px',
          height: '50px',
        },
      },
      {
        selector: '.initial',
        style: {
          'background-color': '#10b981',
          'border-width': '3px',
          'border-color': '#059669',
        },
      },
      {
        selector: '.accept',
        style: {
          'background-color': '#3b82f6',
          'border-width': '3px',
          'border-color': '#2563eb',
        },
      },
      {
        selector: '.initial-accept',
        style: {
          'background-color': '#8b5cf6',
          'border-width': '3px',
          'border-color': '#7c3aed',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': '#9ca3af',
          'target-arrow-color': '#9ca3af',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          label: 'data(label)',
          'font-size': '11px',
          color: '#374151',
          'text-wrap': 'wrap',
          'text-max-width': '120px',
          'text-background-color': '#f3f4f6',
          'text-background-opacity': 0.9,
          'text-background-padding': '4px',
        },
      },
      {
        selector: '.self-loop',
        style: {
          'loop-direction': '90deg',
          'loop-sweep': '20deg',
          'font-size': '10px',
          'text-max-width': '100px',
          'text-margin-x': 10,
          'text-margin-y': -10,
        },
      },
    ],
    layout: {
      name: 'cose',
      animate: false,
      padding: 30,
    },
  })
}

// Initialize on mount if data is available
onMounted(() => {
  if (props.data && !props.isLoading && !props.error) {
    initCytoscape()
  }
})

// Re-initialize when data changes
watch(
  () => props.data,
  async (newData) => {
    if (newData && !props.isLoading && !props.error) {
      // Wait for nextTick to ensure containerRef is available
      // This is needed when transitioning from no data to data
      await nextTick()
      initCytoscape()
    }
  }
)

// Cleanup on unmount
onUnmounted(() => {
  if (cy.value) {
    cy.value.destroy()
    cy.value = null
  }
})
</script>

<template>
  <div class="w-full">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center h-[600px] border rounded-lg bg-muted/10"
    >
      <div class="text-center">
        <Loader2 class="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
        <p class="text-muted-foreground">Loading visualization...</p>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive" class="mb-4">
      <AlertTriangle class="h-4 w-4" />
      <AlertDescription> Error loading visualization: {{ error.message }} </AlertDescription>
    </Alert>

    <!-- Empty State -->
    <div
      v-else-if="!data"
      class="flex items-center justify-center h-[600px] border rounded-lg bg-muted/10"
    >
      <div class="text-center">
        <p class="text-muted-foreground">No visualization data available</p>
        <p class="text-sm text-muted-foreground mt-2">
          Configure your DPDA to see the state diagram
        </p>
      </div>
    </div>

    <!-- Cytoscape Container -->
    <div
      v-else
      ref="containerRef"
      data-testid="cytoscape-container"
      class="w-full h-[600px] border rounded-lg bg-background"
    />
  </div>
</template>
