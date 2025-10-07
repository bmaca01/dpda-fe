/**
 * Zod validation schemas for DPDA forms
 * These schemas provide runtime validation and type inference
 */

import { z } from 'zod'

/**
 * Schema for creating a new DPDA
 */
export const createDPDASchema = z.object({
  name: z.string().min(1, 'Name must be at least 1 character'),
  description: z.string().optional(),
})

export type CreateDPDAFormData = z.infer<typeof createDPDASchema>

/**
 * Schema for updating DPDA metadata
 * At least one field must be provided
 */
export const updateDPDASchema = z
  .object({
    name: z.string().min(1, 'Name must be at least 1 character').optional(),
    description: z.string().optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: 'At least one field must be provided',
  })

export type UpdateDPDAFormData = z.infer<typeof updateDPDASchema>

/**
 * Schema for state configuration
 */
export const stateConfigSchema = z
  .object({
    states: z.array(z.string().min(1)).min(1, 'At least one state is required'),
    initialState: z.string().min(1, 'Initial state is required'),
    acceptStates: z.array(z.string()).default([]),
  })
  .refine((data) => data.states.includes(data.initialState), {
    message: 'Initial state must be in states list',
    path: ['initialState'],
  })
  .refine((data) => data.acceptStates.every((s) => data.states.includes(s)), {
    message: 'All accept states must be in states list',
    path: ['acceptStates'],
  })

export type StateConfigFormData = z.infer<typeof stateConfigSchema>

/**
 * Schema for alphabet configuration
 */
export const alphabetConfigSchema = z
  .object({
    inputAlphabet: z.array(z.string().min(1)).default([]),
    stackAlphabet: z.array(z.string().min(1)).min(1, 'At least one stack symbol is required'),
    initialStackSymbol: z.string().min(1, 'Initial stack symbol is required'),
  })
  .refine((data) => data.stackAlphabet.includes(data.initialStackSymbol), {
    message: 'Initial stack symbol must be in stack alphabet',
    path: ['initialStackSymbol'],
  })

export type AlphabetConfigFormData = z.infer<typeof alphabetConfigSchema>

/**
 * Schema for transition
 * Note: Empty strings represent epsilon transitions
 */
export const transitionSchema = z.object({
  fromState: z.string().min(1, 'From state is required'),
  inputSymbol: z.string(), // Empty string for epsilon
  stackTop: z.string(), // Empty string for epsilon
  toState: z.string().min(1, 'To state is required'),
  stackPush: z.array(z.string()).default([]),
})

export type TransitionFormData = z.infer<typeof transitionSchema>

/**
 * Schema for compute request
 */
export const computeSchema = z.object({
  inputString: z.string().default(''),
  maxSteps: z
    .number()
    .positive('Max steps must be positive')
    .max(1000000, 'Max steps must be less than or equal to 1000000')
    .default(10000),
  showTrace: z.boolean().default(false),
})

export type ComputeFormData = z.infer<typeof computeSchema>

/**
 * Helper function to convert form data to API request format
 * Converts empty strings to null for epsilon transitions
 */
export function transitionFormToApiRequest(formData: TransitionFormData) {
  return {
    from_state: formData.fromState,
    input_symbol: formData.inputSymbol || null,
    stack_top: formData.stackTop || null,
    to_state: formData.toState,
    stack_push: formData.stackPush,
  }
}

/**
 * Helper function to convert API response to form data
 * Converts null to empty strings for epsilon transitions
 */
export function transitionApiToFormData(apiData: any): TransitionFormData {
  return {
    fromState: apiData.from_state,
    inputSymbol: apiData.input_symbol ?? '',
    stackTop: apiData.stack_top ?? '',
    toState: apiData.to_state,
    stackPush: apiData.stack_push || [],
  }
}
