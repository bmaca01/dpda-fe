import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useVisualization } from '@/composables/useVisualization'
import { visualizeDPDA } from '@/api/endpoints/operations'

// Mock the API
vi.mock('@/api/endpoints/operations')

describe('useVisualization', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
    queryClient = null as any
  })

  const createWrapper = (dpdaId?: string) => {
    const TestComponent = defineComponent({
      setup() {
        const result = useVisualization(dpdaId)
        return { result }
      },
      render() {
        return h('div')
      },
    })

    return mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    })
  }

  describe('visualizeQuery', () => {
    it('should return visualizeQuery object', () => {
      const wrapper = createWrapper('test-dpda-1')
      expect(wrapper.vm.result).toBeDefined()
      expect(wrapper.vm.result.visualizeQuery).toBeDefined()
    })

    it('should call visualizeDPDA with correct dpdaId and format', async () => {
      vi.mocked(visualizeDPDA).mockResolvedValue({
        format: 'cytoscape',
        data: { nodes: [], edges: [] },
      })

      const wrapper = createWrapper('test-dpda-1')
      await wrapper.vm.$nextTick()

      // Wait for query to execute
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(visualizeDPDA).toHaveBeenCalledWith('test-dpda-1', 'cytoscape')
    })

    it('should use correct query key for caching', () => {
      createWrapper('test-dpda-1')

      // Check that query is registered with correct key in cache
      const queryCache = queryClient.getQueryCache()
      const query = queryCache.find({ queryKey: ['dpda', 'test-dpda-1', 'visualize'] })

      expect(query).toBeDefined()
      expect(query?.queryKey).toEqual(['dpda', 'test-dpda-1', 'visualize'])
    })

    it('should enable query only when dpdaId is provided', () => {
      const wrapper1 = createWrapper('test-dpda-1')
      const wrapper2 = createWrapper(undefined)

      // Query should be enabled with valid ID
      expect(wrapper1.vm.result.visualizeQuery.isEnabled.value).toBe(true)

      // Query should be disabled without ID
      expect(wrapper2.vm.result.visualizeQuery.isEnabled.value).toBe(false)
    })

    it('should not call API when dpdaId is undefined', async () => {
      createWrapper(undefined)
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(visualizeDPDA).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Visualization failed')
      vi.mocked(visualizeDPDA).mockRejectedValue(mockError)

      const wrapper = createWrapper('test-dpda-1')
      await wrapper.vm.$nextTick()

      // Wait for query to fail
      await new Promise((resolve) => setTimeout(resolve, 100))

      const { visualizeQuery } = wrapper.vm.result
      expect(visualizeQuery.isError.value).toBe(true)
      expect(visualizeQuery.error.value).toBeDefined()
    })

    it('should set appropriate staleTime (5 minutes)', () => {
      createWrapper('test-dpda-1')

      // Access query options from the queryClient
      const queryCache = queryClient.getQueryCache()
      const query = queryCache.find({ queryKey: ['dpda', 'test-dpda-1', 'visualize'] })

      // Check that query exists and has staleTime set
      expect(query).toBeDefined()
      expect((query?.options as any).staleTime).toBe(5 * 60 * 1000) // 5 minutes
    })

    it('should return visualization data when API succeeds', async () => {
      const mockData = {
        format: 'cytoscape' as const,
        data: {
          nodes: [
            { data: { id: 'q0', label: 'q0' } },
            { data: { id: 'q1', label: 'q1' } },
          ],
          edges: [{ data: { source: 'q0', target: 'q1', label: 'a, ε → X' } }],
        },
      }
      vi.mocked(visualizeDPDA).mockResolvedValue(mockData)

      const wrapper = createWrapper('test-dpda-1')
      await wrapper.vm.$nextTick()

      // Wait for query to resolve
      await new Promise((resolve) => setTimeout(resolve, 100))

      const { visualizeQuery } = wrapper.vm.result
      expect(visualizeQuery.data.value).toEqual(mockData)
    })
  })
})
