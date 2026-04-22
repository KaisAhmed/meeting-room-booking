<template>
  <v-app>
    <v-app-bar
      color="primary"
      density="comfortable"
      elevation="2"
      class="app-bar"
    >
      <v-app-bar-title class="font-weight-bold">
        <v-icon class="me-2">mdi-calendar-clock</v-icon>
        نظام حجز قاعة الاجتماعات
      </v-app-bar-title>

      <v-spacer />

      <div v-if="auth.user" class="d-flex align-center gap-3">
        <v-chip
          variant="flat"
          :color="auth.user.role === 'admin' ? 'success' : 'info'"
          size="small"
          class="user-chip"
        >
          <v-icon start size="small">
            {{ auth.user.role === 'admin' ? 'mdi-shield-account' : 'mdi-account' }}
          </v-icon>
          {{ auth.user.username }}
        </v-chip>
        <v-btn
          color="secondary"
          variant="tonal"
          size="small"
          @click="onLogout"
          prepend-icon="mdi-logout"
        >
          خروج
        </v-btn>
      </div>
    </v-app-bar>

    <v-main class="main-background">
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

async function onLogout() {
  await auth.logout()
  await auth.fetchMe().catch(() => {})
}
</script>

<style scoped>
.app-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.main-background {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 64px);
}

.user-chip {
  font-weight: 500;
}

.gap-3 {
  gap: 12px;
}
</style>

