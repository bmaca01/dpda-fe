import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, Router } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'

describe('AppHeader', () => {
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

  const createWrapper = (props = {}) => {
    return mount(AppHeader, {
      props,
      global: {
        plugins: [router],
      },
    })
  }

  it('should render app title', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('DPDA Simulator')
  })

  it('should not show DPDA name when not provided', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[data-testid="dpda-name"]').exists()).toBe(false)
  })

  it('should show DPDA name when provided', () => {
    const wrapper = createWrapper({ dpdaName: 'My Test DPDA' })
    const dpdaName = wrapper.find('[data-testid="dpda-name"]')
    expect(dpdaName.exists()).toBe(true)
    expect(dpdaName.text()).toContain('My Test DPDA')
  })

  it('should not show validation badge when isValid is undefined', () => {
    const wrapper = createWrapper({ dpdaName: 'Test DPDA' })
    expect(wrapper.find('[data-testid="validation-badge"]').exists()).toBe(false)
  })

  it('should show valid badge when isValid is true', () => {
    const wrapper = createWrapper({ dpdaName: 'Test DPDA', isValid: true })
    const badge = wrapper.find('[data-testid="validation-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('Valid')
  })

  it('should show invalid badge when isValid is false', () => {
    const wrapper = createWrapper({ dpdaName: 'Test DPDA', isValid: false })
    const badge = wrapper.find('[data-testid="validation-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('Invalid')
  })

  it('should render home navigation link', () => {
    const wrapper = createWrapper()
    const homeLink = wrapper.find('[data-testid="nav-home"]')
    expect(homeLink.exists()).toBe(true)
    expect(homeLink.attributes('href')).toBe('/')
  })

  it('should render DPDA navigation links when dpdaId is provided', () => {
    const wrapper = createWrapper({ dpdaId: '123' })
    const editorLink = wrapper.find('[data-testid="nav-editor"]')
    const visualizeLink = wrapper.find('[data-testid="nav-visualize"]')
    const computeLink = wrapper.find('[data-testid="nav-compute"]')

    expect(editorLink.exists()).toBe(true)
    expect(visualizeLink.exists()).toBe(true)
    expect(computeLink.exists()).toBe(true)

    expect(editorLink.attributes('href')).toContain('/dpda/123')
    expect(visualizeLink.attributes('href')).toContain('/dpda/123/visualize')
    expect(computeLink.attributes('href')).toContain('/dpda/123/compute')
  })

  it('should not render DPDA navigation links when dpdaId is not provided', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[data-testid="nav-editor"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nav-visualize"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nav-compute"]').exists()).toBe(false)
  })

  it('should have proper ARIA labels for accessibility', () => {
    const wrapper = createWrapper({ dpdaId: '123', dpdaName: 'Test DPDA' })
    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe('Main navigation')
  })
})
