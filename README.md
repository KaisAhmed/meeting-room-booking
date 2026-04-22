# حجز قاعة الاجتماعات (Vue + Node + SQL Server)

مشروع بسيط لتسجيل الدخول وحجز مواعيد قاعة اجتماعات مع لوحة Admin للموافقة/الرفض.

## التقسيم
- `frontend/` : Vue.js + Vuetify + FullCalendar
- `backend/` : Node.js + Express + SQL Server

## متطلبات قاعدة البيانات
قبل التشغيل نفّذ سكربت `backend/src/db/init.sql` (ومعه `seed.sql` اختياريًا).

## تشغيل المشروع
1. إعداد متغيرات البيئة في `backend/.env` اعتمادًا على `backend/.env.example`
2. تشغيل Backend:
   - من داخل `backend/`: `npm install` ثم `npm run dev`
3. تشغيل Frontend:
   - من داخل `frontend/`: `npm install` ثم `npm run dev`

> ملاحظة: جلسات الـ Login مخزنة في SQL Server عبر `connect-mssql-v2`.

