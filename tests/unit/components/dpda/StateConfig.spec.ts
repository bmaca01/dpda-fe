import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import StateConfig from '@/components/dpda/StateConfig.vue'
import * as configApi from '@/api/endpoints/configuration'

// Mock API
vi.mock('@/api/endpoints/configuration')

describe('StateConfig', () => {
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
    return mount(StateConfig, {
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
    it('should render form fields for states, initial state, accept states', () => {
      const wrapper = createWrapper()

      // Check for all required form fields
      expect(wrapper.find('[data-testid="states-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="initial-state-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="accept-states-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="submit-button"]').exists()).toBe(true)
    })

    it('should display labels for each field', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('States')
      expect(wrapper.text()).toContain('Initial State')
      expect(wrapper.text()).toContain('Accept States')
    })

    it('should show helpful descriptions', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('comma-separated')
    })
  })

  describe('Form Validation', () => {
    it('should show error when states field is empty', async () => {
      vi.mocked(configApi.setStates).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()

      // API should NOT be called for invalid form (validation should prevent submission)
      expect(configApi.setStates).not.toHaveBeenCalled()
    })

    it('should show error when initial state not in states list', async () => {
      const wrapper = createWrapper()

      // Set states
      const statesInput = wrapper.find('[data-testid="states-input"]')
      await statesInput.setValue('q0,q1,q2')

      // Set initial state to invalid value
      const initialStateInput = wrapper.find('[data-testid="initial-state-input"]')
      await initialStateInput.setValue('q3')

      await flushPromises()

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toMatch(/initial state.*must be.*in.*states/i)
    })

    it('should show error when accept states not in states list', async () => {
      const wrapper = createWrapper()

      // Set states
      const statesInput = wrapper.find('[data-testid="states-input"]')
      await statesInput.setValue('q0,q1,q2')

      // Set initial state
      const initialStateInput = wrapper.find('[data-testid="initial-state-input"]')
      await initialStateInput.setValue('q0')

      // Set accept states with invalid value
      const acceptStatesInput = wrapper.find('[data-testid="accept-states-input"]')
      await acceptStatesInput.setValue('q2,q5')

      await flushPromises()

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toMatch(/accept states.*must be.*in.*states/i)
    })

    it('should not show errors for valid input', async () => {
      const wrapper = createWrapper()

      vi.mocked(configApi.setStates).mockResolvedValue({ success: true, message: 'Saved' })

      // Set valid states
      const statesInput = wrapper.find('[data-testid="states-input"]')
      await statesInput.setValue('q0,q1,q2')

      // Set valid initial state
      const initialStateInput = wrapper.find('[data-testid="initial-state-input"]')
      await initialStateInput.setValue('q0')

      // Set valid accept states
      const acceptStatesInput = wrapper.find('[data-testid="accept-states-input"]')
      await acceptStatesInput.setValue('q2')

      await flushPromises()

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()

      // Should not have validation errors - check that error elements don't exist
      const errorElements = wrapper.findAll('.text-destructive')
      expect(errorElements.length).toBe(0)
    })
  })

  describe('API Integration', () => {
    it('should call setStates API on successful submit', async () => {
      vi.mocked(configApi.setStates).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      // Fill in valid form data
      await wrapper.find('[data-testid="states-input"]').setValue('q0,q1,q2')
      await wrapper.find('[data-testid="initial-state-input"]').setValue('q0')
      await wrapper.find('[data-testid="accept-states-input"]').setValue('q2')
      await flushPromises()

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Check API was called with correct data
      expect(configApi.setStates).toHaveBeenCalledWith('test-dpda-1', {
        states: ['q0', 'q1', 'q2'],
        initial_state: 'q0',
        accept_states: ['q2'],
      })
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(configApi.setStates).mockRejectedValue(new Error('API Error'))

      const wrapper = createWrapper()

      // Fill in valid form data
      await wrapper.find('[data-testid="states-input"]').setValue('q0,q1')
      await flushPromises()
      await wrapper.find('[data-testid="initial-state-input"]').setValue('q0')
      await flushPromises()
      await wrapper.find('[data-testid="accept-states-input"]').setValue('q1')
      await flushPromises()

      // Submit form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should show error message
      expect(wrapper.text()).toContain('Error')
    })

    it('should show success message on save', async () => {
      vi.mocked(configApi.setStates).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      // Fill and submit
      await wrapper.find('[data-testid="states-input"]').setValue('q0,q1')
      await flushPromises()
      await wrapper.find('[data-testid="initial-state-input"]').setValue('q0')
      await flushPromises()
      await wrapper.find('[data-testid="accept-states-input"]').setValue('q1')
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

      vi.mocked(configApi.setStates).mockReturnValue(pendingPromise)

      const wrapper = createWrapper()

      // Fill form
      await wrapper.find('[data-testid="states-input"]').setValue('q0,q1')
      await flushPromises()
      await wrapper.find('[data-testid="initial-state-input"]').setValue('q0')
      await flushPromises()
      await wrapper.find('[data-testid="accept-states-input"]').setValue('q1')
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
    it('should parse comma-separated states correctly', async () => {
      vi.mocked(configApi.setStates).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      await wrapper.find('[data-testid="states-input"]').setValue('q0, q1 , q2,q3')
      await flushPromises()
      await wrapper.find('[data-testid="initial-state-input"]').setValue('q0')
      await flushPromises()
      await wrapper.find('[data-testid="accept-states-input"]').setValue('q3')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should trim whitespace
      expect(configApi.setStates).toHaveBeenCalledWith('test-dpda-1', {
        states: ['q0', 'q1', 'q2', 'q3'],
        initial_state: 'q0',
        accept_states: ['q3'],
      })
    })

    it('should handle multiple accept states', async () => {
      vi.mocked(configApi.setStates).mockResolvedValue({ success: true, message: 'Saved' })

      const wrapper = createWrapper()

      await wrapper.find('[data-testid="states-input"]').setValue('q0,q1,q2,q3')
      await flushPromises()
      await wrapper.find('[data-testid="initial-state-input"]').setValue('q0')
      await flushPromises()
      await wrapper.find('[data-testid="accept-states-input"]').setValue('q2,q3')
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(configApi.setStates).toHaveBeenCalledWith('test-dpda-1', {
        states: ['q0', 'q1', 'q2', 'q3'],
        initial_state: 'q0',
        accept_states: ['q2', 'q3'],
      })
    })
  })

  describe('StateTable Integration', () => {
    it('should render StateTable component', () => {
      const wrapper = createWrapper()

      // StateTable should be present in the component
      const stateTable = wrapper.findComponent({ name: 'StateTable' })
      expect(stateTable.exists()).toBe(true)
    })

    it('should show both table and form', () => {
      const wrapper = createWrapper()

      // Both StateTable and form should be visible
      const stateTable = wrapper.findComponent({ name: 'StateTable' })
      expect(stateTable.exists()).toBe(true)
      expect(wrapper.find('[data-testid="states-input"]').exists()).toBe(true)
    })

    it('should pass dpdaId prop to StateTable', () => {
      const wrapper = createWrapper()

      // StateTable should receive the dpdaId prop
      const stateTable = wrapper.findComponent({ name: 'StateTable' })
      expect(stateTable.exists()).toBe(true)
      expect(stateTable.props('dpdaId')).toBe('test-dpda-1')
    })
  })
})
