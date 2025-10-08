import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ref } from 'vue'
import ComputeForm from '@/components/compute/ComputeForm.vue'
import { useComputation } from '@/composables/useComputation'

// Mock the composable
vi.mock('@/composables/useComputation')

describe('ComputeForm', () => {
  let mockComputeMutation: any
  let mockValidateQuery: any
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockComputeMutation = {
      mutate: vi.fn(),
      isPending: ref(false),
      isSuccess: ref(false),
      isError: ref(false),
      error: ref(null),
    }

    mockValidateQuery = {
      data: ref({ is_valid: true, violations: [], message: 'DPDA is valid' }),
      isLoading: ref(false),
      isError: ref(false),
    }

    vi.mocked(useComputation).mockReturnValue({
      computeMutation: mockComputeMutation,
      validateQuery: mockValidateQuery,
    })
  })

  afterEach(() => {
    // Cleanup mounted component
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  const createWrapper = (props = {}) => {
    wrapper = mount(ComputeForm, {
      props: {
        dpdaId: 'test-dpda-1',
        computeMutation: mockComputeMutation,
        ...props,
      },
      global: {
        plugins: [createPinia(), [VueQueryPlugin, {}]],
      },
    })
    return wrapper
  }

  describe('Rendering', () => {
    it('should render the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render input string field', () => {
      const wrapper = createWrapper()
      const input = wrapper.find('[data-testid="input-string"]')
      expect(input.exists()).toBe(true)
    })

    it('should render max steps field with default value', () => {
      const wrapper = createWrapper()
      const input = wrapper.find('[data-testid="max-steps"]')
      expect(input.exists()).toBe(true)
      expect((input.element as HTMLInputElement).value).toBe('10000')
    })

    it('should render show trace checkbox', () => {
      const wrapper = createWrapper()
      const checkbox = wrapper.find('[data-testid="show-trace"]')
      expect(checkbox.exists()).toBe(true)
    })

    it('should render compute button', () => {
      const wrapper = createWrapper()
      const button = wrapper.find('[data-testid="compute-button"]')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Compute')
    })
  })

  describe('Validation Status Display', () => {
    it('should render validation status section', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Component should render some validation status
      expect(wrapper.text()).toContain('DPDA')
    })

    it('should show warning if DPDA is invalid', async () => {
      mockValidateQuery.data = {
        is_valid: false,
        violations: [{ type: 'nondeterminism', description: 'Conflict at q0' }],
        message: 'DPDA is invalid',
      }

      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      const warning = wrapper.find('[data-testid="validation-warning"]')
      expect(warning.exists()).toBe(true)
      expect(warning.text()).toContain('invalid')
    })

    it('should display violation descriptions', async () => {
      mockValidateQuery.data = {
        is_valid: false,
        violations: [
          { type: 'nondeterminism', description: 'Conflict at q0' },
          { type: 'missing_transition', description: 'No transition from q1' },
        ],
        message: 'DPDA has errors',
      }

      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Conflict at q0')
      expect(wrapper.text()).toContain('No transition from q1')
    })

    it('should show loading state while validating', async () => {
      mockValidateQuery.isLoading = true

      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      const loading = wrapper.find('[data-testid="validation-loading"]')
      expect(loading.exists()).toBe(true)
      expect(loading.text()).toContain('Checking')
    })

    it('should show error if validation fails', async () => {
      mockValidateQuery.isError = true
      mockValidateQuery.error = { message: 'Failed to validate' }

      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      const error = wrapper.find('[data-testid="validation-error"]')
      expect(error.exists()).toBe(true)
      expect(error.text()).toContain('Failed to validate')
    })
  })

  describe('Button States', () => {
    it('should show loading text while computing', async () => {
      mockComputeMutation.isPending = true

      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      const button = wrapper.find('[data-testid="compute-button"]')
      expect(button.text()).toContain('Computing')
    })
  })

  describe('Props', () => {
    it('should use dpdaId from props', () => {
      createWrapper({ dpdaId: 'custom-dpda-id' })

      expect(useComputation).toHaveBeenCalledWith('custom-dpda-id')
    })
  })

  describe('Integration with useComputation', () => {
    it('should call useComputation with correct dpdaId for validation only', () => {
      createWrapper({ dpdaId: 'test-dpda-123' })

      expect(useComputation).toHaveBeenCalledWith('test-dpda-123')
    })

    it('should use computeMutation from props', () => {
      const wrapper = createWrapper()

      // Component should receive computeMutation as a prop
      expect(wrapper.props('computeMutation')).toBe(mockComputeMutation)
      expect(wrapper.vm).toBeDefined()
    })

    it('should use validateQuery from composable', () => {
      const wrapper = createWrapper()

      expect(useComputation).toHaveBeenCalled()
      // Validation status should be displayed
      expect(wrapper.text()).toContain('valid')
    })
  })

  describe('Form Values and Checkbox Binding', () => {
    it('should have showTrace=false by default in form values', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Check the form values
      expect((wrapper.vm as any).values.showTrace).toBe(false)
    })

    it('should render checkbox with FormField wrapper', async () => {
      const wrapper = createWrapper()

      // Checkbox should be rendered
      const checkbox = wrapper.find('[data-testid="show-trace"]')
      expect(checkbox.exists()).toBe(true)

      // FormControl wrapper should be present (indicates FormField integration)
      expect(wrapper.html()).toContain('data-slot="form-control"')
      expect(wrapper.html()).toContain('data-slot="form-item"')
    })

    it('should include showTrace in form values for submission', async () => {
      const wrapper = createWrapper()

      // Set input string
      const input = wrapper.find('[data-testid="input-string"]')
      await input.setValue('test')
      await wrapper.vm.$nextTick()

      // Submit form
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      // Verify showTrace is in the form values (checked by form submission handler)
      const values = (wrapper.vm as any).values
      expect(values.showTrace).toBeDefined()
      expect(typeof values.showTrace).toBe('boolean')
      expect(values.showTrace).toBe(false) // Default value
    })
  })
})
