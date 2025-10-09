<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useDPDA } from '@/composables/useDPDA'
import { createDPDASchema, updateDPDASchema } from '@/schemas/dpda.schema'
import PageLayout from '@/components/layout/PageLayout.vue'
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
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

const router = useRouter()
const { createMutation, updateMutation, deleteMutation, listQuery } = useDPDA()

// Destructure list query properties
const { data: dpdaList, isLoading, isError, error, refetch } = listQuery

// Destructure mutation properties for proper reactivity
const { isPending: isCreating } = createMutation
const { isPending: isUpdating } = updateMutation
const { isPending: isDeleting } = deleteMutation

// Dialog states
const isDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const editingDPDA = ref<{ id: string; name: string; description?: string } | null>(null)
const deletingDPDA = ref<{ id: string; name: string } | null>(null)

// Create form setup
const { handleSubmit, resetForm, errors, defineField } = useForm({
  validationSchema: toTypedSchema(createDPDASchema),
})

const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')

// Edit form setup
const {
  handleSubmit: handleEditSubmit,
  resetForm: resetEditForm,
  errors: editErrors,
  defineField: defineEditField,
  setValues: setEditValues,
} = useForm({
  validationSchema: toTypedSchema(updateDPDASchema),
})

const [editName, editNameAttrs] = defineEditField('name')
const [editDescription, editDescriptionAttrs] = defineEditField('description')

// Handle create form submission
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

// Handle edit button click
const openEditDialog = (dpda: { id: string; name: string; description?: string }) => {
  editingDPDA.value = dpda
  setEditValues({
    name: dpda.name,
    description: dpda.description || '',
  })
  isEditDialogOpen.value = true
}

// Handle edit form submission
const onEditSubmit = handleEditSubmit((values) => {
  if (!editingDPDA.value) return

  updateMutation.mutate(
    {
      id: editingDPDA.value.id,
      request: {
        name: values.name,
        description: values.description,
      },
    },
    {
      onSuccess: () => {
        isEditDialogOpen.value = false
        resetEditForm()
        editingDPDA.value = null
      },
    }
  )
})

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

// Handle delete button click
const confirmDelete = (dpda: { id: string; name: string }) => {
  deletingDPDA.value = dpda
  isDeleteDialogOpen.value = true
}

// Handle actual deletion
const handleDelete = () => {
  if (!deletingDPDA.value) return

  deleteMutation.mutate(deletingDPDA.value.id, {
    onSuccess: () => {
      isDeleteDialogOpen.value = false
      deletingDPDA.value = null
    },
    onError: (error) => {
      console.error('Failed to delete DPDA:', error)
      // Keep dialog open to show error or retry
    },
  })
}

// Navigate to editor
const navigateToEditor = (id: string) => {
  router.push(`/dpda/${id}`)
}
</script>

<template>
  <PageLayout>
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
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

          <form data-testid="create-dpda-form" @submit="onSubmit">
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
                <p v-if="errors.name" data-testid="name-error" class="text-sm text-red-500">
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
              <Button type="button" variant="outline" @click="isDialogOpen = false">
                Cancel
              </Button>
              <Button type="submit" :disabled="isCreating">
                {{ isCreating ? 'Creating...' : 'Create' }}
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
      <Button variant="outline" size="sm" class="mt-2" @click="refetch"> Retry </Button>
    </Alert>

    <!-- Empty State -->
    <div v-else-if="!dpdaList?.dpdas?.length" data-testid="empty-state" class="text-center py-12">
      <p class="text-muted-foreground text-lg mb-4">
        No DPDAs yet. Create your first one to get started!
      </p>
      <!--
      <Button @click="isDialogOpen = true">Create Your First DPDA</Button>
      -->
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
          <div class="flex gap-2">
            <Button
              :data-testid="`edit-dpda-${dpda.id}`"
              variant="ghost"
              size="sm"
              @click.stop="openEditDialog(dpda)"
            >
              Edit
            </Button>
            <Button
              :data-testid="`delete-dpda-${dpda.id}`"
              variant="ghost"
              size="sm"
              @click.stop="confirmDelete(dpda)"
            >
              Delete
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>

    <!-- Edit DPDA Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent data-testid="edit-dpda-dialog">
        <DialogHeader>
          <DialogTitle>Edit DPDA</DialogTitle>
          <DialogDescription> Update the name and/or description of your DPDA </DialogDescription>
        </DialogHeader>

        <form data-testid="edit-dpda-form" @submit="onEditSubmit">
          <div class="space-y-4 py-4">
            <!-- Name Field -->
            <div class="space-y-2">
              <Label for="edit-name">Name</Label>
              <Input
                id="edit-name"
                v-model="editName"
                v-bind="editNameAttrs"
                data-testid="edit-dpda-name-input"
                placeholder="e.g., Balanced Parentheses"
                :class="{ 'border-red-500': editErrors.name }"
              />
              <p v-if="editErrors.name" data-testid="edit-name-error" class="text-sm text-red-500">
                {{ editErrors.name }}
              </p>
            </div>

            <!-- Description Field -->
            <div class="space-y-2">
              <Label for="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                v-model="editDescription"
                v-bind="editDescriptionAttrs"
                data-testid="edit-dpda-description-input"
                placeholder="Optional description..."
                rows="3"
              />
            </div>

            <!-- General validation error -->
            <p
              v-if="
                editErrors &&
                typeof editErrors === 'object' &&
                '_errors' in editErrors &&
                Array.isArray(editErrors._errors) &&
                editErrors._errors.length > 0
              "
              data-testid="edit-error"
              class="text-sm text-red-500"
            >
              {{ editErrors._errors[0] }}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="isEditDialogOpen = false">
              Cancel
            </Button>
            <Button type="submit" data-testid="edit-dpda-submit" :disabled="isUpdating">
              {{ isUpdating ? 'Updating...' : 'Update' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete DPDA Confirmation Dialog -->
    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent data-testid="delete-dpda-dialog">
        <DialogHeader>
          <DialogTitle>Delete DPDA</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ deletingDPDA?.name }}"? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" @click="isDeleteDialogOpen = false">
            Cancel
          </Button>
          <Button
            variant="destructive"
            data-testid="confirm-delete-button"
            :disabled="isDeleting"
            @click="handleDelete"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </PageLayout>
</template>
