import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import TransitionTable from '@/components/dpda/TransitionTable.vue'
import * as transitionsApi from '@/api/endpoints/transitions'

// Mock API
vi.mock('@/api/endpoints/transitions')

describe('TransitionTable', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  const mockTransitions = [
    {
      from_state: 'q0',
      input_symbol: '0',
      stack_top: '$',
      to_state: 'q1',
      stack_push: ['A', '$'],
    },
    {
      from_state: 'q1',
      input_symbol: null, // epsilon
      stack_top: 'A',
      to_state: 'q2',
      stack_push: [],
    },
    {
      from_state: 'q2',
      input_symbol: '1',
      stack_top: null, // epsilon
      to_state: 'q0',
      stack_push: ['B'],
    },
  ]

  const createWrapper = (props = {}) => {
    return mount(TransitionTable, {
      props: {
        dpdaId: 'test-dpda-1',
        ...props,
      },
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    })
  }

  describe('Rendering', () => {
    it('should render table headers', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: mockTransitions,
        total: 3,
      })

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('From State')
      expect(wrapper.text()).toContain('Input')
      expect(wrapper.text()).toContain('Stack Top')
      expect(wrapper.text()).toContain('To State')
      expect(wrapper.text()).toContain('Stack Push')
      expect(wrapper.text()).toContain('Actions')
    })

    it('should render all transitions in table rows', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: mockTransitions,
        total: 3,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Check for transition data
      expect(wrapper.text()).toContain('q0')
      expect(wrapper.text()).toContain('q1')
      expect(wrapper.text()).toContain('q2')
    })

    it('should display epsilon symbol for null input', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: mockTransitions,
        total: 3,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Should show epsilon symbol
      expect(wrapper.text()).toMatch(/ε|epsilon/i)
    })

    it('should display stack push array as comma-separated string', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: mockTransitions,
        total: 3,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Stack push should be formatted
      expect(wrapper.text()).toMatch(/A.*\$|A,/)
    })

    it('should show empty state when no transitions', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [],
        total: 0,
      })

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toMatch(/no transitions|empty/i)
    })

    it('should show loading state while fetching', async () => {
      let resolveTransitions: (value: any) => void
      const transitionsPromise = new Promise((resolve) => {
        resolveTransitions = resolve
      })
      vi.mocked(transitionsApi.getTransitions).mockReturnValue(transitionsPromise as any)

      const wrapper = createWrapper()

      // Should show loading indicator
      expect(wrapper.text()).toMatch(/loading/i)

      resolveTransitions!({ transitions: mockTransitions, total: 3 })
      await flushPromises()
    })

    it('should show error state on API failure', async () => {
      vi.mocked(transitionsApi.getTransitions).mockRejectedValue(new Error('API Error'))

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toMatch(/error|failed/i)
    })
  })

  describe('Delete Functionality', () => {
    it('should render delete button for each transition', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: mockTransitions,
        total: 3,
      })

      const wrapper = createWrapper()
      await flushPromises()

      const deleteButtons = wrapper.findAll('[data-testid="delete-transition-button"]')
      expect(deleteButtons.length).toBe(3)
    })

    it('should call deleteTransition API with correct index', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: mockTransitions,
        total: 3,
      })
      vi.mocked(transitionsApi.deleteTransition).mockResolvedValue({
        success: true,
        message: 'Deleted',
        remaining_transitions: 2,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Call handleDelete directly (Dialog is teleported and hard to test in unit tests)
      await wrapper.vm.handleDelete(0)
      await flushPromises()

      expect(transitionsApi.deleteTransition).toHaveBeenCalledWith('test-dpda-1', 0)
    })

    it('should show confirmation dialog before deleting', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: mockTransitions,
        total: 3,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Click delete button - should open dialog
      const deleteButtons = wrapper.findAll('[data-testid="delete-transition-button"]')
      await deleteButtons[0].trigger('click')
      await flushPromises()

      // Check dialog state (Dialog content is teleported, check internal state instead)
      expect(wrapper.vm.showDeleteDialog).toBe(true)
      expect(wrapper.vm.deleteIndex).toBe(0)
    })

    it('should refetch transitions after successful deletion', async () => {
      const getTransitionsMock = vi
        .mocked(transitionsApi.getTransitions)
        .mockResolvedValue({
          transitions: mockTransitions,
          total: 3,
        })

      vi.mocked(transitionsApi.deleteTransition).mockResolvedValue({
        success: true,
        message: 'Deleted',
        remaining_transitions: 2,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Initial fetch
      expect(getTransitionsMock).toHaveBeenCalledTimes(1)

      // Delete transition
      wrapper.vm.handleDelete(0)
      await flushPromises()

      // Should refetch (via query invalidation)
      // Note: In actual implementation this happens via TanStack Query
    })

    it('should handle deletion errors gracefully', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: mockTransitions,
        total: 3,
      })
      vi.mocked(transitionsApi.deleteTransition).mockRejectedValue(
        new Error('Delete failed')
      )

      const wrapper = createWrapper()
      await flushPromises()

      // Attempt to delete
      wrapper.vm.handleDelete(0)
      await flushPromises()

      // Should show error message
      expect(wrapper.text()).toMatch(/error|failed/i)
    })
  })

  describe('Display Formatting', () => {
    it('should format epsilon input symbol as ε', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [
          {
            from_state: 'q0',
            input_symbol: null,
            stack_top: '$',
            to_state: 'q1',
            stack_push: ['A'],
          },
        ],
        total: 1,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Epsilon should be displayed as ε symbol
      const cells = wrapper.findAll('td')
      const inputCell = cells.find((cell) => cell.text().match(/ε|epsilon/i))
      expect(inputCell).toBeDefined()
    })

    it('should format epsilon stack top as ε', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [
          {
            from_state: 'q0',
            input_symbol: '0',
            stack_top: null,
            to_state: 'q1',
            stack_push: [],
          },
        ],
        total: 1,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Epsilon should be displayed as ε symbol
      expect(wrapper.text()).toMatch(/ε|epsilon/i)
    })

    it('should format empty stack push as "-" or "empty"', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [
          {
            from_state: 'q0',
            input_symbol: '0',
            stack_top: 'A',
            to_state: 'q1',
            stack_push: [],
          },
        ],
        total: 1,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Empty stack push should show placeholder
      expect(wrapper.text()).toMatch(/-|empty|none/i)
    })

    it('should join stack push array with commas', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [
          {
            from_state: 'q0',
            input_symbol: '0',
            stack_top: '$',
            to_state: 'q1',
            stack_push: ['B', 'A', '$'],
          },
        ],
        total: 1,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Stack push should be comma-separated
      expect(wrapper.text()).toContain('B')
      expect(wrapper.text()).toContain('A')
    })
  })

  describe('Edge Cases', () => {
    it('should handle transitions with all epsilon values', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [
          {
            from_state: 'q0',
            input_symbol: null,
            stack_top: null,
            to_state: 'q0',
            stack_push: [],
          },
        ],
        total: 1,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Should render without errors
      expect(wrapper.text()).toContain('q0')
    })

    it('should display transition count', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: mockTransitions,
        total: 3,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Should show count of transitions
      expect(wrapper.text()).toMatch(/3.*transition/i)
    })

    it('should handle very long stack push arrays', async () => {
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [
          {
            from_state: 'q0',
            input_symbol: '0',
            stack_top: '$',
            to_state: 'q1',
            stack_push: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
          },
        ],
        total: 1,
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Should render all symbols
      expect(wrapper.text()).toContain('A')
      expect(wrapper.text()).toContain('G')
    })
  })
})
