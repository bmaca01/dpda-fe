import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { computeString, validateDPDA, exportDPDA, visualizeDPDA } from '@/api/endpoints/operations'
import type {
  ComputeRequest,
  ComputeResponse,
  ValidationResponse,
  ExportResponse,
  VisualizationResponse,
} from '@/api/types'

// Mock server for API testing
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Operation API Endpoints', () => {
  const API_BASE = 'http://localhost:8000'

  describe('computeString', () => {
    it('should compute an accepted string', async () => {
      const dpdaId = 'test-123'
      const request: ComputeRequest = {
        input_string: '0011',
        max_steps: 10000,
        show_trace: false,
      }

      const expectedResponse: ComputeResponse = {
        accepted: true,
        final_state: 'q2',
        final_stack: ['$'],
        steps_taken: 5,
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/compute`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await computeString(dpdaId, request)
      expect(result).toEqual(expectedResponse)
      expect(result.accepted).toBe(true)
      expect(result.final_state).toBe('q2')
      expect(result.steps_taken).toBe(5)
    })

    it('should compute a rejected string with reason', async () => {
      const dpdaId = 'test-456'
      const request: ComputeRequest = {
        input_string: '001',
        show_trace: false,
      }

      const expectedResponse: ComputeResponse = {
        accepted: false,
        final_state: 'q1',
        final_stack: ['A', '$'],
        steps_taken: 3,
        reason: 'No valid transition from state q1 on input 1 with stack top A',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/compute`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await computeString(dpdaId, request)
      expect(result.accepted).toBe(false)
      expect(result.reason).toBeDefined()
      expect(result.reason).toContain('No valid transition')
    })

    it('should compute with trace enabled', async () => {
      const dpdaId = 'test-789'
      const request: ComputeRequest = {
        input_string: '01',
        show_trace: true,
      }

      const expectedResponse: ComputeResponse = {
        accepted: true,
        final_state: 'q2',
        final_stack: ['$'],
        steps_taken: 3,
        trace: [
          { state: 'q0', input: '01', stack: ['$'] },
          { state: 'q1', input: '1', stack: ['A', '$'] },
          { state: 'q2', input: '', stack: ['$'] },
        ],
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/compute`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await computeString(dpdaId, request)
      expect(result.trace).toBeDefined()
      expect(result.trace).toHaveLength(3)
      expect(result.trace?.[0].state).toBe('q0')
      expect(result.trace?.[2].input).toBe('')
    })

    it('should handle empty string computation', async () => {
      const dpdaId = 'test-empty'
      const request: ComputeRequest = {
        input_string: '', // Empty string
        show_trace: false,
      }

      const expectedResponse: ComputeResponse = {
        accepted: true,
        final_state: 'q0',
        final_stack: ['$'],
        steps_taken: 0,
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/compute`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await computeString(dpdaId, request)
      expect(result.accepted).toBe(true)
      expect(result.steps_taken).toBe(0)
    })

    it('should handle max steps exceeded', async () => {
      const dpdaId = 'test-loop'
      const request: ComputeRequest = {
        input_string: '000111',
        max_steps: 100,
        show_trace: false,
      }

      const expectedResponse: ComputeResponse = {
        accepted: false,
        final_state: 'q1',
        final_stack: ['A', 'A', 'A', '$'],
        steps_taken: 100,
        reason: 'Maximum steps (100) exceeded - possible infinite loop',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/compute`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await computeString(dpdaId, request)
      expect(result.accepted).toBe(false)
      expect(result.steps_taken).toBe(100)
      expect(result.reason).toContain('Maximum steps')
    })
  })

  describe('validateDPDA', () => {
    it('should validate a deterministic DPDA', async () => {
      const dpdaId = 'test-123'

      const expectedResponse: ValidationResponse = {
        is_valid: true,
        violations: [],
        message: 'DPDA is deterministic and valid',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/validate`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await validateDPDA(dpdaId)
      expect(result).toEqual(expectedResponse)
      expect(result.is_valid).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should detect non-deterministic transitions', async () => {
      const dpdaId = 'test-nondet'

      const expectedResponse: ValidationResponse = {
        is_valid: false,
        violations: [
          {
            type: 'non-deterministic',
            description: 'Multiple transitions from state q0 on input 0 with stack top $',
          },
          {
            type: 'non-deterministic',
            description: 'Multiple epsilon transitions from state q1 with stack top A',
          },
        ],
        message: 'DPDA has 2 determinism violations',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/validate`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await validateDPDA(dpdaId)
      expect(result.is_valid).toBe(false)
      expect(result.violations).toHaveLength(2)
      expect(result.violations[0].type).toBe('non-deterministic')
    })

    it('should detect incomplete configuration', async () => {
      const dpdaId = 'test-incomplete'

      const expectedResponse: ValidationResponse = {
        is_valid: false,
        violations: [
          {
            type: 'incomplete',
            description: 'No states defined',
          },
        ],
        message: 'DPDA configuration is incomplete',
      }

      server.use(
        http.post(`${API_BASE}/api/dpda/${dpdaId}/validate`, () => {
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await validateDPDA(dpdaId)
      expect(result.is_valid).toBe(false)
      expect(result.violations[0].type).toBe('incomplete')
    })
  })

  describe('exportDPDA', () => {
    it('should export DPDA as JSON', async () => {
      const dpdaId = 'test-123'

      const expectedResponse: ExportResponse = {
        format: 'json',
        data: JSON.stringify({
          name: 'Test DPDA',
          states: ['q0', 'q1', 'q2'],
          initial_state: 'q0',
          accept_states: ['q2'],
          input_alphabet: ['0', '1'],
          stack_alphabet: ['$', 'A'],
          initial_stack_symbol: '$',
          transitions: [
            {
              from: 'q0',
              input: '0',
              stack_top: '$',
              to: 'q1',
              stack_push: ['A', '$'],
            },
          ],
        }),
      }

      server.use(
        http.get(`${API_BASE}/api/dpda/${dpdaId}/export`, ({ request }) => {
          const url = new URL(request.url)
          const format = url.searchParams.get('format')
          expect(format).toBe('json')
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await exportDPDA(dpdaId, 'json')
      expect(result.format).toBe('json')
      expect(result.data).toBeDefined()
      const parsed = JSON.parse(result.data)
      expect(parsed.name).toBe('Test DPDA')
    })

    it('should handle DPDA not found', async () => {
      const dpdaId = 'nonexistent'

      server.use(
        http.get(`${API_BASE}/api/dpda/${dpdaId}/export`, () => {
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

      await expect(exportDPDA(dpdaId, 'json')).rejects.toThrow()
    })
  })

  describe('visualizeDPDA', () => {
    it('should get Cytoscape visualization data', async () => {
      const dpdaId = 'test-123'

      const expectedResponse: VisualizationResponse = {
        format: 'cytoscape',
        data: {
          elements: {
            nodes: [
              { data: { id: 'q0', label: 'q0 (initial)' } },
              { data: { id: 'q1', label: 'q1' } },
              { data: { id: 'q2', label: 'q2 (accept)' } },
            ],
            edges: [
              {
                data: {
                  id: 'e1',
                  source: 'q0',
                  target: 'q1',
                  label: '0, $ → A$',
                },
              },
              {
                data: {
                  id: 'e2',
                  source: 'q1',
                  target: 'q2',
                  label: '1, A → ε',
                },
              },
            ],
          },
        },
      }

      server.use(
        http.get(`${API_BASE}/api/dpda/${dpdaId}/visualize`, ({ request }) => {
          const url = new URL(request.url)
          const format = url.searchParams.get('format')
          expect(format).toBe('cytoscape')
          return HttpResponse.json(expectedResponse)
        })
      )

      const result = await visualizeDPDA(dpdaId, 'cytoscape')
      expect(result.format).toBe('cytoscape')
      expect(result.data).toBeDefined()
      expect(result.data.elements.nodes).toHaveLength(3)
      expect(result.data.elements.edges).toHaveLength(2)
    })

    it('should handle incomplete DPDA visualization', async () => {
      const dpdaId = 'test-incomplete'

      server.use(
        http.get(`${API_BASE}/api/dpda/${dpdaId}/visualize`, () => {
          return HttpResponse.json(
            {
              error: 'Cannot visualize',
              detail: 'DPDA must have states defined to visualize',
              status_code: 400,
            },
            { status: 400 }
          )
        })
      )

      await expect(visualizeDPDA(dpdaId, 'cytoscape')).rejects.toThrow()
    })
  })
})
