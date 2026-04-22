<template>
  <div class="booking-view">
    <!-- Header Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card
          class="header-card"
          elevation="3"
          color="primary"
          dark
        >
          <v-card-text class="text-center pa-6">
            <v-icon size="48" class="mb-3">mdi-calendar-edit</v-icon>
            <h1 class="text-h5 font-weight-bold mb-2">التقويم وطلب الحجز</h1>
            <p class="text-body-1 opacity-9 mb-0">
              اضغط على اليوم داخل التقويم لاختيار نوع الحجز والوقت وسبب الاجتماع
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Legend -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card variant="outlined" class="legend-card">
          <v-card-text class="pa-4">
            <div class="d-flex justify-center align-center gap-6 flex-wrap">
              <div class="legend-item">
                <v-icon color="pending" size="20" class="me-2">mdi-circle</v-icon>
                <span class="text-body-2">معلق (في انتظار الموافقة)</span>
              </div>
              <div class="legend-item">
                <v-icon color="approved" size="20" class="me-2">mdi-circle</v-icon>
                <span class="text-body-2">مقبول</span>
              </div>
              <div class="legend-item">
                <v-icon color="rejected" size="20" class="me-2">mdi-circle</v-icon>
                <span class="text-body-2">مرفوض</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Calendar -->
    <v-row>
      <v-col cols="12">
        <v-card
          class="calendar-card"
          elevation="2"
        >
          <v-card-text class="pa-0">
            <FullCalendar
              ref="calendarRef"
              :options="calendarOptions"
              :events="events"
              class="calendar"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Booking Dialog -->
    <v-dialog
      v-model="dialog"
      max-width="700"
      persistent
    >
      <v-card class="booking-dialog">
        <v-card-title class="dialog-header">
          <v-icon class="me-3">mdi-calendar-plus</v-icon>
          طلب حجز جديد
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="closeDialog"
          />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                :value="selectedDateLabel"
                label="التاريخ المحدد"
                readonly
                prepend-inner-icon="mdi-calendar"
                variant="outlined"
                density="comfortable"
                class="date-field"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="bookingTypeId"
                :items="types"
                item-title="name"
                item-value="id"
                label="نوع الحجز"
                prepend-inner-icon="mdi-tag"
                variant="outlined"
                density="comfortable"
                return-object="false"
                class="type-select"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="fromTime"
                :items="hours"
                label="وقت البداية"
                prepend-inner-icon="mdi-clock-start"
                variant="outlined"
                density="comfortable"
                class="time-field"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="toTime"
                :items="hours"
                label="وقت النهاية"
                prepend-inner-icon="mdi-clock-end"
                variant="outlined"
                density="comfortable"
                class="time-field"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="meetingReason"
                label="سبب الاجتماع"
                placeholder="اكتب سبب الاجتماع بالتفصيل..."
                prepend-inner-icon="mdi-text"
                variant="outlined"
                auto-grow
                rows="3"
                density="comfortable"
                class="reason-field"
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="conflictMessage"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            {{ conflictMessage }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="closeDialog"
            class="cancel-btn"
          >
            إلغاء
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            :loading="submitting"
            @click="submitBooking"
            :disabled="!!conflictMessage"
            prepend-icon="mdi-check"
            class="submit-btn"
          >
            تأكيد الحجز
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import arLocale from '@fullcalendar/core/locales/ar'

import { apiFetch } from '../api/client'

const calendarRef = ref(null)
const events = ref([])
const types = ref([])

const dialog = ref(false)
const submitting = ref(false)
const selectedDate = ref(null) // Date

const bookingTypeId = ref(null)
const fromTime = ref('09:00')
const toTime = ref('10:00')
const meetingReason = ref('')

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatTimeFromDate(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

const hours = computed(() => {
  const items = []
  for (let h = 7; h <= 19; h++) {
    items.push(`${pad2(h)}:00`)
    items.push(`${pad2(h)}:30`)
  }
  return items
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  return selectedDate.value.toLocaleDateString('ar', { year: 'numeric', month: '2-digit', day: '2-digit' })
})

const currentRange = ref({ from: null, to: null })
const conflictMessage = ref('')

function normalizeStatus(status) {
  if (!status) return 'pending'
  const value = String(status).trim().toLowerCase()
  if (['approved', 'مقبولة', 'accepted'].includes(value)) return 'approved'
  if (['rejected', 'مرفوضة', 'declined'].includes(value)) return 'rejected'
  return 'pending'
}

function getEventRange(event) {
  return {
    start: new Date(event.start),
    end: new Date(event.end),
    status: normalizeStatus(event.extendedProps?.status),
  }
}

function isRangeOverlap(rangeA, rangeB) {
  return rangeA.start < rangeB.end && rangeA.end > rangeB.start
}

function isBlockedRange(start, end) {
  const requested = { start, end }
  return events.value.some((evt) => {
    const status = normalizeStatus(evt.extendedProps?.status)
    if (status !== 'approved' && status !== 'pending') return false
    return isRangeOverlap(requested, getEventRange(evt))
  })
}

async function fetchEvents(from, to) {
  const data = await apiFetch(`/api/bookings?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`)
  events.value = data.events || []
}

function openDialogForDate(date, endDate = null) {
  selectedDate.value = date
  fromTime.value = formatTimeFromDate(date)
  toTime.value = endDate ? formatTimeFromDate(endDate) : (() => {
    const nextHour = new Date(date)
    nextHour.setHours(date.getHours() + 1)
    nextHour.setMinutes(date.getMinutes())
    if (nextHour.getHours() > 19 || (nextHour.getHours() === 19 && nextHour.getMinutes() > 30)) {
      nextHour.setHours(19)
      nextHour.setMinutes(30)
    }
    return formatTimeFromDate(nextHour)
  })()
  meetingReason.value = ''
  conflictMessage.value = ''
  bookingTypeId.value = types.value[0]?.id || null
  dialog.value = true
}

function closeDialog() {
  dialog.value = false
  conflictMessage.value = ''
}

function validateBookingRange(start, end) {
  if (end <= start) {
    conflictMessage.value = 'وقت النهاية يجب أن يكون بعد وقت البداية'
    return false
  }

  if (isBlockedRange(start, end)) {
    conflictMessage.value = 'هذه المدة محجوزة بالفعل أو قيد الانتظار. الرجاء اختيار وقت آخر.'
    return false
  }

  conflictMessage.value = ''
  return true
}

async function submitBooking() {
  if (!selectedDate.value) return
  if (!bookingTypeId.value) return

  const [fh, fm] = fromTime.value.split(':').map(Number)
  const [th, tm] = toTime.value.split(':').map(Number)

  const start = new Date(selectedDate.value)
  start.setHours(fh, fm, 0, 0)

  const end = new Date(selectedDate.value)
  end.setHours(th, tm, 0, 0)

  if (!validateBookingRange(start, end)) {
    return
  }

  try {
    submitting.value = true
    await apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        bookingTypeId: bookingTypeId.value,
        start: start.toISOString(),
        end: end.toISOString(),
        meetingReason: meetingReason.value,
      }),
    })

    dialog.value = false
    if (currentRange.value.from && currentRange.value.to) {
      await fetchEvents(currentRange.value.from, currentRange.value.to)
    }
  } catch (e) {
    conflictMessage.value = e.message || 'فشل إرسال الطلب'
  } finally {
    submitting.value = false
  }
}

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locale: 'ar',
  locales: [arLocale],
  timeZone: 'local',
  initialView: 'timeGridWeek',
  height: 'auto',
  direction: 'rtl',
  selectable: true,
  selectMirror: true,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridWeek,timeGridDay',
  },
  dateClick: (info) => {
    openDialogForDate(info.date)
  },
  selectMirror: false,
  select: (info) => {
    openDialogForDate(info.start, info.end)
  },
  datesSet: async (arg) => {
    const from = arg.start
    const to = arg.end
    currentRange.value = { from, to }
    await fetchEvents(from, to)
  },
  eventDisplay: 'block',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  eventClassNames: (arg) => {
    if (arg.isMirror) {
      return []
    }
    const status = normalizeStatus(arg.event.extendedProps?.status)
    return ['booking-event', `booking-${status}`]
  },
  eventContent: (arg) => {
    if (arg.isMirror) {
      return null
    }

    const status = normalizeStatus(arg.event.extendedProps?.status)
    const isBooked = status === 'approved' || status === 'pending'
    const requester = arg.event.extendedProps?.requestedBy || 'مستخدم'
    const reason = arg.event.extendedProps?.meetingReason || ''
    const prefix = isBooked ? 'تم حجزه مسبقاً' : ''
    const titleText = `${prefix}${prefix ? ' — ' : ''}${requester}${reason ? ' — ' + reason : ''}`

    return {
      html: `<div class="fc-event-custom-content">${titleText}</div>`,
    }
  },
  eventDidMount: (info) => {
    if (info.isMirror) {
      return
    }

    const statusValue = info.event.extendedProps?.status
    const status = normalizeStatus(statusValue)
    const colors = {
      pending: { background: '#e53935', border: '#b71c1c', text: '#ffffff' },
      approved: { background: '#e53935', border: '#b71c1c', text: '#ffffff' },
      rejected: { background: '#ffebee', border: '#e53935', text: '#b71c1c' },
    }
    const chosenColor = colors[status] || colors.pending
    info.el.style.backgroundColor = chosenColor.background
    info.el.style.borderColor = chosenColor.border
    info.el.style.color = chosenColor.text
    info.el.style.borderWidth = '2px'
    info.el.style.borderStyle = 'solid'
    info.el.style.padding = '4px 8px'

    const reason = info.event.extendedProps?.meetingReason || ''
    if (reason) info.el.setAttribute('title', reason)
  },
}

onMounted(async () => {
  const data = await apiFetch('/api/booking-types')
  types.value = data.types || []
  bookingTypeId.value = types.value[0]?.id || null
})
</script>

<style scoped>
.booking-view {
  max-width: 1400px;
  margin: 0 auto;
}

.header-card {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  border-radius: 16px;
}

.legend-card {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-card {
  border-radius: 16px;
  overflow: hidden;
}

.calendar {
  max-width: 100%;
  margin: 0 auto;
}

/* FullCalendar customizations */
:deep(.fc) {
  font-family: inherit;
}

:deep(.fc-header-toolbar) {
  margin-bottom: 1.5em !important;
  flex-wrap: wrap;
  gap: 0.5em;
}

:deep(.fc-button) {
  border-radius: 8px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.2s ease !important;
}

:deep(.fc-button:hover) {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

:deep(.fc-button-active) {
  background-color: #1976d2 !important;
  border-color: #1976d2 !important;
}

:deep(.fc-event) {
  border-radius: 6px !important;
  border: none !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.2s ease !important;
}

:deep(.fc-event:hover) {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

:deep(.fc-event.booking-event) {
  border-radius: 10px !important;
  border-width: 2px !important;
}

:deep(.fc-event.booking-pending) {
  background: #e53935 !important;
  border-color: #b71c1c !important;
  color: #ffffff !important;
}

:deep(.fc-event.booking-approved) {
  background: #e53935 !important;
  border-color: #b71c1c !important;
  color: #ffffff !important;
}

:deep(.fc-event.booking-rejected) {
  background: #ffebee !important;
  border-color: #e53935 !important;
  color: #b71c1c !important;
}

:deep(.fc-event.booking-blocked) {
  background: #e53935 !important;
  border-color: #b71c1c !important;
  color: #ffffff !important;
}

:deep(.fc-event-custom-content) {
  white-space: normal !important;
  line-height: 1.2 !important;
}

:deep(.fc-timegrid-slot) {
  height: 3em !important;
}

.booking-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  padding: 20px 24px;
}

.date-field :deep(.v-field) {
  border-radius: 8px;
}

.type-select :deep(.v-field) {
  border-radius: 8px;
}

.time-field :deep(.v-field) {
  border-radius: 8px;
}

.reason-field :deep(.v-field) {
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
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.opacity-9 {
  opacity: 0.9;
}

.gap-6 {
  gap: 24px;
}
</style>

