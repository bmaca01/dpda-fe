import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TraceViewer from '@/components/compute/TraceViewer.vue'
import type { ComputeResponse } from '@/api/types'

describe('TraceViewer', () => {
  let wrapper: any

  afterEach(() => {
    // CRITICAL: Cleanup wrapper (memory-safe pattern)
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  const createWrapper = (props = {}) => {
    wrapper = mount(TraceViewer, {
      props,
    })
    return wrapper
  }

  describe('Rendering', () => {
    it('should render the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should show empty state when no trace provided', () => {
      const wrapper = createWrapper()
      const emptyState = wrapper.find('[data-testid="empty-state"]')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toContain('No trace data')
    })

    it('should not show table when no trace provided', () => {
      const wrapper = createWrapper()
      const table = wrapper.find('[data-testid="trace-table"]')
      expect(table.exists()).toBe(false)
    })

    it('should show empty state when trace is empty array', () => {
      const wrapper = createWrapper({ trace: [] })
      const emptyState = wrapper.find('[data-testid="empty-state"]')
      expect(emptyState.exists()).toBe(true)
    })
  })

  describe('Table Display', () => {
    const sampleTrace: ComputeResponse['trace'] = [
      {
        state: 'q0',
        input: '0011',
        stack: ['$'],
      },
      {
        state: 'q0',
        input: '011',
        stack: ['A', '$'],
      },
      {
        state: 'q1',
        input: '11',
        stack: ['A', '$'],
      },
      {
        state: 'q1',
        input: '1',
        stack: ['$'],
      },
      {
        state: 'q2',
        input: '',
        stack: ['$'],
      },
    ]

    it('should display table when trace data provided', () => {
      const wrapper = createWrapper({ trace: sampleTrace })
      const table = wrapper.find('[data-testid="trace-table"]')
      expect(table.exists()).toBe(true)
    })

    it('should display table headers', () => {
      const wrapper = createWrapper({ trace: sampleTrace })
      expect(wrapper.text()).toContain('Step')
      expect(wrapper.text()).toContain('State')
      expect(wrapper.text()).toContain('Remaining Input')
      expect(wrapper.text()).toContain('Stack')
    })

    it('should display all trace steps', () => {
      const wrapper = createWrapper({ trace: sampleTrace })
      const rows = wrapper.findAll('.trace-row')
      expect(rows.length).toBe(5)
    })

    it('should display step numbers starting from 1', () => {
      const wrapper = createWrapper({ trace: sampleTrace })
      const firstRow = wrapper.find('[data-testid="trace-row-0"]')
      expect(firstRow.find('[data-testid="step-number"]').text()).toBe('1')
    })

    it('should display state for each step', () => {
      const wrapper = createWrapper({ trace: sampleTrace })
      const firstRow = wrapper.find('[data-testid="trace-row-0"]')
      expect(firstRow.find('[data-testid="state"]').text()).toContain('q0')
    })

    it('should display remaining input for each step', () => {
      const wrapper = createWrapper({ trace: sampleTrace })
      const firstRow = wrapper.find('[data-testid="trace-row-0"]')
      expect(firstRow.find('[data-testid="input"]').text()).toContain('0011')
    })

    it('should display stack for each step', () => {
      const wrapper = createWrapper({ trace: sampleTrace })
      const secondRow = wrapper.find('[data-testid="trace-row-1"]')
      expect(secondRow.find('[data-testid="stack"]').text()).toContain('A')
      expect(secondRow.find('[data-testid="stack"]').text()).toContain('$')
    })
  })

  describe('Stack Formatting', () => {
    it('should format single-element stack', () => {
      const trace: ComputeResponse['trace'] = [
        {
          state: 'q0',
          input: 'test',
          stack: ['$'],
        },
      ]
      const wrapper = createWrapper({ trace })
      expect(wrapper.find('[data-testid="stack"]').text()).toContain('$')
    })

    it('should format multi-element stack with commas', () => {
      const trace: ComputeResponse['trace'] = [
        {
          state: 'q0',
          input: 'test',
          stack: ['C', 'B', 'A', '$'],
        },
      ]
      const wrapper = createWrapper({ trace })
      const stackText = wrapper.find('[data-testid="stack"]').text()
      expect(stackText).toContain('C')
      expect(stackText).toContain('B')
      expect(stackText).toContain('A')
      expect(stackText).toContain('$')
    })

    it('should show empty indicator for empty stack', () => {
      const trace: ComputeResponse['trace'] = [
        {
          state: 'q0',
          input: 'test',
          stack: [],
        },
      ]
      const wrapper = createWrapper({ trace })
      expect(wrapper.find('[data-testid="stack"]').text()).toContain('empty')
    })
  })

  describe('Input Display', () => {
    it('should show epsilon symbol for empty input', () => {
      const trace: ComputeResponse['trace'] = [
        {
          state: 'q2',
          input: '',
          stack: ['$'],
        },
      ]
      const wrapper = createWrapper({ trace })
      const inputText = wrapper.find('[data-testid="input"]').text()
      // Should show epsilon symbol (ε) or "empty" for empty string
      expect(inputText === 'ε' || inputText.includes('empty')).toBe(true)
    })

    it('should show actual input string when not empty', () => {
      const trace: ComputeResponse['trace'] = [
        {
          state: 'q0',
          input: '0011',
          stack: ['$'],
        },
      ]
      const wrapper = createWrapper({ trace })
      expect(wrapper.find('[data-testid="input"]').text()).toContain('0011')
    })
  })

  describe('Props', () => {
    it('should accept trace prop', () => {
      const trace: ComputeResponse['trace'] = [
        {
          state: 'q0',
          input: 'test',
          stack: ['$'],
        },
      ]
      const wrapper = createWrapper({ trace })
      expect(wrapper.props('trace')).toEqual(trace)
    })

    it('should handle undefined trace prop', () => {
      const wrapper = createWrapper({ trace: undefined })
      expect(wrapper.props('trace')).toBeUndefined()
    })

    it('should handle empty array trace prop', () => {
      const wrapper = createWrapper({ trace: [] })
      expect(wrapper.props('trace')).toEqual([])
    })
  })
})
