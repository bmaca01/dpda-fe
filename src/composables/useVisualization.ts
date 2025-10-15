import type { MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { visualizeDPDA } from '@/api/endpoints/operations'
import type { VisualizationResponse } from '@/api/types'

/**
 * Composable for DPDA visualization operations
 * Provides TanStack Query integration for fetching graph data
 *
 * @param dpdaId - Optional DPDA ID. If provided, enables visualization query
 * @param options - Optional configuration object
 * @param options.enabled - Override automatic enabling of visualizeQuery (default: !!dpdaId)
 *                          Can be a boolean, ref, or computed for reactive enabling
 * @returns Object containing visualizeQuery
 *
 * @example
 * ```typescript
 * const { visualizeQuery } = useVisualization(dpdaId)
 * const { data: graphData, isLoading, isError } = visualizeQuery
 * ```
 *
 * @example Conditional visualization with computed ref
 * ```typescript
 * const { canValidate } = useDPDA(dpdaId)
 * const { visualizeQuery } = useVisualization(dpdaId, { enabled: canValidate })
 * ```
 */
export function useVisualization(
  dpdaId?: string,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  // Visualization query - fetches Cytoscape graph data
  const visualizeQuery = useQuery<VisualizationResponse, Error>({
    queryKey: ['dpda', dpdaId, 'visualize'],
    queryFn: () => visualizeDPDA(dpdaId!, 'cytoscape'),
    enabled: options?.enabled ?? !!dpdaId,
    staleTime: 5 * 60 * 1000, // 5 minutes - graphs don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  })

  return {
    visualizeQuery,
  }
}
