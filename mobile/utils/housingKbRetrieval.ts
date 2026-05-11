import kbJson from '../data/cairo_university_housing_kb.json';

export type HousingKbEntry = { topic: string; content: string };

const entries = kbJson as HousingKbEntry[];


const SYNONYMS: Record<string, string[]> = {
  
  'سكن': ['اسكن', 'مسكن', 'ساكن', 'سكنى', 'إقامة', 'اقامة', 'أوضة', 'اوضة', 'غرفة', 'سرير'],
  'مدينة': ['مدن', 'المدينة', 'المدن', 'كومباوند', 'مبنى', 'عمارة'],
  'تقديم': ['أقدم', 'اقدم', 'قدّم', 'التقديم', 'أتقدم', 'اتقدم', 'طلب', 'ابلاي', 'apply'],
  'قبول': ['اتقبلت', 'قبلت', 'مقبول', 'القبول', 'يقبلوني', 'يقبلني', 'أتقبل', 'اتقبل'],
  'رفض': ['اترفضت', 'رفضت', 'مرفوض', 'الرفض', 'يرفضوني', 'يرفضني'],
  
  'أكل': ['اكل', 'وجبة', 'وجبات', 'طعام', 'منيو', 'مينيو', 'menu', 'food', 'meal', 'مطعم', 'كافتيريا'],
  'فطار': ['فطور', 'breakfast', 'صباح', 'الصبح'],
  'غداء': ['غدا', 'لانش', 'lunch', 'الضهر', 'الظهر'],
  'عشاء': ['عشا', 'dinner', 'بالليل', 'المساء', 'المسا'],
  
  'رسوم': ['فلوس', 'مصاريف', 'تكلفة', 'سعر', 'أسعار', 'اسعار', 'دفع', 'سداد', 'فيزا', 'fees', 'payment'],
  
  'عقوبة': ['عقوبات', 'جزاء', 'غرامة', 'حرمان', 'إنذار', 'انذار', 'فصل', 'طرد'],
  'قانون': ['لائحة', 'قواعد', 'ممنوع', 'ممنوعات', 'شروط', 'نظام', 'قوانين', 'تعليمات'],
  
  'غياب': ['غيبت', 'اتغيبت', 'مبات', 'مبيت', 'أبات', 'ابات', 'خروج', 'أخرج', 'اخرج', 'إجازة', 'اجازة', 'leave'],
  
  'خدمات': ['مرافق', 'خدمة', 'مكتبة', 'ملعب', 'ملاعب', 'نادي', 'رياضة', 'صحة', 'طبيب', 'دكتور', 'عيادة'],
  
  'نقل': ['تحويل', 'تغيير', 'انتقال', 'أنقل', 'انقل', 'transfer', 'أحول', 'احول'],
  
  'مكان': ['عنوان', 'فين', 'وين', 'موقع', 'أوصل', 'اوصل', 'أروح', 'اروح', 'ازاي', 'إزاي'],
  
  'موعد': ['ميعاد', 'مواعيد', 'إمتى', 'امتى', 'متى', 'تاريخ', 'deadline', 'آخر', 'اخر'],
};


const synonymToCanonical = new Map<string, string>();
for (const [canonical, syns] of Object.entries(SYNONYMS)) {
  for (const s of syns) {
    synonymToCanonical.set(s, canonical);
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[،؛؟!.?:;,_/\\\\—–«»"'`\-]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}


function expandWithSynonyms(tokens: string[]): string[] {
  const expanded: string[] = [...tokens];
  for (const t of tokens) {
    const canonical = synonymToCanonical.get(t);
    if (canonical && !expanded.includes(canonical)) {
      expanded.push(canonical);
    }
    
    const syns = SYNONYMS[t];
    if (syns) {
      for (const s of syns) {
        if (!expanded.includes(s)) expanded.push(s);
      }
    }
  }
  return expanded;
}

function tfidfVec(
  tokens: string[],
  vocabIndex: Map<string, number>,
  idf: Float64Array
): Float64Array {
  const dim = idf.length;
  const vec = new Float64Array(dim);
  if (tokens.length === 0) return vec;

  const counts = new Map<string, number>();
  for (const t of tokens) {
    const i = vocabIndex.get(t);
    if (i === undefined) continue;
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  let maxTf = 0;
  for (const c of counts.values()) maxTf = Math.max(maxTf, c);
  if (maxTf === 0) return vec;

  for (const [term, c] of counts) {
    const i = vocabIndex.get(term);
    if (i === undefined) continue;
    const tf = c / maxTf;
    vec[i] = tf * idf[i];
  }
  return vec;
}

function cosine(a: Float64Array, b: Float64Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

type Index = {
  vocabIndex: Map<string, number>;
  idf: Float64Array;
  docVecs: Float64Array[];
  chunks: string[];
};

let cache: Index | null = null;

function buildIndex(): Index {
  if (cache) return cache;

  const chunks = entries.map((e) => `${e.topic}\n${e.content}`);
  
  const tokenized = chunks.map((c) => expandWithSynonyms(tokenize(c)));
  const vocabSet = new Set<string>();
  for (const toks of tokenized) {
    for (const t of toks) vocabSet.add(t);
  }
  const vocab = Array.from(vocabSet);
  const vocabIndex = new Map(vocab.map((t, i) => [t, i]));
  const N = tokenized.length;

  const df = new Map<string, number>();
  for (const toks of tokenized) {
    const seen = new Set(toks);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }

  const idf = new Float64Array(vocab.length);
  for (let i = 0; i < vocab.length; i++) {
    const t = vocab[i];
    const d = df.get(t) || 0;
    idf[i] = Math.log((N + 1) / (d + 1)) + 1;
  }

  const docVecs = tokenized.map((toks) => tfidfVec(toks, vocabIndex, idf));
  cache = { vocabIndex, idf, docVecs, chunks };
  return cache;
}


export function retrieveHousingKnowledge(userMessage: string, topK = 4): string[] {
  const msg = userMessage.trim();
  if (!msg || topK <= 0) return [];

  const { vocabIndex, idf, docVecs, chunks } = buildIndex();
  
  const queryTokens = expandWithSynonyms(tokenize(msg));
  const qVec = tfidfVec(queryTokens, vocabIndex, idf);

  const ranked = docVecs
    .map((dv, i) => ({ i, s: cosine(dv, qVec) }))
    .sort((a, b) => b.s - a.s);

  const maxScore = ranked[0]?.s ?? 0;
  
  if (maxScore < 0.02) return [];

  
  const minRelevance = maxScore * 0.3; 
  const slice = ranked.slice(0, topK).filter((x) => x.s >= minRelevance);
  return slice.map((x) => chunks[x.i]);
}
