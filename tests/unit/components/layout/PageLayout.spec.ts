import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, Router } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'

describe('PageLayout', () => {
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

  const createWrapper = (props = {}, slots = {}) => {
    return mount(PageLayout, {
      props,
      slots,
      global: {
        plugins: [router],
      },
    })
  }

  it('should render AppHeader always', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'AppHeader' }).exists()).toBe(true)
  })

  it('should not render AppSidebar when showSidebar is false', () => {
    const wrapper = createWrapper({ showSidebar: false })
    expect(wrapper.findComponent({ name: 'AppSidebar' }).exists()).toBe(false)
  })

  it('should render AppSidebar when showSidebar is true', () => {
    const wrapper = createWrapper({
      showSidebar: true,
      dpdaId: '123',
      currentView: 'editor',
    })
    expect(wrapper.findComponent({ name: 'AppSidebar' }).exists()).toBe(true)
  })

  it('should pass dpdaId to AppHeader when provided', () => {
    const wrapper = createWrapper({ dpdaId: '123', dpdaName: 'Test DPDA' })
    const header = wrapper.findComponent({ name: 'AppHeader' })
    expect(header.props('dpdaId')).toBe('123')
    expect(header.props('dpdaName')).toBe('Test DPDA')
  })

  it('should pass isValid to AppHeader when provided', () => {
    const wrapper = createWrapper({ dpdaId: '123', dpdaName: 'Test', isValid: true })
    const header = wrapper.findComponent({ name: 'AppHeader' })
    expect(header.props('isValid')).toBe(true)
  })

  it('should pass props to AppSidebar when showSidebar is true', () => {
    const wrapper = createWrapper({
      showSidebar: true,
      dpdaId: '123',
      currentView: 'compute',
    })
    const sidebar = wrapper.findComponent({ name: 'AppSidebar' })
    expect(sidebar.props('dpdaId')).toBe('123')
    expect(sidebar.props('currentView')).toBe('compute')
  })

  it('should render default slot content in main area', () => {
    const wrapper = createWrapper({}, { default: '<div data-testid="main-content">Hello</div>' })
    const mainContent = wrapper.find('[data-testid="main-content"]')
    expect(mainContent.exists()).toBe(true)
    expect(mainContent.text()).toBe('Hello')
  })

  it('should forward sidebar events to parent', async () => {
    const wrapper = createWrapper({
      showSidebar: true,
      dpdaId: '123',
      currentView: 'editor',
    })
    const sidebar = wrapper.findComponent({ name: 'AppSidebar' })

    await sidebar.vm.$emit('validate')
    await sidebar.vm.$emit('export')
    await sidebar.vm.$emit('delete')

    expect(wrapper.emitted('validate')).toBeTruthy()
    expect(wrapper.emitted('export')).toBeTruthy()
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('should have main landmark for accessibility', () => {
    const wrapper = createWrapper()
    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
  })
})
