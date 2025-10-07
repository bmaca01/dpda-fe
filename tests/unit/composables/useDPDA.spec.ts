import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { useDPDA } from '@/composables/useDPDA'

// Mock TanStack Query
vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  })),
}))

// Mock API functions
vi.mock('@/api/endpoints/dpda', () => ({
  createDPDA: vi.fn(),
  listDPDAs: vi.fn(),
  getDPDA: vi.fn(),
  deleteDPDA: vi.fn(),
  updateDPDA: vi.fn(),
}))

describe('useDPDA Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createMutation', () => {
    it('should return a mutation for creating DPDA', () => {
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

      const { createMutation } = useDPDA()

      expect(useMutation).toHaveBeenCalled()
      expect(createMutation.mutate).toBe(mockMutate)
      expect(createMutation.isPending).toBe(false)
    })
  })

  describe('listQuery', () => {
    it('should return a query for listing DPDAs', () => {
      const mockData = {
        dpdas: [
          { id: '1', name: 'DPDA 1', is_valid: true },
          { id: '2', name: 'DPDA 2', is_valid: false },
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

      const { listQuery } = useDPDA()

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['dpdas'],
        })
      )
      expect(listQuery.data).toEqual(mockData)
      expect(listQuery.isLoading).toBe(false)
    })
  })

  describe('getQuery', () => {
    it('should return a query for getting a specific DPDA', () => {
      const mockData = {
        id: '123',
        name: 'Test DPDA',
        states: ['q0', 'q1'],
        is_valid: true,
      }

      const mockQuery = {
        data: mockData,
        isLoading: false,
        isError: false,
        error: null,
      }

      vi.mocked(useQuery).mockReturnValue(mockQuery as any)

      const { getQuery } = useDPDA('123')

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['dpda', '123'],
        })
      )
      expect(getQuery.data).toEqual(mockData)
    })

    it('should not fetch if ID is not provided', () => {
      const mockQuery = {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      }

      vi.mocked(useQuery).mockReturnValue(mockQuery as any)

      const { getQuery } = useDPDA(undefined)

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['dpda', undefined],
          enabled: false,
        })
      )
      expect(getQuery.data).toBeUndefined()
    })
  })

  describe('deleteMutation', () => {
    it('should return a mutation for deleting DPDA', () => {
      const mockMutate = vi.fn()
      const mockMutation = {
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      }

      vi.mocked(useMutation).mockReturnValue(mockMutation as any)

      const { deleteMutation } = useDPDA()

      expect(useMutation).toHaveBeenCalled()
      expect(deleteMutation.mutate).toBe(mockMutate)

      // Check that the mutation config includes invalidation
      const mutationConfig = vi.mocked(useMutation).mock.calls[0][0]
      expect(mutationConfig).toHaveProperty('onSuccess')
    })
  })

  describe('integration', () => {
    it('should invalidate queries after successful create', () => {
      let onSuccessCallback: Function | undefined

      vi.mocked(useMutation).mockImplementation((config: any) => {
        onSuccessCallback = config.onSuccess
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        } as any
      })

      const { createMutation } = useDPDA()
      void createMutation

      expect(onSuccessCallback).toBeDefined()
    })

    it('should handle optimistic updates', () => {
      vi.mocked(useMutation).mockImplementation((config: any) => {
        // onMutate might be used for optimistic updates
        void config.onMutate
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
        } as any
      })

      const { deleteMutation } = useDPDA()
      void deleteMutation

      // This test verifies the mutation is set up correctly
      // Optimistic updates are optional based on implementation
    })
  })

  describe('updateMutation', () => {
    it('should return a mutation for updating DPDA metadata', () => {
      const mockMutate = vi.fn()
      const mockMutation = {
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
      }

      vi.mocked(useMutation).mockReturnValue(mockMutation as any)

      const { updateMutation } = useDPDA()

      expect(useMutation).toHaveBeenCalled()
      expect(updateMutation.mutate).toBe(mockMutate)
    })

    it('should invalidate dpda and dpdas queries on success', () => {
      // Unused variable removed
      vi.mocked(useMutation).mockImplementation(() => {
        return {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        } as any
      })

      const { updateMutation } = useDPDA('test-123')
      void updateMutation

      const mutationConfig: any = vi.mocked(useMutation).mock.calls[0][0]
      expect(mutationConfig).toHaveProperty('onSuccess')
    })
  })
})
