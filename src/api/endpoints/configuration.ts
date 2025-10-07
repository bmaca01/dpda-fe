/**
 * DPDA Configuration API Endpoints
 * These functions handle state and alphabet configuration for DPDAs
 */

import apiClient from '@/api/client'
import type {
  SetStatesRequest,
  SetAlphabetsRequest,
  UpdateStatesRequest,
  UpdateAlphabetsRequest,
  SuccessResponse,
  UpdateDPDAResponse,
} from '@/api/types'

/**
 * Set states for a DPDA
 * @param id - The DPDA ID
 * @param request - States configuration including initial and accept states
 * @returns Success response
 */
export async function setStates(id: string, request: SetStatesRequest): Promise<SuccessResponse> {
  const { data } = await apiClient.post<SuccessResponse>(`/api/dpda/${id}/states`, request)
  return data
}

/**
 * Set alphabets for a DPDA
 * @param id - The DPDA ID
 * @param request - Alphabet configuration including input and stack alphabets
 * @returns Success response
 */
export async function setAlphabets(
  id: string,
  request: SetAlphabetsRequest
): Promise<SuccessResponse> {
  const { data } = await apiClient.post<SuccessResponse>(`/api/dpda/${id}/alphabets`, request)
  return data
}

/**
 * Update states with full replacement (PUT)
 * Requires all fields - replaces entire states configuration
 * @param id - The DPDA ID
 * @param request - Complete states configuration
 * @returns Success response
 */
export async function updateStatesFull(
  id: string,
  request: SetStatesRequest
): Promise<SuccessResponse> {
  const { data} = await apiClient.put<SuccessResponse>(`/api/dpda/${id}/states`, request)
  return data
}

/**
 * Update states partially (PATCH)
 * Only provided fields are updated - other fields remain unchanged
 * @param id - The DPDA ID
 * @param request - Partial states update with optional fields
 * @returns Response with changes made
 */
export async function updateStatesPartial(
  id: string,
  request: UpdateStatesRequest
): Promise<UpdateDPDAResponse> {
  const { data } = await apiClient.patch<UpdateDPDAResponse>(`/api/dpda/${id}/states`, request)
  return data
}

/**
 * Update alphabets with full replacement (PUT)
 * Requires all fields - replaces entire alphabets configuration
 * @param id - The DPDA ID
 * @param request - Complete alphabets configuration
 * @returns Success response
 */
export async function updateAlphabetsFull(
  id: string,
  request: SetAlphabetsRequest
): Promise<SuccessResponse> {
  const { data } = await apiClient.put<SuccessResponse>(`/api/dpda/${id}/alphabets`, request)
  return data
}

/**
 * Update alphabets partially (PATCH)
 * Only provided fields are updated - other fields remain unchanged
 * @param id - The DPDA ID
 * @param request - Partial alphabets update with optional fields
 * @returns Response with changes made
 */
export async function updateAlphabetsPartial(
  id: string,
  request: UpdateAlphabetsRequest
): Promise<UpdateDPDAResponse> {
  const { data } = await apiClient.patch<UpdateDPDAResponse>(`/api/dpda/${id}/alphabets`, request)
  return data
}
