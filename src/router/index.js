import { createRouter, createWebHistory } from 'vue-router'
import GeneratorView from '../views/GeneratorView.vue'
import LibraryView from '../views/LibraryView.vue'
import ExportView from '../views/ExportView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'generator',
      component: GeneratorView
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView
    },
    {
      path: '/export',
      name: 'export',
      component: ExportView
    }
  ]
})

export default router
