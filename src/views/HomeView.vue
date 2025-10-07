<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useDPDA } from '@/composables/useDPDA'
import { createDPDASchema } from '@/schemas/dpda.schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

const router = useRouter()
const { useCreateDPDA, useListDPDAs } = useDPDA()

// Fetch DPDAs list
const { data: dpdaList, isLoading, isError, error, refetch } = useListDPDAs()

// Create DPDA mutation
const createMutation = useCreateDPDA()

// Dialog state
const isDialogOpen = ref(false)

// Form setup
const { handleSubmit, resetForm, errors, defineField } = useForm({
  validationSchema: toTypedSchema(createDPDASchema),
})

const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')

// Handle form submission
const onSubmit = handleSubmit((values) => {
  createMutation.mutate(values, {
    onSuccess: (data) => {
      isDialogOpen.value = false
      resetForm()
      // Navigate to the editor
      router.push(`/dpda/${data.id}`)
    },
  })
})

// Close dialog on success
watch(() => createMutation.isSuccess, (isSuccess) => {
  if (isSuccess) {
    isDialogOpen.value = false
    resetForm()
  }
})

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

// Navigate to editor
const navigateToEditor = (id: string) => {
  router.push(`/dpda/${id}`)
}
</script>

<template>
  <div class="container mx-auto py-8 px-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-4xl font-bold">DPDA Simulator</h1>
        <p class="text-muted-foreground mt-2">
          Create and manage Deterministic Pushdown Automata
        </p>
      </div>

      <!-- Create Button with Dialog -->
      <Dialog v-model:open="isDialogOpen">
        <DialogTrigger as-child>
          <Button data-testid="create-dpda-btn" size="lg">
            <span class="mr-2">+</span> Create New DPDA
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="create-dpda-dialog">
          <DialogHeader>
            <DialogTitle>Create New DPDA</DialogTitle>
            <DialogDescription>
              Enter a name and optional description for your new DPDA
            </DialogDescription>
          </DialogHeader>

          <form @submit="onSubmit" data-testid="create-dpda-form">
            <div class="space-y-4 py-4">
              <!-- Name Field -->
              <div class="space-y-2">
                <Label for="name">Name *</Label>
                <Input
                  id="name"
                  v-model="name"
                  v-bind="nameAttrs"
                  data-testid="dpda-name-input"
                  placeholder="e.g., Balanced Parentheses"
                  :class="{ 'border-red-500': errors.name }"
                />
                <p
                  v-if="errors.name"
                  data-testid="name-error"
                  class="text-sm text-red-500"
                >
                  {{ errors.name }}
                </p>
              </div>

              <!-- Description Field -->
              <div class="space-y-2">
                <Label for="description">Description</Label>
                <Textarea
                  id="description"
                  v-model="description"
                  v-bind="descriptionAttrs"
                  data-testid="dpda-description-input"
                  placeholder="Optional description..."
                  rows="3"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                @click="isDialogOpen = false"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                :disabled="createMutation.isPending"
              >
                {{ createMutation.isPending ? 'Creating...' : 'Create' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" data-testid="loading-state" class="text-center py-12">
      <p class="text-muted-foreground">Loading DPDAs...</p>
    </div>

    <!-- Error State -->
    <Alert v-else-if="isError" data-testid="error-state" variant="destructive">
      <AlertDescription>
        Error loading DPDAs: {{ error?.message || 'Unknown error' }}
      </AlertDescription>
      <Button @click="refetch" variant="outline" size="sm" class="mt-2">
        Retry
      </Button>
    </Alert>

    <!-- Empty State -->
    <div
      v-else-if="!dpdaList?.dpdas?.length"
      data-testid="empty-state"
      class="text-center py-12"
    >
      <p class="text-muted-foreground text-lg mb-4">
        No DPDAs yet. Create your first one to get started!
      </p>
      <Button @click="isDialogOpen = true">Create Your First DPDA</Button>
    </div>

    <!-- DPDA List -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="dpda in dpdaList.dpdas"
        :key="dpda.id"
        :data-testid="`dpda-item-${dpda.id}`"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateToEditor(dpda.id)"
      >
        <CardHeader>
          <div class="flex justify-between items-start">
            <CardTitle class="text-xl">
              <a :href="`/dpda/${dpda.id}`" @click.prevent>
                {{ dpda.name }}
              </a>
            </CardTitle>
            <Badge
              :data-testid="`dpda-${dpda.id}-valid-badge`"
              :variant="dpda.is_valid ? 'default' : 'secondary'"
            >
              {{ dpda.is_valid ? 'Valid' : 'Invalid' }}
            </Badge>
          </div>
          <CardDescription v-if="dpda.description">
            {{ dpda.description }}
          </CardDescription>
        </CardHeader>

        <CardFooter class="flex justify-between">
          <span v-if="dpda.created_at" class="text-sm text-muted-foreground">
            Created {{ formatDate(dpda.created_at) }}
          </span>
          <Button
            :data-testid="`delete-dpda-${dpda.id}`"
            variant="ghost"
            size="sm"
            @click.stop
          >
            Delete
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
