import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '@/App.vue'

describe('App', () => {
  it('should render router-view', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: { template: '<div data-testid="home">Home Page</div>' },
        },
      ],
    })

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })
})
