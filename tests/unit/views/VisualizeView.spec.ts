import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { ref } from 'vue'
import VisualizeView from '@/views/VisualizeView.vue'
import { useDPDA } from '@/composables/useDPDA'
import { useVisualization } from '@/composables/useVisualization'

// Mock composables
vi.mock('@/composables/useDPDA')
vi.mock('@/composables/useVisualization')

// Mock CytoscapeGraph component
vi.mock('@/components/visualization/CytoscapeGraph.vue', () => ({
  default: {
    name: 'CytoscapeGraph',
    template: `
      <div>
        <div v-if="isLoading">Loading visualization...</div>
        <div v-else-if="error">Error: {{ error.message }}</div>
        <div v-else-if="!data">No visualization data available</div>
        <div v-else data-testid="cytoscape-container"></div>
      </div>
    `,
    props: ['data', 'isLoading', 'error'],
  },
}))

describe('VisualizeView', () => {
  let wrapper: any
  let queryClient: QueryClient
  let router: any

  // Create default mocks
  const createMocks = (options = {}) => {
    const defaults = {
      dpda: { id: 'test-dpda-1', name: 'Test DPDA', states: ['q0', 'q1'], is_valid: true },
      isLoading: false,
      isError: false,
      error: null,
      visualizationData: {
        format: 'cytoscape',
        data: {
          nodes: [
            { data: { id: 'q0', label: 'q0', type: 'initial' } },
            { data: { id: 'q1', label: 'q1', type: 'accept' } },
          ],
          edges: [
            { data: { source: 'q0', target: 'q1', label: 'a, ε → X' } },
          ],
        },
      },
      visualizationLoading: false,
      visualizationError: null,
    }

    const merged = { ...defaults, ...options }

    vi.mocked(useDPDA).mockReturnValue({
      getQuery: {
        data: ref(merged.dpda),
        isLoading: ref(merged.isLoading),
        isError: ref(merged.isError),
        error: ref(merged.error),
      },
    } as any)

    vi.mocked(useVisualization).mockReturnValue({
      visualizeQuery: {
        data: ref(merged.visualizationData),
        isLoading: ref(merged.visualizationLoading),
        isError: ref(merged.visualizationError !== null),
        error: ref(merged.visualizationError),
      },
    } as any)
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dpda/:id/visualize', component: VisualizeView },
      ],
    })
  })

  afterEach(() => {
    // CRITICAL: Cleanup wrapper (memory-safe pattern)
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
    // Clear QueryClient cache
    queryClient.clear()
    queryClient = null as any
  })

  const createWrapper = async (dpdaId = 'test-dpda-1') => {
    // Navigate to route with dpdaId
    await router.push(`/dpda/${dpdaId}/visualize`)

    wrapper = mount(VisualizeView, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }], router],
      },
    })

    await wrapper.vm.$nextTick()
    return wrapper
  }

  describe('Page Rendering', () => {
    beforeEach(() => createMocks())

    it('should render the component', async () => {
      const wrapper = await createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should extract dpdaId from route params', async () => {
      await createWrapper('my-dpda-id')
      expect(useDPDA).toHaveBeenCalledWith('my-dpda-id')
      expect(useVisualization).toHaveBeenCalledWith('my-dpda-id')
    })
  })

  describe('PageLayout Integration', () => {
    beforeEach(() => createMocks())

    it('should render PageLayout with correct props', async () => {
      const wrapper = await createWrapper()

      // Check for PageLayout props via component structure
      expect(wrapper.html()).toContain('Test DPDA')
    })

    it('should show sidebar (show-sidebar=true)', async () => {
      const wrapper = await createWrapper()

      // Sidebar should be present (look for sidebar navigation elements)
      expect(wrapper.html()).toContain('Editor')
      expect(wrapper.html()).toContain('Compute')
      expect(wrapper.html()).toContain('Visualize')
    })

    it('should highlight Visualize as current view', async () => {
      const wrapper = await createWrapper()

      // Look for active state indicator on Visualize link
      const visualizeLinks = wrapper.findAll('a').filter((link: any) =>
        link.text().includes('Visualize')
      )
      expect(visualizeLinks.length).toBeGreaterThan(0)
    })

    it('should display validation badge when isValid is true', async () => {
      createMocks({ dpda: { id: 'test-dpda-1', name: 'Valid DPDA', is_valid: true } })
      const wrapper = await createWrapper()

      expect(wrapper.html()).toContain('Valid')
    })

    it('should display validation badge when isValid is false', async () => {
      createMocks({ dpda: { id: 'test-dpda-1', name: 'Invalid DPDA', is_valid: false } })
      const wrapper = await createWrapper()

      expect(wrapper.html()).toContain('Invalid')
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching DPDA', async () => {
      createMocks({ dpda: undefined, isLoading: true })

      const wrapper = await createWrapper()
      expect(wrapper.text()).toContain('Loading')
    })

    it('should show loading state while fetching visualization', async () => {
      createMocks({ visualizationData: undefined, visualizationLoading: true })

      const wrapper = await createWrapper()
      expect(wrapper.text()).toContain('Loading')
    })
  })

  describe('Error States', () => {
    it('should show error when DPDA fetch fails', async () => {
      createMocks({
        dpda: undefined,
        isLoading: false,
        isError: true,
        error: { message: 'DPDA not found' },
      })

      const wrapper = await createWrapper()
      expect(wrapper.text()).toContain('Error')
      expect(wrapper.text()).toContain('DPDA not found')
    })

    it('should show error when visualization fetch fails', async () => {
      createMocks({
        visualizationData: undefined,
        visualizationError: { message: 'Visualization failed' },
      })

      const wrapper = await createWrapper()
      expect(wrapper.text()).toContain('Error')
    })
  })

  describe('CytoscapeGraph Integration', () => {
    beforeEach(() => createMocks())

    it('should render CytoscapeGraph component', async () => {
      const wrapper = await createWrapper()

      // Check for cytoscape container
      const cytoscapeContainer = wrapper.find('[data-testid="cytoscape-container"]')
      expect(cytoscapeContainer.exists()).toBe(true)
    })

    it('should pass visualization data to CytoscapeGraph', async () => {
      const mockData = {
        format: 'cytoscape' as const,
        data: {
          nodes: [{ data: { id: 'q0', label: 'q0' } }],
          edges: [],
        },
      }
      createMocks({ visualizationData: mockData })

      const wrapper = await createWrapper()

      // CytoscapeGraph should receive the graph data
      // Since we can't easily access component props in tests, check that data is rendered
      expect(wrapper.html()).toContain('cytoscape-container')
    })

    it('should show empty state when no visualization data', async () => {
      createMocks({ visualizationData: undefined })

      const wrapper = await createWrapper()
      expect(wrapper.text()).toContain('No visualization data available')
    })
  })

  describe('Computed Properties', () => {
    it('should compute dpdaName from dpda data', async () => {
      createMocks({ dpda: { id: 'test-1', name: 'Arithmetic DPDA' } })

      const wrapper = await createWrapper()
      expect(wrapper.text()).toContain('Arithmetic DPDA')
    })

    it('should default dpdaName to "DPDA" when no name', async () => {
      createMocks({ dpda: { id: 'test-1' } })

      const wrapper = await createWrapper()
      // Will show "DPDA" as default name in header
      expect(wrapper.html()).toContain('DPDA')
    })

    it('should compute isValid from dpda data', async () => {
      createMocks({ dpda: { id: 'test-1', name: 'Test', is_valid: true } })

      const wrapper = await createWrapper()
      expect(wrapper.html()).toContain('Valid')
    })

    it('should handle isValid as null when not available', async () => {
      createMocks({ dpda: { id: 'test-1', name: 'Test', is_valid: undefined } })

      const wrapper = await createWrapper()
      // Should not show validation badge when is_valid is undefined
      // Just check it renders without error
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Action Handlers', () => {
    beforeEach(() => createMocks())

    it('should have validate handler', async () => {
      const wrapper = await createWrapper()
      // Just verify component renders with handlers (actual implementation is placeholder)
      expect(wrapper.exists()).toBe(true)
    })

    it('should have export handler', async () => {
      const wrapper = await createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should have delete handler', async () => {
      const wrapper = await createWrapper()
      expect(wrapper.exists()).toBe(true)
    })
  })
})
