import { describe, it, expect } from 'vitest'
import {
  createDPDASchema,
  stateConfigSchema,
  alphabetConfigSchema,
  transitionSchema,
  computeSchema,
} from '@/schemas/dpda.schema'

describe('DPDA Validation Schemas', () => {
  describe('createDPDASchema', () => {
    it('should validate a valid DPDA creation request', () => {
      const valid = {
        name: 'Test DPDA',
        description: 'A test DPDA',
      }

      const result = createDPDASchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test DPDA')
        expect(result.data.description).toBe('A test DPDA')
      }
    })

    it('should validate without description', () => {
      const valid = {
        name: 'Simple DPDA',
      }

      const result = createDPDASchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should fail with empty name', () => {
      const invalid = {
        name: '',
        description: 'Has description but no name',
      }

      const result = createDPDASchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 1 character')
      }
    })

    it('should fail with missing name', () => {
      const invalid = {
        description: 'Only description',
      }

      const result = createDPDASchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('stateConfigSchema', () => {
    it('should validate valid state configuration', () => {
      const valid = {
        states: ['q0', 'q1', 'q2'],
        initialState: 'q0',
        acceptStates: ['q2'],
      }

      const result = stateConfigSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.states).toEqual(['q0', 'q1', 'q2'])
        expect(result.data.initialState).toBe('q0')
        expect(result.data.acceptStates).toEqual(['q2'])
      }
    })

    it('should fail if initial state is not in states list', () => {
      const invalid = {
        states: ['q0', 'q1'],
        initialState: 'q2', // Not in states
        acceptStates: [],
      }

      const result = stateConfigSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Initial state must be in states list')
      }
    })

    it('should fail if accept states are not in states list', () => {
      const invalid = {
        states: ['q0', 'q1'],
        initialState: 'q0',
        acceptStates: ['q2', 'q3'], // Not in states
      }

      const result = stateConfigSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('accept states must be in states list')
      }
    })

    it('should accept empty accept states', () => {
      const valid = {
        states: ['q0', 'q1'],
        initialState: 'q0',
        acceptStates: [],
      }

      const result = stateConfigSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should fail with empty states array', () => {
      const invalid = {
        states: [],
        initialState: '',
        acceptStates: [],
      }

      const result = stateConfigSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('alphabetConfigSchema', () => {
    it('should validate valid alphabet configuration', () => {
      const valid = {
        inputAlphabet: ['0', '1'],
        stackAlphabet: ['$', 'A', 'B'],
        initialStackSymbol: '$',
      }

      const result = alphabetConfigSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.inputAlphabet).toEqual(['0', '1'])
        expect(result.data.stackAlphabet).toEqual(['$', 'A', 'B'])
        expect(result.data.initialStackSymbol).toBe('$')
      }
    })

    it('should fail if initial stack symbol is not in stack alphabet', () => {
      const invalid = {
        inputAlphabet: ['a', 'b'],
        stackAlphabet: ['$', 'X'],
        initialStackSymbol: 'Z', // Not in stack alphabet
      }

      const result = alphabetConfigSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Initial stack symbol must be in stack alphabet')
      }
    })

    it('should accept empty input alphabet', () => {
      const valid = {
        inputAlphabet: [], // Empty for epsilon-only DPDAs
        stackAlphabet: ['$'],
        initialStackSymbol: '$',
      }

      const result = alphabetConfigSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should fail with empty stack alphabet', () => {
      const invalid = {
        inputAlphabet: ['0', '1'],
        stackAlphabet: [],
        initialStackSymbol: '',
      }

      const result = alphabetConfigSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('transitionSchema', () => {
    it('should validate normal transition', () => {
      const valid = {
        fromState: 'q0',
        inputSymbol: '0',
        stackTop: '$',
        toState: 'q1',
        stackPush: ['A', '$'],
      }

      const result = transitionSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.fromState).toBe('q0')
        expect(result.data.inputSymbol).toBe('0')
        expect(result.data.stackTop).toBe('$')
        expect(result.data.toState).toBe('q1')
        expect(result.data.stackPush).toEqual(['A', '$'])
      }
    })

    it('should validate epsilon transition with null/empty values', () => {
      const valid = {
        fromState: 'q1',
        inputSymbol: '', // Empty string for epsilon
        stackTop: '', // Empty string for epsilon
        toState: 'q2',
        stackPush: [],
      }

      const result = transitionSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.inputSymbol).toBe('')
        expect(result.data.stackTop).toBe('')
      }
    })

    it('should accept empty stack push', () => {
      const valid = {
        fromState: 'q0',
        inputSymbol: '1',
        stackTop: 'A',
        toState: 'q1',
        stackPush: [], // Pop only
      }

      const result = transitionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should fail with missing required fields', () => {
      const invalid = {
        fromState: 'q0',
        // Missing other required fields
      }

      const result = transitionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('computeSchema', () => {
    it('should validate compute request with all fields', () => {
      const valid = {
        inputString: '0011',
        maxSteps: 5000,
        showTrace: true,
      }

      const result = computeSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.inputString).toBe('0011')
        expect(result.data.maxSteps).toBe(5000)
        expect(result.data.showTrace).toBe(true)
      }
    })

    it('should validate with only required field', () => {
      const valid = {
        inputString: '01',
      }

      const result = computeSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.maxSteps).toBe(10000) // Default value
        expect(result.data.showTrace).toBe(false) // Default value
      }
    })

    it('should accept empty input string', () => {
      const valid = {
        inputString: '',
      }

      const result = computeSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should fail with invalid max steps', () => {
      const invalid = {
        inputString: '01',
        maxSteps: -100, // Negative not allowed
      }

      const result = computeSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive')
      }
    })

    it('should fail if max steps is too large', () => {
      const invalid = {
        inputString: '01',
        maxSteps: 1000001, // Too large
      }

      const result = computeSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than or equal to 1000000')
      }
    })
  })
})