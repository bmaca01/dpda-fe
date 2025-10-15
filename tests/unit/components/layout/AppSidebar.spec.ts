import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, Router } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'

describe('AppSidebar', () => {
  let router: Router

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/dpda/:id', name: 'editor', component: { template: '<div>Editor</div>' } },
        {
          path: '/dpda/:id/visualize',
          name: 'visualize',
          component: { template: '<div>Visualize</div>' },
        },
        {
          path: '/dpda/:id/compute',
          name: 'compute',
          component: { template: '<div>Compute</div>' },
        },
      ],
    })
  })

  const createWrapper = (props: {
    dpdaId: string
    currentView: 'editor' | 'compute' | 'visualize'
    isValid?: boolean | null
    dpdaName?: string
  }) => {
    return mount(AppSidebar, {
      props,
      global: {
        plugins: [router],
      },
    })
  }

  it('should render with required props', () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render navigation links with correct routes', () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })

    const editorLink = wrapper.find('[data-testid="sidebar-nav-editor"]')
    const computeLink = wrapper.find('[data-testid="sidebar-nav-compute"]')
    const visualizeLink = wrapper.find('[data-testid="sidebar-nav-visualize"]')

    expect(editorLink.exists()).toBe(true)
    expect(computeLink.exists()).toBe(true)
    expect(visualizeLink.exists()).toBe(true)

    expect(editorLink.attributes('href')).toContain('/dpda/123')
    expect(computeLink.attributes('href')).toContain('/dpda/123/compute')
    expect(visualizeLink.attributes('href')).toContain('/dpda/123/visualize')
  })

  it('should highlight current view as active', () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })
    const editorLink = wrapper.find('[data-testid="sidebar-nav-editor"]')

    // The active link should have specific styling or aria-current
    expect(editorLink.attributes('aria-current')).toBe('page')
  })

  it('should not highlight inactive views', () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })
    const computeLink = wrapper.find('[data-testid="sidebar-nav-compute"]')
    const visualizeLink = wrapper.find('[data-testid="sidebar-nav-visualize"]')

    expect(computeLink.attributes('aria-current')).toBeUndefined()
    expect(visualizeLink.attributes('aria-current')).toBeUndefined()
  })

  it('should render quick action buttons', () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })

    expect(wrapper.find('[data-testid="action-validate"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="action-export"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="action-delete"]').exists()).toBe(true)
  })

  it('should emit validate event when validate button is clicked', async () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })
    const validateBtn = wrapper.find('[data-testid="action-validate"]')

    await validateBtn.trigger('click')

    expect(wrapper.emitted('validate')).toBeTruthy()
    expect(wrapper.emitted('validate')).toHaveLength(1)
  })

  it('should emit export event when export button is clicked', async () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })
    const exportBtn = wrapper.find('[data-testid="action-export"]')

    await exportBtn.trigger('click')

    expect(wrapper.emitted('export')).toBeTruthy()
    expect(wrapper.emitted('export')).toHaveLength(1)
  })

  it('should open confirmation dialog when delete button is clicked', async () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor', dpdaName: 'Test DPDA' })
    const deleteBtn = wrapper.find('[data-testid="action-delete"]')

    await deleteBtn.trigger('click')

    // Should NOT emit delete event immediately
    expect(wrapper.emitted('delete')).toBeUndefined()

    // Should open the confirmation dialog (internal state check)
    expect(wrapper.vm.isDeleteDialogOpen).toBe(true)
  })

  it('should close dialog when cancel button is clicked', async () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor', dpdaName: 'Test DPDA' })

    // Open dialog by clicking delete button
    await wrapper.find('[data-testid="action-delete"]').trigger('click')
    expect(wrapper.vm.isDeleteDialogOpen).toBe(true)

    // Close dialog programmatically (simulating cancel button click)
    wrapper.vm.isDeleteDialogOpen = false
    await wrapper.vm.$nextTick()

    // Should NOT emit delete event
    expect(wrapper.emitted('delete')).toBeUndefined()
  })

  it('should emit delete event when confirmed', async () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor', dpdaName: 'Test DPDA' })

    // Open dialog
    await wrapper.find('[data-testid="action-delete"]').trigger('click')
    expect(wrapper.vm.isDeleteDialogOpen).toBe(true)

    // Call handleDelete directly (simulating confirm button click)
    wrapper.vm.handleDelete()
    await wrapper.vm.$nextTick()

    // Should emit delete event
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')).toHaveLength(1)

    // Dialog should be closed
    expect(wrapper.vm.isDeleteDialogOpen).toBe(false)
  })

  it('should have navigation landmark for accessibility', () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })
    const nav = wrapper.find('nav')

    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBe('DPDA workspace navigation')
  })

  it('should have proper button labels for accessibility', () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })

    const validateBtn = wrapper.find('[data-testid="action-validate"]')
    const exportBtn = wrapper.find('[data-testid="action-export"]')
    const deleteBtn = wrapper.find('[data-testid="action-delete"]')

    // Check that buttons have text or aria-label
    expect(validateBtn.text() || validateBtn.attributes('aria-label')).toBeTruthy()
    expect(exportBtn.text() || exportBtn.attributes('aria-label')).toBeTruthy()
    expect(deleteBtn.text() || deleteBtn.attributes('aria-label')).toBeTruthy()
  })

  describe('Conditional Navigation', () => {
    it('should always enable Editor link', () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          isValid: false, // Even when invalid
        },
        global: {
          plugins: [router],
        },
      })

      const editorLink = wrapper.find('[data-testid="sidebar-nav-editor"]')
      expect(editorLink.exists()).toBe(true)
      expect(editorLink.classes()).not.toContain('pointer-events-none')
      expect(editorLink.attributes('aria-disabled')).toBeUndefined()
    })

    it('should always enable Visualize link', () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          isValid: false, // Even when invalid
        },
        global: {
          plugins: [router],
        },
      })

      const visualizeLink = wrapper.find('[data-testid="sidebar-nav-visualize"]')
      expect(visualizeLink.exists()).toBe(true)
      expect(visualizeLink.classes()).not.toContain('pointer-events-none')
      expect(visualizeLink.attributes('aria-disabled')).toBeUndefined()
    })

    it('should disable Compute link when isValid is false', () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          isValid: false,
        },
        global: {
          plugins: [router],
        },
      })

      const computeLink = wrapper.find('[data-testid="sidebar-nav-compute"]')
      expect(computeLink.exists()).toBe(true)
      expect(computeLink.classes()).toContain('pointer-events-none')
      expect(computeLink.classes()).toContain('opacity-50')
      expect(computeLink.attributes('aria-disabled')).toBe('true')
    })

    it('should disable Compute link when isValid is null', () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          isValid: null,
        },
        global: {
          plugins: [router],
        },
      })

      const computeLink = wrapper.find('[data-testid="sidebar-nav-compute"]')
      expect(computeLink.exists()).toBe(true)
      expect(computeLink.classes()).toContain('pointer-events-none')
      expect(computeLink.classes()).toContain('opacity-50')
      expect(computeLink.attributes('aria-disabled')).toBe('true')
    })

    it('should enable Compute link when isValid is true', () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          isValid: true,
        },
        global: {
          plugins: [router],
        },
      })

      const computeLink = wrapper.find('[data-testid="sidebar-nav-compute"]')
      expect(computeLink.exists()).toBe(true)
      expect(computeLink.classes()).not.toContain('pointer-events-none')
      expect(computeLink.classes()).not.toContain('opacity-50')
      expect(computeLink.attributes('aria-disabled')).toBeUndefined()
    })

    it('should prevent navigation when Compute link is disabled', async () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          isValid: false,
        },
        global: {
          plugins: [router],
        },
      })

      const computeLink = wrapper.find('[data-testid="sidebar-nav-compute"]')
      const currentRoute = router.currentRoute.value.path

      await computeLink.trigger('click')
      await router.isReady()

      // Should not navigate when disabled
      expect(router.currentRoute.value.path).toBe(currentRoute)
    })
  })

  describe('Action Button States', () => {
    it('should disable Validate button when canValidate is false', () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          canValidate: false,
        },
        global: {
          plugins: [router],
        },
      })

      const validateBtn = wrapper.find('[data-testid="action-validate"]')
      expect(validateBtn.exists()).toBe(true)
      expect(validateBtn.attributes('disabled')).toBeDefined()
    })

    it('should enable Validate button when canValidate is true', () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          canValidate: true,
        },
        global: {
          plugins: [router],
        },
      })

      const validateBtn = wrapper.find('[data-testid="action-validate"]')
      expect(validateBtn.exists()).toBe(true)
      expect(validateBtn.attributes('disabled')).toBeUndefined()
    })

    it('should always enable Export button', () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          canValidate: false, // Even when validation disabled
        },
        global: {
          plugins: [router],
        },
      })

      const exportBtn = wrapper.find('[data-testid="action-export"]')
      expect(exportBtn.exists()).toBe(true)
      expect(exportBtn.attributes('disabled')).toBeUndefined()
    })

    it('should always enable Delete button', () => {
      const wrapper = mount(AppSidebar, {
        props: {
          dpdaId: '123',
          currentView: 'editor',
          canValidate: false, // Even when validation disabled
        },
        global: {
          plugins: [router],
        },
      })

      const deleteBtn = wrapper.find('[data-testid="action-delete"]')
      expect(deleteBtn.exists()).toBe(true)
      expect(deleteBtn.attributes('disabled')).toBeUndefined()
    })
  })
})
