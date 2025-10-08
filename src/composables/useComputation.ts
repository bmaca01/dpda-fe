import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computeString, validateDPDA } from '@/api/endpoints/operations'
import type { ComputeRequest } from '@/api/types'

/**
 * Composable for DPDA computation and validation operations
 * Provides TanStack Query integration for compute and validate
 *
 * @param dpdaId - Optional DPDA ID. If provided, enables validation query
 * @returns Object containing validateQuery and computeMutation
 *
 * @example
 * ```typescript
 * const { validateQuery, computeMutation } = useComputation(dpdaId)
 * const { data: validationResult, isLoading } = validateQuery
 * const { isPending: isComputing } = computeMutation
 * computeMutation.mutate({ input_string: '001', max_steps: 10000, show_trace: false })
 * ```
 */
export function useComputation(dpdaId?: string) {
  const queryClient = useQueryClient()

  // Validation query - checks if DPDA is deterministic
  const validateQuery = useQuery({
    queryKey: ['dpda', dpdaId, 'validate'],
    queryFn: () => validateDPDA(dpdaId!),
    enabled: !!dpdaId,
  })

  // Compute mutation - tests string acceptance
  const computeMutation = useMutation({
    mutationFn: (request: ComputeRequest) => computeString(dpdaId!, request),
    onSuccess: () => {
      // Invalidate validation query in case computation revealed issues
      queryClient.invalidateQueries({ queryKey: ['dpda', dpdaId, 'validate'] })
    },
  })

  return {
    validateQuery,
    computeMutation,
  }
}
