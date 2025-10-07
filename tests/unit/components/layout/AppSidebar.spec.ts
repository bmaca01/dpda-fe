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

  it('should emit delete event when delete button is clicked', async () => {
    const wrapper = createWrapper({ dpdaId: '123', currentView: 'editor' })
    const deleteBtn = wrapper.find('[data-testid="action-delete"]')

    await deleteBtn.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')).toHaveLength(1)
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
})
