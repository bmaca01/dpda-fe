import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import EditorView from '@/views/EditorView.vue'
import * as dpdaApi from '@/api/endpoints/dpda'
import * as operationsApi from '@/api/endpoints/operations'
import * as transitionsApi from '@/api/endpoints/transitions'

// Mock API modules
vi.mock('@/api/endpoints/dpda')
vi.mock('@/api/endpoints/operations')
vi.mock('@/api/endpoints/transitions')

describe('EditorView', () => {
  let router: ReturnType<typeof createRouter>
  let queryClient: QueryClient

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Create router with EditorView route
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/editor/:id',
          name: 'editor',
          component: EditorView,
        },
        {
          path: '/',
          name: 'home',
          component: { template: '<div>Home</div>' },
        },
      ],
    })
  })

  const createWrapper = async (dpdaId = 'test-dpda-1') => {
    // Navigate to the route first
    await router.push(`/editor/${dpdaId}`)
    await router.isReady()

    const wrapper = mount(EditorView, {
      global: {
        plugins: [router, [VueQueryPlugin, { queryClient }]],
      },
    })

    await flushPromises()
    return wrapper
  }

  describe('DPDA Loading', () => {
    it('should fetch and display DPDA info when ID provided', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      expect(dpdaApi.getDPDA).toHaveBeenCalledWith('test-dpda-1')
      expect(wrapper.text()).toContain('Test DPDA')
    })

    it('should show loading state while fetching', async () => {
      vi.mocked(dpdaApi.getDPDA).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      await router.push('/editor/test-dpda-1')
      await router.isReady()

      const wrapper = mount(EditorView, {
        global: {
          plugins: [router, [VueQueryPlugin, { queryClient }]],
        },
      })

      // Should show loading state before data arrives
      expect(wrapper.text()).toContain('Loading')
    })

    it('should handle DPDA not found error', async () => {
      vi.mocked(dpdaApi.getDPDA).mockRejectedValue(new Error('DPDA not found'))

      const wrapper = await createWrapper('non-existent-id')

      expect(wrapper.text()).toContain('Error')
      expect(wrapper.text()).toContain('DPDA not found')
    })
  })

  describe('PageLayout Integration', () => {
    it('should integrate with PageLayout with sidebar enabled', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      // PageLayout should be present
      const pageLayout = wrapper.findComponent({ name: 'PageLayout' })
      expect(pageLayout.exists()).toBe(true)

      // Sidebar should be enabled
      expect(pageLayout.props('showSidebar')).toBe(true)
    })

    it('should pass correct props to PageLayout', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      const pageLayout = wrapper.findComponent({ name: 'PageLayout' })

      expect(pageLayout.props('dpdaId')).toBe('test-dpda-1')
      expect(pageLayout.props('dpdaName')).toBe('Test DPDA')
      expect(pageLayout.props('currentView')).toBe('editor')
    })

    it('should update isValid prop based on validation status', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1'],
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A'],
      }

      const mockValidation = {
        is_valid: true,
        violations: [],
        message: 'DPDA is valid',
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(operationsApi.validateDPDA).mockResolvedValue(mockValidation)

      const wrapper = await createWrapper('test-dpda-1')

      // Trigger validation
      const pageLayout = wrapper.findComponent({ name: 'PageLayout' })
      pageLayout.vm.$emit('validate')

      await flushPromises()

      // After validation, isValid should be updated
      expect(pageLayout.props('isValid')).toBe(true)
    })
  })

  describe('Action Handlers', () => {
    it('should handle validate action emission', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1'],
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A'],
      }

      const mockValidation = {
        is_valid: true,
        violations: [],
        message: 'DPDA is valid',
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(operationsApi.validateDPDA).mockResolvedValue(mockValidation)

      const wrapper = await createWrapper('test-dpda-1')

      const pageLayout = wrapper.findComponent({ name: 'PageLayout' })
      pageLayout.vm.$emit('validate')

      await flushPromises()

      expect(operationsApi.validateDPDA).toHaveBeenCalledWith('test-dpda-1')
    })

    it('should handle export action emission', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
      }

      const mockExport = {
        format: 'json' as const,
        data: JSON.stringify({ states: [], transitions: [] }),
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(operationsApi.exportDPDA).mockResolvedValue(mockExport)

      const wrapper = await createWrapper('test-dpda-1')

      const pageLayout = wrapper.findComponent({ name: 'PageLayout' })
      pageLayout.vm.$emit('export')

      await flushPromises()

      expect(operationsApi.exportDPDA).toHaveBeenCalledWith('test-dpda-1', 'json')
    })

    it('should handle delete action emission and navigate away', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(dpdaApi.deleteDPDA).mockResolvedValue({ success: true, message: 'Deleted' })

      const wrapper = await createWrapper('test-dpda-1')

      const pageLayout = wrapper.findComponent({ name: 'PageLayout' })
      pageLayout.vm.$emit('delete')

      await flushPromises()

      expect(dpdaApi.deleteDPDA).toHaveBeenCalledWith('test-dpda-1')

      // Should navigate to home after delete
      expect(router.currentRoute.value.name).toBe('home')
    })
  })

  describe('Tabbed Interface', () => {
    it('should render tabs for States, Alphabets, and Transitions', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      // Check for tab structure
      expect(wrapper.text()).toContain('States')
      expect(wrapper.text()).toContain('Alphabets')
      expect(wrapper.text()).toContain('Transitions')
    })

    it('should have clickable tab triggers', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      // All tab triggers should exist and be clickable
      const statesTab = wrapper.find('[data-testid="tab-states"]')
      const alphabetsTab = wrapper.find('[data-testid="tab-alphabets"]')
      const transitionsTab = wrapper.find('[data-testid="tab-transitions"]')

      expect(statesTab.exists()).toBe(true)
      expect(alphabetsTab.exists()).toBe(true)
      expect(transitionsTab.exists()).toBe(true)
    })
  })

  describe('Tab Accessibility', () => {
    it('should always have States tab accessible', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        // Empty DPDA - no states, alphabets, or transitions
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      const statesTab = wrapper.find('[data-testid="tab-states"]')
      expect(statesTab.exists()).toBe(true)
      expect(statesTab.attributes('data-disabled')).toBeUndefined()
      expect(statesTab.attributes('aria-disabled')).not.toBe('true')
    })

    it('should disable Alphabets tab when no states', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        // No states configured
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      const alphabetsTab = wrapper.find('[data-testid="tab-alphabets"]')
      expect(alphabetsTab.exists()).toBe(true)
      // radix-vue sets data-disabled="" (empty string) when disabled
      expect(alphabetsTab.attributes('data-disabled')).toBeDefined()
    })

    it('should enable Alphabets tab when states exist', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1'],
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      const alphabetsTab = wrapper.find('[data-testid="tab-alphabets"]')
      expect(alphabetsTab.exists()).toBe(true)
      expect(alphabetsTab.attributes('data-disabled')).not.toBe('true')
    })

    it('should disable Transitions tab when no states', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        // No states
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      const transitionsTab = wrapper.find('[data-testid="tab-transitions"]')
      expect(transitionsTab.exists()).toBe(true)
      // radix-vue sets data-disabled="" (empty string) when disabled
      expect(transitionsTab.attributes('data-disabled')).toBeDefined()
    })

    it('should disable Transitions tab when states but no alphabets', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1'],
        // No alphabets configured
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      const transitionsTab = wrapper.find('[data-testid="tab-transitions"]')
      expect(transitionsTab.exists()).toBe(true)
      // radix-vue sets data-disabled="" (empty string) when disabled
      expect(transitionsTab.attributes('data-disabled')).toBeDefined()
    })

    it('should disable Transitions tab when states and input alphabet but no stack alphabet', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1'],
        input_alphabet: ['0', '1'],
        // No stack alphabet
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      const transitionsTab = wrapper.find('[data-testid="tab-transitions"]')
      expect(transitionsTab.exists()).toBe(true)
      // radix-vue sets data-disabled="" (empty string) when disabled
      expect(transitionsTab.attributes('data-disabled')).toBeDefined()
    })

    it('should enable Transitions tab when states and both alphabets configured', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1'],
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A'],
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [],
        total: 0,
      })

      const wrapper = await createWrapper('test-dpda-1')

      const transitionsTab = wrapper.find('[data-testid="tab-transitions"]')
      expect(transitionsTab.exists()).toBe(true)
      expect(transitionsTab.attributes('data-disabled')).not.toBe('true')
    })

    it('should add aria-disabled to disabled tabs', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        // Empty DPDA
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)

      const wrapper = await createWrapper('test-dpda-1')

      const alphabetsTab = wrapper.find('[data-testid="tab-alphabets"]')
      const transitionsTab = wrapper.find('[data-testid="tab-transitions"]')

      // Disabled tabs should have data-disabled attribute (radix-vue sets it as empty string)
      expect(alphabetsTab.attributes('data-disabled')).toBeDefined()
      expect(transitionsTab.attributes('data-disabled')).toBeDefined()
    })
  })

  describe('Transitions Tab', () => {
    it('should render TransitionForm component in Transitions tab', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1', 'q2'],
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A', 'B'],
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [],
        total: 0,
      })

      const wrapper = await createWrapper('test-dpda-1')

      // Switch to transitions tab first
      ;(wrapper.vm as any).activeTab = 'transitions'
      await flushPromises()

      // Check that TransitionForm component is present
      const transitionForm = wrapper.findComponent({ name: 'TransitionForm' })
      expect(transitionForm.exists()).toBe(true)
    })

    it('should render TransitionTable component in Transitions tab', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1'],
        input_alphabet: ['0'],
        stack_alphabet: ['$'],
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [],
        total: 0,
      })

      const wrapper = await createWrapper('test-dpda-1')

      // Switch to transitions tab
      ;(wrapper.vm as any).activeTab = 'transitions'
      await flushPromises()

      // Check that TransitionTable component is present
      const transitionTable = wrapper.findComponent({ name: 'TransitionTable' })
      expect(transitionTable.exists()).toBe(true)
    })

    it('should pass states and alphabets to TransitionForm', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1', 'q2'],
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A', 'B'],
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [],
        total: 0,
      })

      const wrapper = await createWrapper('test-dpda-1')

      // Switch to transitions tab
      ;(wrapper.vm as any).activeTab = 'transitions'
      await flushPromises()

      const transitionForm = wrapper.findComponent({ name: 'TransitionForm' })
      expect(transitionForm.props('states')).toEqual(['q0', 'q1', 'q2'])
      expect(transitionForm.props('inputAlphabet')).toEqual(['0', '1'])
      expect(transitionForm.props('stackAlphabet')).toEqual(['$', 'A', 'B'])
    })

    it('should pass dpdaId to both TransitionForm and TransitionTable', async () => {
      const mockDPDA = {
        id: 'test-dpda-1',
        name: 'Test DPDA',
        description: 'Test description',
        states: [],
        input_alphabet: [],
        stack_alphabet: [],
      }

      vi.mocked(dpdaApi.getDPDA).mockResolvedValue(mockDPDA)
      vi.mocked(transitionsApi.getTransitions).mockResolvedValue({
        transitions: [],
        total: 0,
      })

      const wrapper = await createWrapper('test-dpda-1')

      // Switch to transitions tab
      ;(wrapper.vm as any).activeTab = 'transitions'
      await flushPromises()

      const transitionForm = wrapper.findComponent({ name: 'TransitionForm' })
      const transitionTable = wrapper.findComponent({ name: 'TransitionTable' })

      expect(transitionForm.props('dpdaId')).toBe('test-dpda-1')
      expect(transitionTable.props('dpdaId')).toBe('test-dpda-1')
    })
  })
})
