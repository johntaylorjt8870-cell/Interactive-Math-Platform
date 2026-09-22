# النشر على استضافة Node.js (خارج Vercel)

دليل عملي لنشر المنصة على أي مزوّد يشغّل خادم Node.js: Railway · Render ·
Fly.io · Koyeb · Northflank · Coolify · Dokploy · خادم خاص (VPS) خلف nginx.

المنصة **تطبيق Next.js 16 بخادم حقيقي** (App Router + مسارات API + بوابة في
`src/proxy.ts`)، فلا يصلح لها استضافة ثابتة (GitHub Pages أو أي مضيف ملفات
ساكنة): لا صفحات ساكنة فقط، بل خادم يلزمه أن ينفّذ البوابة والتصحيح الخادمي.

> هذا الدليل لا يغيّر معمارية الأمان: البوابة وكلمة المرور والتصحيح الخادمي
> ومفتاح المعلم تبقى كما هي. كل ما هنا تهيئة نشر.

---

## 1) الخلاصة السريعة

```bash
# على المزوّد (أو في صورة Docker)
npm ci                 # يشمل devDependencies: البناء يحتاجها
npm run build          # لا يحتاج أي سرّ ولا قاعدة بيانات
npm start              # next start — يقرأ PORT ويستمع على 0.0.0.0

# متغيّرات البيئة (تُضبط في لوحة المزوّد، لا في ملف مرفوع)
SITE_PASSWORD=<كلمة مرور الموقع>          # إلزامية في الإنتاج
TEACHER_KEY_PASSWORD=<كلمة مرور المعلم>   # اختيارية — بدونها فضاء المعلم مغلق
# DATABASE_URL اختيارية تمامًا — اتركها فارغة إن لم يكن لديك قاعدة بيانات
```

فحص الصحة الذي يُعطى للمزوّد: **`/api/health`** (مستثنى من البوابة، بلا سرّ).

## 2) المتطلبات

| البند | القيمة | المرجع |
|---|---|---|
| Node.js | `>= 20.9.0` — والموصى به **22 LTS** (نفس ما في CI) | `node_modules/next/package.json` → `engines` |
| مدير الحزم | npm مع `package-lock.json` (`npm ci`) | المستودع |
| قاعدة بيانات | **غير مطلوبة** | المحتوى ملفات TypeScript ثابتة |
| ذاكرة الخادم | 256–512MB مريحة (الاستهلاك المقيس ≈ 130–300MB) | قياس محلي |
| قرص دائم/Volumes | **غير مطلوب** — لا كتابة على القرص في زمن التشغيل | فحص الكود |
| زمن الجهوزية | أقل من ثانية محليًا (`Ready in ~150–260ms`) | `npx next start` |

حجم الأثر: `.next` ≈ 13MB · `node_modules` ≈ 670MB.

## 3) متغيّرات البيئة

المصدر المعياري للأسماء والشرح: `.env.example` (المستودع لا يحمل أي قيمة
حقيقية، و`.gitignore` يستثني كل ملفات `.env`).

| المتغيّر | إلزامي في الإنتاج؟ | إن غاب | متى يُقرأ |
|---|---|---|---|
| `SITE_PASSWORD` | **نعم** | الصفحات المحمية كلها **503** (fail-closed) وصفحة `/gate/not-configured` | زمن الطلب — لا يُدمج في حزمة البناء |
| `TEACHER_KEY_PASSWORD` | اختياري وظيفيًا | `/api/teacher-key` يردّ 503 (فضاء المعلم لا يعمل) | زمن الطلب |
| `DATABASE_URL` | لا | `/api/health` يردّ 200 مع `database: "not-configured"` | زمن أول استعلام فقط |

قواعد ملزمة:

- **لا** تستخدم `NEXT_PUBLIC_*` لأي منهما — الاستيراد من مكوّن عميل كان سيكشف السرّ. اختبار `npm run test:gate` يحرس هذا.
- القيم تُقرأ **زمن التشغيل**: تغيير `SITE_PASSWORD` وتشغيل الخادم من جديد يكفي — **بلا إعادة بناء**.
- ⚠️ إن ضُبط `DATABASE_URL` ولم يكن الاتصال ناجحًا، يردّ `/api/health` بحالة **500** → أكثر المنصّات ستعتبر النشر غير سليم. لذلك: اضبطها فقط عند وجود قاعدة بيانات فعلية.
- في الإنتاج لا تشغّل الخادم بـ `NODE_ENV=development`: القفل الاحتياطي (503 عند غياب الكلمة) مبنيّ على وضع الإنتاج. `next start` يضبط `NODE_ENV=production` تلقائيًا.

## 4) البناء والتشغيل

```bash
npm ci                # تثبيت مطابق للقفل
npm run build         # next build (Turbopack) — نُفِّذ بنجاح: 9 صفحات، منها SSG لصفحات الدروس
npm start             # next start
```

- **PORT**: `next start` يحترمه (`PORT=8080 npm start`) — هكذا تضبطه معظم المنصّات.
- **العنوان**: `next start` يستمع على `0.0.0.0` افتراضيًا، و**يتجاهل** متغيّر `HOSTNAME` (مهم في الحاويات التي تضبط `HOSTNAME` على معرّف الحاوية).
- القائمة الكاملة للمسارات تُطبع بعد البناء: `/` · `/algebra` · `/geometry` · `/lesson/[id]` · `/gate` · `/gate/not-configured` · `/api/{gate,grade,teacher-key,health}` · `Proxy (Middleware)`.
- `/dev/lesson-shell` يردّ **404** في الإنتاج (مقصود).
- إضافة درس جديد تعني **إعادة بناء** (صفحات الدروس تُولَّد مسبقًا عبر `generateStaticParams`).

## 5) HTTPS إلزامي

الكوكي `site_access` يُضبط بـ `Secure` في الإنتاج. النتيجة العملية:

- على `http://` لا يخزّنه المتصفح → لا يكتمل الدخول أبدًا. **يجب** أن يوفّر المزوّد TLS (أو وسيط عكسي بـ HTTPS).
- إعادة توجيه البوابة **نسبية** (`location: /gate?next=…`)، فتعمل خلف أي وسيط عكسي أو نطاق مخصّص بلا ضبط إضافي.
- إن كنت خلف nginx/Caddy، مرّر `Host` و`X-Forwarded-Proto` كالمعتاد (التطبيق لا يعتمد عليهما في الأمان، لكنها ممارسة سليمة).

## 6) فحص الصحة والمراقبة

| الفحص | المتوقع |
|---|---|
| `GET /api/health` | `200 {"ok":true,"database":"not-configured"}` (بلا قاعدة بيانات) |
| `GET /` بلا كوكي | `307` إلى `/gate?next=%2F` |
| `POST /api/gate` بكلمة خاطئة | `401` |

استخدم `/api/health` كـ **health check path** في المزوّد: لا يمرّ بالبوابة، ولا يحتاج كلمة مرور، ولا يعتمد على قاعدة بيانات.

## 7) الجلسات والتوسّع الأفقي

- لا يوجد مخزن جلسات خادمي: الجلسة كوكي `HttpOnly` موقَّع بـ HMAC-SHA-256 مفتاحه `SITE_PASSWORD`.
- لذلك يمكن تشغيل **أكثر من نسخة** خلف موازن تحميل، بشرط أن تحمل كل النسخ **نفس** `SITE_PASSWORD`. لا حاجة لـ sticky sessions.
- تقدّم الطالب في `localStorage` داخل المتصفح — لا قرص ولا قاعدة بيانات.
- **تغيير `SITE_PASSWORD` = خروج جماعي فوري** لكل المستخدمين (كل الكوكيات القديمة تصبح غير صحيحة)، بلا إعادة نشر. مفيد عند تسرّب الكلمة.

## 8) التخزين المؤقت (CDN) — مهم

صفحات الموقع تُبنى مسبقًا، وNext أرسل لها قبل هذه الدفعة
`Cache-Control: s-maxage=31536000` بلا `Vary: Cookie`. أي وسيط تخزين
**مشترك** أمام الخادم (Cloudflare أو CDN أو وسيط عكسي يخزّن HTML) كان يمكن أن
يحفظ صفحة محمية ثم يقدّمها لزائر بلا كوكي — لأن البوابة تتحقّق على الخادم قبل
الرد، ولا تتحكّم في ترويسات التخزين التي يراها الوسيط.

المعالجة في `next.config.ts` (تهيئة نشر لا تمسّ البوابة):

| المسار | الترويسة |
|---|---|
| HTML ومسارات `/api/*` | `Cache-Control: private, no-store, max-age=0` |
| `/_next/static/*` و`/_next/image/*` و`favicon.ico` | بلا تغيير: `public, max-age=31536000, immutable` |

اختبار آلي يحرس ذلك: `npm run test:gate:e2e -- <url>` (قسم «تخزين الاستجابات»).
الثمن: ذاكرة الـ prefetch في المتصفح لا يُعاد استخدامها بين التنقّلات (طلبات
RSC أكثر قليلًا). إن فُضِّل ضبط ذلك على مستوى المزوّد وحده، يمكن حذف المقطع من
`next.config.ts` وإضافة قاعدة «لا تخزّن HTML» عند الـ CDN.

## 9) وصفات المزوّدين

| المزوّد | Build | Start | ملاحظات |
|---|---|---|---|
| Railway | `npm ci && npm run build` | `npm start` | يضبط `PORT` تلقائيًا؛ أضف المتغيّرات في Variables |
| Render (Web Service) | `npm ci && npm run build` | `npm start` | Health Check Path: `/api/health`؛ Node 22 |
| Fly.io | `npm ci && npm run build` | `npm start` | يحتاج `internal_port = 3000` و`[env] PORT = "3000"`؛ `fly secrets set SITE_PASSWORD=…` |
| Koyeb / Northflank | `npm ci && npm run build` | `npm start` | اضبط منفذ HTTP = `PORT` |
| VPS + nginx/Caddy | `npm ci && npm run build` | `npm start` (systemd) | TLS عبر Caddy/Let's Encrypt — الكوكي `Secure` يلزمه HTTPS |
| Coolify / Dokploy | Dockerfile أو Nixpacks | `npm start` | اضبط المتغيّرات كـ Secrets |

خدمة systemd مختصرة على VPS:

```ini
[Unit]
Description=Interactive Math Platform
After=network.target

[Service]
WorkingDirectory=/srv/math-platform
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/etc/math-platform.env      # يحوي SITE_PASSWORD وغيره، بصلاحيات 600
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

### Docker (اختياري)

المستودع لا يحوي Dockerfile. أبسط صورة تحتفظ بالأمر `next start`:

```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3000
CMD ["npm", "start"]
```

⚠️ لا تفعّل `output: "standalone"` في `next.config.ts` إلا إن كنت ستبدّل أمر
التشغيل إلى `node .next/standalone/server.js` **مع نسخ `.next/static`**؛ فـ
`next start` يرفض العمل معه (تحذير مختبَر: «next start does not work with
output: standalone»). أبقِ التهيئة كما هي إن أردت `npm start`.

## 10) التحقّق بعد النشر

```bash
# 1) الخدمة حيّة
curl -s https://<النطاق>/api/health

# 2) البوابة تعمل (متوقّع: 307 إلى /gate)
curl -s -o /dev/null -w '%{http_code}\n' https://<النطاق>/

# 3) الحزمة الكاملة عبر HTTP على الخادم المنشور (72 تحقّقًا)
SITE_PASSWORD=<كلمة الموقع الحقيقية> npm run test:gate:e2e -- https://<النطاق>

# 4) البناء والصحة العامة قبل النشر (نفس ما في CI)
npm run verify
```

بعد الدخول يدويًا، تأكّد من: `/` · `/algebra` · `/geometry` ·
`/lesson/algebra-u1-l1` · فضاء المعلم في الدرس (بـ `TEACHER_KEY_PASSWORD`).

## 11) مسائل معروفة (خارج نطاق هذه الدفعة)

- خطوط Google تُجلب من `fonts.googleapis.com` في المتصفح (ليست حاجة بناء). الشبكات المقيّدة تحتاج استضافة الخطوط محليًا لاحقًا.
- لا يوجد `robots.txt` ولا `sitemap.xml` (يردّان 404)، ولا ترويسة `X-Robots-Tag`؛ صفحات الدخول تحمل `noindex` في بياناتها الوصفية.
- لا حدّ لمعدّل المحاولات على `/api/gate` ولا على `/api/grade`. الحماية الحالية: كلمة واحدة + مقارنة بزمن ثابت. إضافة تحديد المعدّل تحتاج مخزنًا مشتركًا (Redis/DB) — عمل قادم.
- لا ترويسات CSP/HSTS من التطبيق؛ تُضاف عادة في الـ CDN أو الوسيط العكسي.
