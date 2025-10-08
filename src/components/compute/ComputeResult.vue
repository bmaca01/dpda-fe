<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Info } from 'lucide-vue-next'
import type { ComputeResponse } from '@/api/types'

interface Props {
  result?: ComputeResponse
}

const props = defineProps<Props>()

// Computed properties
const hasResult = computed(() => !!props.result)
const isAccepted = computed(() => props.result?.accepted ?? false)
const finalStackDisplay = computed(() => {
  if (!props.result?.final_stack || props.result.final_stack.length === 0) {
    return '(empty)'
  }
  return props.result.final_stack.join(', ')
})
</script>

<template>
  <div>
    <!-- Empty State -->
    <Alert v-if="!hasResult" data-testid="empty-state">
      <Info class="h-4 w-4" />
      <AlertDescription>
        No computation result yet. Enter a string and click <strong>Compute</strong> to test
        acceptance.
      </AlertDescription>
    </Alert>

    <!-- Result Section -->
    <Card v-else data-testid="result-section">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Computation Result</CardTitle>
          <!-- Accepted/Rejected Badge -->
          <Badge
            v-if="isAccepted"
            data-testid="accepted-badge"
            variant="default"
            class="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 class="mr-1 h-4 w-4" />
            Accepted
          </Badge>
          <Badge
            v-else
            data-testid="rejected-badge"
            variant="destructive"
          >
            <XCircle class="mr-1 h-4 w-4" />
            Rejected
          </Badge>
        </div>
        <CardDescription>
          String was {{ isAccepted ? 'accepted' : 'rejected' }} by the DPDA
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Final State -->
        <div>
          <h4 class="text-sm font-medium text-muted-foreground mb-1">Final State</h4>
          <p data-testid="final-state" class="text-lg font-mono">{{ result?.final_state }}</p>
        </div>

        <!-- Final Stack -->
        <div>
          <h4 class="text-sm font-medium text-muted-foreground mb-1">Final Stack</h4>
          <p data-testid="final-stack" class="text-lg font-mono">{{ finalStackDisplay }}</p>
        </div>

        <!-- Steps Taken -->
        <div>
          <h4 class="text-sm font-medium text-muted-foreground mb-1">Steps Taken</h4>
          <p data-testid="steps-taken" class="text-lg">{{ result?.steps_taken }}</p>
        </div>

        <!-- Rejection Reason (if rejected) -->
        <Alert v-if="!isAccepted && result?.reason" variant="destructive" data-testid="rejection-reason">
          <XCircle class="h-4 w-4" />
          <AlertDescription>
            <strong>Rejection Reason:</strong> {{ result.reason }}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  </div>
</template>
