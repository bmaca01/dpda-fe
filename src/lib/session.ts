/**
 * Session Management Utilities
 * Manages anonymous session IDs for DPDA persistence without authentication
 */

const SESSION_KEY = 'dpda-session-id'

// In-memory fallback for when localStorage is unavailable (private browsing)
let inMemorySessionId: string | null = null

/**
 * Get or generate a session ID.
 * Automatically creates a new UUID on first visit and stores it in localStorage.
 * Falls back to in-memory storage if localStorage is unavailable.
 *
 * @returns The current session ID (UUID v4)
 */
export function getSessionId(): string {
  try {
    let sessionId = localStorage.getItem(SESSION_KEY)

    if (!sessionId) {
      // Generate new UUID using Web Crypto API
      sessionId = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, sessionId)
      console.log('Generated new session ID:', sessionId)
    }

    return sessionId
  } catch (error) {
    // localStorage unavailable (private browsing, quota exceeded, etc.)
    console.warn('localStorage unavailable, using in-memory session:', error)

    if (!inMemorySessionId) {
      inMemorySessionId = crypto.randomUUID()
      console.log('Generated in-memory session ID:', inMemorySessionId)
    }

    return inMemorySessionId
  }
}

/**
 * Reset the session (generate new ID).
 * Useful for "New Session" button or starting fresh.
 * Falls back to in-memory storage if localStorage is unavailable.
 *
 * @returns The new session ID
 */
export function resetSession(): string {
  try {
    const newId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, newId)
    console.log('Reset to new session ID:', newId)
    return newId
  } catch (error) {
    // localStorage unavailable
    console.warn('localStorage unavailable, resetting in-memory session:', error)
    inMemorySessionId = crypto.randomUUID()
    console.log('Reset in-memory session ID:', inMemorySessionId)
    return inMemorySessionId
  }
}

/**
 * Import an existing session ID.
 * Useful for syncing across devices by copying session ID.
 *
 * @param sessionId - The session ID to import (must be valid UUID)
 * @throws Error if session ID format is invalid
 */
export function importSession(sessionId: string): void {
  // Validate UUID format (v4 or any valid UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(sessionId)) {
    throw new Error('Invalid session ID format. Must be a valid UUID.')
  }

  try {
    localStorage.setItem(SESSION_KEY, sessionId)
    console.log('Imported session ID:', sessionId)
  } catch (error) {
    // localStorage unavailable
    console.warn('localStorage unavailable, setting in-memory session:', error)
    inMemorySessionId = sessionId
    console.log('Imported in-memory session ID:', sessionId)
  }
}

/**
 * Get current session ID without creating one.
 * Returns null if no session exists.
 *
 * @returns The current session ID or null
 */
export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch (error) {
    // localStorage unavailable
    console.warn('localStorage unavailable, returning in-memory session:', error)
    return inMemorySessionId
  }
}
