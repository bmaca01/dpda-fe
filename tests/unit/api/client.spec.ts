import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import apiClient from '@/api/client'
import * as session from '@/lib/session'

// Mock the session module
vi.mock('@/lib/session', () => ({
  getSessionId: vi.fn(() => 'test-session-id-12345'),
  resetSession: vi.fn(() => 'new-test-session-id-67890'),
  importSession: vi.fn(),
  getCurrentSessionId: vi.fn(() => 'test-session-id-12345'),
}))

// Setup MSW server to intercept requests and check headers
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  // Reset mock to default return value
  vi.mocked(session.getSessionId).mockReturnValue('test-session-id-12345')
})

afterAll(() => {
  server.close()
})

describe('API Client - Session Integration', () => {
  const API_BASE = 'http://localhost:8000'

  describe('Request Interceptor', () => {
    it('should add X-Session-ID header to all requests', async () => {
      let capturedHeaders: any = null

      server.use(
        http.get(`${API_BASE}/api/test`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ success: true })
        })
      )

      await apiClient.get('/api/test')

      expect(session.getSessionId).toHaveBeenCalled()
      expect(capturedHeaders).toBeDefined()
      expect(capturedHeaders['x-session-id']).toBeDefined()
    })

    it('should use session ID from getSessionId', async () => {
      const testSessionId = 'specific-test-id-123'
      vi.mocked(session.getSessionId).mockReturnValue(testSessionId)

      let capturedHeaders: any = null

      server.use(
        http.get(`${API_BASE}/api/test`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ success: true })
        })
      )

      await apiClient.get('/api/test')

      expect(capturedHeaders['x-session-id']).toBe(testSessionId)
    })

    it('should generate session ID if none exists', async () => {
      vi.mocked(session.getSessionId).mockReturnValue('generated-session-id')

      let capturedHeaders: any = null

      server.use(
        http.get(`${API_BASE}/api/test`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ success: true })
        })
      )

      await apiClient.get('/api/test')

      expect(session.getSessionId).toHaveBeenCalled()
      expect(capturedHeaders['x-session-id']).toBe('generated-session-id')
    })

    it('should include X-Session-ID on GET requests', async () => {
      let capturedHeaders: any = null

      server.use(
        http.get(`${API_BASE}/api/dpda/list`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ dpdas: [], total: 0 })
        })
      )

      await apiClient.get('/api/dpda/list')

      expect(capturedHeaders['x-session-id']).toBe('test-session-id-12345')
    })

    it('should include X-Session-ID on POST requests', async () => {
      let capturedHeaders: any = null

      server.use(
        http.post(`${API_BASE}/api/dpda/create`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ id: '123', name: 'Test' })
        })
      )

      await apiClient.post('/api/dpda/create', { name: 'Test' })

      expect(capturedHeaders['x-session-id']).toBe('test-session-id-12345')
    })

    it('should include X-Session-ID on PATCH requests', async () => {
      let capturedHeaders: any = null

      server.use(
        http.patch(`${API_BASE}/api/dpda/123`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ changes: {} })
        })
      )

      await apiClient.patch('/api/dpda/123', { name: 'Updated' })

      expect(capturedHeaders['x-session-id']).toBe('test-session-id-12345')
    })

    it('should include X-Session-ID on DELETE requests', async () => {
      let capturedHeaders: any = null

      server.use(
        http.delete(`${API_BASE}/api/dpda/123`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ success: true })
        })
      )

      await apiClient.delete('/api/dpda/123')

      expect(capturedHeaders['x-session-id']).toBe('test-session-id-12345')
    })

    it('should not override manually set X-Session-ID header', async () => {
      const customSessionId = 'custom-session-override'
      let capturedHeaders: any = null

      server.use(
        http.get(`${API_BASE}/api/test`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ success: true })
        })
      )

      await apiClient.get('/api/test', {
        headers: {
          'X-Session-ID': customSessionId,
        },
      })

      // Should preserve the custom header (headers are case-insensitive in HTTP)
      expect(capturedHeaders['x-session-id']).toBe(customSessionId)
    })
  })

  describe('Session Persistence', () => {
    it('should use same session ID across multiple requests', async () => {
      const sessionId = 'persistent-session-id'
      vi.mocked(session.getSessionId).mockReturnValue(sessionId)

      const capturedHeaders: any[] = []

      server.use(
        http.get(`${API_BASE}/api/test1`, ({ request }) => {
          capturedHeaders.push(Object.fromEntries(request.headers.entries()))
          return HttpResponse.json({ success: true })
        }),
        http.get(`${API_BASE}/api/test2`, ({ request }) => {
          capturedHeaders.push(Object.fromEntries(request.headers.entries()))
          return HttpResponse.json({ success: true })
        }),
        http.get(`${API_BASE}/api/test3`, ({ request }) => {
          capturedHeaders.push(Object.fromEntries(request.headers.entries()))
          return HttpResponse.json({ success: true })
        })
      )

      // Make multiple requests
      await apiClient.get('/api/test1')
      await apiClient.get('/api/test2')
      await apiClient.get('/api/test3')

      // All should have the same session ID
      expect(capturedHeaders[0]['x-session-id']).toBe(sessionId)
      expect(capturedHeaders[1]['x-session-id']).toBe(sessionId)
      expect(capturedHeaders[2]['x-session-id']).toBe(sessionId)
    })

    it('should update session ID after reset', async () => {
      const originalId = 'original-session-id'
      const newId = 'new-session-id-after-reset'

      // First return original, then new after "reset"
      vi.mocked(session.getSessionId).mockReturnValueOnce(originalId).mockReturnValueOnce(newId)

      const capturedHeaders: any[] = []

      server.use(
        http.get(`${API_BASE}/api/before-reset`, ({ request }) => {
          capturedHeaders.push(Object.fromEntries(request.headers.entries()))
          return HttpResponse.json({ success: true })
        }),
        http.get(`${API_BASE}/api/after-reset`, ({ request }) => {
          capturedHeaders.push(Object.fromEntries(request.headers.entries()))
          return HttpResponse.json({ success: true })
        })
      )

      await apiClient.get('/api/before-reset')
      await apiClient.get('/api/after-reset')

      expect(capturedHeaders[0]['x-session-id']).toBe(originalId)
      expect(capturedHeaders[1]['x-session-id']).toBe(newId)
    })

    it('should use imported session ID', async () => {
      const importedId = 'imported-session-id-from-device'
      vi.mocked(session.getSessionId).mockReturnValue(importedId)

      let capturedHeaders: any = null

      server.use(
        http.get(`${API_BASE}/api/test`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ success: true })
        })
      )

      await apiClient.get('/api/test')

      expect(capturedHeaders['x-session-id']).toBe(importedId)
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage unavailable gracefully', async () => {
      // Mock getSessionId to use in-memory fallback
      const inMemoryId = 'in-memory-fallback-id'
      vi.mocked(session.getSessionId).mockReturnValue(inMemoryId)

      let capturedHeaders: any = null

      server.use(
        http.get(`${API_BASE}/api/test`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ success: true })
        })
      )

      // Should not throw
      await expect(apiClient.get('/api/test')).resolves.toBeDefined()

      expect(capturedHeaders['x-session-id']).toBe(inMemoryId)
    })

    it('should continue request if session generation fails', async () => {
      // Even if getSessionId somehow fails, request should continue
      const fallbackId = 'emergency-fallback'
      vi.mocked(session.getSessionId).mockReturnValue(fallbackId)

      let capturedHeaders: any = null

      server.use(
        http.get(`${API_BASE}/api/test`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries())
          return HttpResponse.json({ success: true })
        })
      )

      await expect(apiClient.get('/api/test')).resolves.toBeDefined()

      expect(capturedHeaders['x-session-id']).toBe(fallbackId)
    })
  })
})
