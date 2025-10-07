/**
 * DPDA Transition API Endpoints
 * These functions handle transition management for DPDAs
 */

import apiClient from '@/api/client'
import type {
  AddTransitionRequest,
  UpdateTransitionRequest,
  SuccessResponse,
  DeleteTransitionResponse,
  UpdateTransitionResponse,
} from '@/api/types'

/**
 * Response type for getting transitions
 */
export interface TransitionsResponse {
  transitions: Array<{
    from_state: string
    input_symbol: string | null
    stack_top: string | null
    to_state: string
    stack_push: string[]
  }>
  total: number
}

/**
 * Add a transition to a DPDA
 * @param id - The DPDA ID
 * @param request - Transition details
 * @returns Success response
 */
export async function addTransition(
  id: string,
  request: AddTransitionRequest
): Promise<SuccessResponse> {
  const { data } = await apiClient.post<SuccessResponse>(`/api/dpda/${id}/transition`, request)
  return data
}

/**
 * Delete a transition from a DPDA by index
 * WARNING: Index-based deletion is fragile - always refetch transitions after deletion
 * @param id - The DPDA ID
 * @param index - The transition index to delete
 * @returns Delete response with remaining transition count
 */
export async function deleteTransition(
  id: string,
  index: number
): Promise<DeleteTransitionResponse> {
  const { data } = await apiClient.delete<DeleteTransitionResponse>(
    `/api/dpda/${id}/transition/${index}`
  )
  return data
}

/**
 * Get all transitions for a DPDA
 * @param id - The DPDA ID
 * @returns List of transitions
 */
export async function getTransitions(id: string): Promise<TransitionsResponse> {
  const { data } = await apiClient.get<TransitionsResponse>(`/api/dpda/${id}/transitions`)
  return data
}

/**
 * Update a specific transition by index
 * Uses PUT for partial updates - only provided fields are updated
 * WARNING: Index-based update is fragile - always refetch transitions after update
 * @param id - The DPDA ID
 * @param index - The transition index to update
 * @param request - Partial transition update with optional fields
 * @returns Response with changes made
 */
export async function updateTransition(
  id: string,
  index: number,
  request: UpdateTransitionRequest
): Promise<UpdateTransitionResponse> {
  const { data } = await apiClient.put<UpdateTransitionResponse>(
    `/api/dpda/${id}/transition/${index}`,
    request
  )
  return data
}
