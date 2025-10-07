<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Props {
  dpdaId?: string
  dpdaName?: string
  isValid?: boolean | null
}

const props = withDefaults(defineProps<Props>(), {
  isValid: null,
})

const showDpdaInfo = computed(() => props.dpdaName !== undefined)
const showValidationBadge = computed(() => {
  // Only show badge if both dpdaName is present AND isValid is explicitly set (true or false, not null)
  return props.dpdaName !== undefined && props.isValid !== null && props.isValid !== undefined
})
const showDpdaLinks = computed(() => props.dpdaId !== undefined)

const validationBadgeVariant = computed(() => {
  if (props.isValid === null || props.isValid === undefined) return 'secondary'
  return props.isValid ? 'default' : 'destructive'
})

const validationBadgeText = computed(() => {
  if (props.isValid === null || props.isValid === undefined) return ''
  return props.isValid ? 'Valid' : 'Invalid'
})
</script>

<template>
  <header class="border-b bg-background">
    <div class="container mx-auto px-4">
      <div class="flex h-16 items-center justify-between">
        <!-- App Title/Logo -->
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold">DPDA Simulator</h1>

          <!-- DPDA Info -->
          <template v-if="showDpdaInfo">
            <Separator orientation="vertical" class="h-6" />
            <div class="flex items-center gap-2">
              <span data-testid="dpda-name" class="text-sm font-medium">
                {{ dpdaName }}
              </span>
              <Badge
                v-if="showValidationBadge"
                data-testid="validation-badge"
                :variant="validationBadgeVariant"
                class="text-xs"
              >
                {{ validationBadgeText }}
              </Badge>
            </div>
          </template>
        </div>

        <!-- Navigation -->
        <nav aria-label="Main navigation">
          <ul class="flex items-center gap-6">
            <li>
              <RouterLink
                data-testid="nav-home"
                to="/"
                class="text-sm font-medium transition-colors hover:text-primary"
                active-class="text-primary"
              >
                Home
              </RouterLink>
            </li>

            <template v-if="showDpdaLinks">
              <li>
                <RouterLink
                  data-testid="nav-editor"
                  :to="`/dpda/${dpdaId}`"
                  class="text-sm font-medium transition-colors hover:text-primary"
                  active-class="text-primary"
                >
                  Editor
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  data-testid="nav-visualize"
                  :to="`/dpda/${dpdaId}/visualize`"
                  class="text-sm font-medium transition-colors hover:text-primary"
                  active-class="text-primary"
                >
                  Visualize
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  data-testid="nav-compute"
                  :to="`/dpda/${dpdaId}/compute`"
                  class="text-sm font-medium transition-colors hover:text-primary"
                  active-class="text-primary"
                >
                  Compute
                </RouterLink>
              </li>
            </template>
          </ul>
        </nav>
      </div>
    </div>
  </header>
</template>
