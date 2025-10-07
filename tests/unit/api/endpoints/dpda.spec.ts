import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { createDPDA, listDPDAs, getDPDA, deleteDPDA, updateDPDA } from '@/api/endpoints/dpda'
import type {
  CreateDPDARequest,
  CreateDPDAResponse,
  ListDPDAsResponse,
  DPDAInfoResponse,
  SuccessResponse,
  UpdateDPDARequest,
  UpdateDPDAResponse,
} from '@/api/types'

// Mock server for API testing
const server = setupServer()

beforeAll(() => {
  // Set the environment variable for tests
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000')
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => server.resetHandlers())
afterAll(() => {
  vi.unstubAllEnvs()
  server.close()
})

describe('DPDA API Endpoints', () => {
  const API_BASE = 'http://localhost:8000'

  describe('createDPDA', () => {
    it('should create a new DPDA successfully', async () => {
      const request: CreateDPDARequest = {
        name: 'Test DPDA',
        description: 'A test DPDA',
      }

      const expectedResponse: CreateDPDAResponse = {
        id: 'uuid-123',
        name: 'Test DPDA',
        description: 'A test DPDA',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/create`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await createDPDA(request)
      expect(result).toEqual(expectedResponse)
      expect(result.id).toBe('uuid-123')
      expect(result.name).toBe('Test DPDA')
    })

    it('should handle creation without description', async () => {
      const request: CreateDPDARequest = {
        name: 'Simple DPDA',
      }

      const expectedResponse: CreateDPDAResponse = {
        id: 'uuid-456',
        name: 'Simple DPDA',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/create`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await createDPDA(request)
      expect(result).toEqual(expectedResponse)
      expect(result.description).toBeUndefined()
    })

    it('should handle API errors', async () => {
      server.use(
        http.post(`${API_BASE}/api/dpda/create`, () => {
          return HttpResponse.json(
            { error: 'Invalid request', detail: 'Name is required', status_code: 400 },
            { status: 400 }
          )
        })
      )

      await expect(createDPDA({ name: '' })).rejects.toThrow()
    })
  })

  describe('listDPDAs', () => {
    it('should list all DPDAs', async () => {
      const expectedResponse: ListDPDAsResponse = {
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
            description: 'Second DPDA',
          },
        ],
        total: 2,
      }

      server.use(
        http.get(`${API_BASE}/api/dpda/list`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await listDPDAs()
      expect(result).toEqual(expectedResponse)
      expect(result.dpdas).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should handle empty list', async () => {
      const expectedResponse: ListDPDAsResponse = {
        dpdas: [],
        total: 0,
      }

      server.use(
        http.get(`${API_BASE}/api/dpda/list`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await listDPDAs()
      expect(result.dpdas).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('getDPDA', () => {
    it('should get a DPDA by ID', async () => {
      const expectedResponse: DPDAInfoResponse = {
        id: '123',
        name: 'Test DPDA',
        description: 'A complete DPDA',
        states: ['q0', 'q1', 'q2'],
        initial_state: 'q0',
        accept_states: ['q2'],
        input_alphabet: ['0', '1'],
        stack_alphabet: ['$', 'A', 'B'],
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

      server.use(
        http.get(`${API_BASE}/api/dpda/123`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await getDPDA('123')
      expect(result).toEqual(expectedResponse)
      expect(result.id).toBe('123')
      expect(result.states).toEqual(['q0', 'q1', 'q2'])
      expect(result.transitions).toHaveLength(1)
    })

    it('should handle DPDA not found', async () => {
      server.use(
        http.get(`${API_BASE}/api/dpda/nonexistent`, () => {
          return HttpResponse.json(
            { error: 'DPDA not found', detail: 'No DPDA with ID: nonexistent', status_code: 404 },
            { status: 404 }
          )
        })
      )

      await expect(getDPDA('nonexistent')).rejects.toThrow()
    })

    it('should get a partially configured DPDA', async () => {
      const expectedResponse: DPDAInfoResponse = {
        id: '456',
        name: 'Partial DPDA',
        is_valid: false,
      }

      server.use(
        http.get(`${API_BASE}/api/dpda/456`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await getDPDA('456')
      expect(result.id).toBe('456')
      expect(result.states).toBeUndefined()
      expect(result.transitions).toBeUndefined()
      expect(result.is_valid).toBe(false)
    })
  })

  describe('deleteDPDA', () => {
    it('should delete a DPDA successfully', async () => {
      const expectedResponse: SuccessResponse = {
        success: true,
        message: 'DPDA deleted successfully',
      }

      server.use(
        http.delete(`${API_BASE}/api/dpda/123`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await deleteDPDA('123')
      expect(result).toEqual(expectedResponse)
      expect(result.success).toBe(true)
    })

    it('should handle deletion of non-existent DPDA', async () => {
      server.use(
        http.delete(`${API_BASE}/api/dpda/nonexistent`, () => {
          return HttpResponse.json(
            {
              error: 'DPDA not found',
              detail: 'Cannot delete non-existent DPDA',
              status_code: 404,
            },
            { status: 404 }
          )
        })
      )

      await expect(deleteDPDA('nonexistent')).rejects.toThrow()
    })
  })

  describe('updateDPDA', () => {
    it('should update DPDA name successfully', async () => {
      const request: UpdateDPDARequest = {
        name: 'Updated Name',
      }

      const expectedResponse: UpdateDPDAResponse = {
        changes: {
          name: 'Updated Name',
        },
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/test-123`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateDPDA('test-123', request)

      expect(result).toEqual(expectedResponse)
      expect(result.changes).toHaveProperty('name')
      expect(result.changes.name).toBe('Updated Name')
    })

    it('should update DPDA description successfully', async () => {
      const request: UpdateDPDARequest = {
        description: 'New description',
      }

      const expectedResponse: UpdateDPDAResponse = {
        changes: {
          description: 'New description',
        },
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/test-456`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateDPDA('test-456', request)

      expect(result.changes).toHaveProperty('description')
      expect(result.changes.description).toBe('New description')
    })

    it('should update both name and description', async () => {
      const request: UpdateDPDARequest = {
        name: 'New Name',
        description: 'New Description',
      }

      const expectedResponse: UpdateDPDAResponse = {
        changes: {
          name: 'New Name',
          description: 'New Description',
        },
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/test-789`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateDPDA('test-789', request)

      expect(result.changes).toHaveProperty('name')
      expect(result.changes).toHaveProperty('description')
    })

    it('should handle update errors', async () => {
      server.use(
        http.patch(`${API_BASE}/api/dpda/invalid`, () => {
          return HttpResponse.json(
            {
              error: 'DPDA not found',
              detail: 'Cannot update non-existent DPDA',
              status_code: 404,
            },
            { status: 404 }
          )
        })
      )

      await expect(updateDPDA('invalid', { name: 'Test' })).rejects.toThrow()
    })

    it('should return empty changes when no fields updated', async () => {
      const request: UpdateDPDARequest = {}

      const expectedResponse: UpdateDPDAResponse = {
        changes: {},
      }

      server.use(
        http.patch(`${API_BASE}/api/dpda/test-empty`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await updateDPDA('test-empty', request)

      expect(result.changes).toEqual({})
    })
  })
})
