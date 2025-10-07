/**
 * DPDA Operations API Endpoints
 * These functions handle computation, validation, export, and visualization
 */

import apiClient from '@/api/client'
import type {
  ComputeRequest,
  ComputeResponse,
  ValidationResponse,
  ExportResponse,
  VisualizationResponse,
} from '@/api/types'

/**
 * Compute a string on the DPDA
 * @param id - The DPDA ID
 * @param request - Computation request with input string and options
 * @returns Computation result with acceptance status and trace
 */
export async function computeString(id: string, request: ComputeRequest): Promise<ComputeResponse> {
  const { data } = await apiClient.post<ComputeResponse>(`/api/dpda/${id}/compute`, request)
  return data
}

/**
 * Validate DPDA for determinism
 * @param id - The DPDA ID
 * @returns Validation result with any violations found
 */
export async function validateDPDA(id: string): Promise<ValidationResponse> {
  const { data } = await apiClient.post<ValidationResponse>(`/api/dpda/${id}/validate`)
  return data
}

/**
 * Export DPDA definition in specified format
 * @param id - The DPDA ID
 * @param format - Export format (json, yaml, xml)
 * @returns Exported DPDA data as string
 */
export async function exportDPDA(
  id: string,
  format: 'json' | 'yaml' | 'xml' = 'json'
): Promise<ExportResponse> {
  const { data } = await apiClient.get<ExportResponse>(`/api/dpda/${id}/export`, {
    params: { format },
  })
  return data
}

/**
 * Get visualization data for the DPDA
 * @param id - The DPDA ID
 * @param format - Visualization format (cytoscape, dot, d3)
 * @returns Visualization data in specified format
 */
export async function visualizeDPDA(
  id: string,
  format: 'cytoscape' | 'dot' | 'd3' = 'cytoscape'
): Promise<VisualizationResponse> {
  const { data } = await apiClient.get<VisualizationResponse>(`/api/dpda/${id}/visualize`, {
    params: { format },
  })
  return data
}
