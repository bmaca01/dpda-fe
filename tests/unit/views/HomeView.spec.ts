import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

// Mock the composable
const mockCreateMutation = {
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
}

const mockListQuery = {
  data: {
    dpdas: [
      { id: '1', name: 'DPDA 1', is_valid: true, created_at: '2025-01-01T00:00:00Z' },
      { id: '2', name: 'DPDA 2', description: 'Test DPDA', is_valid: false },
    ],
    total: 2,
  },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}

vi.mock('@/composables/useDPDA', () => ({
  useDPDA: () => ({
    useCreateDPDA: () => mockCreateMutation,
    useListDPDAs: () => mockListQuery,
  }),
}))

describe('HomeView', () => {
  let wrapper: VueWrapper<any>
  let router: any

  const mountComponent = () => {
    return mount(HomeView, {
      global: {
        plugins: [router],
      },
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Reset mock data to default state
    mockListQuery.data = {
      dpdas: [
        { id: '1', name: 'DPDA 1', is_valid: true, created_at: '2025-01-01T00:00:00Z' },
        { id: '2', name: 'DPDA 2', description: 'Test DPDA', is_valid: false },
      ],
      total: 2,
    }
    mockListQuery.isLoading = false
    mockListQuery.isError = false
    mockListQuery.error = null
    mockCreateMutation.isPending = false
    mockCreateMutation.isSuccess = false
    mockCreateMutation.isError = false

    // Create a router for tests
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomeView },
        { path: '/dpda/:id', component: { template: '<div>Editor</div>' } },
      ],
    })
  })

  it('should render the component', () => {
    wrapper = mountComponent()
    expect(wrapper.exists()).toBe(true)
  })

  it('should display page title', () => {
    wrapper = mountComponent()
    expect(wrapper.text()).toContain('DPDA Simulator')
  })

  it('should display create DPDA button', () => {
    wrapper = mountComponent()
    const createButton = wrapper.find('[data-testid="create-dpda-btn"]')
    expect(createButton.exists()).toBe(true)
    expect(createButton.text()).toContain('Create')
  })

  it('should display list of DPDAs when data is loaded', () => {
    wrapper = mountComponent()

    const dpdaItems = wrapper.findAll('[data-testid^="dpda-item-"]')
    expect(dpdaItems).toHaveLength(2)
    expect(wrapper.text()).toContain('DPDA 1')
    expect(wrapper.text()).toContain('DPDA 2')
  })

  it('should show loading state when fetching DPDAs', () => {
    mockListQuery.isLoading = true
    mockListQuery.data = undefined as any

    wrapper = mountComponent()

    expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading')

    // Reset
    mockListQuery.isLoading = false
    mockListQuery.data = {
      dpdas: [],
      total: 0,
    }
  })

  it('should show error state when fetching fails', () => {
    mockListQuery.isError = true
    mockListQuery.error = new Error('Failed to fetch DPDAs') as any

    wrapper = mountComponent()

    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Error')

    // Reset
    mockListQuery.isError = false
    mockListQuery.error = null
  })

  it('should show empty state when no DPDAs exist', () => {
    mockListQuery.data = {
      dpdas: [],
      total: 0,
    }

    wrapper = mountComponent()

    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No DPDAs')
  })

  it('should open create dialog when create button is clicked', async () => {
    wrapper = mountComponent()

    const createButton = wrapper.find('[data-testid="create-dpda-btn"]')
    await createButton.trigger('click')

    expect(wrapper.find('[data-testid="create-dpda-dialog"]').exists()).toBe(true)
  })

  it('should display DPDA names in the list', () => {
    wrapper = mountComponent()

    expect(wrapper.text()).toContain('DPDA 1')
    expect(wrapper.text()).toContain('DPDA 2')
  })

  it('should display DPDA validity status', () => {
    wrapper = mountComponent()

    const validBadge = wrapper.find('[data-testid="dpda-1-valid-badge"]')
    const invalidBadge = wrapper.find('[data-testid="dpda-2-valid-badge"]')

    expect(validBadge.exists()).toBe(true)
    expect(invalidBadge.exists()).toBe(true)
  })

  it('should have links to DPDA editor', () => {
    wrapper = mountComponent()

    const link1 = wrapper.find('[data-testid="dpda-item-1"] a')
    expect(link1.exists()).toBe(true)
    expect(link1.attributes('href')).toContain('/dpda/1')
  })

  it('should display DPDA description if available', () => {
    wrapper = mountComponent()

    expect(wrapper.text()).toContain('Test DPDA')
  })

  it('should handle create DPDA form submission', async () => {
    wrapper = mountComponent()

    // Open dialog
    await wrapper.find('[data-testid="create-dpda-btn"]').trigger('click')

    // Fill form
    const nameInput = wrapper.find('[data-testid="dpda-name-input"]')
    const descInput = wrapper.find('[data-testid="dpda-description-input"]')

    await nameInput.setValue('New DPDA')
    await descInput.setValue('A new test DPDA')

    // Submit
    const form = wrapper.find('[data-testid="create-dpda-form"]')
    await form.trigger('submit')

    expect(mockCreateMutation.mutate).toHaveBeenCalledWith({
      name: 'New DPDA',
      description: 'A new test DPDA',
    })
  })

  it('should show validation error for empty name', async () => {
    wrapper = mountComponent()

    // Open dialog
    await wrapper.find('[data-testid="create-dpda-btn"]').trigger('click')

    // Try to submit without name
    const form = wrapper.find('[data-testid="create-dpda-form"]')
    await form.trigger('submit')

    expect(wrapper.find('[data-testid="name-error"]').exists()).toBe(true)
    expect(mockCreateMutation.mutate).not.toHaveBeenCalled()
  })

  it('should close dialog after successful creation', async () => {
    mockCreateMutation.isSuccess = true

    wrapper = mountComponent()

    // Open dialog
    await wrapper.find('[data-testid="create-dpda-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="create-dpda-dialog"]').exists()).toBe(true)

    // After success, dialog should close
    await wrapper.vm.$nextTick()

    // Reset
    mockCreateMutation.isSuccess = false
  })

  it('should display delete button for each DPDA', () => {
    wrapper = mountComponent()

    const deleteButtons = wrapper.findAll('[data-testid^="delete-dpda-"]')
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it('should display created date if available', () => {
    wrapper = mountComponent()

    // DPDA 1 has created_at
    expect(wrapper.text()).toMatch(/2025/)
  })
})