<template>
  <div class="home-view">
    <!-- Hero Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card
          class="hero-card"
          elevation="4"
          color="primary"
          dark
        >
          <v-card-text class="text-center pa-8">
            <v-icon size="64" class="mb-4">mdi-calendar-check</v-icon>
            <h1 class="text-h4 font-weight-bold mb-2">مرحباً بك في نظام حجز قاعة الاجتماعات</h1>
            <p class="text-h6 opacity-8 mb-0">احجز قاعة اجتماعاتك بسهولة وسرعة</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
    <v-row class="mb-8">
      <v-col cols="12" md="4">
        <v-card
          class="stat-card stat-card--pending"
          elevation="3"
        >
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="pending" class="mb-3">mdi-clock-outline</v-icon>
            <div class="text-h3 font-weight-bold mb-1">{{ stats.pendingCount }}</div>
            <div class="text-subtitle-1">طلبات معلقة</div>
            <div class="text-caption opacity-7">في انتظار الموافقة</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card
          class="stat-card stat-card--approved"
          elevation="3"
        >
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="approved" class="mb-3">mdi-check-circle-outline</v-icon>
            <div class="text-h3 font-weight-bold mb-1">{{ stats.approvedCount }}</div>
            <div class="text-subtitle-1">حجوزات مقبولة</div>
            <div class="text-caption opacity-7">مؤكدة ومفعلة</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card
          class="stat-card stat-card--upcoming"
          elevation="3"
        >
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="info" class="mb-3">mdi-calendar-month</v-icon>
            <div class="text-h3 font-weight-bold mb-1">{{ stats.upcomingCount }}</div>
            <div class="text-subtitle-1">قريباً خلال 7 أيام</div>
            <div class="text-caption opacity-7">الحجوزات القادمة</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Admin Panel -->
    <v-row v-if="auth.user?.role === 'admin'" class="mb-6">
      <v-col cols="12">
        <v-card
          class="admin-card"
          elevation="3"
          color="success"
          dark
        >
          <v-card-text class="d-flex align-center pa-6">
            <v-icon size="32" class="me-4">mdi-shield-account</v-icon>
            <div class="flex-grow-1">
              <div class="text-h6 font-weight-bold mb-1">لوحة الإدارة</div>
              <div class="text-body-2 opacity-9">إدارة طلبات الحجز ومراجعة الطلبات الجديدة</div>
            </div>
            <div class="d-flex gap-3 flex-wrap">
              <v-btn
                color="white"
                variant="flat"
                size="large"
                to="/admin"
                prepend-icon="mdi-arrow-left"
                class="admin-btn"
              >
                الدخول للوحة الإدارة
              </v-btn>
              <v-btn
                color="white"
                variant="flat"
                size="large"
                to="/bookings-overview"
                prepend-icon="mdi-file-document-outline"
                class="admin-btn"
              >
                عرض جميع الحجوزات
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Booking Section -->
    <v-row>
      <v-col cols="12">
        <v-card
          class="booking-card"
          elevation="3"
        >
          <v-card-text class="text-center pa-8">
            <v-icon size="64" color="primary" class="mb-4">mdi-calendar-plus</v-icon>
            <h2 class="text-h5 font-weight-bold mb-3">ابدأ بالحجز الآن</h2>
            <p class="text-body-1 mb-6 opacity-8">
              اختر التاريخ والوقت المناسب لاجتماعك واحجز قاعة الاجتماعات بسهولة
            </p>
            <v-btn
              color="primary"
              size="x-large"
              variant="flat"
              to="/booking"
              prepend-icon="mdi-calendar-edit"
              class="booking-btn"
            >
              انتقل لصفحة الحجز
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../api/client'

const auth = useAuthStore()
const stats = ref({
  pendingCount: 0,
  approvedCount: 0,
  upcomingCount: 0,
})

onMounted(async () => {
  try {
    const data = await apiFetch('/api/dashboard')
    stats.value = data.stats || stats.value
  } catch (e) {
    console.error('Failed to load dashboard stats:', e)
  }
})
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-card {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  border-radius: 16px;
}

.stat-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.stat-card--pending::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff9800, #ffc107);
}

.stat-card--approved::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4caf50, #66bb6a);
}

.stat-card--upcoming::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2196f3, #42a5f5);
}

.admin-card {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  border-radius: 16px;
}

.admin-btn {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.booking-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.booking-btn {
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.3);
  transition: all 0.3s ease;
}

.booking-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(25, 118, 210, 0.4);
}

.opacity-8 {
  opacity: 0.8;
}

.opacity-9 {
  opacity: 0.9;
}

.opacity-7 {
  opacity: 0.7;
}
</style>
