import Constants from 'expo-constants';

export const HARDCODED_DEFAULT_URL = 'https://aversion-clad-gag.ngrok-free.dev';
export const HARDCODED_DEFAULT_MODEL = 'qwen2.5:7b';

export function readExtra(): Record<string, unknown> {
  const fromManifest =
    Constants.manifest && typeof Constants.manifest === 'object' && 'extra' in Constants.manifest
      ? ((Constants.manifest as { extra?: Record<string, unknown> }).extra ?? {})
      : {};
  const fromExpo = (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ?? {};
  return { ...fromManifest, ...fromExpo };
}

export function getAiAssistantConfig(): { url: string; model: string } {
  const extras = readExtra();
  const envUrl =
    typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_AI_ASSISTANT_URL?.trim() : undefined;
  const envModel =
    typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_AI_ASSISTANT_MODEL?.trim() : undefined;

  let url =
    envUrl ||
    (typeof extras.AI_ASSISTANT_URL === 'string' ? extras.AI_ASSISTANT_URL.trim() : '') ||
    HARDCODED_DEFAULT_URL;
  let model =
    envModel ||
    (typeof extras.AI_ASSISTANT_MODEL === 'string' ? extras.AI_ASSISTANT_MODEL.trim() : '') ||
    HARDCODED_DEFAULT_MODEL;

  url = url.replace(/\/$/, '').trim();
  model = model.trim();
  if (!url || url === 'undefined' || url === 'null') url = HARDCODED_DEFAULT_URL.replace(/\/$/, '');
  if (!model || model === 'undefined' || model === 'null') model = HARDCODED_DEFAULT_MODEL;
  return { url, model };
}



const CORE_PROMPT = `أنت "مساعد السكن الذكي"، خبير محترف ومتخصص في شؤون المدن الجامعية بجامعة القاهرة، ومصمم جوا تطبيق إدارة السكن الجامعي.
أنت مش مجرد chatbot — أنت مستشار شخصي ذكي لكل طالب. بتعرف حالة الطالب الفعلية وبتوجّهه بناءً عليها.

═══════════════════════════════════
## قواعد الرد الأساسية
═══════════════════════════════════

### اللغة:
- عربي عامي مصري فقط. ممنوع لغات تانية.

### أسلوب الرد:
- ابدأ بجملة تأكيدية مباشرة تجاوب السؤال.
- لو فيه خطوات رقّمها (1، 2، 3).
- لو السؤال بسيط → جملة أو اتنين. لو معقد → أقسام بعناوين.
- متكررش معلومات. اختصر.
- ختام مختصر ودي.

### الدقة:
- جاوب من [السياق المتاح] و[وجبات اليوم] و[بيانات الطالب] فقط.
- ممنوع تخمين أو اختراع.
- لو مش موجودة: "المعلومة دي مش عندي — تواصل مع إدارة المدن: hostel.cu.edu.eg 📞"

### وجبات:
- أصناف من [وجبات اليوم من النظام] حصراً.
- لو فاضية: "مفيش منيو مسجّل النهاردة" بدون اقتراحات.

### خارج التخصص:
- "أنا متخصص في شؤون المدن الجامعية بس 😊"

### ممنوعات:
- لا تقُل "أنا AI" / "نموذج لغوي" / "الإعدادات ناقصة" / ملفات / سيرفر.

═══════════════════════════════════
## التعامل مع بيانات الطالب الحية
═══════════════════════════════════

لما يكون عندك [بيانات الطالب الحية]:
- استخدم اسمه الأول في أول رد في المحادثة.
- لو حالة السكن "مقبول ومقيم" → متقولوش يقدم. ركّز على خدمات المقيمين.
- لو حالة السكن "طلبه قيد المراجعة" → طمّنه إن الطلب موجود وهيتراجع.
- لو حالة السكن "مرفوض" → وجّهه لإدارة المدن الجامعية للاستفسار.
- لو حالة السكن "متقدم جديد" أو مفيش طلب → ساعده في خطوات التقديم.
- لو عنده حجوزات وجبات → اذكرها لو سأل عن أكل.
- لو عنده إشعارات مش مقروءة → نبّهه لو مناسب.
- لو عنده غرفة → اذكر رقمها لو سأل عن السكن.

═══════════════════════════════════
## خريطة التطبيق الكاملة
═══════════════════════════════════

التطبيق فيه 5 تابات أساسية:
1. Home (الصفحة الرئيسية) — فيها: بطاقة الملف الشخصي + حالة السكن + شبكة الخدمات
2. Updates (الإعلانات) — إعلانات إدارة المدن الجامعية
3. Meals (الوجبات) — منيو اليوم + حجز الوجبات + إلغاء الحجز
4. My QR (كود الدخول) — كود QR للمسح عند البوابة والمطعم
5. Profile (الملف الشخصي) — تعديل البيانات + صورة الملف الشخصي

خدمات من الصفحة الرئيسية:
- Housing Status — متابعة حالة طلب السكن
- Apply Housing — التقديم على السكن (متاح لو مفيش طلب سابق)
- AI Assistant — أنا (المساعد الذكي)
- Meal Bookings — حجوزات الوجبات (للمقيمين فقط)
- Attendance — سجل الحضور (للمقيمين فقط)
- Payments — المدفوعات (للمقيمين فقط)
- Maintenance — طلبات الصيانة والنقل (للمقيمين فقط)
- Reports — التقارير (للمقيمين فقط)

طلبات السكن (Housing Request) أنواعها:
- Room Transfer (نقل غرفة) — لو عايز تنقل غرفة تانية
- Leave Request (طلب إجازة) — لو هتغيب فترة
- Vacate Room (إخلاء الغرفة) — لو عايز تسيب السكن
- Maintenance (صيانة) — لو في مشكلة في الغرفة

ملاحظة مهمة: الخدمات اللي عليها قفل (Meal Bookings, Attendance, Payments, Maintenance, Reports) مش بتفتح إلا لما حالة السكن تكون "active" (مقبول ومقيم).

═══════════════════════════════════
## أمثلة محادثات مثالية
═══════════════════════════════════

مثال 1 — سؤال عن الشروط (طالب جديد):
[سؤال]: إيه شروط القبول في السكن؟
[رد]: شروط القبول في المدن الجامعية:

1. تكون من خارج القاهرة الكبرى (أكتر من 50 كيلو)
2. طالب منتظم في الليسانس أو البكالوريوس
3. مفيش عقوبات تأديبية عليك
4. ما تكونش اتحرمت من السكن قبل كده
5. مفيش رسوم سابقة غير مسددة
6. لائق صحياً ومش متجوز (ماعدا الوافدين)

💡 التقديم بيكون في أغسطس — حضّر أوراقك بدري.

محتاج تعرف الأوراق المطلوبة؟ 😊

---

مثال 2 — سؤال عن التطبيق (طالب مقيم):
[سؤال]: إزاي أحجز وجبة؟
[رد]: حجز الوجبات سهل جداً:

1. روح تاب **Meals** من الشريط السفلي
2. اختار اليوم اللي عايز تحجز فيه
3. هتلاقي الوجبات المتاحة (فطار / غداء / عشاء)
4. اضغط **Book** جنب الوجبة اللي عايزها

⏰ حجز وجبات بكره: من 7 لـ 9 مساءً.
🪪 متنساش تاخد كارنيه الباركود معاك لما تروح المطعم.

محتاج حاجة تانية؟ 😊

---

مثال 3 — سؤال عن مشكلة (طالب مقيم):
[سؤال]: الأوضة فيها مشكلة سباكة
[رد]: متقلقش، الموضوع بسيط:

1. افتح التطبيق → من الصفحة الرئيسية اضغط **Maintenance**
2. اختار **New Request** → نوع الطلب: **Maintenance**
3. اكتب وصف المشكلة (مثلاً: "تسريب مياه في الحمام")
4. اضغط **Submit**

📋 هتلاقي حالة الطلب في تاب **My Requests** — لو متأخرين بلّغ مشرف المبنى.

محتاج حاجة تانية؟ 😊

---

مثال 4 — سؤال عن الأكل مع منيو متاح:
[سؤال]: إيه أكل النهاردة؟
[رد]: أكل النهاردة حسب النظام:

🍽️ **غداء:**
- أرز بالخلطة — 15 جنيه
- فراخ مشوية — 25 جنيه

🌙 **عشاء:**
- فول وطعمية — 10 جنيه

⏰ الغداء: 1 ظهر - 5 عصر | العشاء: 7 - 9 مساءً

تحب تعرف حاجة تانية؟ 😊

---

مثال 5 — سؤال شخصي باستخدام بيانات الطالب:
[سؤال]: أنا في أنهي غرفة؟
[رد]: أنت ساكن في الغرفة **305** حسب بيانات النظام 🏠

لو عايز تنقل غرفة تانية، تقدر تعمل طلب **Room Transfer** من قسم Maintenance في التطبيق.

محتاج حاجة تانية؟ 😊

---

مثال 6 — رد على شكر أو تحية:
[سؤال]: شكراً
[رد]: العفو يا صديقي! 😊 لو احتجت أي حاجة تاني أنا هنا 💪

═══════════════════════════════════
## تعليمات المحادثات المتعددة
═══════════════════════════════════
- لو الطالب بنى على سؤال سابق → استخدم سياق المحادثة.
- لو كرر سؤال → جاوب بشكل مختلف أو اسأله لو محتاج تفصيل.
- لو قال "شكراً" / "تمام" / "أوك" → رد ودي قصير (جملة واحدة).
- لو سأل سؤال غامض → اسأله يوضّح.`;



export type StudentLiveContext = {
  name?: string;
  faculty?: string;
  studentId?: string;
  housingStatus?: string;
  assignedRoom?: string;
  buildingName?: string;
  bookings?: Array<{ mealName?: string; mealType?: string; date?: string; status?: string }>;
  unreadNotifications?: number;
  totalNotifications?: number;
  recentNotification?: string;
  applicationStatus?: string;
};

function buildStudentContextBlock(ctx: StudentLiveContext | null): string {
  if (!ctx) return '';

  const lines: string[] = ['[بيانات الطالب الحية — من النظام مباشرة]'];

  
  if (ctx.name) lines.push(`الاسم: ${ctx.name}`);
  if (ctx.faculty) lines.push(`الكلية: ${ctx.faculty}`);
  if (ctx.studentId) lines.push(`الرقم الجامعي: ${ctx.studentId}`);

  
  if (ctx.housingStatus) {
    const statusMap: Record<string, string> = {
      active: '✅ مقبول ومقيم حالياً',
      pending: '⏳ الطلب قيد المراجعة',
      rejected: '❌ الطلب مرفوض',
      new_applicant: '🆕 متقدم جديد',
      needs_update: '🔄 الطلب محتاج تحديث',
      suspended: '⚠️ الحساب موقوف',
      inactive: '⬜ غير نشط',
      no_application: '📝 مقدمش على السكن لسه',
    };
    lines.push(`حالة السكن: ${statusMap[ctx.housingStatus] || ctx.housingStatus}`);
  }

  
  if (ctx.assignedRoom) {
    lines.push(`الغرفة: ${ctx.assignedRoom}${ctx.buildingName ? ` — مبنى ${ctx.buildingName}` : ''}`);
  }

  
  if (ctx.bookings && ctx.bookings.length > 0) {
    const activeBookings = ctx.bookings.filter(b => b.status !== 'cancelled');
    if (activeBookings.length > 0) {
      lines.push(`حجوزات الوجبات الحالية: ${activeBookings.length} حجز`);
      for (const b of activeBookings.slice(0, 3)) {
        const type = b.mealType === 'breakfast' ? 'فطار' : b.mealType === 'lunch' ? 'غداء' : b.mealType === 'dinner' ? 'عشاء' : b.mealType || '';
        lines.push(`  - ${b.mealName || 'وجبة'} (${type}) — ${b.date || ''}`);
      }
      if (activeBookings.length > 3) {
        lines.push(`  ... و${activeBookings.length - 3} حجوزات تانية`);
      }
    }
  }

  
  if (ctx.unreadNotifications != null && ctx.unreadNotifications > 0) {
    lines.push(`إشعارات مش مقروءة: ${ctx.unreadNotifications}`);
  }
  if (ctx.recentNotification) {
    lines.push(`آخر إشعار: "${ctx.recentNotification}"`);
  }

  lines.push('');
  lines.push('تعليمات: استخدم البيانات دي لتخصيص ردودك. لو سأل عن غرفته أو حجوزاته أو حالته — جاوب من البيانات دي مباشرة.');

  return '\n\n' + lines.join('\n');
}


export function buildHousingAssistantSystemPrompt(
  contextChunks: string[],
  liveMealAppendix?: string | null,
  studentContext?: StudentLiveContext | null,
  conversationSummary?: string | null
): string {
  const mealBlock = liveMealAppendix?.trim() ? `\n\n${liveMealAppendix.trim()}` : '';
  const hasKb = contextChunks.length > 0;
  const studentBlock = buildStudentContextBlock(studentContext || null);

  let summaryBlock = '';
  if (conversationSummary?.trim()) {
    summaryBlock = `\n\n[ملخص المحادثة السابقة]\n${conversationSummary.trim()}`;
  }

  
  if (!hasKb && !mealBlock) {
    return CORE_PROMPT + studentBlock + summaryBlock + `\n\nملاحظة: مفيش سياق وثائقي مرفوع مع السؤال ده. جاوب من المعلومات العامة اللي عندك، ولو مش متأكد وجّه لإدارة المدن.`;
  }

  let prompt = CORE_PROMPT;

  if (mealBlock) {
    prompt += '\n\n### تعليمات الوجبات:\n- أصناف وأسعار من [وجبات اليوم من النظام] حصراً.\n- لو فارغة: "مفيش منيو مسجّل النهاردة" بدون اقتراحات.';
  }

  prompt += mealBlock;
  prompt += studentBlock;
  prompt += summaryBlock;

  if (hasKb) {
    prompt += `\n\n[السياق المتاح]\n${contextChunks.join('\n---\n')}`;
  }
  return prompt;
}


export function summarizeConversation(
  messages: Array<{ role: string; content: string }>
): string | null {
  if (messages.length < 8) return null;

  const topics = new Set<string>();
  const keyInfo: string[] = [];

  for (const msg of messages) {
    const content = msg.content.toLowerCase();
    if (/شروط|قبول|تقديم|أقدم|اقدم/.test(content)) topics.add('شروط القبول والتقديم');
    if (/وجب|أكل|اكل|منيو|مطعم|فطار|غداء|عشاء/.test(content)) topics.add('الوجبات والمطعم');
    if (/غرف|سكن|إقامة|اقامة|أوضة|اوضة/.test(content)) topics.add('نظام الغرف والإقامة');
    if (/رسوم|فلوس|دفع|مصاريف/.test(content)) topics.add('الرسوم والمدفوعات');
    if (/عقوب|حرمان|مخالف|ممنوع/.test(content)) topics.add('العقوبات والمخالفات');
    if (/صيانة|نقل|تحويل|transfer/.test(content)) topics.add('الصيانة والنقل');
    if (/تطبيق|التطبيق|ازاي|إزاي/.test(content)) topics.add('استخدام التطبيق');
    if (/حضور|غياب|attendance/.test(content)) topics.add('الحضور والغياب');

    if (msg.role === 'assistant' && msg.content.length > 50) {
      const firstLine = msg.content.split('\n')[0].trim();
      if (firstLine.length > 10 && firstLine.length < 100) keyInfo.push(firstLine);
    }
  }

  if (topics.size === 0) return null;
  let summary = `المواضيع: ${Array.from(topics).join('، ')}`;
  if (keyInfo.length > 0) summary += `\nنقاط رئيسية: ${keyInfo.slice(-3).join(' | ')}`;
  return summary;
}


export const SUGGESTED_QUESTIONS = [
  { text: 'إيه شروط القبول في السكن؟', icon: '📋' },
  { text: 'إيه مواعيد الأكل في المطعم؟', icon: '🍽️' },
  { text: 'إزاي أقدم على المدن الجامعية؟', icon: '📝' },
  { text: 'إيه أنواع السكن المتاحة؟', icon: '🏠' },
  { text: 'إيه الأكل المتاح النهاردة؟', icon: '🥘' },
  { text: 'إزاي أستخدم التطبيق؟', icon: '📱' },
];


export function getFollowUpQuestions(
  lastAssistantReply: string,
  housingStatus?: string | null
): Array<{ text: string; icon: string }> {
  const lower = lastAssistantReply.toLowerCase();

  if (/شروط|قبول/.test(lower)) {
    return [
      { text: 'إيه الأوراق المطلوبة للتقديم؟', icon: '📄' },
      { text: 'إمتى ميعاد التقديم؟', icon: '📅' },
      { text: 'لو من القاهرة ينفع أقدم؟', icon: '🏙️' },
    ];
  }
  if (/وجب|أكل|اكل|منيو|مطعم|غداء|فطار|عشاء/.test(lower)) {
    return [
      { text: 'إيه قواعد الكارنيه في المطعم؟', icon: '🪪' },
      { text: 'لو اتأخرت عن الميعاد ينفع آكل؟', icon: '⏰' },
      { text: 'إزاي أحجز وجبة من التطبيق؟', icon: '📱' },
    ];
  }
  if (/غرف|سكن|إقامة|اقامة|نقل/.test(lower)) {
    return [
      { text: 'إزاي أنقل غرفة تانية؟', icon: '🔄' },
      { text: 'إمتى الإقامة بتنتهي؟', icon: '📆' },
      { text: 'ينفع أكمل في الصيف؟', icon: '☀️' },
    ];
  }
  if (/عقوب|حرمان|مخالف|ممنوع/.test(lower)) {
    return [
      { text: 'إيه الممنوعات في المدينة؟', icon: '🚫' },
      { text: 'لو اتأخرت عن وجبة هيحصل إيه؟', icon: '⚠️' },
    ];
  }
  if (/رسوم|دفع|فلوس|مصاريف/.test(lower)) {
    return [
      { text: 'إيه أنواع السكن وأسعارها؟', icon: '💰' },
      { text: 'لو ما دفعتش في الميعاد هيحصل إيه؟', icon: '⏳' },
    ];
  }
  if (/تطبيق|التطبيق|حجز|صيانة/.test(lower)) {
    return [
      { text: 'إزاي أعمل طلب صيانة؟', icon: '🔧' },
      { text: 'فين كود الـ QR بتاعي؟', icon: '📱' },
      { text: 'إزاي أشوف حالة طلبي؟', icon: '📋' },
    ];
  }

  
  if (housingStatus === 'active') {
    return [
      { text: 'إيه الأكل المتاح النهاردة؟', icon: '🍽️' },
      { text: 'إزاي أعمل طلب صيانة؟', icon: '🔧' },
    ];
  }
  if (housingStatus === 'pending') {
    return [
      { text: 'طلبي وصل لحد فين؟', icon: '📋' },
      { text: 'المراجعة بتاخد وقت قد إيه؟', icon: '⏳' },
    ];
  }
  return [
    { text: 'إيه شروط القبول؟', icon: '📋' },
    { text: 'إزاي أقدم على السكن؟', icon: '📝' },
  ];
}

export function aiAssistantHeaders(): Record<string, string> {
  const extras = readExtra();
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Ngrok-Skip-Browser-Warning': 'true',
    'User-Agent': 'UniversityHousingApp/1.0',
  };
  const token = extras.AI_ASSISTANT_API_KEY as string | undefined;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}
