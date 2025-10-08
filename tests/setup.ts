/**
 * Global test setup file
 * Runs before all tests to configure test environment and cleanup
 */

import { afterEach, vi } from 'vitest'
import { config } from '@vue/test-utils'

// Global cleanup after each test
afterEach(() => {
  // Cleanup Vue Test Utils global config
  config.global.plugins = []
  config.global.mocks = {}
  config.global.stubs = {}
  config.global.provide = {}

  // Clear all timers
  vi.clearAllTimers()

  // Clear all mocks
  vi.clearAllMocks()
})
