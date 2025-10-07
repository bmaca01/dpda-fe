/**
 * DPDA CRUD API Endpoints
 * These functions handle Create, Read, Update, Delete operations for DPDAs
 */

import apiClient from '@/api/client'
import type {
  CreateDPDARequest,
  CreateDPDAResponse,
  ListDPDAsResponse,
  DPDAInfoResponse,
  SuccessResponse,
} from '@/api/types'

/**
 * Create a new DPDA
 * @param request - The DPDA creation request
 * @returns The created DPDA with its unique ID
 */
export async function createDPDA(request: CreateDPDARequest): Promise<CreateDPDAResponse> {
  const { data } = await apiClient.post<CreateDPDAResponse>('/api/dpda/create', request)
  return data
}

/**
 * List all DPDAs
 * @returns List of all DPDAs with their basic information
 */
export async function listDPDAs(): Promise<ListDPDAsResponse> {
  const { data } = await apiClient.get<ListDPDAsResponse>('/api/dpda/list')
  return data
}

/**
 * Get detailed information about a specific DPDA
 * @param id - The DPDA ID
 * @returns Full DPDA information including states, alphabets, and transitions
 */
export async function getDPDA(id: string): Promise<DPDAInfoResponse> {
  const { data } = await apiClient.get<DPDAInfoResponse>(`/api/dpda/${id}`)
  return data
}

/**
 * Delete a DPDA
 * @param id - The DPDA ID to delete
 * @returns Success response
 */
export async function deleteDPDA(id: string): Promise<SuccessResponse> {
  const { data } = await apiClient.delete<SuccessResponse>(`/api/dpda/${id}`)
  return data
}
