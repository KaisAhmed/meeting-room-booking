<template>
  <div>
    <v-alert
      v-if="auth.user?.role !== 'admin'"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      هذه الصفحة مخصصة للأدمن فقط.
    </v-alert>

    <div v-else>
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card class="admin-tabs-card" elevation="2">
            <v-card-text class="pa-4 d-flex flex-wrap gap-3">
              <v-btn
                :variant="selectedTab === 'requests' ? 'tonal' : 'text'"
                :color="selectedTab === 'requests' ? 'primary' : 'default'"
                @click="selectedTab = 'requests'"
              >
                طلبات الحجز
              </v-btn>
              <v-btn
                :variant="selectedTab === 'users' ? 'tonal' : 'text'"
                :color="selectedTab === 'users' ? 'primary' : 'default'"
                @click="selectedTab = 'users'"
              >
                إدارة المستخدمين
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <AdminRequests v-if="selectedTab === 'requests'" />
      <AdminUsers v-else />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import AdminRequests from '../components/AdminRequests.vue'
import AdminUsers from '../components/AdminUsers.vue'

const auth = useAuthStore()
const selectedTab = ref('requests')
</script>

