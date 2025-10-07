/**
 * API Type Definitions
 * These TypeScript interfaces match the backend Pydantic models exactly.
 * See ~/repos/cs341-dpda/api/models.py for the source definitions.
 */

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request to create a new DPDA
 */
export interface CreateDPDARequest {
  name: string
  description?: string
}

/**
 * Request to set states for a DPDA
 */
export interface SetStatesRequest {
  states: string[]
  initial_state: string
  accept_states: string[]
}

/**
 * Request to set alphabets for a DPDA
 */
export interface SetAlphabetsRequest {
  input_alphabet: string[]
  stack_alphabet: string[]
  initial_stack_symbol: string
}

/**
 * Request to add a transition to a DPDA
 * Note: input_symbol and stack_top can be null for epsilon transitions
 */
export interface AddTransitionRequest {
  from_state: string
  input_symbol: string | null // null for epsilon
  stack_top: string | null // null for epsilon
  to_state: string
  stack_push: string[] // Ordered list, first element pushed last (top of stack)
}

/**
 * Request to compute a string on the DPDA
 */
export interface ComputeRequest {
  input_string: string
  max_steps?: number // Default: 10000
  show_trace?: boolean // Default: false
}

/**
 * Request to update DPDA metadata (PATCH)
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateDPDARequest {
  name?: string
  description?: string
}

/**
 * Request to update states (PATCH)
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateStatesRequest {
  states?: string[]
  initial_state?: string
  accept_states?: string[]
}

/**
 * Request to update alphabets (PATCH)
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateAlphabetsRequest {
  input_alphabet?: string[]
  stack_alphabet?: string[]
  initial_stack_symbol?: string
}

/**
 * Request to update a transition (PUT)
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateTransitionRequest {
  from_state?: string
  input_symbol?: string | null // null for epsilon
  stack_top?: string | null // null for epsilon
  to_state?: string
  stack_push?: string[] // Ordered list
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response after creating a DPDA
 */
export interface CreateDPDAResponse {
  id: string
  name: string
  description?: string
}

/**
 * Response after computing a string
 */
export interface ComputeResponse {
  accepted: boolean
  final_state: string
  final_stack: string[]
  steps_taken: number
  trace?: Array<{
    state: string
    input: string
    stack: string[]
  }>
  reason?: string // Rejection reason if not accepted
}

/**
 * Response after validating a DPDA
 */
export interface ValidationResponse {
  is_valid: boolean
  violations: Array<{
    type: string
    description: string
  }>
  message: string
}

/**
 * Visualization response with graph data
 */
export interface VisualizationResponse {
  format: 'cytoscape' | 'dot' | 'd3'
  data: any // Format-specific data structure
}

/**
 * Export response with DPDA definition
 */
export interface ExportResponse {
  format: 'json' | 'yaml' | 'xml'
  data: string
}

/**
 * Full DPDA information response
 */
export interface DPDAInfoResponse {
  id: string
  name: string
  description?: string
  states?: string[]
  initial_state?: string
  accept_states?: string[]
  input_alphabet?: string[]
  stack_alphabet?: string[]
  initial_stack_symbol?: string
  transitions?: Array<{
    from_state: string
    input_symbol: string | null
    stack_top: string | null
    to_state: string
    stack_push: string[]
  }>
  is_valid?: boolean
}

/**
 * Response for listing all DPDAs
 */
export interface ListDPDAsResponse {
  dpdas: Array<{
    id: string
    name: string
    description?: string
    is_valid?: boolean
    created_at?: string
  }>
  total: number
}

/**
 * Response after deleting a transition
 */
export interface DeleteTransitionResponse {
  success: boolean
  message: string
  remaining_transitions?: number
}

/**
 * Generic success response
 */
export interface SuccessResponse {
  success: boolean
  message: string
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string
  detail?: string
  status_code: number
}

/**
 * Response after updating DPDA metadata (PATCH)
 * Returns object showing which fields were changed
 */
export interface UpdateDPDAResponse {
  changes: Record<string, any>
}

/**
 * Response after updating a transition (PUT)
 * Returns object showing which fields were changed
 */
export interface UpdateTransitionResponse {
  changes: Record<string, any>
}
