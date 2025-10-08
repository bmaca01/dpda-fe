import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CytoscapeGraph from '@/components/visualization/CytoscapeGraph.vue'
import cytoscape from 'cytoscape'

// Mock cytoscape
vi.mock('cytoscape', () => ({
  default: vi.fn(() => ({
    destroy: vi.fn(),
    layout: vi.fn(() => ({ run: vi.fn() })),
  })),
}))

describe('CytoscapeGraph', () => {
  let wrapper: any

  afterEach(() => {
    // CRITICAL: Cleanup wrapper (memory-safe pattern)
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
    vi.clearAllMocks()
  })

  const createWrapper = (props = {}) => {
    const defaultProps = {
      data: undefined,
      isLoading: false,
      error: null,
    }

    wrapper = mount(CytoscapeGraph, {
      props: { ...defaultProps, ...props },
    })

    return wrapper
  }

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render container with explicit dimensions', () => {
      const mockData = {
        elements: [{ data: { id: 'q0' } }],
      }
      const wrapper = createWrapper({ data: mockData })
      const container = wrapper.find('[data-testid="cytoscape-container"]')

      expect(container.exists()).toBe(true)
      // Check that container has explicit height/width classes
      expect(container.classes()).toContain('w-full')
      expect(wrapper.html()).toContain('h-')
    })
  })

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      const wrapper = createWrapper({ isLoading: true })
      expect(wrapper.text()).toContain('Loading')
    })

    it('should not initialize cytoscape when loading', () => {
      createWrapper({ isLoading: true })
      expect(cytoscape).not.toHaveBeenCalled()
    })
  })

  describe('Error State', () => {
    it('should show error state when error prop is provided', () => {
      const error = { message: 'Visualization failed' }
      const wrapper = createWrapper({ error })

      expect(wrapper.text()).toContain('Error')
      expect(wrapper.text()).toContain('Visualization failed')
    })

    it('should not initialize cytoscape when error exists', () => {
      const error = { message: 'Error' }
      createWrapper({ error })
      expect(cytoscape).not.toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when data is undefined', () => {
      const wrapper = createWrapper({ data: undefined })
      expect(wrapper.text()).toContain('No visualization data available')
    })

    it('should not initialize cytoscape when data is undefined', () => {
      createWrapper({ data: undefined })
      expect(cytoscape).not.toHaveBeenCalled()
    })
  })

  describe('Cytoscape Initialization', () => {
    it('should initialize cytoscape on mount with valid data', async () => {
      const mockData = {
        elements: [
          { data: { id: 'q0', label: 'q0' } },
          { data: { id: 'q1', label: 'q1' } },
          {
            data: {
              id: 'e1',
              source: 'q0',
              target: 'q1',
              label: 'a, ε → X',
            },
          },
        ],
      }

      createWrapper({ data: mockData })
      await wrapper.vm.$nextTick()

      expect(cytoscape).toHaveBeenCalled()

      // Check that cytoscape was called with correct structure
      const cytoscapeCall = vi.mocked(cytoscape).mock.calls[0][0]
      expect(cytoscapeCall).toHaveProperty('container')
      expect(cytoscapeCall).toHaveProperty('elements')
      expect(cytoscapeCall).toHaveProperty('style')
      expect(cytoscapeCall).toHaveProperty('layout')
    })

    it('should pass correct elements to cytoscape', async () => {
      const mockData = {
        elements: [
          { data: { id: 'q0' } },
          { data: { id: 'e1', source: 'q0', target: 'q1' } },
        ],
      }

      createWrapper({ data: mockData })
      await wrapper.vm.$nextTick()

      const cytoscapeCall = vi.mocked(cytoscape).mock.calls[0][0] as any
      expect(cytoscapeCall.elements).toMatchObject(mockData.elements)
    })

    it('should apply node styles', async () => {
      const mockData = {
        elements: [{ data: { id: 'q0' } }],
      }

      createWrapper({ data: mockData })
      await wrapper.vm.$nextTick()

      const cytoscapeCall = vi.mocked(cytoscape).mock.calls[0][0] as any
      const nodeStyle = cytoscapeCall.style.find((s: any) => s.selector === 'node')

      expect(nodeStyle).toBeDefined()
      expect(nodeStyle.style).toHaveProperty('label')
    })

    it('should apply edge styles', async () => {
      const mockData = {
        elements: [
          { data: { id: 'q0' } },
          { data: { id: 'q1' } },
          { data: { id: 'e1', source: 'q0', target: 'q1' } },
        ],
      }

      createWrapper({ data: mockData })
      await wrapper.vm.$nextTick()

      const cytoscapeCall = vi.mocked(cytoscape).mock.calls[0][0] as any
      const edgeStyle = cytoscapeCall.style.find((s: any) => s.selector === 'edge')

      expect(edgeStyle).toBeDefined()
      expect(edgeStyle.style).toHaveProperty('curve-style')
      expect(edgeStyle.style).toHaveProperty('target-arrow-shape')
    })

    it('should use cose layout', async () => {
      const mockData = {
        elements: [{ data: { id: 'q0' } }],
      }

      createWrapper({ data: mockData })
      await wrapper.vm.$nextTick()

      const cytoscapeCall = vi.mocked(cytoscape).mock.calls[0][0] as any
      expect(cytoscapeCall.layout.name).toBe('cose')
    })
  })

  describe('Cytoscape Cleanup', () => {
    it('should destroy cytoscape instance on unmount', async () => {
      const mockDestroy = vi.fn()
      vi.mocked(cytoscape).mockReturnValue({
        destroy: mockDestroy,
        layout: vi.fn(() => ({ run: vi.fn() })),
      } as any)

      const mockData = {
        elements: [{ data: { id: 'q0' } }],
      }

      const wrapper = createWrapper({ data: mockData })
      await wrapper.vm.$nextTick()

      expect(cytoscape).toHaveBeenCalled()

      wrapper.unmount()

      expect(mockDestroy).toHaveBeenCalled()
    })
  })

  describe('Data Updates', () => {
    it('should re-initialize when data prop changes', async () => {
      const mockDestroy = vi.fn()
      vi.mocked(cytoscape).mockReturnValue({
        destroy: mockDestroy,
        layout: vi.fn(() => ({ run: vi.fn() })),
      } as any)

      const initialData = {
        elements: [{ data: { id: 'q0' } }],
      }

      const wrapper = createWrapper({ data: initialData })
      await wrapper.vm.$nextTick()

      expect(cytoscape).toHaveBeenCalledTimes(1)

      // Update data
      const newData = {
        elements: [
          { data: { id: 'q0' } },
          { data: { id: 'q1' } },
          { data: { id: 'e1', source: 'q0', target: 'q1' } },
        ],
      }

      await wrapper.setProps({ data: newData })
      await wrapper.vm.$nextTick()
      // Wait for async watch handler
      await new Promise(resolve => setTimeout(resolve, 10))

      // Should destroy old instance and create new one
      expect(mockDestroy).toHaveBeenCalled()
      expect(cytoscape).toHaveBeenCalledTimes(2)
    })

    it('should handle transition from no data to data', async () => {
      const wrapper = createWrapper({ data: undefined })
      expect(cytoscape).not.toHaveBeenCalled()

      const newData = {
        elements: [{ data: { id: 'q0' } }],
      }

      await wrapper.setProps({ data: newData })
      await wrapper.vm.$nextTick()
      // Wait for async watch handler
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(cytoscape).toHaveBeenCalled()
    })
  })
})
