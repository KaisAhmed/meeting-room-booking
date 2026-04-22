<template>
  <div class="bookings-overview-view">
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="overview-header-card" elevation="4" color="primary" dark>
          <v-card-text class="text-center pa-8">
            <v-icon size="64" class="mb-4">mdi-calendar-multiple</v-icon>
            <h1 class="text-h4 font-weight-bold mb-2">عرض جميع الحجوزات</h1>
            <p class="text-body-1 opacity-9 mb-0">
              تصفح الحجوزات المعلقة والمقبولة والمرفوضة مع إمكانية التصفية حسب التاريخ والحالة.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-text-field
          v-model="fromDate"
          label="من تاريخ"
          type="date"
          variant="outlined"
          density="comfortable"
          class="filter-field"
        />
      </v-col>

      <v-col cols="12" md="3">
        <v-text-field
          v-model="toDate"
          label="إلى تاريخ"
          type="date"
          variant="outlined"
          density="comfortable"
          class="filter-field"
        />
      </v-col>

      <v-col cols="12" md="3">
        <v-select
          v-model="status"
          :items="statusOptions"
          label="الحالة"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
          class="filter-field"
        />
      </v-col>

      <v-col cols="12" md="3" class="d-flex align-end justify-end">
        <v-btn color="primary" size="large" variant="flat" @click="fetchBookings" class="search-button">
          فلترة الطلبات
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="2" class="overview-card">
          <v-card-text>
            <div class="table-actions mb-4 d-flex flex-wrap gap-4 align-center justify-space-between">
              <div>
                <div class="text-subtitle-1 font-weight-bold mb-1">عدد الحجوزات</div>
                <div class="text-body-2 opacity-8">{{ bookings.length }} طلب</div>
              </div>
              <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-0">
                {{ errorMessage }}
              </v-alert>
            </div>

            <v-data-table
              :headers="headers"
              :items="bookings"
              :items-per-page="10"
              class="bookings-table"
              :loading="loading"
              density="comfortable"
              item-key="id"
            >
                <template #item.startDate="{ item }">
                {{ formatDate(item.start) }}
              </template>
              <template #item.startTime="{ item }">
                {{ formatTime(item.start) }}
              </template>
              <template #item.endDate="{ item }">
                {{ formatDate(item.end) }}
              </template>
              <template #item.endTime="{ item }">
                {{ formatTime(item.end) }}
              </template>
              <template #item.status="{ item }">
                <v-chip :color="statusColor(item.extendedProps.status)" variant="tonal" size="small">
                  {{ statusLabel(item.extendedProps.status) }}
                </v-chip>
              </template>
              <template #item.bookingType="{ item }">
                {{ item.extendedProps.bookingTypeName || '-' }}
              </template>
              <template #item.requestedBy="{ item }">
                {{ item.extendedProps.requestedBy || '-' }}
              </template>
              <template #item.meetingReason="{ item }">
                <span class="reason-cell">{{ item.extendedProps.meetingReason || '-' }}</span>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { apiFetch } from '../api/client'

const fromDate = ref('')
const toDate = ref('')
const status = ref('all')
const statusOptions = [
  { label: 'الكل', value: 'all' },
  { label: 'قيد الانتظار', value: 'pending' },
  { label: 'مقبولة', value: 'approved' },
  { label: 'مرفوضة', value: 'rejected' },
]
const bookings = ref([])
const loading = ref(false)
const errorMessage = ref('')

function toInputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const headers = [
  { title: 'تاريخ البداية', key: 'startDate', align: 'start' },
  { title: 'التوقيت', key: 'startTime', align: 'start' },
  { title: 'تاريخ النهاية', key: 'endDate', align: 'start' },
  { title: 'التوقيت', key: 'endTime', align: 'start' },
  { title: 'نوع الحجز', key: 'bookingType', align: 'start' },
  { title: 'الحالة', key: 'status', align: 'center' },
  { title: 'مقدم الطلب', key: 'requestedBy', align: 'start' },
  { title: 'سبب الاجتماع', key: 'meetingReason', align: 'start' },
]

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('ar', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleTimeString('ar', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function statusLabel(value) {
  const normalized = String(value || 'pending').trim().toLowerCase()
  if (normalized === 'approved') return 'مقبولة'
  if (normalized === 'rejected') return 'مرفوضة'
  return 'قيد الانتظار'
}

function statusColor(value) {
  const normalized = String(value || 'pending').trim().toLowerCase()
  if (normalized === 'approved') return 'success'
  if (normalized === 'rejected') return 'error'
  return 'warning'
}

function buildQueryParams() {
  const params = new URLSearchParams()
  if (fromDate.value) params.set('from', `${fromDate.value}T00:00:00`)
  if (toDate.value) params.set('to', `${toDate.value}T23:59:59`)
  if (status.value) params.set('status', status.value)
  return params.toString()
}

async function fetchBookings() {
  loading.value = true
  errorMessage.value = ''
  try {
    const query = buildQueryParams()
    const data = await apiFetch(`/api/bookings?${query}`)
    bookings.value = data.events || []
  } catch (error) {
    errorMessage.value = error.message || 'فشل تحميل الحجوزات'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 30)
  const end = new Date(today)
  end.setDate(today.getDate() + 30)
  fromDate.value = toInputDate(start)
  toDate.value = toInputDate(end)
  fetchBookings()
})
</script>

<style scoped>
.bookings-overview-view {
  max-width: 1300px;
  margin: 0 auto;
}

.overview-header-card {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  border-radius: 16px;
}

.filter-field {
  border-radius: 12px;
}

.search-button {
  min-width: 180px;
}

.overview-card {
  border-radius: 18px;
}

.bookings-table {
  width: 100%;
}

.reason-cell {
  display: block;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-actions {
  gap: 16px;
}
</style>
