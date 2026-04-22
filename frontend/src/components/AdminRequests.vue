<template>
  <div class="admin-requests">
    <v-card class="main-card" elevation="3">
      <v-card-title class="card-header">
        <v-icon class="me-3">mdi-clipboard-check-multiple</v-icon>
        طلبات الحجز المعلقة
        <v-chip
          color="warning"
          variant="flat"
          size="small"
          class="ms-3"
        >
          {{ requests.length }}
        </v-chip>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="ma-4 mb-0"
          closable
        >
          {{ error }}
        </v-alert>

        <v-progress-linear
          v-if="loading"
          indeterminate
          class="mb-4"
          color="primary"
        />

        <div v-if="!loading && requests.length === 0" class="empty-state">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-check-circle-outline</v-icon>
          <h3 class="text-h6 text-grey-lighten-1 mb-2">لا توجد طلبات معلقة</h3>
          <p class="text-body-2 text-grey-lighten-2">جميع الطلبات تمت مراجعتها</p>
        </div>

        <v-list v-else class="requests-list">
          <v-list-item
            v-for="request in requests"
            :key="request.id"
            class="request-item"
            :class="`request-item--${request.status || 'pending'}`"
          >
            <v-card
              variant="outlined"
              class="request-card"
              :class="`request-card--${request.status || 'pending'}`"
            >
              <v-card-text class="pa-4">
                <div class="request-header">
                  <div class="request-info">
                    <div class="d-flex align-center mb-2">
                      <v-chip
                        :color="getBookingTypeColor(request.bookingTypeColor)"
                        variant="flat"
                        size="small"
                        class="me-2"
                      >
                        <v-icon start size="16">mdi-tag</v-icon>
                        {{ request.bookingTypeName }}
                      </v-chip>
                      <v-chip
                        color="pending"
                        variant="outlined"
                        size="small"
                      >
                        <v-icon start size="16">mdi-clock-outline</v-icon>
                        معلق
                      </v-chip>
                    </div>

                    <div class="request-details">
                      <div class="detail-row">
                        <v-icon size="18" color="primary" class="me-2">mdi-calendar</v-icon>
                        <span class="detail-label">التاريخ:</span>
                        <span class="detail-value">{{ formatDate(request.start_time, 'date') }}</span>
                      </div>

                      <div class="detail-row">
                        <v-icon size="18" color="primary" class="me-2">mdi-clock-outline</v-icon>
                        <span class="detail-label">الوقت:</span>
                        <span class="detail-value">{{ formatDate(request.start_time, 'time') }} - {{ formatDate(request.end_time, 'time') }}</span>
                      </div>

                      <div class="detail-row">
                        <v-icon size="18" color="primary" class="me-2">mdi-account</v-icon>
                        <span class="detail-label">مقدم الطلب:</span>
                        <span class="detail-value font-weight-bold">{{ request.requestedBy }}</span>
                      </div>

                      <div class="detail-row">
                        <v-icon size="18" color="primary" class="me-2">mdi-text</v-icon>
                        <span class="detail-label">سبب الاجتماع:</span>
                        <span class="detail-value">{{ request.meeting_reason }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="request-actions">
                    <v-btn
                      color="approved"
                      variant="flat"
                      size="large"
                      prepend-icon="mdi-check"
                      @click="approve(request.id)"
                      :loading="loading"
                      class="action-btn approve-btn"
                    >
                      موافقة
                    </v-btn>

                    <v-btn
                      color="rejected"
                      variant="flat"
                      size="large"
                      prepend-icon="mdi-close"
                      @click="openReject(request)"
                      :loading="loading"
                      class="action-btn reject-btn"
                    >
                      رفض
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Reject Dialog -->
    <v-dialog
      v-model="rejectDialog"
      max-width="600"
      persistent
    >
      <v-card class="reject-dialog">
        <v-card-title class="dialog-header">
          <v-icon color="rejected" class="me-3">mdi-close-circle</v-icon>
          رفض طلب الحجز
        </v-card-title>

        <v-card-text class="pa-6">
          <v-alert
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            سيتم إشعار المستخدم برفض طلبه مع السبب المحدد
          </v-alert>

          <v-textarea
            v-model="rejectReason"
            label="سبب الرفض"
            placeholder="اكتب سبب الرفض بالتفصيل..."
            prepend-inner-icon="mdi-text"
            variant="outlined"
            rows="4"
            auto-grow
            density="comfortable"
            class="reject-reason"
          />
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="rejectDialog = false"
            :disabled="loading"
            class="cancel-btn"
          >
            إلغاء
          </v-btn>
          <v-btn
            color="rejected"
            variant="flat"
            size="large"
            :loading="loading"
            @click="submitReject"
            prepend-icon="mdi-send"
            class="submit-btn"
          >
            تأكيد الرفض
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { apiFetch } from '../api/client'

const loading = ref(false)
const error = ref(null)
const requests = ref([])

const rejectDialog = ref(false)
const rejectTarget = ref(null)
const rejectReason = ref('')

function formatDate(d, type = 'full') {
  const date = new Date(d)
  if (isNaN(date)) return ''

  if (type === 'date') {
    return date.toLocaleDateString('ar', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long'
    })
  } else if (type === 'time') {
    return date.toLocaleTimeString('ar', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return date.toLocaleString('ar', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getBookingTypeColor(color) {
  // إذا كان اللون موجوداً نستخدمه، وإلا نستخدم لون افتراضي
  return color || 'primary'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await apiFetch('/api/admin/requests')
    requests.value = data.requests || []
  } catch (e) {
    error.value = e.message || 'Failed to load requests'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function approve(id) {
  loading.value = true
  error.value = null
  try {
    await apiFetch(`/api/admin/requests/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'approve' }),
    })
    await load()
  } catch (e) {
    error.value = e.message || 'Approve failed'
  } finally {
    loading.value = false
  }
}

function openReject(r) {
  rejectTarget.value = r
  rejectReason.value = ''
  rejectDialog.value = true
}

async function submitReject() {
  if (!rejectTarget.value) return
  loading.value = true
  error.value = null
  try {
    await apiFetch(`/api/admin/requests/${rejectTarget.value.id}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        decision: 'reject',
        rejectReason: rejectReason.value,
      }),
    })
    rejectDialog.value = false
    rejectTarget.value = null
    await load()
  } catch (e) {
    error.value = e.message || 'Reject failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-requests {
  max-width: 1200px;
  margin: 0 auto;
}

.main-card {
  border-radius: 16px;
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  padding: 20px 24px;
}

.requests-list {
  padding: 0;
}

.request-item {
  padding: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.request-item:last-child {
  border-bottom: none;
}

.request-card {
  border-radius: 12px;
  margin: 16px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.request-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.request-card--pending {
  border-color: rgba(255, 152, 0, 0.3);
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 193, 7, 0.05) 100%);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.request-info {
  flex: 1;
}

.request-details {
  margin-top: 16px;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.detail-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  min-width: 100px;
}

.detail-value {
  color: rgba(0, 0, 0, 0.9);
}

.request-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

.action-btn {
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.approve-btn {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.reject-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(0, 0, 0, 0.5);
}

.reject-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  padding: 20px 24px;
}

.reject-reason :deep(.v-field) {
  border-radius: 8px;
}

.dialog-actions {
  padding: 20px 24px;
  background: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.cancel-btn {
  border-radius: 8px;
  font-weight: 500;
}

.submit-btn {
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}
</style>

