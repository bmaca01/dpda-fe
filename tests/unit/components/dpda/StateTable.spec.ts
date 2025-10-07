import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import StateTable from '@/components/dpda/StateTable.vue'
import * as dpdaApi from '@/api/endpoints/dpda'
import * as configurationApi from '@/api/endpoints/configuration'

// Mock API
vi.mock('@/api/endpoints/dpda')
vi.mock('@/api/endpoints/configuration')

describe('StateTable', () => {
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

  const mockDPDA = {
    id: 'test-dpda-1',
    name: 'Test DPDA',
    states: ['q0', 'q1', 'q2', 'q3'],
    initial_state: 'q0',
    accept_states: ['q2', 'q3'],
  }

  const createWrapper = (props = {}) => {
    return mount(StateTable, {
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
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('State')
      expect(wrapper.text()).toContain('Type')
    })

    it('should render all states in table rows', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('q0')
      expect(wrapper.text()).toContain('q1')
      expect(wrapper.text()).toContain('q2')
      expect(wrapper.text()).toContain('q3')
    })

    it('should display initial state with badge', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      // Should show initial badge
      expect(wrapper.text()).toMatch(/initial/i)
    })

    it('should display accept states with badges', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      // Should show accept badge
      expect(wrapper.text()).toMatch(/accept/i)
    })

    it('should display regular states without badges', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      // q1 is a regular state (not initial, not accept)
      expect(wrapper.text()).toContain('q1')
    })

    it('should show loading state while fetching', async () => {
      let resolveDPDA: (value: any) => void
      const dpdaPromise = new Promise((resolve) => {
        resolveDPDA = resolve
      })
      vi.mocked(dpdaApi.getDPDA).mockReturnValue(dpdaPromise as any)

      const wrapper = createWrapper()

      // Should show loading indicator
      expect(wrapper.text()).toMatch(/loading/i)

      resolveDPDA!(mockDPDA)
      await flushPromises()
    })

    it('should show error state on API failure', async () => {
      vi.mocked(dpdaApi.getDPDA).mockRejectedValue(new Error('API Error'))

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toMatch(/error|failed/i)
    })

    it('should show empty state when no states configured', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue({
        id: 'test-dpda-1',
        name: 'Test DPDA',
        states: undefined,
        initial_state: undefined,
        accept_states: undefined,
      })

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toMatch(/no states|empty/i)
    })
  })

  describe('Edit Functionality', () => {
    it('should render Edit button', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      const editButton = wrapper.find('[data-testid="edit-states-button"]')
      expect(editButton.exists()).toBe(true)
    })

    it('should open edit dialog on Edit button click', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      const editButton = wrapper.find('[data-testid="edit-states-button"]')
      await editButton.trigger('click')
      await flushPromises()

      // Check dialog state (Dialog content is teleported, check internal state instead)
      expect(wrapper.vm.showEditDialog).toBe(true)
    })

    it('should pre-fill edit form with current states', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      const editButton = wrapper.find('[data-testid="edit-states-button"]')
      await editButton.trigger('click')
      await flushPromises()

      // Check that form was pre-filled
      expect(wrapper.vm.statesInput).toBe('q0, q1, q2, q3')
      expect(wrapper.vm.initialStateInput).toBe('q0')
      expect(wrapper.vm.acceptStatesInput).toBe('q2, q3')
    })

    it('should call update mutation on form submit', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(configurationApi.updateStatesFull).mockResolvedValue({
        success: true,
        message: 'States updated successfully',
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Open dialog
      const editButton = wrapper.find('[data-testid="edit-states-button"]')
      await editButton.trigger('click')
      await flushPromises()

      // Modify form
      ;(wrapper.vm as any).statesInput = 'q0, q1, q2'
      ;(wrapper.vm as any).acceptStatesInput = 'q2'

      // Submit
      await wrapper.vm.handleEditSubmit()
      await flushPromises()

      expect(configurationApi.updateStatesFull).toHaveBeenCalledWith('test-dpda-1', {
        states: ['q0', 'q1', 'q2'],
        initial_state: 'q0',
        accept_states: ['q2'],
      })
    })

    it('should close dialog on successful update', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(configurationApi.updateStatesFull).mockResolvedValue({
        success: true,
        message: 'States updated successfully',
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Open dialog
      const editButton = wrapper.find('[data-testid="edit-states-button"]')
      await editButton.trigger('click')
      await flushPromises()

      expect(wrapper.vm.showEditDialog).toBe(true)

      // Submit
      await wrapper.vm.handleEditSubmit()
      await flushPromises()

      // Dialog should close
      expect(wrapper.vm.showEditDialog).toBe(false)
    })

    it('should display error message on update failure', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(configurationApi.updateStatesFull).mockRejectedValue(new Error('Update failed'))

      const wrapper = createWrapper()
      await flushPromises()

      // Open dialog
      const editButton = wrapper.find('[data-testid="edit-states-button"]')
      await editButton.trigger('click')
      await flushPromises()

      // Submit
      await wrapper.vm.handleEditSubmit()
      await flushPromises()

      // Should show error
      expect(wrapper.text()).toMatch(/error|failed/i)
    })

    it('should validate form data before submitting', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      // Open dialog
      const editButton = wrapper.find('[data-testid="edit-states-button"]')
      await editButton.trigger('click')
      await flushPromises()

      // Set invalid data (empty states)
      ;(wrapper.vm as any).statesInput = ''

      // Submit
      await wrapper.vm.handleEditSubmit()
      await flushPromises()

      // Should not call API
      expect(configurationApi.updateStatesFull).not.toHaveBeenCalled()

      // Should show validation error
      expect(wrapper.vm.validationErrors).toBeTruthy()
    })
  })

  describe('Display Formatting', () => {
    it('should display state count', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      // Should show count of states
      expect(wrapper.text()).toMatch(/4.*state/i)
    })

    it('should show initial and accept badges on same state', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue({
        id: 'test-dpda-1',
        name: 'Test DPDA',
        states: ['q0', 'q1'],
        initial_state: 'q0',
        accept_states: ['q0'], // Initial state is also accept state
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Should show both badges for q0
      expect(wrapper.text()).toMatch(/initial/i)
      expect(wrapper.text()).toMatch(/accept/i)
    })

    it('should format states in correct order', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      const tableText = wrapper.text()
      const q0Index = tableText.indexOf('q0')
      const q1Index = tableText.indexOf('q1')
      const q2Index = tableText.indexOf('q2')
      const q3Index = tableText.indexOf('q3')

      // States should appear in order
      expect(q0Index).toBeLessThan(q1Index)
      expect(q1Index).toBeLessThan(q2Index)
      expect(q2Index).toBeLessThan(q3Index)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single state', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue({
        id: 'test-dpda-1',
        name: 'Test DPDA',
        states: ['q0'],
        initial_state: 'q0',
        accept_states: ['q0'],
      })

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('q0')
      expect(wrapper.text()).toMatch(/1.*state/i)
    })

    it('should handle no accept states', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue({
        id: 'test-dpda-1',
        name: 'Test DPDA',
        states: ['q0', 'q1'],
        initial_state: 'q0',
        accept_states: [],
      })

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('q0')
      expect(wrapper.text()).toContain('q1')
    })

    it('should handle many states', async () => {
      const manyStates = Array.from({ length: 20 }, (_, i) => `q${i}`)
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue({
        id: 'test-dpda-1',
        name: 'Test DPDA',
        states: manyStates,
        initial_state: 'q0',
        accept_states: ['q19'],
      })

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('q0')
      expect(wrapper.text()).toContain('q19')
      expect(wrapper.text()).toMatch(/20.*state/i)
    })
  })
})
