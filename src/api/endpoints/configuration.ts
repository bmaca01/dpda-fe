/**
 * DPDA Configuration API Endpoints
 * These functions handle state and alphabet configuration for DPDAs
 */

import apiClient from '@/api/client'
import type { SetStatesRequest, SetAlphabetsRequest, SuccessResponse } from '@/api/types'

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
