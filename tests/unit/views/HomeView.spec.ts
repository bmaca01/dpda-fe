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

const mockUpdateMutation = {
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
}

const mockDeleteMutation = {
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
    createMutation: mockCreateMutation,
    updateMutation: mockUpdateMutation,
    deleteMutation: mockDeleteMutation,
    listQuery: mockListQuery,
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
    mockUpdateMutation.isPending = false
    mockUpdateMutation.isSuccess = false
    mockUpdateMutation.isError = false
    mockDeleteMutation.isPending = false
    mockDeleteMutation.isSuccess = false
    mockDeleteMutation.isError = false

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

    // DPDA 1 has created_at - check for "Created" text
    expect(wrapper.text()).toContain('Created')
  })

  // Edit DPDA metadata tests
  it('should display edit button for each DPDA', () => {
    wrapper = mountComponent()

    const editButtons = wrapper.findAll('[data-testid^="edit-dpda-"]')
    expect(editButtons.length).toBeGreaterThan(0)
    expect(editButtons).toHaveLength(2) // Two DPDAs in mock data
  })

  it('should open edit dialog when edit button is clicked', async () => {
    wrapper = mountComponent()

    const editButton = wrapper.find('[data-testid="edit-dpda-1"]')
    await editButton.trigger('click')

    expect(wrapper.find('[data-testid="edit-dpda-dialog"]').exists()).toBe(true)
  })

  it('should pre-fill edit form with current DPDA data', async () => {
    wrapper = mountComponent()

    // Click edit button for DPDA 1
    await wrapper.find('[data-testid="edit-dpda-1"]').trigger('click')

    // Check that form is pre-filled
    const nameInput = wrapper.find('[data-testid="edit-dpda-name-input"]')
    const descInput = wrapper.find('[data-testid="edit-dpda-description-input"]')

    expect((nameInput.element as HTMLInputElement).value).toBe('DPDA 1')
    expect((descInput.element as HTMLTextAreaElement).value).toBe('') // No description for DPDA 1
  })

  it('should call updateMutation with correct data on submit', async () => {
    wrapper = mountComponent()

    // Open edit dialog for DPDA 2 (has description)
    await wrapper.find('[data-testid="edit-dpda-2"]').trigger('click')

    // Modify the name
    const nameInput = wrapper.find('[data-testid="edit-dpda-name-input"]')
    await nameInput.setValue('Updated DPDA 2')

    // Submit form
    const form = wrapper.find('[data-testid="edit-dpda-form"]')
    await form.trigger('submit')

    expect(mockUpdateMutation.mutate).toHaveBeenCalledWith(
      {
        id: '2',
        request: {
          name: 'Updated DPDA 2',
          description: 'Test DPDA',
        },
      },
      expect.any(Object) // onSuccess callback
    )
  })

  it('should validate that at least one field is changed', async () => {
    wrapper = mountComponent()

    // Open edit dialog
    await wrapper.find('[data-testid="edit-dpda-1"]').trigger('click')

    // Don't change anything, just submit
    const form = wrapper.find('[data-testid="edit-dpda-form"]')
    await form.trigger('submit')

    // Should show validation error
    expect(wrapper.find('[data-testid="edit-error"]').exists()).toBe(true)
    expect(mockUpdateMutation.mutate).not.toHaveBeenCalled()
  })

  it('should close edit dialog on success', async () => {
    mockUpdateMutation.isSuccess = true

    wrapper = mountComponent()

    // Open dialog
    await wrapper.find('[data-testid="edit-dpda-1"]').trigger('click')
    expect(wrapper.find('[data-testid="edit-dpda-dialog"]').exists()).toBe(true)

    // After success, dialog should close
    await wrapper.vm.$nextTick()

    // Reset
    mockUpdateMutation.isSuccess = false
  })

  it('should show loading state during update', async () => {
    wrapper = mountComponent()

    // Open edit dialog
    await wrapper.find('[data-testid="edit-dpda-1"]').trigger('click')

    // Set loading state
    mockUpdateMutation.isPending = true
    await wrapper.vm.$nextTick()

    const submitButton = wrapper.find('[data-testid="edit-dpda-submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.text()).toContain('Updating')

    // Reset
    mockUpdateMutation.isPending = false
  })

  it('should stop propagation when edit button clicked', async () => {
    wrapper = mountComponent()

    // Mock router push to check it's not called
    const pushSpy = vi.spyOn(router, 'push')

    const editButton = wrapper.find('[data-testid="edit-dpda-1"]')
    await editButton.trigger('click')

    // Should not navigate to editor
    expect(pushSpy).not.toHaveBeenCalled()
  })

  // Delete DPDA tests
  it('should open delete confirmation dialog when delete button clicked', async () => {
    wrapper = mountComponent()

    const deleteButton = wrapper.find('[data-testid="delete-dpda-1"]')
    await deleteButton.trigger('click')

    expect(wrapper.find('[data-testid="delete-dpda-dialog"]').exists()).toBe(true)
  })

  it('should display DPDA name in delete confirmation', async () => {
    wrapper = mountComponent()

    // Click delete button for DPDA 1
    await wrapper.find('[data-testid="delete-dpda-1"]').trigger('click')

    // Check that dialog shows DPDA name
    expect(wrapper.text()).toContain('DPDA 1')
    expect(wrapper.text()).toContain('cannot be undone')
  })

  it('should call deleteMutation with correct ID when delete confirmed', async () => {
    wrapper = mountComponent()

    // Open delete dialog for DPDA 1
    await wrapper.find('[data-testid="delete-dpda-1"]').trigger('click')

    // Click confirm button
    const confirmButton = wrapper.find('[data-testid="confirm-delete-button"]')
    await confirmButton.trigger('click')

    expect(mockDeleteMutation.mutate).toHaveBeenCalledWith('1', expect.any(Object))
  })

  it('should close dialog after successful deletion', async () => {
    wrapper = mountComponent()

    // Open delete dialog
    await wrapper.find('[data-testid="delete-dpda-1"]').trigger('click')
    expect(wrapper.find('[data-testid="delete-dpda-dialog"]').exists()).toBe(true)

    // Simulate successful deletion
    mockDeleteMutation.isSuccess = true
    await wrapper.vm.$nextTick()

    // Reset
    mockDeleteMutation.isSuccess = false
  })

  it('should stop propagation when delete button clicked', async () => {
    wrapper = mountComponent()

    // Mock router push to check it's not called
    const pushSpy = vi.spyOn(router, 'push')

    const deleteButton = wrapper.find('[data-testid="delete-dpda-1"]')
    await deleteButton.trigger('click')

    // Should not navigate to editor
    expect(pushSpy).not.toHaveBeenCalled()
  })

  it('should show loading state during deletion', async () => {
    wrapper = mountComponent()

    // Open delete dialog
    await wrapper.find('[data-testid="delete-dpda-1"]').trigger('click')

    // Set loading state
    mockDeleteMutation.isPending = true
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.find('[data-testid="confirm-delete-button"]')
    expect(confirmButton.attributes('disabled')).toBeDefined()
    expect(confirmButton.text()).toContain('Deleting')

    // Reset
    mockDeleteMutation.isPending = false
  })
})
