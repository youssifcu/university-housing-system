import { auth } from '../config/firebase';
import BACKEND_URL from '../config/backend';

export type MealItem = {
  _id?: string;
  name?: string;
  type?: string;
  price?: number;
  description?: string;
  calories?: number;
};




export function isLikelyMealMenuQuestion(text: string): boolean {
  const n = text.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!n) return false;
  const lower = n.toLowerCase();

  
  const hasFoodKeyword =
    /اكل|أكل|و?جب|و?جبات|غدا|غداء|فطار|فطور|عشا|عشاء|مينيو|منيو|مأكولات|ماكولات|food|meal|menu|مطعم|الأكل|الاكل|كافتيريا|بوفيه|أصناف|اصناف|طبخ|طبيخ/i.test(
      lower
    );

  
  const hasPriceKeyword =
    /سعر.*(وجب|اكل|أكل|غدا|فطار|عشا)|تمن.*(وجب|اكل|أكل)|بكام.*(الاكل|الأكل|الوجب)|كام.*(الوجب|الاكل)/i.test(
      lower
    );

  if (!hasFoodKeyword && !hasPriceKeyword) return false;

  
  const todayOrNow =
    /اليوم|النهارده|نهاردة|نهارده|دلوقتي|الدلوقت|today|now|النهاردة|النهارده|حالا|حاليا|الوقتي|دي الوقت|بكره|بكرة|tomorrow/i.test(
      lower
    );

  
  const asksListOrWhat =
    /^(ايه|إيه|ماذا|عايز اعرف|عاوز اعرف|قولي|قول|فيه ايه|في ايه|ايه اللي|إيه اللي|هل فيه|عندكم)/i.test(
      n.trim()
    ) ||
    /ايه|إيه|عايز|عاوز|عارف|قائمة|فيه ايه|في ايه|بيعملوا|بيقدموا|المقترح|قوللي|ورّيني|وريني|فين.*اكل|فين.*أكل|ناكل|نأكل|هاكل|أكل إيه|اكل ايه/i.test(
      lower
    );

  
  const hasMealTime =
    /موعد.*(اكل|أكل|وجب|غدا|فطار|عشا)|ميعاد.*(اكل|أكل|وجب)|امتى.*(الاكل|الأكل|الغدا|الفطار|العشا)|إمتى.*(الاكل|الأكل)/i.test(
      lower
    );

  
  const hasBookingKeyword =
    /احجز.*(وجب|اكل|أكل)|حجز.*(وجب|اكل)|booking.*meal|book.*meal/i.test(lower);

  if (todayOrNow) return true;
  if (asksListOrWhat) return true;
  if (hasMealTime) return true;
  if (hasBookingKeyword) return true;
  if (hasPriceKeyword) return true;
  if (/المنيو|قائمة الوجبات|وجبات النهار|اكل النهار|أكل النهار|الاكل بتاع|الأكل بتاع|المطعم بيقدم|المطعم بيعمل/i.test(lower)) {
    return true;
  }
  return false;
}

function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const TYPE_AR: Record<string, string> = {
  breakfast: 'فطار 🌅',
  lunch: 'غداء 🍽️',
  dinner: 'عشاء 🌙',
};

const MEAL_SCHEDULE_AR = `مواعيد التقديم الرسمية (حسب لائحة المدن الجامعية):
- الغداء: من 1 ظهر لحد 5 عصر.
- العشاء وفطار اليوم اللي بعده: من 7 مساءً لحد 9 مساءً.
- حجز وجبات اليوم اللي بعده: من 7 لحد 9 مساءً.`;

function formatMealsBlock(dateStr: string, meals: MealItem[]): string {
  const lines: string[] = [];
  lines.push(`[وجبات اليوم من النظام]`);
  lines.push(`التاريخ في التطبيق: ${dateStr}`);
  lines.push('');
  lines.push(MEAL_SCHEDULE_AR);
  lines.push('');

  if (!meals.length) {
    lines.push('حالة_المنيو: فارغة (النظام مارجعش أي وجبة للتاريخ ده).');
    lines.push(
      'تعليمات_ردّ_إلزامية: جاوب بجملة قصيرة بالعامية إن مفيش منيو ظاهر في النظام النهاردة / للتاريخ ده. ممنوع اقتراح أصناف أو أمثلة أكل. ممكن تذكر مواعيد التقديم العامة من الأعلى فقط.'
    );
    return lines.join('\n');
  }

  const buckets: Record<string, MealItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    other: [],
  };

  for (const m of meals) {
    const t = (m.type || 'other').toLowerCase();
    const key: keyof typeof buckets =
      t === 'breakfast' || t === 'lunch' || t === 'dinner' ? t : 'other';
    buckets[key].push(m);
  }

  const order: (keyof typeof buckets)[] = ['breakfast', 'lunch', 'dinner', 'other'];
  lines.push(`حالة_المنيو: يوجد بيانات (${meals.length} صنف) — اذكر الأصناف كما هي بالأسفل فقط.`);
  lines.push('');
  for (const key of order) {
    const arr = buckets[key];
    if (!arr.length) continue;
    const label = TYPE_AR[key] || 'وجبات أخرى';
    lines.push(`${label}:`);
    for (const m of arr) {
      const name = m.name?.trim() || 'وجبة';
      const price = m.price != null ? ` — ${m.price} جنيه` : '';
      const desc = m.description?.trim() ? ` (${m.description.trim()})` : '';
      lines.push(`- ${name}${price}${desc}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}


export async function fetchTodayMealsForChat(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    return `[وجبات اليوم من النظام]
حالة_المنيو: غير_معروفة (مش مسجّل دخول — مفيش قائمة من السيرفر).
تعليمات_ردّ_إلزامية: قول «مقدرش أجيب المنيو من غير تسجيل دخول» — ممنوع ذكر أصناف. لا تخمين.

${MEAL_SCHEDULE_AR}`;
  }

  const dateStr = localYmd(new Date());

  try {
    const idToken = await user.getIdToken();
    const res = await fetch(`${BACKEND_URL}/api/meals?date=${dateStr}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return `[وجبات اليوم من النظام]
حالة_المنيو: خطأ_جلب (${res.status}).
تعليمات_ردّ_إلزامية: قول مفيش قائمة متاحة دلوقتي من النظام — جرّب تبويب الوجبات. ممنوع ذكر أصناف.

${MEAL_SCHEDULE_AR}`;
    }

    const raw = body?.data;
    const meals: MealItem[] = Array.isArray(raw) ? raw : raw?.meals || [];
    return formatMealsBlock(dateStr, meals);
  } catch {
    return `[وجبات اليوم من النظام]
حالة_المنيو: خطأ_شبكة.
تعليمات_ردّ_إلزامية: قول مفيش قائمة متاحة دلوقتي — جرّب تبويب الوجبات. ممنوع ذكر أصناف.

${MEAL_SCHEDULE_AR}`;
  }
}
