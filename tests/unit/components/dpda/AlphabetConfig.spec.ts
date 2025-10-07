import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import AlphabetConfig from '@/components/dpda/AlphabetConfig.vue'
import * as configApi from '@/api/endpoints/configuration'

// Mock API
vi.mock('@/api/endpoints/configuration')

describe('AlphabetConfig', () => {
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
    return mount(AlphabetConfig, {
      props: {
        dpdaId: 'test-dpda-1',
        ...props,
      },
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    })
  }

  describe('Form Rendering', () => {
    it('should render form fields for input alphabet, stack alphabet, and initial stack symbol', () => {
      const wrapper = createWrapper()

      // Check for all required form fields
      expect(wrapper.find('[data-testid="input-alphabet-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="stack-alphabet-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="initial-stack-symbol-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="submit-button"]').exists()).toBe(true)
    })

    it('should display labels for each field', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('Input Alphabet')
      expect(wrapper.text()).toContain('Stack Alphabet')
      expect(wrapper.text()).toContain('Initial Stack Symbol')
    })

    it('should show helpful descriptions', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('comma-separated')
    })
  })

  describe('Form Validation', () => {
    it('should show error when stack alphabet field is empty', async () => {
      vi.mocked(configApi.setAlphabets).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()

      // API should NOT be called for invalid form (validation should prevent submission)
      expect(configApi.setAlphabets).not.toHaveBeenCalled()
    })

    it('should show error when initial stack symbol is empty', async () => {
      const wrapper = createWrapper()

      // Set stack alphabet
      const stackAlphabetInput = wrapper.find('[data-testid="stack-alphabet-input"]')
      await stackAlphabetInput.setValue('$,A,B')

      await flushPromises()

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toMatch(/initial stack symbol.*required/i)
    })

    it('should show error when initial stack symbol not in stack alphabet', async () => {
      const wrapper = createWrapper()

      // Set stack alphabet
      const stackAlphabetInput = wrapper.find('[data-testid="stack-alphabet-input"]')
      await stackAlphabetInput.setValue('$,A,B')
      await flushPromises()

      // Set initial stack symbol to invalid value
      const initialStackSymbolInput = wrapper.find('[data-testid="initial-stack-symbol-input"]')
      await initialStackSymbolInput.setValue('Z')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toMatch(/initial stack symbol.*must be.*in.*stack alphabet/i)
    })

    it('should not show errors for valid input', async () => {
      const wrapper = createWrapper()

      vi.mocked(configApi.setAlphabets).mockResolvedValue({ success: true, message: 'Saved' })

      // Set valid alphabets
      const inputAlphabetInput = wrapper.find('[data-testid="input-alphabet-input"]')
      await inputAlphabetInput.setValue('0,1')

      const stackAlphabetInput = wrapper.find('[data-testid="stack-alphabet-input"]')
      await stackAlphabetInput.setValue('$,A,B')

      // Set valid initial stack symbol
      const initialStackSymbolInput = wrapper.find('[data-testid="initial-stack-symbol-input"]')
      await initialStackSymbolInput.setValue('$')

      await flushPromises()

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()

      // Should not have validation errors - check that error elements don't exist
      const errorElements = wrapper.findAll('.text-destructive')
      expect(errorElements.length).toBe(0)
    })

    it('should allow empty input alphabet', async () => {
      vi.mocked(configApi.setAlphabets).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      // Leave input alphabet empty
      const stackAlphabetInput = wrapper.find('[data-testid="stack-alphabet-input"]')
      await stackAlphabetInput.setValue('$')

      const initialStackSymbolInput = wrapper.find('[data-testid="initial-stack-symbol-input"]')
      await initialStackSymbolInput.setValue('$')

      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should call API with empty input alphabet
      expect(configApi.setAlphabets).toHaveBeenCalledWith('test-dpda-1', {
        input_alphabet: [],
        stack_alphabet: ['$'],
        initial_stack_symbol: '$',
      })
    })
  })

  describe('API Integration', () => {
    it('should call setAlphabets API on successful submit', async () => {
      vi.mocked(configApi.setAlphabets).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      // Fill in valid form data
      await wrapper.find('[data-testid="input-alphabet-input"]').setValue('0,1')
      await wrapper.find('[data-testid="stack-alphabet-input"]').setValue('$,A,B')
      await wrapper.find('[data-testid="initial-stack-symbol-input"]').setValue('$')
      await flushPromises()

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Check API was called with correct data
      expect(configApi.setAlphabets).toHaveBeenCalledWith('test-dpda-1', {
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A', 'B'],
        initial_stack_symbol: '$',
      })
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(configApi.setAlphabets).mockRejectedValue(new Error('API Error'))

      const wrapper = createWrapper()

      // Fill in valid form data
      await wrapper.find('[data-testid="input-alphabet-input"]').setValue('0,1')
      await flushPromises()
      await wrapper.find('[data-testid="stack-alphabet-input"]').setValue('$,A')
      await flushPromises()
      await wrapper.find('[data-testid="initial-stack-symbol-input"]').setValue('$')
      await flushPromises()

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should show error message
      expect(wrapper.text()).toContain('Error')
    })

    it('should show success message on save', async () => {
      vi.mocked(configApi.setAlphabets).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      // Fill and submit
      await wrapper.find('[data-testid="input-alphabet-input"]').setValue('0,1')
      await flushPromises()
      await wrapper.find('[data-testid="stack-alphabet-input"]').setValue('$,A')
      await flushPromises()
      await wrapper.find('[data-testid="initial-stack-symbol-input"]').setValue('$')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should show success feedback
      expect(wrapper.text()).toMatch(/saved|success/i)
    })

    it('should disable submit during API call', async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePromise: (value: { success: boolean; message: string }) => void
      const pendingPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(configApi.setAlphabets).mockReturnValue(pendingPromise)

      const wrapper = createWrapper()

      // Fill form
      await wrapper.find('[data-testid="input-alphabet-input"]').setValue('0,1')
      await flushPromises()
      await wrapper.find('[data-testid="stack-alphabet-input"]').setValue('$,A')
      await flushPromises()
      await wrapper.find('[data-testid="initial-stack-symbol-input"]').setValue('$')
      await flushPromises()

      // Submit form
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Button should be disabled during API call
      expect(submitButton.attributes('disabled')).toBeDefined()

      // Resolve the promise and check button is enabled again
      resolvePromise!({ success: true, message: 'Saved' })
      await flushPromises()

      expect(submitButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('Comma-Separated Input Parsing', () => {
    it('should parse comma-separated input alphabet correctly', async () => {
      vi.mocked(configApi.setAlphabets).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      await wrapper.find('[data-testid="input-alphabet-input"]').setValue('0, 1 , a,b')
      await flushPromises()
      await wrapper.find('[data-testid="stack-alphabet-input"]').setValue('$')
      await flushPromises()
      await wrapper.find('[data-testid="initial-stack-symbol-input"]').setValue('$')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should trim whitespace
      expect(configApi.setAlphabets).toHaveBeenCalledWith('test-dpda-1', {
        input_alphabet: ['0', '1', 'a', 'b'],
        stack_alphabet: ['$'],
        initial_stack_symbol: '$',
      })
    })

    it('should parse comma-separated stack alphabet correctly', async () => {
      vi.mocked(configApi.setAlphabets).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      await wrapper.find('[data-testid="input-alphabet-input"]').setValue('0,1')
      await flushPromises()
      await wrapper.find('[data-testid="stack-alphabet-input"]').setValue('$ , A , B,C')
      await flushPromises()
      await wrapper.find('[data-testid="initial-stack-symbol-input"]').setValue('$')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should trim whitespace
      expect(configApi.setAlphabets).toHaveBeenCalledWith('test-dpda-1', {
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A', 'B', 'C'],
        initial_stack_symbol: '$',
      })
    })

    it('should handle single-character symbols', async () => {
      vi.mocked(configApi.setAlphabets).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      await wrapper.find('[data-testid="input-alphabet-input"]').setValue('a')
      await flushPromises()
      await wrapper.find('[data-testid="stack-alphabet-input"]').setValue('Z')
      await flushPromises()
      await wrapper.find('[data-testid="initial-stack-symbol-input"]').setValue('Z')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(configApi.setAlphabets).toHaveBeenCalledWith('test-dpda-1', {
        input_alphabet: ['a'],
        stack_alphabet: ['Z'],
        initial_stack_symbol: 'Z',
      })
    })
  })

  describe('AlphabetTable Integration', () => {
    it('should render AlphabetTable component', () => {
      const wrapper = createWrapper()

      // AlphabetTable should be present in the component
      const alphabetTable = wrapper.findComponent({ name: 'AlphabetTable' })
      expect(alphabetTable.exists()).toBe(true)
    })

    it('should show both table and form', () => {
      const wrapper = createWrapper()

      // Both AlphabetTable and form should be visible
      const alphabetTable = wrapper.findComponent({ name: 'AlphabetTable' })
      expect(alphabetTable.exists()).toBe(true)
      expect(wrapper.find('[data-testid="input-alphabet-input"]').exists()).toBe(true)
    })

    it('should pass dpdaId prop to AlphabetTable', () => {
      const wrapper = createWrapper()

      // AlphabetTable should receive the dpdaId prop
      const alphabetTable = wrapper.findComponent({ name: 'AlphabetTable' })
      expect(alphabetTable.exists()).toBe(true)
      expect(alphabetTable.props('dpdaId')).toBe('test-dpda-1')
    })
  })
})
