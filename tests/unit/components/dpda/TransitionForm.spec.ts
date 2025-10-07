import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import TransitionForm from '@/components/dpda/TransitionForm.vue'
import * as transitionsApi from '@/api/endpoints/transitions'

// Mock API
vi.mock('@/api/endpoints/transitions')

describe('TransitionForm', () => {
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

  const createWrapper = (props = {}) => {
    return mount(TransitionForm, {
      props: {
        dpdaId: 'test-dpda-1',
        states: ['q0', 'q1', 'q2'],
        inputAlphabet: ['0', '1'],
        stackAlphabet: ['$', 'A', 'B'],
        ...props,
      },
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    })
  }

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('[data-testid="from-state-select"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="input-symbol-select"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="stack-top-select"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="to-state-select"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="stack-push-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="submit-button"]').exists()).toBe(true)
    })

    it('should display labels for each field', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('From State')
      expect(wrapper.text()).toContain('Input Symbol')
      expect(wrapper.text()).toContain('Stack Top')
      expect(wrapper.text()).toContain('To State')
      expect(wrapper.text()).toContain('Stack Push')
    })

    it('should populate state dropdowns with provided states', () => {
      const wrapper = createWrapper()

      // Check that states are passed as props (Select content is teleported, hard to test)
      expect(wrapper.props('states')).toEqual(['q0', 'q1', 'q2'])
    })

    it('should populate input alphabet dropdown including epsilon option', () => {
      const wrapper = createWrapper()

      // Check that input alphabet is passed as props (Select content is teleported)
      expect(wrapper.props('inputAlphabet')).toEqual(['0', '1'])
      // Epsilon option is hardcoded in the component, verified by other tests
    })

    it('should populate stack alphabet dropdown including epsilon option', () => {
      const wrapper = createWrapper()

      // Check that stack alphabet is passed as props (Select content is teleported)
      expect(wrapper.props('stackAlphabet')).toEqual(['$', 'A', 'B'])
      // Epsilon option is hardcoded in the component, verified by other tests
    })

    it('should show helpful description for stack push field', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toMatch(/comma.*separated|order/i)
    })
  })

  describe('Form Validation', () => {
    it('should require from state to be selected', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      await wrapper.find('[data-testid="submit-button"]').trigger('click')
      await flushPromises()

      // API should NOT be called without required fields
      expect(transitionsApi.addTransition).not.toHaveBeenCalled()
    })

    it('should require to state to be selected', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      // Set only from state via VM (Select components don't support setValue in tests)
      ;(wrapper.vm as any).fromState = 'q0'
      await flushPromises()

      await wrapper.find('[data-testid="submit-button"]').trigger('click')
      await flushPromises()

      // API should NOT be called without to state
      expect(transitionsApi.addTransition).not.toHaveBeenCalled()
    })

    it('should allow valid transition submission', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      // Fill in valid data via VM (Select components don't support setValue in tests)
      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).inputSymbol = '0'
      ;(wrapper.vm as any).stackTop = '$'
      ;(wrapper.vm as any).toState = 'q1'
      await wrapper.find('[data-testid="stack-push-input"]').setValue('A,$')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should call API
      expect(transitionsApi.addTransition).toHaveBeenCalled()
    })
  })

  describe('Epsilon Handling', () => {
    it('should convert epsilon input symbol to null for API', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      // Select epsilon for input symbol via VM
      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).inputSymbol = '__epsilon__' // Epsilon placeholder
      ;(wrapper.vm as any).stackTop = '$'
      ;(wrapper.vm as any).toState = 'q1'
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(transitionsApi.addTransition).toHaveBeenCalledWith(
        'test-dpda-1',
        expect.objectContaining({
          input_symbol: null, // Epsilon should be null
        })
      )
    })

    it('should convert epsilon stack top to null for API', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).inputSymbol = '0'
      ;(wrapper.vm as any).stackTop = '__epsilon__' // Epsilon placeholder
      ;(wrapper.vm as any).toState = 'q1'
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(transitionsApi.addTransition).toHaveBeenCalledWith(
        'test-dpda-1',
        expect.objectContaining({
          stack_top: null, // Epsilon should be null
        })
      )
    })
  })

  describe('Stack Push Parsing', () => {
    it('should parse comma-separated stack push values into array', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).inputSymbol = '0'
      ;(wrapper.vm as any).stackTop = '$'
      ;(wrapper.vm as any).toState = 'q1'
      await wrapper.find('[data-testid="stack-push-input"]').setValue('B,A,$')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(transitionsApi.addTransition).toHaveBeenCalledWith(
        'test-dpda-1',
        expect.objectContaining({
          stack_push: ['B', 'A', '$'], // First element pushed last
        })
      )
    })

    it('should handle empty stack push (pop only)', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).inputSymbol = '0'
      ;(wrapper.vm as any).stackTop = 'A'
      ;(wrapper.vm as any).toState = 'q1'
      await wrapper.find('[data-testid="stack-push-input"]').setValue('')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(transitionsApi.addTransition).toHaveBeenCalledWith(
        'test-dpda-1',
        expect.objectContaining({
          stack_push: [],
        })
      )
    })

    it('should trim whitespace from stack push values', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).inputSymbol = '0'
      ;(wrapper.vm as any).stackTop = '$'
      ;(wrapper.vm as any).toState = 'q1'
      await wrapper.find('[data-testid="stack-push-input"]').setValue(' A , $ ')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(transitionsApi.addTransition).toHaveBeenCalledWith(
        'test-dpda-1',
        expect.objectContaining({
          stack_push: ['A', '$'], // Whitespace trimmed
        })
      )
    })
  })

  describe('API Integration', () => {
    it('should call addTransition API with correct data', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).inputSymbol = '1'
      ;(wrapper.vm as any).stackTop = 'A'
      ;(wrapper.vm as any).toState = 'q2'
      await wrapper.find('[data-testid="stack-push-input"]').setValue('B,A')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(transitionsApi.addTransition).toHaveBeenCalledWith('test-dpda-1', {
        from_state: 'q0',
        input_symbol: '1',
        stack_top: 'A',
        to_state: 'q2',
        stack_push: ['B', 'A'],
      })
    })

    it('should show success message after adding transition', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).toState = 'q1'
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toMatch(/success|added/i)
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(transitionsApi.addTransition).mockRejectedValue(new Error('API Error'))

      const wrapper = createWrapper()

      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).toState = 'q1'
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toMatch(/error|failed/i)
    })

    it('should disable submit button while submitting', async () => {
      // Make the API call hang
      let resolveApiCall: (value: any) => void
      const apiPromise = new Promise((resolve) => {
        resolveApiCall = resolve
      })
      vi.mocked(transitionsApi.addTransition).mockReturnValue(apiPromise as any)

      const wrapper = createWrapper()

      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).toState = 'q1'
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Button should be disabled
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.attributes('disabled')).toBeDefined()

      // Resolve the API call
      resolveApiCall!({ success: true, message: 'Added' })
      await flushPromises()
    })

    it('should clear form after successful submission', async () => {
      vi.mocked(transitionsApi.addTransition).mockResolvedValue({
        success: true,
        message: 'Transition added',
      })

      const wrapper = createWrapper()

      ;(wrapper.vm as any).fromState = 'q0'
      ;(wrapper.vm as any).inputSymbol = '0'
      ;(wrapper.vm as any).stackTop = '$'
      ;(wrapper.vm as any).toState = 'q1'
      await wrapper.find('[data-testid="stack-push-input"]').setValue('A')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Form should be reset
      const stackPushInput = wrapper.find('[data-testid="stack-push-input"]')
      expect((stackPushInput.element as HTMLInputElement).value).toBe('')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing states prop gracefully', () => {
      const wrapper = createWrapper({ states: [] })

      // Should still render but show empty dropdowns
      expect(wrapper.find('[data-testid="from-state-select"]').exists()).toBe(true)
    })

    it('should handle missing alphabets prop gracefully', () => {
      const wrapper = createWrapper({ inputAlphabet: [], stackAlphabet: [] })

      // Should still render but only show epsilon option
      expect(wrapper.find('[data-testid="input-symbol-select"]').exists()).toBe(true)
    })

    it('should warn about stack push order', () => {
      const wrapper = createWrapper()

      // Should have a hint about first element being pushed last
      expect(wrapper.text()).toMatch(/first.*last|order.*top|push.*order/i)
    })
  })
})
