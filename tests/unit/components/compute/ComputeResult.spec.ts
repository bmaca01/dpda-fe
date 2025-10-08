import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ComputeResult from '@/components/compute/ComputeResult.vue'
import type { ComputeResponse } from '@/api/types'

describe('ComputeResult', () => {
  let wrapper: any

  afterEach(() => {
    // CRITICAL: Cleanup wrapper (memory-safe pattern)
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  const createWrapper = (props = {}) => {
    wrapper = mount(ComputeResult, {
      props,
    })
    return wrapper
  }

  describe('Rendering', () => {
    it('should render the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should show empty state when no result provided', () => {
      const wrapper = createWrapper()
      const emptyState = wrapper.find('[data-testid="empty-state"]')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toContain('No computation result')
    })

    it('should not show result when no result provided', () => {
      const wrapper = createWrapper()
      const resultSection = wrapper.find('[data-testid="result-section"]')
      expect(resultSection.exists()).toBe(false)
    })
  })

  describe('Accepted State', () => {
    const acceptedResult: ComputeResponse = {
      accepted: true,
      final_state: 'q2',
      final_stack: ['$'],
      steps_taken: 5,
    }

    it('should display accepted badge when string is accepted', () => {
      const wrapper = createWrapper({ result: acceptedResult })
      const badge = wrapper.find('[data-testid="accepted-badge"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('Accepted')
    })

    it('should show final state', () => {
      const wrapper = createWrapper({ result: acceptedResult })
      expect(wrapper.text()).toContain('q2')
      expect(wrapper.find('[data-testid="final-state"]').text()).toContain('q2')
    })

    it('should show final stack', () => {
      const wrapper = createWrapper({ result: acceptedResult })
      const finalStack = wrapper.find('[data-testid="final-stack"]')
      expect(finalStack.exists()).toBe(true)
      expect(finalStack.text()).toContain('$')
    })

    it('should show steps taken', () => {
      const wrapper = createWrapper({ result: acceptedResult })
      const steps = wrapper.find('[data-testid="steps-taken"]')
      expect(steps.exists()).toBe(true)
      expect(steps.text()).toContain('5')
    })

    it('should not show rejection reason when accepted', () => {
      const wrapper = createWrapper({ result: acceptedResult })
      const reason = wrapper.find('[data-testid="rejection-reason"]')
      expect(reason.exists()).toBe(false)
    })
  })

  describe('Rejected State', () => {
    const rejectedResult: ComputeResponse = {
      accepted: false,
      final_state: 'q1',
      final_stack: ['X', 'A', '$'],
      steps_taken: 3,
      reason: 'No valid transition from state q1',
    }

    it('should display rejected badge when string is rejected', () => {
      const wrapper = createWrapper({ result: rejectedResult })
      const badge = wrapper.find('[data-testid="rejected-badge"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('Rejected')
    })

    it('should show rejection reason when provided', () => {
      const wrapper = createWrapper({ result: rejectedResult })
      const reason = wrapper.find('[data-testid="rejection-reason"]')
      expect(reason.exists()).toBe(true)
      expect(reason.text()).toContain('No valid transition from state q1')
    })

    it('should show final state for rejected strings', () => {
      const wrapper = createWrapper({ result: rejectedResult })
      expect(wrapper.find('[data-testid="final-state"]').text()).toContain('q1')
    })

    it('should show final stack for rejected strings', () => {
      const wrapper = createWrapper({ result: rejectedResult })
      const finalStack = wrapper.find('[data-testid="final-stack"]')
      expect(finalStack.text()).toContain('X')
      expect(finalStack.text()).toContain('A')
      expect(finalStack.text()).toContain('$')
    })

    it('should show steps taken for rejected strings', () => {
      const wrapper = createWrapper({ result: rejectedResult })
      expect(wrapper.find('[data-testid="steps-taken"]').text()).toContain('3')
    })
  })

  describe('Stack Display', () => {
    it('should format empty stack', () => {
      const result: ComputeResponse = {
        accepted: true,
        final_state: 'q0',
        final_stack: [],
        steps_taken: 1,
      }
      const wrapper = createWrapper({ result })
      const finalStack = wrapper.find('[data-testid="final-stack"]')
      expect(finalStack.text()).toContain('empty')
    })

    it('should format single-element stack', () => {
      const result: ComputeResponse = {
        accepted: true,
        final_state: 'q0',
        final_stack: ['$'],
        steps_taken: 1,
      }
      const wrapper = createWrapper({ result })
      const finalStack = wrapper.find('[data-testid="final-stack"]')
      expect(finalStack.text()).toContain('$')
    })

    it('should format multi-element stack with comma separation', () => {
      const result: ComputeResponse = {
        accepted: true,
        final_state: 'q0',
        final_stack: ['C', 'B', 'A', '$'],
        steps_taken: 4,
      }
      const wrapper = createWrapper({ result })
      const finalStack = wrapper.find('[data-testid="final-stack"]')
      // Stack should be displayed top-to-bottom or with commas
      expect(finalStack.text()).toContain('C')
      expect(finalStack.text()).toContain('$')
    })
  })

  describe('Props', () => {
    it('should accept result prop', () => {
      const result: ComputeResponse = {
        accepted: true,
        final_state: 'q0',
        final_stack: ['$'],
        steps_taken: 1,
      }
      const wrapper = createWrapper({ result })
      expect(wrapper.props('result')).toEqual(result)
    })

    it('should handle undefined result prop', () => {
      const wrapper = createWrapper({ result: undefined })
      expect(wrapper.props('result')).toBeUndefined()
    })
  })
})
