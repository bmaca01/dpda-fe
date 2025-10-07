import { describe, it, expect } from 'vitest'
import type {
  CreateDPDARequest,
  CreateDPDAResponse,
  SetStatesRequest,
  SetAlphabetsRequest,
  AddTransitionRequest,
  ComputeRequest,
  ComputeResponse,
  ValidationResponse,
  DPDAInfoResponse,
  ListDPDAsResponse,
} from '@/api/types'

describe('API Types', () => {
  describe('CreateDPDARequest', () => {
    it('should have required name field', () => {
      const request: CreateDPDARequest = {
        name: 'Test DPDA',
      }
      expect(request.name).toBe('Test DPDA')
    })

    it('should have optional description field', () => {
      const request: CreateDPDARequest = {
        name: 'Test DPDA',
        description: 'A test description',
      }
      expect(request.description).toBe('A test description')
    })
  })

  describe('CreateDPDAResponse', () => {
    it('should have id and name fields', () => {
      const response: CreateDPDAResponse = {
        id: '123-456',
        name: 'Test DPDA',
      }
      expect(response.id).toBe('123-456')
      expect(response.name).toBe('Test DPDA')
    })
  })

  describe('SetStatesRequest', () => {
    it('should have states, initial_state, and accept_states', () => {
      const request: SetStatesRequest = {
        states: ['q0', 'q1', 'q2'],
        initial_state: 'q0',
        accept_states: ['q2'],
      }
      expect(request.states).toEqual(['q0', 'q1', 'q2'])
      expect(request.initial_state).toBe('q0')
      expect(request.accept_states).toEqual(['q2'])
    })
  })

  describe('SetAlphabetsRequest', () => {
    it('should have input_alphabet, stack_alphabet, and initial_stack_symbol', () => {
      const request: SetAlphabetsRequest = {
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A', 'B'],
        initial_stack_symbol: '$',
      }
      expect(request.input_alphabet).toEqual(['0', '1'])
      expect(request.stack_alphabet).toEqual(['$', 'A', 'B'])
      expect(request.initial_stack_symbol).toBe('$')
    })
  })

  describe('AddTransitionRequest', () => {
    it('should handle normal transitions', () => {
      const request: AddTransitionRequest = {
        from_state: 'q0',
        input_symbol: '0',
        stack_top: '$',
        to_state: 'q1',
        stack_push: ['A', '$'],
      }
      expect(request.from_state).toBe('q0')
      expect(request.input_symbol).toBe('0')
      expect(request.stack_top).toBe('$')
      expect(request.to_state).toBe('q1')
      expect(request.stack_push).toEqual(['A', '$'])
    })

    it('should handle epsilon transitions with null values', () => {
      const request: AddTransitionRequest = {
        from_state: 'q0',
        input_symbol: null, // epsilon
        stack_top: null, // epsilon
        to_state: 'q1',
        stack_push: [],
      }
      expect(request.input_symbol).toBeNull()
      expect(request.stack_top).toBeNull()
      expect(request.stack_push).toEqual([])
    })
  })

  describe('ComputeRequest', () => {
    it('should have required and optional fields', () => {
      const request: ComputeRequest = {
        input_string: '0011',
        max_steps: 10000,
        show_trace: true,
      }
      expect(request.input_string).toBe('0011')
      expect(request.max_steps).toBe(10000)
      expect(request.show_trace).toBe(true)
    })

    it('should have default values', () => {
      const request: ComputeRequest = {
        input_string: '01',
      }
      expect(request.input_string).toBe('01')
      expect(request.max_steps).toBeUndefined()
      expect(request.show_trace).toBeUndefined()
    })
  })

  describe('ComputeResponse', () => {
    it('should have acceptance result fields', () => {
      const response: ComputeResponse = {
        accepted: true,
        final_state: 'q2',
        final_stack: ['$'],
        steps_taken: 5,
      }
      expect(response.accepted).toBe(true)
      expect(response.final_state).toBe('q2')
      expect(response.final_stack).toEqual(['$'])
      expect(response.steps_taken).toBe(5)
    })

    it('should have optional trace and reason fields', () => {
      const response: ComputeResponse = {
        accepted: false,
        final_state: 'q1',
        final_stack: ['A', '$'],
        steps_taken: 3,
        reason: 'No valid transition',
        trace: [
          {
            state: 'q0',
            input: '01',
            stack: ['$'],
          },
        ],
      }
      expect(response.reason).toBe('No valid transition')
      expect(response.trace).toHaveLength(1)
      expect(response.trace?.[0].state).toBe('q0')
    })
  })

  describe('ValidationResponse', () => {
    it('should have validation result fields', () => {
      const response: ValidationResponse = {
        is_valid: false,
        violations: [
          {
            type: 'non-deterministic',
            description: 'Multiple transitions from state q0',
          },
        ],
        message: 'DPDA is not deterministic',
      }
      expect(response.is_valid).toBe(false)
      expect(response.violations).toHaveLength(1)
      expect(response.violations[0].type).toBe('non-deterministic')
      expect(response.message).toBe('DPDA is not deterministic')
    })
  })

  describe('DPDAInfoResponse', () => {
    it('should have complete DPDA information', () => {
      const response: DPDAInfoResponse = {
        id: '123',
        name: 'Test DPDA',
        description: 'Test description',
        states: ['q0', 'q1'],
        initial_state: 'q0',
        accept_states: ['q1'],
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A'],
        initial_stack_symbol: '$',
        transitions: [
          {
            from_state: 'q0',
            input_symbol: '0',
            stack_top: '$',
            to_state: 'q1',
            stack_push: ['A', '$'],
          },
        ],
        is_valid: true,
      }
      expect(response.id).toBe('123')
      expect(response.name).toBe('Test DPDA')
      expect(response.states).toEqual(['q0', 'q1'])
      expect(response.transitions).toHaveLength(1)
    })

    it('should handle optional fields', () => {
      const response: DPDAInfoResponse = {
        id: '123',
        name: 'Test DPDA',
      }
      expect(response.description).toBeUndefined()
      expect(response.states).toBeUndefined()
    })
  })

  describe('ListDPDAsResponse', () => {
    it('should have array of DPDA items', () => {
      const response: ListDPDAsResponse = {
        dpdas: [
          {
            id: '1',
            name: 'DPDA 1',
            is_valid: true,
            created_at: '2025-01-01T00:00:00Z',
          },
          {
            id: '2',
            name: 'DPDA 2',
            is_valid: false,
          },
        ],
        total: 2,
      }
      expect(response.dpdas).toHaveLength(2)
      expect(response.dpdas[0].id).toBe('1')
      expect(response.total).toBe(2)
    })
  })
})