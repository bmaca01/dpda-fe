import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import {
  addTransition,
  deleteTransition,
  getTransitions,
  updateTransition,
} from '@/api/endpoints/transitions'
import type {
  AddTransitionRequest,
  UpdateTransitionRequest,
  SuccessResponse,
  DeleteTransitionResponse,
  UpdateTransitionResponse,
} from '@/api/types'

// Mock server for API testing
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Transition API Endpoints', () => {
  const API_BASE = 'http://localhost:8000'

  describe('addTransition', () => {
    it('should add a normal transition successfully', async () => {
      const dpdaId = 'test-123'
      const request: AddTransitionRequest = {
        from_state: 'q0',
        input_symbol: '0',
        stack_top: '$',
        to_state: 'q1',
        stack_push: ['A', '$'], // First element pushed last (A on top)
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'Transition added successfully',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/transition`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await addTransition(dpdaId, request)
      expect(result).toEqual(expectedResponse)
      expect(result.success).toBe(true)
    })

    it('should add an epsilon transition with null values', async () => {
      const dpdaId = 'test-456'
      const request: AddTransitionRequest = {
        from_state: 'q1',
        input_symbol: null, // epsilon input
        stack_top: null, // epsilon stack read
        to_state: 'q2',
        stack_push: [], // pop only (no push)
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'Transition added successfully',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/transition`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await addTransition(dpdaId, request)
      expect(result.success).toBe(true)
    })

    it('should handle stack push with multiple symbols', async () => {
      const dpdaId = 'test-789'
      const request: AddTransitionRequest = {
        from_state: 'q0',
        input_symbol: '1',
        stack_top: '$',
        to_state: 'q1',
        stack_push: ['B', 'A', '$'], // B pushed last, ends on top
      }

      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'Transition added successfully',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/transition`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await addTransition(dpdaId, request)
      expect(result.success).toBe(true)
    })

    it('should handle validation errors for invalid states', async () => {
      const dpdaId = 'test-invalid'
      const request: AddTransitionRequest = {
        from_state: 'q99', // Invalid state
        input_symbol: '0',
        stack_top: '$',
        to_state: 'q100', // Invalid state
        stack_push: ['A'],
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/transition`, () => {
          return HttpResponse.json(
            {
              error: 'Validation error',
              detail: 'State q99 is not in the states list',
              status_code: 400,
            },
            { status: 400 }
          )
        })
      )

      await expect(addTransition(dpdaId, request)).rejects.toThrow()
    })

    it('should handle non-determinism errors', async () => {
      const dpdaId = 'test-nondet'
      const request: AddTransitionRequest = {
        from_state: 'q0',
        input_symbol: '0',
        stack_top: '$',
        to_state: 'q1',
        stack_push: ['A', '$'],
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/transition`, () => {
          return HttpResponse.json(
            {
              error: 'Non-deterministic transition',
              detail: 'A transition already exists from q0 on input 0 with stack top $',
              status_code: 400,
            },
            { status: 400 }
          )
        })
      )

      await expect(addTransition(dpdaId, request)).rejects.toThrow()
    })
  })

  describe('deleteTransition', () => {
    it('should delete a transition by index successfully', async () => {
      const dpdaId = 'test-123'
      const transitionIndex = 0

      const expectedResponse: DeleteTransitionResponse = {
        success: true,
        message: 'Transition deleted successfully',
        remaining_transitions: 5,
      }

      server.use(
        http.delete(`${API_BASE}/api/dpda/${dpdaId}/transition/${transitionIndex}`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await deleteTransition(dpdaId, transitionIndex)
      expect(result).toEqual(expectedResponse)
      expect(result.success).toBe(true)
      expect(result.remaining_transitions).toBe(5)
    })

    it('should handle invalid index error', async () => {
      const dpdaId = 'test-456'
      const transitionIndex = 999 // Out of bounds

      server.use(
        http.delete(`${API_BASE}/api/dpda/${dpdaId}/transition/${transitionIndex}`, () => {
          return HttpResponse.json(
            {
              error: 'Invalid index',
              detail: 'Transition index 999 is out of bounds',
              status_code: 400,
            },
            { status: 400 }
          )
        })
      )

      await expect(deleteTransition(dpdaId, transitionIndex)).rejects.toThrow()
    })

    it('should handle deletion when no transitions exist', async () => {
      const dpdaId = 'test-empty'
      const transitionIndex = 0

      server.use(
        http.delete(`${API_BASE}/api/dpda/${dpdaId}/transition/${transitionIndex}`, () => {
          return HttpResponse.json(
            {
              error: 'No transitions',
              detail: 'DPDA has no transitions to delete',
              status_code: 400,
            },
            { status: 400 }
          )
        })
      )

      await expect(deleteTransition(dpdaId, transitionIndex)).rejects.toThrow()
    })
  })

  describe('getTransitions', () => {
    it('should get all transitions for a DPDA', async () => {
      const dpdaId = 'test-123'

      const expectedTransitions = [
        {
          from_state: 'q0',
          input_symbol: '0',
          stack_top: '$',
          to_state: 'q1',
          stack_push: ['A', '$'],
        },
        {
          from_state: 'q1',
          input_symbol: '1',
          stack_top: 'A',
          to_state: 'q2',
          stack_push: [],
        },
        {
          from_state: 'q2',
          input_symbol: null, // epsilon
          stack_top: '$',
          to_state: 'q3',
          stack_push: ['$'],
        },
      ]

      server.use(
        http.get(`${API_BASE}/api/dpda/${dpdaId}/transitions`, () => {
          return HttpResponse.json({
            transitions: expectedTransitions,
            total: 3,
          })
        })
      )

      const result = await getTransitions(dpdaId)
      expect(result.transitions).toEqual(expectedTransitions)
      expect(result.total).toBe(3)
      expect(result.transitions[0].from_state).toBe('q0')
      expect(result.transitions[2].input_symbol).toBeNull()
    })

    it('should handle empty transitions list', async () => {
      const dpdaId = 'test-empty'

      server.use(
        http.get(`${API_BASE}/api/dpda/${dpdaId}/transitions`, () => {
          return HttpResponse.json({
            transitions: [],
            total: 0,
          })
        })
      )

      const result = await getTransitions(dpdaId)
      expect(result.transitions).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should handle DPDA not found', async () => {
      const dpdaId = 'nonexistent'

      server.use(
        http.get(`${API_BASE}/api/dpda/${dpdaId}/transitions`, () => {
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

      await expect(getTransitions(dpdaId)).rejects.toThrow()
    })
  })

  describe('updateTransition', () => {
    it('should update transition to_state successfully', async () => {
      const dpdaId = 'test-123'
      const index = 0
      const request: UpdateTransitionRequest = {
        to_state: 'q2',
      }

      const expectedResponse: UpdateTransitionResponse = {
        changes: {
          to_state: 'q2',
        },
      }

      server.use(
        http.put(`${API_BASE}/api/dpda/${dpdaId}/transition/${index}`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateTransition(dpdaId, index, request)

      expect(result.changes).toHaveProperty('to_state')
      expect(result.changes.to_state).toBe('q2')
    })

    it('should update transition stack_push successfully', async () => {
      const dpdaId = 'test-456'
      const index = 1
      const request: UpdateTransitionRequest = {
        stack_push: ['X', 'Y', 'Z'],
      }

      const expectedResponse: UpdateTransitionResponse = {
        changes: {
          stack_push: ['X', 'Y', 'Z'],
        },
      }

      server.use(
        http.put(`${API_BASE}/api/dpda/${dpdaId}/transition/${index}`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateTransition(dpdaId, index, request)

      expect(result.changes).toHaveProperty('stack_push')
      expect(result.changes.stack_push).toEqual(['X', 'Y', 'Z'])
    })

    it('should update multiple transition fields', async () => {
      const dpdaId = 'test-789'
      const index = 2
      const request: UpdateTransitionRequest = {
        to_state: 'q3',
        input_symbol: '1',
        stack_push: ['A', '$'],
      }

      const expectedResponse: UpdateTransitionResponse = {
        changes: {
          to_state: 'q3',
          input_symbol: '1',
          stack_push: ['A', '$'],
        },
      }

      server.use(
        http.put(`${API_BASE}/api/dpda/${dpdaId}/transition/${index}`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateTransition(dpdaId, index, request)

      expect(result.changes).toHaveProperty('to_state')
      expect(result.changes).toHaveProperty('input_symbol')
      expect(result.changes).toHaveProperty('stack_push')
    })

    it('should update transition to epsilon values', async () => {
      const dpdaId = 'test-epsilon'
      const index = 0
      const request: UpdateTransitionRequest = {
        input_symbol: null,
        stack_top: null,
        stack_push: [],
      }

      const expectedResponse: UpdateTransitionResponse = {
        changes: {
          input_symbol: null,
          stack_top: null,
          stack_push: [],
        },
      }

      server.use(
        http.put(`${API_BASE}/api/dpda/${dpdaId}/transition/${index}`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateTransition(dpdaId, index, request)

      expect(result.changes.input_symbol).toBeNull()
      expect(result.changes.stack_top).toBeNull()
    })

    it('should handle invalid index error', async () => {
      const dpdaId = 'test-123'
      const index = 999

      server.use(
        http.put(`${API_BASE}/api/dpda/${dpdaId}/transition/${index}`, () => {
          return HttpResponse.json(
            {
              error: 'Transition not found',
              detail: `No transition at index ${index}`,
              status_code: 404,
            },
            { status: 404 }
          )
        })
      )

      await expect(updateTransition(dpdaId, index, { to_state: 'q2' })).rejects.toThrow()
    })
  })
})
