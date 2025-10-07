/**
 * Composable for DPDA Transition operations
 * Uses TanStack Query for data fetching and caching
 *
 * WARNING: Backend uses fragile index-based deletion - always refetch after delete
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  getTransitions,
  addTransition,
  deleteTransition,
  updateTransition,
  type TransitionsResponse,
} from '@/api/endpoints/transitions'
import type { AddTransitionRequest, UpdateTransitionRequest, UpdateTransitionResponse } from '@/api/types'

export function useTransitions(dpdaId?: string | undefined) {
  const queryClient = useQueryClient()

  /**
   * Get all transitions for a DPDA
   */
  const getQuery = useQuery<TransitionsResponse, Error>({
    queryKey: ['transitions', dpdaId],
    queryFn: () => getTransitions(dpdaId!),
    enabled: !!dpdaId, // Only fetch if DPDA ID is provided
    staleTime: 2 * 60 * 1000, // 2 minutes - transitions change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  /**
   * Add a transition to a DPDA
   */
  const addMutation = useMutation({
    mutationFn: (request: AddTransitionRequest) => addTransition(dpdaId!, request),
    onSuccess: () => {
      // Invalidate transitions query to refetch
      queryClient.invalidateQueries({ queryKey: ['transitions', dpdaId] })
      // Also invalidate DPDA query as validity status may change
      queryClient.invalidateQueries({ queryKey: ['dpda', dpdaId] })
      queryClient.invalidateQueries({ queryKey: ['dpdas'] })
    },
    onError: (error) => {
      console.error('Failed to add transition:', error)
    },
  })

  /**
   * Delete a transition by index
   * WARNING: Index-based deletion is fragile! Transitions are refetched after deletion.
   */
  const deleteMutation = useMutation({
    mutationFn: (index: number) => deleteTransition(dpdaId!, index),
    onSuccess: () => {
      // CRITICAL: Refetch transitions immediately due to fragile index-based deletion
      queryClient.invalidateQueries({ queryKey: ['transitions', dpdaId] })
      // Also invalidate DPDA query as validity status may change
      queryClient.invalidateQueries({ queryKey: ['dpda', dpdaId] })
      queryClient.invalidateQueries({ queryKey: ['dpdas'] })
    },
    onError: (error) => {
      console.error('Failed to delete transition:', error)
      console.warn('Note: Transition deletion uses fragile index-based API')
    },
  })

  /**
   * Update a transition by index
   * WARNING: Index-based update is fragile! Transitions are refetched after update.
   */
  const updateMutation = useMutation({
    mutationFn: ({ index, request }: { index: number; request: UpdateTransitionRequest }) =>
      updateTransition(dpdaId!, index, request),
    onSuccess: (_data: UpdateTransitionResponse) => {
      // CRITICAL: Refetch transitions immediately due to fragile index-based update
      queryClient.invalidateQueries({ queryKey: ['transitions', dpdaId] })
      // Also invalidate DPDA query as validity status may change
      queryClient.invalidateQueries({ queryKey: ['dpda', dpdaId] })
      queryClient.invalidateQueries({ queryKey: ['dpdas'] })
    },
    onError: (error) => {
      console.error('Failed to update transition:', error)
      console.warn('Note: Transition update uses fragile index-based API')
    },
  })

  /**
   * Prefetch transitions (useful for hover/preload)
   */
  const prefetchTransitions = async (id?: string) => {
    const targetId = id || dpdaId
    if (!targetId) return

    await queryClient.prefetchQuery({
      queryKey: ['transitions', targetId],
      queryFn: () => getTransitions(targetId),
      staleTime: 2 * 60 * 1000,
    })
  }

  return {
    getQuery,
    addMutation,
    deleteMutation,
    updateMutation,
    prefetchTransitions,
  }
}
