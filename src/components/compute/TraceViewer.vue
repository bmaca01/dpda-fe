<script setup lang="ts">
import { computed } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-vue-next'
import type { ComputeResponse } from '@/api/types'

interface Props {
  trace?: ComputeResponse['trace']
}

const props = defineProps<Props>()

// Computed properties
const hasTrace = computed(() => !!props.trace && props.trace.length > 0)

const formatStack = (stack: string[]): string => {
  if (!stack || stack.length === 0) {
    return '(empty)'
  }
  return stack.join(', ')
}

const formatInput = (input: string): string => {
  if (input === '') {
    return 'ε'
  }
  return input
}
</script>

<template>
  <div>
    <!-- Empty State -->
    <Alert v-if="!hasTrace" data-testid="empty-state">
      <Info class="h-4 w-4" />
      <AlertDescription>
        No trace data available. Enable <strong>Show step-by-step trace</strong> when computing to
        see execution details.
      </AlertDescription>
    </Alert>

    <!-- Trace Table -->
    <Card v-else>
      <CardHeader>
        <CardTitle>Execution Trace</CardTitle>
        <CardDescription>
          Step-by-step execution showing state transitions, remaining input, and stack contents
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Table data-testid="trace-table">
          <TableHeader>
            <TableRow>
              <TableHead class="w-20">Step</TableHead>
              <TableHead class="w-32">State</TableHead>
              <TableHead>Remaining Input</TableHead>
              <TableHead>Stack</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="(step, index) in trace"
              :key="index"
              :data-testid="`trace-row-${index}`"
              class="trace-row"
            >
              <TableCell data-testid="step-number" class="font-medium">
                {{ index + 1 }}
              </TableCell>
              <TableCell data-testid="state" class="font-mono">
                {{ step.state }}
              </TableCell>
              <TableCell data-testid="input" class="font-mono">
                {{ formatInput(step.input) }}
              </TableCell>
              <TableCell data-testid="stack" class="font-mono text-sm">
                {{ formatStack(step.stack) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
/* Highlight final step */
.trace-row:last-child {
  background-color: hsl(var(--muted) / 0.5);
}
</style>
