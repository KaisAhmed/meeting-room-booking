import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import BookingView from '../views/BookingView.vue'
import AdminView from '../views/AdminView.vue'
import BookingsOverviewView from '../views/BookingsOverviewView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/booking', name: 'booking', component: BookingView, meta: { requiresAuth: true } },
    { path: '/bookings-overview', name: 'bookings-overview', component: BookingsOverviewView, meta: { requiresAuth: true, adminOnly: true } },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, adminOnly: true } },
  ],
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      // ignore: will redirect below
    }
  }

  if (to.meta.requiresAuth && !auth.user) {
    return next('/login')
  }

  if (to.meta.adminOnly && auth.user?.role !== 'admin') {
    return next('/')
  }

  return next()
})

export default router

