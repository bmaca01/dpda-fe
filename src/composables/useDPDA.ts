/**
 * Composable for DPDA CRUD operations
 * Uses TanStack Query for data fetching and caching
 */

import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { createDPDA, listDPDAs, getDPDA, deleteDPDA, updateDPDA } from '@/api/endpoints/dpda'
import type {
  CreateDPDARequest,
  CreateDPDAResponse,
  ListDPDAsResponse,
  DPDAInfoResponse,
  UpdateDPDARequest,
  UpdateDPDAResponse,
} from '@/api/types'

export function useDPDA(id?: string | undefined) {
  const queryClient = useQueryClient()

  /**
   * Create a new DPDA mutation
   */
  const createMutation = useMutation({
    mutationFn: (request: CreateDPDARequest) => createDPDA(request),
    onSuccess: (data: CreateDPDAResponse) => {
      // Invalidate the list query to refetch
      queryClient.invalidateQueries({ queryKey: ['dpdas'] })
      // Optionally, prefetch the new DPDA data
      queryClient.setQueryData(['dpda', data.id], data)
    },
    onError: (error) => {
      console.error('Failed to create DPDA:', error)
    },
  })

  /**
   * List all DPDAs query
   */
  const listQuery = useQuery<ListDPDAsResponse, Error>({
    queryKey: ['dpdas'],
    queryFn: listDPDAs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })

  /**
   * Get a specific DPDA by ID query
   */
  const getQuery = useQuery<DPDAInfoResponse, Error>({
    queryKey: ['dpda', id],
    queryFn: () => getDPDA(id!),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  /**
   * Computed property to determine if DPDA can be validated
   * Requires states and both alphabets to be configured
   */
  const canValidate = computed(() => {
    const dpda = getQuery.data.value
    if (!dpda) return false

    // Require states and alphabets to be configured before attempting validation
    // Explicitly convert to boolean to ensure we return true/false, not undefined
    const hasConfig = !!(
      dpda.states &&
      dpda.states.length > 0 &&
      dpda.input_alphabet &&
      dpda.input_alphabet.length > 0 &&
      dpda.stack_alphabet &&
      dpda.stack_alphabet.length > 0
    )

    return hasConfig
  })

  /**
   * Delete a DPDA mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDPDA(id),
    onSuccess: (_, deletedId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['dpdas'] })
      queryClient.invalidateQueries({ queryKey: ['dpda', deletedId] })
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['dpda', deletedId] })
    },
    onError: (error) => {
      console.error('Failed to delete DPDA:', error)
    },
  })

  /**
   * Prefetch a DPDA (useful for hover/preload)
   */
  const prefetchDPDA = async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['dpda', id],
      queryFn: () => getDPDA(id),
      staleTime: 5 * 60 * 1000,
    })
  }

  /**
   * Update DPDA metadata (name/description) mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateDPDARequest }) =>
      updateDPDA(id, request),
    onSuccess: (_data: UpdateDPDAResponse, variables) => {
      // Invalidate to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['dpda', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dpdas'] })
    },
    onError: (error) => {
      console.error('Failed to update DPDA:', error)
    },
  })

  /**
   * Invalidate all DPDA-related queries
   */
  const invalidateAllDPDAs = () => {
    queryClient.invalidateQueries({ queryKey: ['dpdas'] })
    queryClient.invalidateQueries({ queryKey: ['dpda'] })
  }

  return {
    createMutation,
    listQuery,
    getQuery,
    deleteMutation,
    updateMutation,
    prefetchDPDA,
    invalidateAllDPDAs,
    canValidate,
  }
}
