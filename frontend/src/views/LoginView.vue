<template>
  <div class="login-view">
    <v-container fluid class="fill-height login-container">
      <v-row class="justify-center align-center">
        <v-col cols="12" md="8" lg="6" xl="4">
          <v-card
            class="login-card"
            elevation="8"
            :loading="auth.loading"
          >
            <!-- Header -->
            <div class="login-header">
              <v-icon size="64" class="mb-4">mdi-account-circle</v-icon>
              <h1 class="text-h4 font-weight-bold mb-2">تسجيل الدخول</h1>
              <p class="text-body-1 opacity-8 mb-0">
                أدخل بياناتك للوصول إلى نظام الحجز
              </p>
            </div>

            <!-- Form -->
            <v-card-text class="pa-8">
              <v-form @submit.prevent="onSubmit" class="login-form">
                <v-text-field
                  v-model="username"
                  label="اسم المستخدم"
                  placeholder="أدخل اسم المستخدم"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                  required
                  autocomplete="username"
                  class="login-field"
                  :rules="[v => !!v || 'اسم المستخدم مطلوب']"
                />

                <v-text-field
                  v-model="password"
                  label="كلمة المرور"
                  placeholder="أدخل كلمة المرور"
                  prepend-inner-icon="mdi-lock"
                  variant="outlined"
                  type="password"
                  density="comfortable"
                  required
                  autocomplete="current-password"
                  class="login-field"
                  :rules="[v => !!v || 'كلمة المرور مطلوبة']"
                />

                <v-alert
                  v-if="auth.error"
                  type="error"
                  variant="tonal"
                  class="mt-4 error-alert"
                  closable
                >
                  <v-icon start>mdi-alert-circle</v-icon>
                  {{ auth.error }}
                </v-alert>

                <v-btn
                  class="mt-6 login-btn"
                  color="primary"
                  size="x-large"
                  block
                  type="submit"
                  :disabled="auth.loading"
                  :loading="auth.loading"
                  prepend-icon="mdi-login"
                >
                  {{ auth.loading ? 'جاري تسجيل الدخول...' : 'دخول' }}
                </v-btn>
              </v-form>

              <!-- Demo Credentials -->
              <v-alert
                type="info"
                variant="tonal"
                class="mt-6 demo-alert"
              >
                <div class="text-body-2">
                  <strong>بيانات تجريبية:</strong><br>
                  اسم المستخدم: <code>admin</code><br>
                  كلمة المرور: <code>admin123</code>
                </div>
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Background Pattern -->
    <div class="background-pattern">
      <div class="pattern-circle pattern-circle-1"></div>
      <div class="pattern-circle pattern-circle-2"></div>
      <div class="pattern-circle pattern-circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')

async function onSubmit() {
  await auth.login({ username: username.value, password: password.value })
  router.push('/')
}
</script>

<style scoped>
.login-view {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.login-container {
  position: relative;
  z-index: 2;
}

.login-card {
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  text-align: center;
  padding: 40px 24px 32px;
}

.login-form {
  max-width: 400px;
  margin: 0 auto;
}

.login-field {
  margin-bottom: 16px;
}

.login-field :deep(.v-field) {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
}

.login-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  box-shadow: 0 8px 20px rgba(25, 118, 210, 0.3);
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(25, 118, 210, 0.4);
}

.error-alert {
  border-radius: 8px;
}

.demo-alert {
  border-radius: 12px;
  background: rgba(25, 118, 210, 0.1);
  border: 1px solid rgba(25, 118, 210, 0.2);
}

.demo-alert code {
  background: rgba(25, 118, 210, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

.pattern-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.pattern-circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: 0s;
}

.pattern-circle-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: 2s;
}

.pattern-circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 10%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.opacity-8 {
  opacity: 0.8;
}
</style>

