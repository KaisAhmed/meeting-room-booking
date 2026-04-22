import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  direction: 'rtl',
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976d2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          pending: '#FF9800', // أصفر للطلبات المعلقة
          approved: '#4CAF50', // أخضر للمقبولة
          rejected: '#F44336', // أحمر للمرفوضة
          background: '#FAFAFA',
          surface: '#FFFFFF',
        },
      },
    },
  },
  components,
  directives,
})

export default vuetify

