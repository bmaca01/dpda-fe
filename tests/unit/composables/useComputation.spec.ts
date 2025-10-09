import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useComputation } from '@/composables/useComputation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computeString, validateDPDA } from '@/api/endpoints/operations'

// Mock the dependencies
vi.mock('@tanstack/vue-query')
vi.mock('@/api/endpoints/operations')

describe('useComputation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('with dpdaId provided', () => {
    it('should create validateQuery with correct queryKey', () => {
      const mockUseQuery = vi.mocked(useQuery)
      mockUseQuery.mockReturnValue({} as any)

      useComputation('test-dpda-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['dpda', 'test-dpda-1', 'validate'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should create validateQuery that calls validateDPDA', async () => {
      const mockUseQuery = vi.mocked(useQuery)
      let queryFn: any

      mockUseQuery.mockImplementation((config: any) => {
        queryFn = config.queryFn
        return {} as any
      })

      useComputation('test-dpda-1')

      expect(queryFn).toBeDefined()
      await queryFn()

      expect(validateDPDA).toHaveBeenCalledWith('test-dpda-1')
    })

    it('should create computeMutation with correct mutationFn', () => {
      const mockUseMutation = vi.mocked(useMutation)
      mockUseMutation.mockReturnValue({} as any)

      useComputation('test-dpda-1')

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      })
    })

    it('should call computeString with correct dpdaId when mutationFn is called', async () => {
      const mockUseMutation = vi.mocked(useMutation)
      let mutationFn: any

      mockUseMutation.mockImplementation((config: any) => {
        mutationFn = config.mutationFn
        return {} as any
      })

      useComputation('test-dpda-1')

      expect(mutationFn).toBeDefined()
      await mutationFn({ input_string: '001', max_steps: 1000, show_trace: false })

      expect(computeString).toHaveBeenCalledWith('test-dpda-1', {
        input_string: '001',
        max_steps: 1000,
        show_trace: false,
      })
    })

    it('should invalidate queries on successful computation', () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn(),
      }
      vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any)

      const mockUseMutation = vi.mocked(useMutation)
      let onSuccess: any

      mockUseMutation.mockImplementation((config: any) => {
        onSuccess = config.onSuccess
        return {} as any
      })

      useComputation('test-dpda-1')

      expect(onSuccess).toBeDefined()
      onSuccess()

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['dpda', 'test-dpda-1', 'validate'],
      })
    })

    it('should return validateQuery and computeMutation', () => {
      const mockValidateQuery = { data: { is_valid: true } }
      const mockComputeMutation = { mutate: vi.fn() }

      vi.mocked(useQuery).mockReturnValue(mockValidateQuery as any)
      vi.mocked(useMutation).mockReturnValue(mockComputeMutation as any)

      const result = useComputation('test-dpda-1')

      expect(result.validateQuery).toBe(mockValidateQuery)
      expect(result.computeMutation).toBe(mockComputeMutation)
    })
  })

  describe('without dpdaId', () => {
    it('should create disabled validateQuery when no dpdaId', () => {
      const mockUseQuery = vi.mocked(useQuery)
      mockUseQuery.mockReturnValue({} as any)

      useComputation()

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['dpda', undefined, 'validate'],
        queryFn: expect.any(Function),
        enabled: false,
      })
    })

    it('should still create computeMutation when no dpdaId', () => {
      const mockUseMutation = vi.mocked(useMutation)
      mockUseMutation.mockReturnValue({} as any)

      const result = useComputation()

      expect(mockUseMutation).toHaveBeenCalled()
      expect(result.computeMutation).toBeDefined()
    })
  })

  describe('with enabled option', () => {
    it('should accept enabled option and conditionally disable validateQuery', () => {
      const mockUseQuery = vi.mocked(useQuery)
      mockUseQuery.mockReturnValue({} as any)

      useComputation('test-dpda-1', { enabled: false })

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['dpda', 'test-dpda-1', 'validate'],
        queryFn: expect.any(Function),
        enabled: false,
      })
    })

    it('should enable validateQuery when enabled option is true', () => {
      const mockUseQuery = vi.mocked(useQuery)
      mockUseQuery.mockReturnValue({} as any)

      useComputation('test-dpda-1', { enabled: true })

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['dpda', 'test-dpda-1', 'validate'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should maintain backward compatibility when no options provided', () => {
      const mockUseQuery = vi.mocked(useQuery)
      mockUseQuery.mockReturnValue({} as any)

      useComputation('test-dpda-1')

      // Default behavior - should be enabled (true)
      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['dpda', 'test-dpda-1', 'validate'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should override default enabled behavior when explicitly provided', () => {
      const mockUseQuery = vi.mocked(useQuery)
      mockUseQuery.mockReturnValue({} as any)

      // Even with dpdaId, enabled: false should disable the query
      useComputation('test-dpda-1', { enabled: false })

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['dpda', 'test-dpda-1', 'validate'],
        queryFn: expect.any(Function),
        enabled: false,
      })
    })
  })
})
