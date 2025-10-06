import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const isLoading = ref(false)
  const toast = ref<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toast.value = { message, type }
  }

  const clearToast = () => {
    toast.value = null
  }

  return { isLoading, toast, setLoading, showToast, clearToast }
})
