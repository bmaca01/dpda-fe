import { useQuery } from '@tanstack/vue-query'
import { visualizeDPDA } from '@/api/endpoints/operations'
import type { VisualizationResponse } from '@/api/types'

/**
 * Composable for DPDA visualization operations
 * Provides TanStack Query integration for fetching graph data
 *
 * @param dpdaId - Optional DPDA ID. If provided, enables visualization query
 * @returns Object containing visualizeQuery
 *
 * @example
 * ```typescript
 * const { visualizeQuery } = useVisualization(dpdaId)
 * const { data: graphData, isLoading, isError } = visualizeQuery
 * ```
 */
export function useVisualization(dpdaId?: string) {
  // Visualization query - fetches Cytoscape graph data
  const visualizeQuery = useQuery<VisualizationResponse, Error>({
    queryKey: ['dpda', dpdaId, 'visualize'],
    queryFn: () => visualizeDPDA(dpdaId!, 'cytoscape'),
    enabled: !!dpdaId,
    staleTime: 5 * 60 * 1000, // 5 minutes - graphs don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  })

  return {
    visualizeQuery,
  }
}
