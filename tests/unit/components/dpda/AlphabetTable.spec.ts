import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import AlphabetTable from '@/components/dpda/AlphabetTable.vue'
import * as dpdaApi from '@/api/endpoints/dpda'
import * as configurationApi from '@/api/endpoints/configuration'

// Mock API
vi.mock('@/api/endpoints/dpda')
vi.mock('@/api/endpoints/configuration')

describe('AlphabetTable', () => {
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
    input_alphabet: ['0', '1', 'a', 'b'],
    stack_alphabet: ['$', 'A', 'B', 'X'],
    initial_stack_symbol: '$',
  }

  const createWrapper = (props = {}) => {
    return mount(AlphabetTable, {
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

      expect(wrapper.text()).toContain('Input Alphabet')
      expect(wrapper.text()).toContain('Stack Alphabet')
    })

    it('should render all input alphabet symbols', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('0')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('a')
      expect(wrapper.text()).toContain('b')
    })

    it('should render all stack alphabet symbols', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('$')
      expect(wrapper.text()).toContain('A')
      expect(wrapper.text()).toContain('B')
      expect(wrapper.text()).toContain('X')
    })

    it('should display initial stack symbol with badge', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      // Should show initial badge for $
      expect(wrapper.text()).toMatch(/initial/i)
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

    it('should show empty state when no alphabets configured', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue({
        id: 'test-dpda-1',
        name: 'Test DPDA',
        input_alphabet: undefined,
        stack_alphabet: undefined,
        initial_stack_symbol: undefined,
      })

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toMatch(/no alphabets|empty/i)
    })
  })

  describe('Edit Functionality', () => {
    it('should render Edit button', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      const editButton = wrapper.find('[data-testid="edit-alphabets-button"]')
      expect(editButton.exists()).toBe(true)
    })

    it('should open edit dialog on Edit button click', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      const editButton = wrapper.find('[data-testid="edit-alphabets-button"]')
      await editButton.trigger('click')
      await flushPromises()

      // Check dialog state (Dialog content is teleported, check internal state instead)
      expect(wrapper.vm.showEditDialog).toBe(true)
    })

    it('should pre-fill edit form with current alphabets', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      const editButton = wrapper.find('[data-testid="edit-alphabets-button"]')
      await editButton.trigger('click')
      await flushPromises()

      // Check that form was pre-filled
      expect(wrapper.vm.inputAlphabetInput).toBe('0, 1, a, b')
      expect(wrapper.vm.stackAlphabetInput).toBe('$, A, B, X')
      expect(wrapper.vm.initialStackSymbolInput).toBe('$')
    })

    it('should call update mutation on form submit', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(configurationApi.updateAlphabetsFull).mockResolvedValue({
        success: true,
        message: 'Alphabets updated successfully',
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Open dialog
      const editButton = wrapper.find('[data-testid="edit-alphabets-button"]')
      await editButton.trigger('click')
      await flushPromises()

      // Modify form
      ;(wrapper.vm as any).inputAlphabetInput = '0, 1'
      ;(wrapper.vm as any).stackAlphabetInput = '$, A'
      ;(wrapper.vm as any).initialStackSymbolInput = '$'

      // Submit
      await wrapper.vm.handleEditSubmit()
      await flushPromises()

      expect(configurationApi.updateAlphabetsFull).toHaveBeenCalledWith('test-dpda-1', {
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A'],
        initial_stack_symbol: '$',
      })
    })

    it('should close dialog on successful update', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(configurationApi.updateAlphabetsFull).mockResolvedValue({
        success: true,
        message: 'Alphabets updated successfully',
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Open dialog
      const editButton = wrapper.find('[data-testid="edit-alphabets-button"]')
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
      vi.mocked(configurationApi.updateAlphabetsFull).mockRejectedValue(
        new Error('Update failed')
      )

      const wrapper = createWrapper()
      await flushPromises()

      // Open dialog
      const editButton = wrapper.find('[data-testid="edit-alphabets-button"]')
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
      const editButton = wrapper.find('[data-testid="edit-alphabets-button"]')
      await editButton.trigger('click')
      await flushPromises()

      // Set invalid data (empty stack alphabet)
      ;(wrapper.vm as any).stackAlphabetInput = ''

      // Submit
      await wrapper.vm.handleEditSubmit()
      await flushPromises()

      // Should not call API
      expect(configurationApi.updateAlphabetsFull).not.toHaveBeenCalled()

      // Should show validation error
      expect(wrapper.vm.validationErrors).toBeTruthy()
    })
  })

  describe('Display Formatting', () => {
    it('should display input alphabet count', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      // Should show count
      expect(wrapper.text()).toMatch(/4.*symbol/i)
    })

    it('should display stack alphabet count', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      // Should show count
      expect(wrapper.text()).toMatch(/4.*symbol/i)
    })

    it('should format comma-separated symbols correctly', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = createWrapper()
      await flushPromises()

      // Should show symbols with formatting
      const text = wrapper.text()
      expect(text).toContain('0')
      expect(text).toContain('1')
      expect(text).toContain('a')
      expect(text).toContain('b')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input alphabet', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue({
        id: 'test-dpda-1',
        name: 'Test DPDA',
        input_alphabet: [],
        stack_alphabet: ['$', 'A'],
        initial_stack_symbol: '$',
      })

      const wrapper = createWrapper()
      await flushPromises()

      // Should still render stack alphabet
      expect(wrapper.text()).toContain('$')
      expect(wrapper.text()).toContain('A')
    })

    it('should handle single stack symbol', async () => {
      vi.mocked(dpdaApi.getDPDA).mockResolvedValue({
        id: 'test-dpda-1',
        name: 'Test DPDA',
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$'],
        initial_stack_symbol: '$',
      })

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('$')
    })

    it('should handle many symbols', async () => {
      const manyInputSymbols = Array.from({ length: 20 }, (_, i) => String(i))
      const manyStackSymbols = Array.from({ length: 20 }, (_, i) => `S${i}`)

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue({
        id: 'test-dpda-1',
        name: 'Test DPDA',
        input_alphabet: manyInputSymbols,
        stack_alphabet: manyStackSymbols,
        initial_stack_symbol: 'S0',
      })

      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('0')
      expect(wrapper.text()).toContain('19')
      expect(wrapper.text()).toContain('S0')
      expect(wrapper.text()).toContain('S19')
    })
  })
})
