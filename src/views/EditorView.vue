<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import PageLayout from '@/components/layout/PageLayout.vue'
import StateConfig from '@/components/dpda/StateConfig.vue'
import AlphabetConfig from '@/components/dpda/AlphabetConfig.vue'
import TransitionForm from '@/components/dpda/TransitionForm.vue'
import TransitionTable from '@/components/dpda/TransitionTable.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDPDA, deleteDPDA } from '@/api/endpoints/dpda'
import { validateDPDA, exportDPDA } from '@/api/endpoints/operations'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const dpdaId = computed(() => route.params.id as string)
const activeTab = ref('states')
const validationStatus = ref<boolean | null>(null)

// Fetch DPDA data
const {
  data: dpda,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ['dpda', dpdaId],
  queryFn: () => getDPDA(dpdaId.value),
  enabled: computed(() => !!dpdaId.value),
})

// Validate mutation
const validateMutation = useMutation({
  mutationFn: () => validateDPDA(dpdaId.value),
  onSuccess: (data) => {
    validationStatus.value = data.is_valid
  },
})

// Export mutation
const exportMutation = useMutation({
  mutationFn: () => exportDPDA(dpdaId.value, 'json'),
  onSuccess: (data) => {
    // Create download link
    const blob = new Blob([JSON.stringify(data.data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${dpda.value?.name || 'dpda'}.json`
    link.click()
    URL.revokeObjectURL(url)
  },
})

// Delete mutation
const deleteMutation = useMutation({
  mutationFn: () => deleteDPDA(dpdaId.value),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['dpdas'] })
    router.push({ name: 'home' })
  },
})

const handleValidate = () => {
  validateMutation.mutate()
}

const handleExport = () => {
  exportMutation.mutate()
}

const handleDelete = () => {
  deleteMutation.mutate()
}
</script>

<template>
  <PageLayout
    :show-sidebar="true"
    :dpda-id="dpdaId"
    :dpda-name="dpda?.name"
    :is-valid="validationStatus"
    current-view="editor"
    @validate="handleValidate"
    @export="handleExport"
    @delete="handleDelete"
  >
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <p class="text-muted-foreground">Loading DPDA...</p>
    </div>

    <div v-else-if="isError" class="flex items-center justify-center h-64">
      <div class="text-center">
        <p class="text-destructive font-semibold">Error loading DPDA</p>
        <p class="text-sm text-muted-foreground mt-2">
          {{ error?.message || 'An error occurred' }}
        </p>
      </div>
    </div>

    <div v-else-if="dpda" class="space-y-6">
      <!-- DPDA Info Header -->
      <div class="border-b pb-4">
        <h1 class="text-3xl font-bold">{{ dpda.name }}</h1>
        <p v-if="dpda.description" class="text-muted-foreground mt-2">
          {{ dpda.description }}
        </p>
      </div>

      <!-- Configuration Tabs -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="states" data-testid="tab-states"> States </TabsTrigger>
          <TabsTrigger value="alphabets" data-testid="tab-alphabets"> Alphabets </TabsTrigger>
          <TabsTrigger value="transitions" data-testid="tab-transitions"> Transitions </TabsTrigger>
        </TabsList>

        <TabsContent value="states" class="mt-6">
          <StateConfig :dpda-id="dpdaId" />
        </TabsContent>

        <TabsContent value="alphabets" class="mt-6">
          <AlphabetConfig :dpda-id="dpdaId" />
        </TabsContent>

        <TabsContent value="transitions" class="mt-6">
          <div class="space-y-6">
            <TransitionForm
              :dpda-id="dpdaId"
              :states="dpda.states || []"
              :input-alphabet="dpda.input_alphabet || []"
              :stack-alphabet="dpda.stack_alphabet || []"
            />
            <TransitionTable :dpda-id="dpdaId" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </PageLayout>
</template>
