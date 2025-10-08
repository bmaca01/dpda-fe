import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { ref } from 'vue'
import ComputeView from '@/views/ComputeView.vue'
import { useDPDA } from '@/composables/useDPDA'
import { useComputation } from '@/composables/useComputation'

// Mock composables
vi.mock('@/composables/useDPDA')
vi.mock('@/composables/useComputation')

describe('ComputeView', () => {
  let wrapper: any
  let queryClient: QueryClient
  let router: any

  // Create default mocks
  const createMocks = (options = {}) => {
    const defaults = {
      dpda: { id: 'test-dpda-1', name: 'Test DPDA', states: ['q0', 'q1'] },
      isLoading: false,
      isError: false,
      error: null,
      validationData: { is_valid: true, violations: [], message: 'Valid' },
      computeData: undefined,
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

    vi.mocked(useComputation).mockReturnValue({
      validateQuery: {
        data: ref(merged.validationData),
        isLoading: ref(false),
      },
      computeMutation: {
        data: ref(merged.computeData),
        mutate: vi.fn(),
        isPending: ref(false),
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
        { path: '/dpda/:id/compute', component: ComputeView },
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
    await router.push(`/dpda/${dpdaId}/compute`)

    wrapper = mount(ComputeView, {
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

    it('should use dpdaId from route params', async () => {
      await createWrapper('my-dpda-id')
      expect(useDPDA).toHaveBeenCalledWith('my-dpda-id')
      expect(useComputation).toHaveBeenCalledWith('my-dpda-id')
    })
  })

  describe('Component Integration', () => {
    beforeEach(() => createMocks())

    it('should render ComputeForm component', async () => {
      const wrapper = await createWrapper()
      // ComputeForm should be present
      expect(wrapper.html()).toContain('Input String')
    })

    it('should show empty state for ComputeResult when no result', async () => {
      const wrapper = await createWrapper()
      expect(wrapper.text()).toContain('No computation result')
    })

    it('should not show TraceViewer when no trace data', async () => {
      const wrapper = await createWrapper()
      expect(wrapper.text()).not.toContain('Execution Trace')
    })
  })

  describe('Result Display', () => {
    it('should display ComputeResult when computation completes', async () => {
      createMocks({
        computeData: {
          accepted: true,
          final_state: 'q2',
          final_stack: ['$'],
          steps_taken: 5,
        },
      })

      const wrapper = await createWrapper()
      expect(wrapper.text()).toContain('Computation Result')
      expect(wrapper.text()).toContain('Accepted')
    })

    it('should update UI when mutation.data changes (reactivity test)', async () => {
      // This test simulates the exact browser behavior:
      // 1. Component mounts with mutation.data = undefined
      // 2. User clicks compute, mutation updates mutation.data
      // 3. UI should reactively update

      const mutationDataRef = ref(undefined)
      const mutateFn = vi.fn()

      vi.mocked(useDPDA).mockReturnValue({
        getQuery: {
          data: ref({ id: 'dpda-1', name: 'Arithmetic DPDA', states: ['q0', 'q1'] }),
          isLoading: ref(false),
          isError: ref(false),
          error: ref(null),
        },
      } as any)

      vi.mocked(useComputation).mockReturnValue({
        validateQuery: {
          data: ref({ is_valid: true, violations: [], message: 'DPDA is valid' }),
          isLoading: ref(false),
        },
        computeMutation: {
          data: mutationDataRef,
          mutate: mutateFn,
          isPending: ref(false),
        },
      } as any)

      const wrapper = await createWrapper()

      // Step 1: Initially shows empty state
      expect(wrapper.text()).toContain('No computation result')

      // Step 2: Simulate mutation success (like API responding)
      // This is what happens in the browser when computeMutation.mutate() succeeds
      mutationDataRef.value = {
        accepted: true,
        final_state: '13',
        final_stack: ['$'],
        steps_taken: 14,
        trace: null,
        reason: null,
      } as any

      await wrapper.vm.$nextTick()

      // Step 3: UI MUST update to show the result
      // This is the bug - it currently doesn't update!
      expect(wrapper.text()).toContain('Computation Result')
      expect(wrapper.text()).toContain('Accepted')
      expect(wrapper.text()).toContain('13') // final_state
      expect(wrapper.text()).toContain('14') // steps_taken
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching DPDA', async () => {
      createMocks({ dpda: undefined, isLoading: true })

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
    })
  })
})
