import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getSessionId, resetSession, importSession, getCurrentSessionId } from '@/lib/session'

describe('Session Management', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('getSessionId', () => {
    it('should generate new UUID on first call when localStorage empty', () => {
      const sessionId = getSessionId()

      expect(sessionId).toBeTruthy()
      expect(typeof sessionId).toBe('string')
      expect(sessionId.length).toBeGreaterThan(0)
    })

    it('should return valid UUIDv4 format', () => {
      const sessionId = getSessionId()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      expect(sessionId).toMatch(uuidRegex)
    })

    it('should persist session ID to localStorage with key "dpda-session-id"', () => {
      const sessionId = getSessionId()

      expect(localStorage.getItem('dpda-session-id')).toBe(sessionId)
    })

    it('should return same session ID on subsequent calls', () => {
      const firstCall = getSessionId()
      const secondCall = getSessionId()
      const thirdCall = getSessionId()

      expect(firstCall).toBe(secondCall)
      expect(secondCall).toBe(thirdCall)
    })

    it('should not generate new ID if one already exists', () => {
      const existingId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
      localStorage.setItem('dpda-session-id', existingId)

      const sessionId = getSessionId()

      expect(sessionId).toBe(existingId)
    })
  })

  describe('resetSession', () => {
    it('should generate new UUID different from previous', () => {
      const originalId = getSessionId()
      const newId = resetSession()

      expect(newId).not.toBe(originalId)
      expect(newId).toBeTruthy()
    })

    it('should update localStorage with new ID', () => {
      const originalId = getSessionId()
      const newId = resetSession()

      expect(localStorage.getItem('dpda-session-id')).toBe(newId)
      expect(localStorage.getItem('dpda-session-id')).not.toBe(originalId)
    })

    it('should return the new session ID', () => {
      const newId = resetSession()
      const storedId = localStorage.getItem('dpda-session-id')

      expect(newId).toBe(storedId)
    })

    it('should maintain valid UUIDv4 format', () => {
      const newId = resetSession()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      expect(newId).toMatch(uuidRegex)
    })
  })

  describe('importSession', () => {
    it('should accept valid UUID and store in localStorage', () => {
      const validId = '550e8400-e29b-41d4-a716-446655440000'

      importSession(validId)

      expect(localStorage.getItem('dpda-session-id')).toBe(validId)
    })

    it('should throw error for invalid UUID format', () => {
      const invalidId = 'not-a-valid-uuid'

      expect(() => importSession(invalidId)).toThrow('Invalid session ID format')
    })

    it('should throw error for empty string', () => {
      expect(() => importSession('')).toThrow('Invalid session ID format')
    })

    it('should throw error for malformed UUID', () => {
      const malformedId = '550e8400-e29b-41d4-a716-44665544000' // Missing one character

      expect(() => importSession(malformedId)).toThrow('Invalid session ID format')
    })

    it('should update localStorage with imported ID', () => {
      const existingId = getSessionId()
      const newId = '12345678-1234-4234-8234-123456789abc'

      importSession(newId)

      expect(localStorage.getItem('dpda-session-id')).toBe(newId)
      expect(localStorage.getItem('dpda-session-id')).not.toBe(existingId)
    })

    it('should make getSessionId return imported ID', () => {
      const importedId = '11111111-2222-4333-8444-555555555555'

      importSession(importedId)
      const retrievedId = getSessionId()

      expect(retrievedId).toBe(importedId)
    })
  })

  describe('getCurrentSessionId', () => {
    it('should return null when no session exists', () => {
      const sessionId = getCurrentSessionId()

      expect(sessionId).toBeNull()
    })

    it('should return existing session ID without creating one', () => {
      const existingId = '99999999-8888-4777-8666-555555555555'
      localStorage.setItem('dpda-session-id', existingId)

      const sessionId = getCurrentSessionId()

      expect(sessionId).toBe(existingId)
    })

    it('should not modify localStorage', () => {
      const beforeCall = localStorage.length

      getCurrentSessionId()

      const afterCall = localStorage.length
      expect(afterCall).toBe(beforeCall)
    })
  })

  describe('edge cases', () => {
    it('should handle localStorage being unavailable (private browsing)', () => {
      // Mock localStorage.getItem to throw error
      const originalGetItem = Storage.prototype.getItem
      const originalSetItem = Storage.prototype.setItem

      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage is not available')
      })

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage is not available')
      })

      // Should not throw, should fallback gracefully
      expect(() => getSessionId()).not.toThrow()

      // Restore original methods
      Storage.prototype.getItem = originalGetItem
      Storage.prototype.setItem = originalSetItem
    })

    it('should handle localStorage quota exceeded', () => {
      const originalSetItem = Storage.prototype.setItem

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      // Should not throw
      expect(() => resetSession()).not.toThrow()

      Storage.prototype.setItem = originalSetItem
    })

    it('should handle concurrent access', () => {
      // Multiple calls in rapid succession should all return same ID
      const ids = [getSessionId(), getSessionId(), getSessionId(), getSessionId(), getSessionId()]

      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(1)
    })
  })
})
