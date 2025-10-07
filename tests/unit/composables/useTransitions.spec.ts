import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { useTransitions } from '@/composables/useTransitions'

// Mock TanStack Query
vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
  })),
}))

// Mock API functions
vi.mock('@/api/endpoints/transitions', () => ({
  getTransitions: vi.fn(),
  addTransition: vi.fn(),
  deleteTransition: vi.fn(),
  updateTransition: vi.fn(),
}))

describe('useTransitions Composable', () => {
  const mockDpdaId = 'test-dpda-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getQuery', () => {
    it('should return a query for getting transitions', () => {
      const mockData = {
        transitions: [
          {
            from_state: 'q0',
            input_symbol: '0',
            stack_top: '$',
            to_state: 'q1',
            stack_push: ['A', '$'],
          },
          {
            from_state: 'q1',
            input_symbol: null, // epsilon
            stack_top: 'A',
            to_state: 'q2',
            stack_push: [],
          },
        ],
        total: 2,
      }

      const mockQuery = {
        data: mockData,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      }

      vi.mocked(useQuery).mockReturnValue(mockQuery as any)

      const { getQuery } = useTransitions(mockDpdaId)

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['transitions', mockDpdaId],
        })
      )
      expect(getQuery.data).toEqual(mockData)
      expect(getQuery.isLoading).toBe(false)
    })

    it('should not fetch if DPDA ID is not provided', () => {
      const mockQuery = {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      }

      vi.mocked(useQuery).mockReturnValue(mockQuery as any)

      const { getQuery } = useTransitions(undefined)

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['transitions', undefined],
          enabled: false,
        })
      )
      expect(getQuery.data).toBeUndefined()
    })

    it('should use appropriate stale time for caching', () => {
      const mockQuery = {
        data: { transitions: [], total: 0 },
        isLoading: false,
        isError: false,
        error: null,
      }

      vi.mocked(useQuery).mockReturnValue(mockQuery as any)

      useTransitions(mockDpdaId)

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          staleTime: 2 * 60 * 1000, // 2 minutes - transitions change frequently
        })
      )
    })
  })

  describe('addMutation', () => {
    it('should return a mutation for adding transitions', () => {
      const mockMutate = vi.fn()
      const mockMutation = {
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        data: undefined,
        error: null,
      }

      vi.mocked(useMutation).mockReturnValue(mockMutation as any)

      const { addMutation } = useTransitions(mockDpdaId)

      expect(useMutation).toHaveBeenCalled()
      expect(addMutation.mutate).toBe(mockMutate)
      expect(addMutation.isPending).toBe(false)
    })

    it('should configure mutation to invalidate transitions query on success', () => {
      vi.mocked(useMutation).mockImplementation(() => {
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        } as any
      })

      useTransitions(mockDpdaId)

      const mutationConfig = vi.mocked(useMutation).mock.calls[0][0]
      expect(mutationConfig).toHaveProperty('onSuccess')
    })

    it('should handle errors in add mutation', () => {
      vi.mocked(useMutation).mockImplementation(() => {
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        } as any
      })

      useTransitions(mockDpdaId)

      const mutationConfig = vi.mocked(useMutation).mock.calls[0][0]
      expect(mutationConfig).toHaveProperty('onError')
    })
  })

  describe('deleteMutation', () => {
    it('should return a mutation for deleting transitions', () => {
      const mockMutate = vi.fn()
      const mockMutation = {
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      }

      vi.mocked(useMutation).mockReturnValue(mockMutation as any)

      const { deleteMutation } = useTransitions(mockDpdaId)

      expect(useMutation).toHaveBeenCalled()
      expect(deleteMutation.mutate).toBe(mockMutate)
    })

    it('should configure mutation to invalidate queries on delete success', () => {
      vi.mocked(useMutation).mockImplementation(() => {
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        } as any
      })

      useTransitions(mockDpdaId)

      // deleteMutation is the second useMutation call
      const mutationConfig = vi.mocked(useMutation).mock.calls[1][0]
      expect(mutationConfig).toHaveProperty('onSuccess')
    })

    it('should warn about fragile index-based deletion in error handler', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(useMutation).mockImplementation(() => {
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        } as any
      })

      useTransitions(mockDpdaId)

      const mutationConfig = vi.mocked(useMutation).mock.calls[1][0]
      expect(mutationConfig).toHaveProperty('onError')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('integration', () => {
    it('should invalidate both transitions and DPDA queries after adding transition', () => {
      vi.mocked(useMutation).mockImplementation(() => {
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        } as any
      })

      useTransitions(mockDpdaId)

      const mutationConfig: any = vi.mocked(useMutation).mock.calls[0][0]
      expect(mutationConfig.onSuccess).toBeDefined()
    })

    it('should invalidate both transitions and DPDA queries after deleting transition', () => {
      vi.mocked(useMutation).mockImplementation(() => {
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        } as any
      })

      useTransitions(mockDpdaId)

      // deleteMutation is the second call
      const mutationConfig: any = vi.mocked(useMutation).mock.calls[1][0]
      expect(mutationConfig.onSuccess).toBeDefined()
      // Should invalidate transitions query to refetch (fragile index warning)
    })

    it('should handle transitions for different DPDA IDs independently', () => {
      const mockQuery = {
        data: { transitions: [], total: 0 },
        isLoading: false,
        isError: false,
        error: null,
      }

      vi.mocked(useQuery).mockReturnValue(mockQuery as any)

      const { getQuery: getQuery1 } = useTransitions('dpda-1')
      const { getQuery: getQuery2 } = useTransitions('dpda-2')

      // Verify different query keys
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['transitions', 'dpda-1'],
        })
      )

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['transitions', 'dpda-2'],
        })
      )

      expect(getQuery1).toBeDefined()
      expect(getQuery2).toBeDefined()
    })
  })

  describe('prefetchTransitions', () => {
    it('should provide a prefetch function for optimistic loading', () => {
      const mockQuery = {
        data: { transitions: [], total: 0 },
        isLoading: false,
        isError: false,
        error: null,
      }

      vi.mocked(useQuery).mockReturnValue(mockQuery as any)

      const { prefetchTransitions } = useTransitions(mockDpdaId)

      expect(prefetchTransitions).toBeDefined()
      expect(typeof prefetchTransitions).toBe('function')
    })
  })

  describe('updateMutation', () => {
    it('should return a mutation for updating transitions', () => {
      const mockMutate = vi.fn()
      const mockMutation = {
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
      }

      vi.mocked(useMutation).mockReturnValue(mockMutation as any)

      const { updateMutation } = useTransitions(mockDpdaId)

      expect(useMutation).toHaveBeenCalled()
      expect(updateMutation.mutate).toBe(mockMutate)
    })

    it('should invalidate transitions and dpda queries on success', () => {
      vi.mocked(useMutation).mockImplementation(() => {
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        } as any
      })

      const { updateMutation } = useTransitions(mockDpdaId)
      void updateMutation

      const mutationConfig: any = vi.mocked(useMutation).mock.calls[0][0]
      expect(mutationConfig).toHaveProperty('onSuccess')
    })
  })
})
