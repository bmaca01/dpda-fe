import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/dpda/:id',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
    },
    {
      path: '/dpda/:id/visualize',
      name: 'visualize',
      component: () => import('@/views/VisualizeView.vue'),
    },
    {
      path: '/dpda/:id/compute',
      name: 'compute',
      component: () => import('@/views/ComputeView.vue'),
    },
  ],
})

export default router
