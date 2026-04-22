import { defineStore } from 'pinia'
import { apiFetch } from '../api/client'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchMe() {
      this.loading = true
      this.error = null
      try {
        const data = await apiFetch('/api/auth/me')
        this.user = data.user
      } catch (e) {
        this.error = e.message || 'Failed to load user'
        this.user = null
      } finally {
        this.loading = false
      }
    },

    async login({ username, password }) {
      this.error = null
      try {
        await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        })
        await this.fetchMe()
      } catch (e) {
        this.error = e.message || 'Login failed'
        throw e
      }
    },

    async logout() {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' })
      } catch {
        // ignore
      }
      this.user = null
    },
  },
})

