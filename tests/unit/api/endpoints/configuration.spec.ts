import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import {
  setStates,
  setAlphabets,
  updateStatesFull,
  updateStatesPartial,
  updateAlphabetsFull,
  updateAlphabetsPartial,
} from '@/api/endpoints/configuration'
import type {
  SetStatesRequest,
  SetAlphabetsRequest,
  UpdateStatesRequest,
  UpdateAlphabetsRequest,
  SuccessResponse,
  UpdateDPDAResponse,
} from '@/api/types'

// Mock server for API testing
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Configuration API Endpoints', () => {
  const API_BASE = 'http://localhost:8000'

  describe('setStates', () => {
    it('should set states successfully', async () => {
      const dpdaId = 'test-123'
      const request: SetStatesRequest = {
        states: ['q0', 'q1', 'q2'],
        initial_state: 'q0',
        accept_states: ['q2'],
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'States configured successfully',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/states`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await setStates(dpdaId, request)
      expect(result).toEqual(expectedResponse)
      expect(result.success).toBe(true)
    })

    it('should handle validation errors for invalid initial state', async () => {
      const dpdaId = 'test-456'
      const request: SetStatesRequest = {
        states: ['q0', 'q1'],
        initial_state: 'q3', // Not in states list
        accept_states: [],
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/states`, () => {
          return HttpResponse.json(
            {
              error: 'Validation error',
              detail: 'Initial state q3 is not in the states list',
              status_code: 400,
            },
            { status: 400 }
          )
        })
      )

      await expect(setStates(dpdaId, request)).rejects.toThrow()
    })

    it('should handle validation errors for invalid accept states', async () => {
      const dpdaId = 'test-789'
      const request: SetStatesRequest = {
        states: ['q0', 'q1'],
        initial_state: 'q0',
        accept_states: ['q2', 'q3'], // Not in states list
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/states`, () => {
          return HttpResponse.json(
            {
              error: 'Validation error',
              detail: 'Accept states must be in the states list',
              status_code: 400,
            },
            { status: 400 }
          )
        })
      )

      await expect(setStates(dpdaId, request)).rejects.toThrow()
    })

    it('should handle empty accept states', async () => {
      const dpdaId = 'test-empty'
      const request: SetStatesRequest = {
        states: ['q0', 'q1', 'q2'],
        initial_state: 'q0',
        accept_states: [], // Empty is valid
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'States configured successfully',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/states`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await setStates(dpdaId, request)
      expect(result.success).toBe(true)
    })
  })

  describe('setAlphabets', () => {
    it('should set alphabets successfully', async () => {
      const dpdaId = 'test-123'
      const request: SetAlphabetsRequest = {
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A', 'B'],
        initial_stack_symbol: '$',
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'Alphabets configured successfully',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/alphabets`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await setAlphabets(dpdaId, request)
      expect(result).toEqual(expectedResponse)
      expect(result.success).toBe(true)
    })

    it('should handle validation error for invalid initial stack symbol', async () => {
      const dpdaId = 'test-456'
      const request: SetAlphabetsRequest = {
        input_alphabet: ['a', 'b'],
        stack_alphabet: ['$', 'X', 'Y'],
        initial_stack_symbol: 'Z', // Not in stack alphabet
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/alphabets`, () => {
          return HttpResponse.json(
            {
              error: 'Validation error',
              detail: 'Initial stack symbol Z is not in the stack alphabet',
              status_code: 400,
            },
            { status: 400 }
          )
        })
      )

      await expect(setAlphabets(dpdaId, request)).rejects.toThrow()
    })

    it('should handle empty input alphabet', async () => {
      const dpdaId = 'test-empty-input'
      const request: SetAlphabetsRequest = {
        input_alphabet: [], // Empty input alphabet (for epsilon-only DPDAs)
        stack_alphabet: ['$'],
        initial_stack_symbol: '$',
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'Alphabets configured successfully',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/alphabets`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await setAlphabets(dpdaId, request)
      expect(result.success).toBe(true)
    })

    it('should handle single character alphabets', async () => {
      const dpdaId = 'test-single'
      const request: SetAlphabetsRequest = {
        input_alphabet: ['0'], // Single input symbol
        stack_alphabet: ['$'], // Single stack symbol
        initial_stack_symbol: '$',
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'Alphabets configured successfully',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/alphabets`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await setAlphabets(dpdaId, request)
      expect(result.success).toBe(true)
    })

    it('should handle DPDA not found error', async () => {
      const dpdaId = 'nonexistent'
      const request: SetAlphabetsRequest = {
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A'],
        initial_stack_symbol: '$',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/alphabets`, () => {
          return HttpResponse.json(
            {
              error: 'DPDA not found',
              detail: `No DPDA with ID: ${dpdaId}`,
              status_code: 404,
            },
            { status: 404 }
          )
        })
      )

      await expect(setAlphabets(dpdaId, request)).rejects.toThrow()
    })
  })

  describe('updateStatesFull', () => {
    it('should perform full states replacement (PUT)', async () => {
      const dpdaId = 'test-123'
      const request: SetStatesRequest = {
        states: ['s0', 's1', 's2'],
        initial_state: 's0',
        accept_states: ['s2'],
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'States updated successfully',
      }

      server.use(
        http.put(`${API_BASE}/api/dpda/${dpdaId}/states`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateStatesFull(dpdaId, request)

      expect(result).toEqual(expectedResponse)
    })

    it('should require all fields for PUT', async () => {
      const dpdaId = 'test-456'
      const request: SetStatesRequest = {
        states: ['q0', 'q1'],
        initial_state: 'q0',
        accept_states: [],
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'States replaced',
      }

      server.use(
        http.put(`${API_BASE}/api/dpda/${dpdaId}/states`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateStatesFull(dpdaId, request)

      expect(result.success).toBe(true)
    })
  })

  describe('updateStatesPartial', () => {
    it('should update only states (PATCH)', async () => {
      const dpdaId = 'test-123'
      const request: UpdateStatesRequest = {
        states: ['q0', 'q1', 'q2', 'q3'],
      }

      const expectedResponse: UpdateDPDAResponse = {
        changes: {
          states: ['q0', 'q1', 'q2', 'q3'],
        },
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/${dpdaId}/states`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateStatesPartial(dpdaId, request)

      expect(result.changes).toHaveProperty('states')
      expect(result.changes.states).toEqual(['q0', 'q1', 'q2', 'q3'])
    })

    it('should update only initial_state (PATCH)', async () => {
      const dpdaId = 'test-456'
      const request: UpdateStatesRequest = {
        initial_state: 'q2',
      }

      const expectedResponse: UpdateDPDAResponse = {
        changes: {
          initial_state: 'q2',
        },
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/${dpdaId}/states`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateStatesPartial(dpdaId, request)

      expect(result.changes).toHaveProperty('initial_state')
      expect(result.changes.initial_state).toBe('q2')
    })

    it('should update only accept_states (PATCH)', async () => {
      const dpdaId = 'test-789'
      const request: UpdateStatesRequest = {
        accept_states: ['q1', 'q2'],
      }

      const expectedResponse: UpdateDPDAResponse = {
        changes: {
          accept_states: ['q1', 'q2'],
        },
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/${dpdaId}/states`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateStatesPartial(dpdaId, request)

      expect(result.changes).toHaveProperty('accept_states')
    })
  })

  describe('updateAlphabetsFull', () => {
    it('should perform full alphabets replacement (PUT)', async () => {
      const dpdaId = 'test-123'
      const request: SetAlphabetsRequest = {
        input_alphabet: ['a', 'b'],
        stack_alphabet: ['$', 'X'],
        initial_stack_symbol: '$',
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'Alphabets updated successfully',
      }

      server.use(
        http.put(`${API_BASE}/api/dpda/${dpdaId}/alphabets`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateAlphabetsFull(dpdaId, request)

      expect(result).toEqual(expectedResponse)
    })
  })

  describe('updateAlphabetsPartial', () => {
    it('should update only input_alphabet (PATCH)', async () => {
      const dpdaId = 'test-123'
      const request: UpdateAlphabetsRequest = {
        input_alphabet: ['0', '1', '2'],
      }

      const expectedResponse: UpdateDPDAResponse = {
        changes: {
          input_alphabet: ['0', '1', '2'],
        },
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/${dpdaId}/alphabets`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateAlphabetsPartial(dpdaId, request)

      expect(result.changes).toHaveProperty('input_alphabet')
      expect(result.changes.input_alphabet).toEqual(['0', '1', '2'])
    })

    it('should update only stack_alphabet (PATCH)', async () => {
      const dpdaId = 'test-456'
      const request: UpdateAlphabetsRequest = {
        stack_alphabet: ['$', 'A', 'B', 'C'],
      }

      const expectedResponse: UpdateDPDAResponse = {
        changes: {
          stack_alphabet: ['$', 'A', 'B', 'C'],
        },
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/${dpdaId}/alphabets`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateAlphabetsPartial(dpdaId, request)

      expect(result.changes).toHaveProperty('stack_alphabet')
    })

    it('should update only initial_stack_symbol (PATCH)', async () => {
      const dpdaId = 'test-789'
      const request: UpdateAlphabetsRequest = {
        initial_stack_symbol: 'Z',
      }

      const expectedResponse: UpdateDPDAResponse = {
        changes: {
          initial_stack_symbol: 'Z',
        },
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/${dpdaId}/alphabets`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateAlphabetsPartial(dpdaId, request)

      expect(result.changes).toHaveProperty('initial_stack_symbol')
      expect(result.changes.initial_stack_symbol).toBe('Z')
    })
  })
})
