<template>
  <div class="admin-users">
    <v-card class="main-card" elevation="3">
      <v-card-title class="card-header">
        <v-icon class="me-3">mdi-account-group</v-icon>
        إدارة المستخدمين
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
        >
          {{ error }}
        </v-alert>

        <v-row class="mb-6">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="newUsername"
              label="اسم المستخدم"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="newPassword"
              label="كلمة المرور"
              type="password"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="newRole"
              :items="roleOptions"
              item-title="label"
              item-value="value"
              label="الصلاحية"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="1" class="d-flex align-end">
            <v-btn
              color="primary"
              variant="flat"
              size="large"
              @click="createUser"
              :loading="loading"
            >
              إضافة
            </v-btn>
          </v-col>
        </v-row>

        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

        <v-data-table
          :headers="headers"
          :items="users"
          :items-per-page="10"
          class="users-table"
          density="comfortable"
          item-key="id"
        >
          <template #item.role="{ item }">
            <v-chip :color="item.role === 'admin' ? 'primary' : 'info'" variant="tonal" size="small">
              {{ item.role === 'admin' ? 'أدمن' : 'مستخدم' }}
            </v-chip>
          </template>
          <template #item.createdAt="{ item }">
            {{ formatDate(item.created_at) }}
          </template>
          <template #item.actions="{ item }">
            <v-btn icon variant="flat" @click="openEdit(item)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon variant="flat" color="error" @click="confirmDelete(item)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="editDialog" max-width="540">
      <v-card>
        <v-card-title>تعديل مستخدم</v-card-title>
        <v-card-text>
          <v-select
            v-model="editRole"
            :items="roleOptions"
            item-title="label"
            item-value="value"
            label="الصلاحية"
            variant="outlined"
            density="comfortable"
          />
          <v-text-field
            v-model="editPassword"
            label="كلمة المرور الجديدة (اختياري)"
            type="password"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="closeEditDialog">إلغاء</v-btn>
          <v-btn color="primary" variant="flat" :loading="loading" @click="updateUser">حفظ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title>حذف مستخدم</v-card-title>
        <v-card-text>
          هل أنت متأكد من حذف المستخدم <strong>{{ deleteTarget?.username }}</strong>؟
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="deleteDialog = false">إلغاء</v-btn>
          <v-btn color="error" variant="flat" :loading="loading" @click="deleteUser">حذف</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { apiFetch } from '../api/client'

const users = ref([])
const loading = ref(false)
const error = ref(null)
const newUsername = ref('')
const newPassword = ref('')
const newRole = ref('user')
const editDialog = ref(false)
const editTarget = ref(null)
const editRole = ref('user')
const editPassword = ref('')
const deleteDialog = ref(false)
const deleteTarget = ref(null)

const roleOptions = [
  { label: 'أدمن', value: 'admin' },
  { label: 'مستخدم عادي', value: 'user' },
]

const headers = [
  { title: 'اسم المستخدم', key: 'username', align: 'start' },
  { title: 'الصلاحية', key: 'role', align: 'center' },
  { title: 'أنشئ في', key: 'createdAt', align: 'start' },
  { title: 'إجراءات', key: 'actions', align: 'center' },
]

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

async function loadUsers() {
  loading.value = true
  error.value = null
  try {
    const data = await apiFetch('/api/admin/users')
    users.value = data.users || []
  } catch (e) {
    error.value = e.message || 'فشل تحميل المستخدمين'
  } finally {
    loading.value = false
  }
}

async function createUser() {
  if (!newUsername.value || !newPassword.value) {
    error.value = 'يرجى إدخال اسم مستخدم وكلمة مرور'
    return
  }

  loading.value = true
  error.value = null
  try {
    await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        username: newUsername.value.trim(),
        password: newPassword.value,
        role: newRole.value,
      }),
    })
    newUsername.value = ''
    newPassword.value = ''
    newRole.value = 'user'
    await loadUsers()
  } catch (e) {
    error.value = e.message || 'فشل إنشاء المستخدم'
  } finally {
    loading.value = false
  }
}

function openEdit(user) {
  editTarget.value = user
  editRole.value = user.role
  editPassword.value = ''
  editDialog.value = true
}

function closeEditDialog() {
  editDialog.value = false
  editTarget.value = null
  editPassword.value = ''
}

async function updateUser() {
  if (!editTarget.value) return
  loading.value = true
  error.value = null
  try {
    await apiFetch(`/api/admin/users/${editTarget.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        role: editRole.value,
        password: editPassword.value || null,
      }),
    })
    editDialog.value = false
    await loadUsers()
  } catch (e) {
    error.value = e.message || 'فشل تحديث المستخدم'
  } finally {
    loading.value = false
  }
}

function confirmDelete(user) {
  deleteTarget.value = user
  deleteDialog.value = true
}

async function deleteUser() {
  if (!deleteTarget.value) return
  loading.value = true
  error.value = null
  try {
    await apiFetch(`/api/admin/users/${deleteTarget.value.id}`, {
      method: 'DELETE',
    })
    deleteDialog.value = false
    await loadUsers()
  } catch (e) {
    error.value = e.message || 'فشل حذف المستخدم'
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-users {
  max-width: 1200px;
  margin: 0 auto;
}

.main-card {
  border-radius: 18px;
}

.card-header {
  align-items: center;
}

.users-table {
  width: 100%;
}
</style>
