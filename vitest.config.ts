import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    setupFiles: ['./tests/setup.ts'],

    // Timeouts to prevent hangs
    testTimeout: 10000, // 10s max per test
    hookTimeout: 10000, // 10s max for hooks
    teardownTimeout: 10000, // 10s max for teardown

    // Isolate tests to prevent cross-contamination
    isolate: true,

    // Pool options for better resource management
    pool: 'forks', // Use process forking instead of threads
    poolOptions: {
      forks: {
        singleFork: false, // Allow parallel but isolated
        maxForks: 4, // Limit concurrent forks
      },
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.spec.ts', '**/*.test.ts', '**/dist/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
