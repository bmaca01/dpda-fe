import type { MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computeString, validateDPDA } from '@/api/endpoints/operations'
import type { ComputeRequest } from '@/api/types'

/**
 * Composable for DPDA computation and validation operations
 * Provides TanStack Query integration for compute and validate
 *
 * @param dpdaId - Optional DPDA ID. If provided, enables validation query
 * @param options - Optional configuration object
 * @param options.enabled - Override automatic enabling of validateQuery (default: !!dpdaId)
 *                          Can be a boolean, ref, or computed for reactive enabling
 * @returns Object containing validateQuery and computeMutation
 *
 * @example
 * ```typescript
 * const { validateQuery, computeMutation } = useComputation(dpdaId)
 * const { data: validationResult, isLoading } = validateQuery
 * const { isPending: isComputing } = computeMutation
 * computeMutation.mutate({ input_string: '001', max_steps: 10000, show_trace: false })
 * ```
 *
 * @example Conditional validation with computed ref
 * ```typescript
 * const { canValidate } = useDPDA(dpdaId)
 * const { validateQuery } = useComputation(dpdaId, { enabled: canValidate })
 * ```
 */
export function useComputation(
  dpdaId?: string,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const queryClient = useQueryClient()

  // Validation query - checks if DPDA is deterministic
  const validateQuery = useQuery({
    queryKey: ['dpda', dpdaId, 'validate'],
    queryFn: () => validateDPDA(dpdaId!),
    enabled: options?.enabled ?? !!dpdaId,
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
