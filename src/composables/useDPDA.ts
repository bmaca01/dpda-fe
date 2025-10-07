/**
 * Composable for DPDA CRUD operations
 * Uses TanStack Query for data fetching and caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { createDPDA, listDPDAs, getDPDA, deleteDPDA } from '@/api/endpoints/dpda'
import type {
  CreateDPDARequest,
  CreateDPDAResponse,
  ListDPDAsResponse,
  DPDAInfoResponse,
} from '@/api/types'

export function useDPDA() {
  const queryClient = useQueryClient()

  /**
   * Create a new DPDA
   */
  const useCreateDPDA = () => {
    return useMutation({
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
  }

  /**
   * List all DPDAs
   */
  const useListDPDAs = () => {
    return useQuery<ListDPDAsResponse, Error>({
      queryKey: ['dpdas'],
      queryFn: listDPDAs,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    })
  }

  /**
   * Get a specific DPDA by ID
   */
  const useGetDPDA = (id: string | undefined) => {
    return useQuery<DPDAInfoResponse, Error>({
      queryKey: ['dpda', id],
      queryFn: () => getDPDA(id!),
      enabled: !!id, // Only fetch if ID is provided
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  /**
   * Delete a DPDA
   */
  const useDeleteDPDA = () => {
    return useMutation({
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
  }

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
   * Invalidate all DPDA-related queries
   */
  const invalidateAllDPDAs = () => {
    queryClient.invalidateQueries({ queryKey: ['dpdas'] })
    queryClient.invalidateQueries({ queryKey: ['dpda'] })
  }

  return {
    useCreateDPDA,
    useListDPDAs,
    useGetDPDA,
    useDeleteDPDA,
    prefetchDPDA,
    invalidateAllDPDAs,
  }
}
