import React, { useState, useEffect, useMemo } from 'react';

// ==========================================
// 1. المساعدات الحسابية والمالية الصارمة
// ==========================================
export function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

// 4 خانات عشرية للأسعار والكميات (مثل 0.125 كغ)
export function round4(val: number): number {
  return Math.round((val + Number.EPSILON) * 10000) / 10000;
}

export function parseDecimal(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : round4(val);
  const cleaned = String(val).replace(/,/g, '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : round4(num);
}

// للمبالغ النقدية (خانتان عشريتان)
export function parseMoney(val: any): number {
  return round2(parseDecimal(val));
}

export function formatCurr(val: number, curr: 'USD' | 'SYP' | string = 'USD'): string {
  const safeVal = round2(Number(val) || 0);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeVal);
  return `${formatted} ${curr === 'USD' ? '$' : 'ل.س'}`;
}

// سعر الوحدة: حتى 4 خانات عشرية
export function formatPrice(val: number, curr: 'USD' | 'SYP' | string = 'USD'): string {
  const safeVal = round4(Number(val) || 0);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(safeVal);
  return `${formatted} ${curr === 'USD' ? '$' : 'ل.س'}`;
}

// تحويل أي مبلغ إلى دولار لتجميع الأرقام بأمان
export function toUSD(amount: number, currency: 'USD' | 'SYP' = 'USD', rate = 1): number {
  return currency === 'SYP' && rate > 0 ? round4(amount / rate) : round4(amount);
}

// تاريخ محلي (وليس UTC)
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// وقت 24 ساعة بأرقام لاتينية (يُرتَّب نصياً بشكل صحيح)
export function timeStr(d: Date = new Date()): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// مفتاح ترتيب زمني يفهم الأوقات القديمة (أرقام عربية + ص/م) والجديدة
export function tsKey(date: string, time: string): string {
  const t = (time || '').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const m = t.match(/(\d{1,2}):(\d{2})/);
  let h = m ? parseInt(m[1], 10) : 0;
  const mi = m ? parseInt(m[2], 10) : 0;
  if (/م|PM|pm/.test(t) && h < 12) h += 12;
  if (/ص|AM|am/.test(t) && h === 12) h = 0;
  return `${date} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

// ترميز النص قبل وضعه في HTML الطباعة
export function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==========================================
// 2. هياكل البيانات المحاسبية المتكاملة
// ==========================================
export interface AlAmeenItem {
  id: number;
  code: string;
  name: string;
  category: 'كهربائيات' | 'صحية' | 'خردة' | 'أدوات أخرى';
  baseUnit: 'متر' | 'قطعة' | 'طقم' | 'كيلو غرام';
  subUnitName?: string;
  subUnitFactor?: number;
  subUnitPrice?: number;
  costPrice: number;
  salePrice: number;
  stockQty: number;
  minStock: number;
  rackLocation?: string;
  isDeleted?: boolean;
}

export interface InvoiceRow {
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  factor: number;
  quantity: number;
  price: number;
  total: number;
  cost: number;
  addedAt?: string;
  priceStr?: string;
  qtyStr?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  time: string;
  amount: number;
  notes: string;
  partyName: string;
  partyType: 'customer' | 'merchant';
  invNumber: string;
  currency?: 'USD' | 'SYP';
  rate?: number; // سعر الصرف وقت الدفع
  kind?: 'receipt' | 'refund'; // سند قبض أو سند صرف (ردّ نقد)
}

export interface AlAmeenInvoice {
  id: number;
  invNumber: string;
  type: 'sale' | 'purchase' | 'return';
  customerName: string;
  customerPhone: string;
  merchantName?: string;
  shopName?: string;
  rows: InvoiceRow[];
  subTotal: number;
  discount: number;
  discountRate?: number; // نسبة الخصم (تُطبَّق نسبياً عند المرتجع أو السحب)
  grandTotal: number;
  initialPaid: number;
  paidAmount: number;
  remainingAmount: number;
  currency: 'USD' | 'SYP';
  exchangeRate: number;
  invDate: string;
  invTime: string;
  notes?: string;
  origInvNumber?: string;
}

export interface ExpenseItem {
  id: number;
  title: string;
  category: 'كهرباء وإنارة' | 'إيجار المحل' | 'أجور عمال' | 'شحن ونقل' | 'صيانة' | 'نثريات وضيافة';
  amount: number;
  currency: 'USD' | 'SYP';
  date: string;
  time: string;
  notes?: string;
}

export interface SealImage {
  id: string;
  name: string;
  data: string; // صورة base64
}

export interface AlAmeenSettings {
  shopName: string;
  phone: string;
  address: string;
  usdRate: number;
  adminUsername: string;
  adminPassHash: string;
  securityQuestion: string;
  securityAnswerHash: string;
  cashierUsername: string;
  cashierPassHash: string;
  fontSize: 'normal' | 'medium' | 'large';
  logoBase64?: string;
  logoPosition: 'right' | 'center' | 'left';
  stampBase64?: string; // قديم: يُرحَّل تلقائياً إلى مكتبة الأختام
  signatureBase64?: string; // قديم: يُرحَّل تلقائياً إلى مكتبة التواقيع
  stamps: SealImage[];
  signatures: SealImage[];
  activeStampId: string;
  activeSignatureId: string;
  showStamp: boolean;
  showSignature: boolean;
}

export interface OpLog {
  id: string;
  date: string;
  time: string;
  kind: 'sale' | 'purchase' | 'payment' | 'merchant_payment' | 'return' | 'add_items' | 'expense' | 'delete' | 'item' | 'adjust' | 'closing';
  party: string;
  invNumber: string;
  amount: number;
  text: string;
}

export interface ClosingRecord {
  id: string;
  date: string;
  time: string;
  systemCash: number;
  countedCash: number;
  diff: number;
  notes: string;
}

export const LOG_LABELS: Record<OpLog['kind'], string> = {
  sale: 'فاتورة مبيعات',
  purchase: 'فاتورة مشتريات',
  payment: 'دفعة زبون',
  merchant_payment: 'دفعة تاجر',
  return: 'مرتجع',
  add_items: 'سحب مواد',
  expense: 'مصروف',
  delete: 'حذف',
  item: 'مادة بالمستودع',
  adjust: 'تسوية جرد',
  closing: 'إقفال يومي'
};

// إعادة احتساب الفاتورة من بنودها: الخصم يُطبَّق بنسبته الأصلية (توزيع نسبي)
export function recalcInvoice(inv: AlAmeenInvoice, rows: InvoiceRow[]): AlAmeenInvoice {
  const subTotal = round2(rows.reduce((s, r) => s + r.total, 0));
  const rate = inv.discountRate ?? (inv.subTotal > 0 ? inv.discount / inv.subTotal : 0);
  const discount = round2(subTotal * rate);
  const grandTotal = Math.max(0, round2(subTotal - discount));
  const remainingAmount = Math.max(0, round2(grandTotal - inv.paidAmount));
  return { ...inv, rows, subTotal, discount, discountRate: rate, grandTotal, remainingAmount };
}

// فروقات سعر الصرف المحققة بين تاريخ الفاتورة وتاريخ الدفع (بالدولار)
export function fxDifference(list: PaymentRecord[], invoices: AlAmeenInvoice[]): number {
  return round2(
    list.reduce((s, p) => {
      if ((p.currency ?? 'USD') !== 'SYP' || !p.rate) return s;
      const inv = invoices.find(i => i.invNumber === p.invNumber);
      if (!inv) return s;
      const d = toUSD(p.amount, 'SYP', p.rate) - toUSD(p.amount, 'SYP', inv.exchangeRate);
      const sign = p.partyType === 'customer' ? (p.kind === 'refund' ? -1 : 1) : -1;
      return s + sign * d;
    }, 0)
  );
}

// ==========================================
// 3. التخزين الآمن: IndexedDB + مزامنة النوافذ
// ==========================================
export const STORAGE_KEYS = {
  ITEMS: 'alameen_storage_items_v2026',
  INVOICES: 'alameen_storage_invoices_v2026',
  PAYMENTS: 'alameen_storage_payments_v2026',
  EXPENSES: 'alameen_storage_expenses_v2026',
  SETTINGS: 'alameen_storage_settings_v2026',
  LOG: 'alameen_storage_log_v2026',
  CLOSINGS: 'alameen_storage_closings_v2026',
  COUNTERS: 'alameen_storage_counters_v2026'
};

const DB_NAME = 'alameen_db';
const DB_STORE = 'kv';
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = () => {
        rq.result.createObjectStore(DB_STORE);
      };
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    });
  }
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const rq = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(key);
    rq.onsuccess = () => resolve(rq.result as T | undefined);
    rq.onerror = () => reject(rq.error);
  });
}

async function idbSet(key: string, val: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(JSON.parse(JSON.stringify(val)), key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

const bc: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('alameen_sync') : null;

// تنبيه عند تغيير البيانات من نافذة أخرى (لمنع الكتابة فوق بعضها)
export function onExternalChange(cb: () => void): () => void {
  if (!bc) return () => {};
  const handler = () => cb();
  bc.addEventListener('message', handler);
  return () => bc.removeEventListener('message', handler);
}

let lastFailAlert = 0;
function notifySaveFail() {
  const now = Date.now();
  if (now - lastFailAlert < 10000) return;
  lastFailAlert = now;
  alert('⚠️ فشل حفظ البيانات في المتصفح! خذ نسخة احتياطية فوراً من (الإعدادات) ولا تغلق البرنامج.');
}

export async function loadStored<T>(key: string, def: T): Promise<T> {
  try {
    const v = await idbGet<T>(key);
    if (v !== undefined) return v;
  } catch (e) {
    console.error('IDB read failed', key, e);
  }
  // ترحيل البيانات القديمة من localStorage
  try {
    const d = localStorage.getItem(key);
    if (d) {
      const parsed = JSON.parse(d) as T;
      setLocal(key, parsed);
      return parsed;
    }
  } catch (e) {
    console.error('legacy read failed', key, e);
  }
  return def;
}

export function setLocal<T>(key: string, val: T): void {
  idbSet(key, val)
    .then(() => {
      try {
        bc?.postMessage({ key, t: Date.now() });
      } catch {
        /* ignore */
      }
    })
    .catch(err => {
      console.error('IDB write failed', key, err);
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch {
        notifySaveFail();
      }
    });
}

// ==========================================
// 4. الترقيم التسلسلي للفواتير
// ==========================================
const counters: Record<string, number> = { SAL: 0, PUR: 0, RET: 0 };
const usedNumbers = new Set<string>();

export function initNumbering(stored: Record<string, number> | undefined, invoices: AlAmeenInvoice[]) {
  Object.assign(counters, stored || {});
  usedNumbers.clear();
  invoices.forEach(i => usedNumbers.add(i.invNumber));
}

export function nextInvNumber(prefix: 'SAL' | 'PUR' | 'RET'): string {
  let n = counters[prefix] || 0;
  let s = '';
  do {
    n += 1;
    s = `${prefix}-${String(n).padStart(6, '0')}`;
  } while (usedNumbers.has(s));
  counters[prefix] = n;
  usedNumbers.add(s);
  setLocal(STORAGE_KEYS.COUNTERS, { ...counters });
  return s;
}

// ==========================================
// 5. الأمان: تجزئة كلمات المرور (SHA-256)
// ==========================================
export async function sha256(text: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`alameen|${text}`));
      return 'h1:' + Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    /* fall through */
  }
  return 'p0:' + text; // احتياطي عند عدم توفر التشفير (بيئة غير آمنة)
}

export async function verifyHash(input: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  if (hash.startsWith('p0:')) return hash === 'p0:' + input;
  return (await sha256(input)) === hash;
}

// ==========================================
// 6. فحص التطابق المحاسبي (Ledger consistency check)
// ==========================================
export function checkIntegrity(invoices: AlAmeenInvoice[], payments: PaymentRecord[], items: AlAmeenItem[]): string[] {
  const issues: string[] = [];
  const tol = 0.011;
  const seen = new Set<string>();

  invoices.forEach(inv => {
    if (seen.has(inv.invNumber)) issues.push(`رقم فاتورة مكرر: ${inv.invNumber}`);
    seen.add(inv.invNumber);
    if (inv.type === 'return') return;

    const sumRows = round2(inv.rows.reduce((s, r) => s + r.total, 0));
    if (Math.abs(sumRows - inv.subTotal) > tol) {
      issues.push(`الفاتورة ${inv.invNumber}: مجموع البنود (${sumRows}) لا يساوي المجموع المسجل (${inv.subTotal})`);
    }
    const expectedGrand = Math.max(0, round2(inv.subTotal - inv.discount));
    if (Math.abs(expectedGrand - inv.grandTotal) > tol) {
      issues.push(`الفاتورة ${inv.invNumber}: الصافي (${inv.grandTotal}) لا يطابق المجموع - الخصم (${expectedGrand})`);
    }

    const partyType = inv.type === 'sale' ? 'customer' : 'merchant';
    const received = payments
      .filter(p => p.invNumber === inv.invNumber && p.partyType === partyType)
      .reduce((s, p) => s + (p.kind === 'refund' ? -p.amount : p.amount), 0);
    const expectedPaid = round2((inv.initialPaid ?? 0) + received);
    if (Math.abs(expectedPaid - inv.paidAmount) > tol) {
      issues.push(`الفاتورة ${inv.invNumber}: المسدد المسجل (${inv.paidAmount}) لا يطابق المدفوع الأولي + السندات (${expectedPaid})`);
    }
    const expectedRem = Math.max(0, round2(inv.grandTotal - inv.paidAmount));
    if (Math.abs(expectedRem - inv.remainingAmount) > tol) {
      issues.push(`الفاتورة ${inv.invNumber}: المتبقي المسجل (${inv.remainingAmount}) لا يطابق الحساب (${expectedRem})`);
    }
  });

  payments.forEach(p => {
    if (!invoices.some(i => i.invNumber === p.invNumber)) {
      issues.push(`السند ${p.id} مرتبط بفاتورة غير موجودة (${p.invNumber})`);
    }
  });

  items.filter(i => !i.isDeleted && i.stockQty < 0).forEach(i => issues.push(`المادة ${i.name}: رصيد سالب (${i.stockQty})`));
  return issues;
}

// ==========================================
// 7. اختبارات ذاتية لدوال الحساب (تُشغَّل من الإعدادات)
// ==========================================
export async function runSelfTests(): Promise<{ name: string; ok: boolean }[]> {
  const res: { name: string; ok: boolean }[] = [];
  const t = (name: string, cond: boolean) => res.push({ name, ok: !!cond });

  t('تقريب الأموال: 0.1 + 0.2 = 0.3', round2(0.1 + 0.2) === 0.3);
  t('الفاصلة العشرية: 2,5 = 2.5', parseDecimal('2,5') === 2.5);
  t('كمية بثلاث خانات: 0,125', parseDecimal('0,125') === 0.125);
  t('المبلغ النقدي يُقرَّب لخانتين: 10,999 = 11', parseMoney('10,999') === 11);
  t('تحويل الليرة للدولار: 15000 ل.س = 1$ بسعر 15000', toUSD(15000, 'SYP', 15000) === 1);
  t('ترتيب الأوقات: 09:01 م بعد 10:33 ص', tsKey('2026-11-02', '٠٩:٠١ م') > tsKey('2026-11-02', '١٠:٣٣ ص'));

  const baseInv: AlAmeenInvoice = {
    id: 1, invNumber: 'SAL-000001', type: 'sale', customerName: 'أ', customerPhone: '',
    rows: [
      { itemId: 1, itemCode: '1', itemName: 'س', unit: 'قطعة', factor: 1, quantity: 10, price: 10, total: 100, cost: 5 }
    ],
    subTotal: 100, discount: 10, discountRate: 0.1, grandTotal: 90, initialPaid: 40, paidAmount: 40, remainingAmount: 50,
    currency: 'USD', exchangeRate: 1, invDate: '2026-01-01', invTime: '10:00'
  };
  const afterReturn = recalcInvoice(baseInv, [{ ...baseInv.rows[0], quantity: 5, total: 50 }]);
  t('المرتجع يخفّض الخصم نسبياً (50 - 5 = 45)', afterReturn.grandTotal === 45 && afterReturn.discount === 5);
  t('المتبقي بعد المرتجع = 45 - 40 = 5', afterReturn.remainingAmount === 5);
  t('فحص التطابق: فاتورة سليمة بلا أخطاء', checkIntegrity([baseInv], [], []).length === 0);
  t('فحص التطابق: يكتشف مسدداً خاطئاً', checkIntegrity([{ ...baseInv, paidAmount: 90, remainingAmount: 0 }], [], []).length > 0);

  const pay: PaymentRecord = {
    id: 'p1', date: '2026-01-02', time: '10:00', amount: 15000, notes: '', partyName: 'أ',
    partyType: 'customer', invNumber: 'SAL-000001', currency: 'SYP', rate: 16000
  };
  const inv2: AlAmeenInvoice = { ...baseInv, currency: 'SYP', exchangeRate: 15000 };
  const fxC = fxDifference([pay], [inv2]);
  const fxM = fxDifference([{ ...pay, partyType: 'merchant' }], [inv2]);
  t('فرق الصرف: خسارة عند قبض ليرة بسعر أضعف', fxC < 0 && fxM > 0 && Math.abs(fxC + fxM) < 0.001);

  const sealBase: any = {
    showStamp: true, showSignature: true,
    stamps: [{ id: 'a', name: 'x', data: 'data:image/png;base64,AAA' }], signatures: [],
    activeStampId: 'a', activeSignatureId: ''
  };
  t('الختم الظاهر يُطبع على المطبوعات', sealsFooterHtml(sealBase).includes('data:image/png;base64,AAA'));
  t('إخفاء الختم والتوقيع معاً يزيل التذييل', sealsFooterHtml({ ...sealBase, showStamp: false, showSignature: false }) === '');
  t('إخفاء الختم فقط: لا ختم ويبقى التوقيع', !sealsFooterHtml({ ...sealBase, showStamp: false }).includes('AAA') && sealsFooterHtml({ ...sealBase, showStamp: false }).includes('التوقيع'));

  const h = await sha256('abc');
  t('تجزئة كلمة المرور: تطابق وعدم تطابق', (await verifyHash('abc', h)) && !(await verifyHash('abd', h)));
  return res;
}


// ==========================================
// 8. الختم والتوقيع على كل المطبوعات + تصغير الصور
// ==========================================
export function activeSeal(list: SealImage[] | undefined, activeId: string): SealImage | null {
  if (!list || list.length === 0) return null;
  return list.find(i => i.id === activeId) || null;
}

// تذييل الختم والتوقيع (يُضاف لكل مطبوع حسب الإعدادات)
export function sealsFooterHtml(settings: AlAmeenSettings): string {
  const showSig = settings.showSignature !== false;
  const showStamp = settings.showStamp !== false;
  if (!showSig && !showStamp) return '';
  const sig = activeSeal(settings.signatures, settings.activeSignatureId);
  const stamp = activeSeal(settings.stamps, settings.activeStampId);

  const sigBlock = showSig
    ? `<div style="text-align: center; width: 200px;">
         <p style="margin: 0 0 5px 0; font-weight: bold;">التوقيع</p>
         ${sig ? `<img src="${sig.data}" style="height: 60px; max-width: 190px; object-fit: contain;" />` : '<div style="height: 45px; border-bottom: 1px dashed #888;"></div>'}
       </div>`
    : '';
  const stampBlock = showStamp
    ? `<div style="text-align: center; width: 200px;">
         <p style="margin: 0 0 5px 0; font-weight: bold;">الختم الرسمي</p>
         ${stamp ? `<img src="${stamp.data}" style="height: 80px; max-width: 190px; object-fit: contain;" />` : '<div style="height: 60px; width: 60px; margin: 0 auto; border: 1px dashed #aaa; border-radius: 50%;"></div>'}
       </div>`
    : '';
  return `<div class="footer" style="justify-content: space-around; page-break-inside: avoid;">${sigBlock}${stampBlock}</div>`;
}

// قراءة صورة وتصغيرها (للحفاظ على خفة التخزين) مع إبقاء الشفافية PNG
export function resizeImageFile(file: File, maxSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image failed'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas failed'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// دالة الطباعة النظيفة المعزولة
function printCleanDocumentOffline(htmlBody: string) {
  const oldFrame = document.getElementById('alameen-clean-print-frame');
  if (oldFrame) oldFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'alameen-clean-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow || iframe.contentDocument;
  const doc = (frameDoc as any).document || frameDoc;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>طباعة رسمية A4</title>
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif; margin: 0; padding: 10px; color: #111; font-size: 13px; line-height: 1.5; direction: rtl; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
        th, td { border: 1px solid #333; padding: 8px; text-align: right; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 15px; }
        .info-box { border: 1px solid #444; padding: 10px; border-radius: 4px; margin-bottom: 15px; display: flex; justify-content: space-between; }
        .notes-box { border: 1px dashed #666; padding: 8px; border-radius: 4px; margin-bottom: 15px; background-color: #fafafa; font-size: 12px; }
        .footer { margin-top: 35px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #ccc; padding-top: 15px; }
        .totals-box { width: 280px; margin-right: auto; margin-left: 0; border: 1px solid #333; padding: 8px; font-weight: bold; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
      </style>
    </head>
    <body>
      ${htmlBody}
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Print failed:', err);
    }
  }, 250);
}

// مكتبة الأيقونات المتجهة
const mkIcon = (...paths: string[]) => () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {paths.map((d, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    ))}
  </svg>
);

const SvgIcons = {
  Cart: mkIcon('M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'),
  Package: mkIcon('M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'),
  Debts: mkIcon('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'),
  Truck: mkIcon('M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20'),
  MerchantStatement: mkIcon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'),
  MoneyBag: mkIcon('M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'),
  Returns: mkIcon('M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'),
  Layers: mkIcon('M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'),
  Printer: mkIcon('M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'),
  Trending: mkIcon('M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'),
  Users: mkIcon('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'),
  Settings: mkIcon(
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    'M15 12a3 3 0 11-6 0 3 3 0 016 0z'
  )
};

// ==========================================
// 3. التطبيق الرئيسي لبرنامج الأمين
// ==========================================
export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'sale_inv' | 'pur_inv' | 'unpaid_debts' | 'merchant_debts' | 'merchant_statement' | 'expenses' | 'returns' | 'items' | 'archive' | 'profits' | 'statement' | 'settings'
  >('sale_inv');

  const [items, setItems] = useState<AlAmeenItem[]>([]);
  const [invoices, setInvoices] = useState<AlAmeenInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [opLog, setOpLog] = useState<OpLog[]>([]);
  const [closings, setClosings] = useState<ClosingRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [staleData, setStaleData] = useState(false);
  const [role, setRole] = useState<'admin' | 'cashier'>('admin');
  const [settings, setSettings] = useState<AlAmeenSettings>({
    shopName: 'مؤسسة النور للأدوات الصحية والكهربائية والخردة',
    phone: '0912345678',
    address: 'الشارع التجاري العام - جانب دوار الساعة',
    usdRate: 15000,
    adminUsername: 'alaa',
    adminPassHash: '',
    cashierUsername: '',
    cashierPassHash: '',
    securityQuestion: 'ما هو اسم محلك الأول؟',
    securityAnswerHash: '',
    fontSize: 'normal',
    logoPosition: 'right',
    stamps: [],
    signatures: [],
    activeStampId: '',
    activeSignatureId: '',
    showStamp: true,
    showSignature: true
  });

  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onSuccess: () => void;
  }>({ isOpen: false, title: '', description: '', onSuccess: () => {} });
  const [inputPass, setInputPass] = useState('');

  // تحميل البيانات من IndexedDB (مع ترحيل تلقائي من التخزين القديم)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await (navigator as any).storage?.persist?.();
      } catch {
        /* ignore */
      }
      let savedItems = await loadStored<AlAmeenItem[]>(STORAGE_KEYS.ITEMS, []);
      const savedInvoices = await loadStored<AlAmeenInvoice[]>(STORAGE_KEYS.INVOICES, []);
      const savedPayments = await loadStored<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
      const savedExpenses = await loadStored<ExpenseItem[]>(STORAGE_KEYS.EXPENSES, []);
      const stRaw = await loadStored<any>(STORAGE_KEYS.SETTINGS, null);
      const savedLog = await loadStored<OpLog[]>(STORAGE_KEYS.LOG, []);
      const savedClosings = await loadStored<ClosingRecord[]>(STORAGE_KEYS.CLOSINGS, []);
      const savedCounters = await loadStored<Record<string, number>>(STORAGE_KEYS.COUNTERS, {});

      // ترحيل كلمات المرور القديمة (نص عادي) إلى تجزئة
      const base: any = { ...settings, ...(stRaw || {}) };
      let settingsChanged = false;
      if (!base.adminPassHash) {
        base.adminPassHash = await sha256(String(stRaw?.adminPass ?? '123456').trim());
        settingsChanged = true;
      }
      if (!base.securityAnswerHash) {
        base.securityAnswerHash = await sha256(String(stRaw?.securityAnswer ?? 'النور').trim().toLowerCase());
        settingsChanged = true;
      }
      if ('adminPass' in base || 'securityAnswer' in base) {
        delete base.adminPass;
        delete base.securityAnswer;
        settingsChanged = true;
      }
      // ترحيل الختم والتوقيع القديمين إلى المكتبة الجديدة
      if (!(base.stamps && base.stamps.length) && base.stampBase64) {
        base.stamps = [{ id: 'stamp-legacy', name: 'الختم الرسمي', data: base.stampBase64 }];
        base.activeStampId = 'stamp-legacy';
        settingsChanged = true;
      }
      if (!(base.signatures && base.signatures.length) && base.signatureBase64) {
        base.signatures = [{ id: 'sig-legacy', name: 'التوقيع', data: base.signatureBase64 }];
        base.activeSignatureId = 'sig-legacy';
        settingsChanged = true;
      }
      if ('stampBase64' in base || 'signatureBase64' in base) {
        delete base.stampBase64;
        delete base.signatureBase64;
        settingsChanged = true;
      }
      if (settingsChanged) setLocal(STORAGE_KEYS.SETTINGS, base);

      if (savedItems.length === 0) {
        savedItems = [
          { id: 1, code: '101', name: 'سلك نحاس معزول 2.5 مم', category: 'كهربائيات', baseUnit: 'متر', subUnitName: 'لفة', subUnitFactor: 100, subUnitPrice: 24, costPrice: 0.18, salePrice: 0.25, stockQty: 850, minStock: 100, rackLocation: 'A-1' },
          { id: 2, code: '102', name: 'قاطع أوتوماتيك شنايدر 32A', category: 'كهربائيات', baseUnit: 'قطعة', costPrice: 3.5, salePrice: 5.0, stockQty: 0, minStock: 15, rackLocation: 'B-2' },
          { id: 3, code: '201', name: 'محبس مياه إيطالي 1/2 إنش', category: 'صحية', baseUnit: 'قطعة', subUnitName: 'كرتونة', subUnitFactor: 24, subUnitPrice: 60, costPrice: 2.0, salePrice: 2.8, stockQty: 120, minStock: 24, rackLocation: 'C-1' },
          { id: 4, code: '301', name: 'نحاس أحمر خردة كابلات', category: 'خردة', baseUnit: 'كيلو غرام', costPrice: 7.5, salePrice: 9.0, stockQty: 18, minStock: 50, rackLocation: 'مستودع الخردة' }
        ];
        setLocal(STORAGE_KEYS.ITEMS, savedItems);
      }

      initNumbering(savedCounters, savedInvoices);
      if (cancelled) return;
      setItems(savedItems);
      setInvoices(savedInvoices);
      setPayments(savedPayments);
      setExpenses(savedExpenses);
      setSettings(base);
      setOpLog(savedLog);
      setClosings(savedClosings);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // منع الكتابة فوق بعضها عند فتح البرنامج في أكثر من نافذة
  useEffect(() => onExternalChange(() => setStaleData(true)), []);

  const updateItems = (n: AlAmeenItem[]) => { setItems(n); setLocal(STORAGE_KEYS.ITEMS, n); };
  const updateInvoices = (n: AlAmeenInvoice[]) => { setInvoices(n); setLocal(STORAGE_KEYS.INVOICES, n); };
  const updatePayments = (n: PaymentRecord[]) => { setPayments(n); setLocal(STORAGE_KEYS.PAYMENTS, n); };
  const updateExpenses = (n: ExpenseItem[]) => { setExpenses(n); setLocal(STORAGE_KEYS.EXPENSES, n); };
  const updateSettings = (n: AlAmeenSettings) => { setSettings(n); setLocal(STORAGE_KEYS.SETTINGS, n); };
  const updateClosings = (n: ClosingRecord[]) => { setClosings(n); setLocal(STORAGE_KEYS.CLOSINGS, n); };

  const addLog = (kind: OpLog['kind'], party: string, invNumber: string, amount: number, text: string) => {
    const now = new Date();
    const entry: OpLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: localDateStr(now),
      time: timeStr(now),
      kind,
      party,
      invNumber,
      amount,
      text
    };
    setOpLog(prev => {
      const next = [entry, ...prev];
      setLocal(STORAGE_KEYS.LOG, next);
      return next;
    });
  };

  const requestAdminAuth = (title: string, description: string, onSuccess: () => void) => {
    setInputPass('');
    setSecurityModal({ isOpen: true, title, description, onSuccess });
  };

  const handleVerifyAdminPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await verifyHash(inputPass.trim(), settings.adminPassHash)) {
      const cb = securityModal.onSuccess;
      setSecurityModal({ isOpen: false, title: '', description: '', onSuccess: () => {} });
      cb();
    } else {
      alert('كلمة مرور المدير غير صحيحة! تم رفض العملية.');
    }
  };

  // تسديد دفعات على عدة فواتير دفعة واحدة (دفعة على الحساب: الأقدم أولاً)
  const handleCustomerPaymentBatch = (allocs: { inv: AlAmeenInvoice; amount: number }[], notes: string) => {
    const now = new Date();
    const recs: PaymentRecord[] = [];
    const byId: Record<number, number> = {};
    allocs.forEach((a, idx) => {
      byId[a.inv.id] = round2((byId[a.inv.id] || 0) + a.amount);
      recs.push({
        id: `CUST-PAY-${Date.now()}-${idx}`,
        date: localDateStr(now),
        time: timeStr(now),
        amount: a.amount,
        notes: notes.trim() || 'تسديد دفعة دين من الزبون',
        partyName: a.inv.customerName,
        partyType: 'customer',
        invNumber: a.inv.invNumber,
        currency: a.inv.currency,
        rate: settings.usdRate,
        kind: 'receipt'
      });
    });
    updateInvoices(
      invoices.map(i => {
        const add = byId[i.id];
        if (!add) return i;
        const newPaid = round2(i.paidAmount + add);
        return { ...i, paidAmount: newPaid, remainingAmount: Math.max(0, round2(i.grandTotal - newPaid)) };
      })
    );
    updatePayments([...recs, ...payments]);
    allocs.forEach(a => addLog('payment', a.inv.customerName, a.inv.invNumber, a.amount, `سند قبض دفعة من الفاتورة #${a.inv.invNumber}`));
  };

  const handleCustomerPayment = (inv: AlAmeenInvoice, amount: number, notes: string) =>
    handleCustomerPaymentBatch([{ inv, amount }], notes);

  // جرد فعلي: تثبيت الكميات الفعلية وتسجيل الفروقات
  const handleStocktake = (adj: { item: AlAmeenItem; counted: number }[]) => {
    const map: Record<number, number> = {};
    adj.forEach(a => (map[a.item.id] = a.counted));
    updateItems(items.map(it => (map[it.id] !== undefined ? { ...it, stockQty: round4(map[it.id]) } : it)));
    adj.forEach(a => {
      const diff = round4(a.counted - a.item.stockQty);
      addLog('adjust', a.item.name, '-', round2(Math.abs(diff) * a.item.costPrice), `تسوية جرد: النظام ${a.item.stockQty} ← الفعلي ${a.counted} (فرق ${diff > 0 ? '+' : ''}${diff})`);
    });
    alert('تم تثبيت نتيجة الجرد وتسجيل التسويات في السجل.');
  };

  // إقفال يومي: مقارنة النقد الفعلي بالصندوق
  const handleCloseDay = (systemCash: number, countedCash: number, notes: string) => {
    const now = new Date();
    const rec: ClosingRecord = {
      id: `CLS-${Date.now()}`,
      date: localDateStr(now),
      time: timeStr(now),
      systemCash,
      countedCash,
      diff: round2(countedCash - systemCash),
      notes
    };
    updateClosings([rec, ...closings]);
    addLog('closing', 'الصندوق', '-', Math.abs(rec.diff), `إقفال يومي: النظام ${systemCash} / الفعلي ${countedCash} / الفرق ${rec.diff}`);
  };

  // تسديد دفعة لتاجر
  const handleMerchantPayment = (invId: number, amount: number, notes: string, merchantName: string) => {
    const inv = invoices.find(i => i.id === invId);
    if (!inv) return;
    if (amount > inv.remainingAmount) {
      alert('المبلغ أكبر من المتبقي للتاجر!');
      return;
    }
    const now = new Date();
    const rec: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      date: localDateStr(now),
      time: timeStr(now),
      amount,
      notes: notes || 'تسديد دفعة للتاجر',
      partyName: merchantName,
      partyType: 'merchant',
      invNumber: inv.invNumber,
      currency: inv.currency,
      rate: settings.usdRate
    };
    const newPaid = round2(inv.paidAmount + amount);
    updateInvoices(
      invoices.map(i =>
        i.id === invId ? { ...i, paidAmount: newPaid, remainingAmount: Math.max(0, round2(i.grandTotal - newPaid)) } : i
      )
    );
    updatePayments([rec, ...payments]);
    addLog('merchant_payment', merchantName, inv.invNumber, amount, notes || 'تسديد دفعة للتاجر');
  };

  const activeItems = useMemo(() => items.filter(i => !i.isDeleted), [items]);
  const lowOrOutItems = useMemo(() => activeItems.filter(i => i.stockQty <= i.minStock), [activeItems]);
  // ترقيم تلقائي للمواد: أعلى رقم موجود (حتى المحذوف) + 1
  const nextItemCode = useMemo(() => {
    let max = 0;
    items.forEach(i => {
      const m = String(i.code).match(/(\d+)\s*$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return String(max + 1);
  }, [items]);
  const integrityIssues = useMemo(() => checkIntegrity(invoices, payments, items), [invoices, payments, items]);

  // كل المطبوعات (فواتير، كشوف، جرد، أرشيف) تحمل الختم والتوقيع حسب الإعدادات
  const printDoc = (html: string) => printCleanDocumentOffline(html + sealsFooterHtml(settings));

  const fontSizeClass =
    settings.fontSize === 'large' ? 'text-base font-medium' : settings.fontSize === 'medium' ? 'text-sm' : 'text-xs';

  // طباعة الفواتير الرسمية
  const printCleanA4InvoiceOffline = (invoice: AlAmeenInvoice) => {
    const rowsHtml = invoice.rows
      .map(
        (r, i) => `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td>${esc(r.itemCode)}</td>
          <td style="font-weight:bold;">${esc(r.itemName)}</td>
          <td>${esc(r.unit)}</td>
          <td style="text-align:center;">${r.quantity}</td>
          <td>${formatPrice(r.price, invoice.currency)}</td>
          <td style="font-weight:bold;">${formatCurr(r.total, invoice.currency)}</td>
        </tr>`
      )
      .join('');

    const logoHtml = settings.logoBase64 ? `<img src="${settings.logoBase64}" style="height: 65px; object-fit: contain;" />` : '';
    const notesHtml =
      invoice.notes && invoice.notes.trim()
        ? `<div class="notes-box"><strong>ملاحظات وبيان الفاتورة:</strong><br />${esc(invoice.notes).replace(/\n/g, '<br />')}</div>`
        : '';

    const title = invoice.type === 'sale' ? 'فاتورة مبيعات رسمية' : invoice.type === 'purchase' ? 'فاتورة مشتريات' : 'فاتورة مرتجع';
    const partyLabel = invoice.type === 'purchase' ? 'التاجر:' : 'السيد:';

    printDoc(`
      <div class="header">
        <div>
          <h1 style="margin: 0; font-size: 20px;">${esc(settings.shopName)}</h1>
          <p style="margin: 3px 0; color: #555;">هاتف: ${esc(settings.phone)} | العنوان: ${esc(settings.address)}</p>
          <h3 style="margin: 5px 0 0 0; color: #333;">${title} #${esc(invoice.invNumber)}</h3>
        </div>
        <div>${logoHtml}</div>
      </div>

      <div class="info-box">
        <div>
          <p style="margin: 2px 0;"><strong>${partyLabel}</strong> ${esc(invoice.customerName)}</p>
          <p style="margin: 2px 0;"><strong>رقم الجوال:</strong> ${esc(invoice.customerPhone)}</p>
        </div>
        <div style="text-align: left;">
          <p style="margin: 2px 0;"><strong>التاريخ:</strong> ${invoice.invDate}</p>
          <p style="margin: 2px 0;"><strong>الوقت:</strong> ${invoice.invTime}</p>
        </div>
      </div>

      ${notesHtml}

      <table>
        <thead>
          <tr>
            <th>#</th><th>رمز المادة</th><th>اسم المادة والمواصفة</th><th>الوحدة</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="totals-box">
        <div class="totals-row"><span>المجموع:</span><span>${formatCurr(invoice.subTotal, invoice.currency)}</span></div>
        <div class="totals-row"><span>الخصم:</span><span>${formatCurr(invoice.discount, invoice.currency)}</span></div>
        <div class="totals-row" style="border-top: 1px solid #444; padding-top: 3px; font-size: 14px;"><span>الصافي:</span><span>${formatCurr(invoice.grandTotal, invoice.currency)}</span></div>
        <div class="totals-row" style="color: green;"><span>المدفوع:</span><span>${formatCurr(invoice.paidAmount, invoice.currency)}</span></div>
        ${invoice.remainingAmount > 0 ? `<div class="totals-row" style="color: red;"><span>المتبقي ذمة:</span><span>${formatCurr(invoice.remainingAmount, invoice.currency)}</span></div>` : ''}
      </div>

    `);
  };

  // طباعة كشف حساب الزبون
  const handlePrintCustomerStatement = (
    customerName: string,
    customerPhone: string,
    invoicesList: AlAmeenInvoice[],
    paymentsList: PaymentRecord[],
    totalBilled: number,
    totalPaid: number,
    totalDebt: number
  ) => {
    let rowsHtml = '';
    invoicesList.forEach(inv => {
      const isRet = inv.type === 'return';
      rowsHtml += `
        <tr>
          <td>${inv.invDate} ${inv.invTime}</td>
          <td>${isRet ? `مرتجع بضاعة #${esc(inv.invNumber)}` : `فاتورة بيع #${esc(inv.invNumber)}`}</td>
          <td>${inv.rows.map(r => `${esc(r.itemName)} (${r.quantity} ${esc(r.unit)})`).join('، ')}</td>
          <td>${isRet ? '-' : formatCurr(inv.grandTotal, inv.currency)}</td>
          <td style="color: green;">${isRet ? `مرتجع ${formatCurr(inv.grandTotal, inv.currency)}` : formatCurr(inv.initialPaid ?? inv.paidAmount, inv.currency)}</td>
        </tr>`;
    });

    paymentsList.forEach(pay => {
      rowsHtml += `
        <tr style="background-color: #f0fdf4;">
          <td>${pay.date} ${pay.time}</td>
          <td style="font-weight: bold; color: green;">${pay.kind === 'refund' ? 'سند صرف (ردّ نقد)' : 'سند قبض دفعة دين'} #${esc(pay.invNumber)}</td>
          <td>${esc(pay.notes)}</td>
          <td>-</td>
          <td style="font-weight: bold; color: green;">${pay.kind === 'refund' ? '-' : '+'}${formatCurr(pay.amount, pay.currency ?? 'USD')}</td>
        </tr>`;
    });

    printDoc(`
      <div class="header">
        <div>
          <h1 style="margin: 0; font-size: 20px;">${esc(settings.shopName)}</h1>
          <p style="margin: 3px 0;">كشف حساب زبون تفصيلي معتمد - التاريخ: ${localDateStr()}</p>
        </div>
      </div>

      <div class="info-box">
        <div>
          <p style="margin: 2px 0;"><strong>السيد:</strong> ${esc(customerName)}</p>
          <p style="margin: 2px 0;"><strong>رقم الجوال:</strong> ${esc(customerPhone)}</p>
        </div>
        <div style="text-align: left;">
          <p style="margin: 2px 0;"><strong>صافي المشتريات:</strong> ${formatCurr(totalBilled)}</p>
          <p style="margin: 2px 0; color: green;"><strong>إجمالي المسدد:</strong> ${formatCurr(totalPaid)}</p>
          <p style="margin: 2px 0; font-weight: bold; color: ${totalDebt > 0.001 ? 'red' : 'green'};">
            ${totalDebt > 0.001 ? `لنا عند الزبون: ${formatCurr(totalDebt)}` : 'الحساب مسدد بالكامل ✓'}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>التاريخ والوقت</th><th>نوع الحركة</th><th>تفاصيل المواد والكميات</th><th>قيمة الفاتورة</th><th>المسدد</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `);
  };

  // طباعة كشف حساب التاجر
  const handlePrintMerchantStatement = (merchantName: string, entries: any[], totalCredit: number, totalDebit: number, netDue: number) => {
    const rowsHtml = entries
      .map(
        e => `
        <tr>
          <td>${e.date} ${e.time}</td>
          <td style="font-weight: bold;">${esc(e.type)}</td>
          <td>${esc(e.ref)}</td>
          <td style="color: green; font-weight: bold;">${e.debit > 0 ? formatCurr(e.debit, e.cur) : '-'}</td>
          <td style="color: red; font-weight: bold;">${e.credit > 0 ? formatCurr(e.credit, e.cur) : '-'}</td>
          <td>${esc(e.statement)}</td>
        </tr>`
      )
      .join('');

    printDoc(`
      <div class="header">
        <div>
          <h1 style="margin: 0; font-size: 20px;">${esc(settings.shopName)}</h1>
          <p style="margin: 3px 0;">كشف حساب تاجر / مورد تفصيلي معتمد - التاريخ: ${localDateStr()}</p>
        </div>
      </div>

      <div class="info-box">
        <div><p style="margin: 2px 0;"><strong>التاجر / المورد:</strong> ${esc(merchantName)}</p></div>
        <div style="text-align: left;">
          <p style="margin: 2px 0;"><strong>مجموع التوريدات (له):</strong> ${formatCurr(totalCredit)}</p>
          <p style="margin: 2px 0; color: green;"><strong>إجمالي المسدد له:</strong> ${formatCurr(totalDebit)}</p>
          <p style="margin: 2px 0; font-weight: bold;">
            ${netDue > 0.001 ? `<span style="color: red;">علينا للتاجر: ${formatCurr(netDue)}</span>` : netDue < -0.001 ? `<span style="color: green;">رصيد لصالحنا عند التاجر: ${formatCurr(Math.abs(netDue))}</span>` : `<span style="color: green;">الحساب مسدد بالكامل ✓</span>`}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>التاريخ والوقت</th><th>نوع الحركة</th><th>رقم المرجع</th><th>مدين (سددنا له)</th><th>دائن (استلمنا منه)</th><th>البيان والتفاصيل</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `);
  };

  // طباعة جرد المستودع
  const handlePrintCleanInventory = (list: AlAmeenItem[] = activeItems, label = '') => {
    const totalCost = list.reduce((s, it) => s + round2(it.stockQty * it.costPrice), 0);
    const totalSale = list.reduce((s, it) => s + round2(it.stockQty * it.salePrice), 0);

    const rowsHtml = list
      .map(
        (it, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${esc(it.code)}</td>
          <td style="font-weight: bold;">${esc(it.name)}</td>
          <td>${esc(it.category)}</td>
          <td style="font-weight: bold; text-align: center;">${it.stockQty} ${esc(it.baseUnit)}</td>
          <td>${formatPrice(it.costPrice)}</td>
          <td>${formatPrice(it.salePrice)}</td>
          <td style="font-weight: bold;">${formatCurr(round2(it.stockQty * it.costPrice))}</td>
        </tr>`
      )
      .join('');

    printDoc(`
      <div class="header">
        <div>
          <h1 style="margin: 0; font-size: 20px;">${esc(settings.shopName)}</h1>
          <p style="margin: 3px 0;">تقرير جرد المستودع ${label ? `(${esc(label)})` : 'والمخزون الكامل'} - التاريخ: ${localDateStr()}</p>
        </div>
        <div style="text-align: left; font-size: 11px;">
          <p style="margin: 2px 0;"><strong>رأس مال المخزون (بالتكلفة):</strong> ${formatCurr(totalCost)}</p>
          <p style="margin: 2px 0; color: green;"><strong>قيمة البيع المتوقعة:</strong> ${formatCurr(totalSale)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>#</th><th>رمز المادة</th><th>اسم المادة</th><th>التصنيف</th><th>الرصيد المتاح</th><th>سعر الشراء</th><th>سعر البيع</th><th>إجمالي رأس المال</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600 font-bold" dir="rtl">
        جارٍ تحميل البيانات...
      </div>
    );
  }

  if (staleData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900/80 p-6" dir="rtl">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center space-y-4 shadow-2xl border border-rose-300">
          <div className="text-4xl">🔄</div>
          <h2 className="font-bold text-rose-600 text-base">تم تعديل البيانات من نافذة أخرى</h2>
          <p className="text-slate-600 text-sm">لمنع ضياع أي حركة، أعد تحميل الصفحة ليتم عرض آخر بيانات محفوظة. أغلق النوافذ المكررة واعمل من نافذة واحدة فقط.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl">إعادة التحميل الآن</button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AlAmeenLogin
        onLogin={(u, r) => {
          setCurrentUser(u);
          setRole(r);
          setActiveTab('sale_inv');
        }}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    );
  }

  const dashboardCards = [
    { id: 'sale_inv', name: 'فاتورة مبيعات', icon: SvgIcons.Cart, bg: 'bg-[#0097a7] hover:bg-[#00838f]' },
    { id: 'pur_inv', name: 'فاتورة مشتريات وتجار', icon: SvgIcons.Package, bg: 'bg-[#5e35b1] hover:bg-[#512da8]' },
    { id: 'unpaid_debts', name: 'الدين غير المقبوض (زبائن)', icon: SvgIcons.Debts, bg: 'bg-[#e53935] hover:bg-[#d32f2f]' },
    { id: 'merchant_debts', name: 'ديون التجار (الموردين)', icon: SvgIcons.Truck, bg: 'bg-[#0288d1] hover:bg-[#0277bd]' },
    { id: 'merchant_statement', name: 'كشف حساب تاجر', icon: SvgIcons.MerchantStatement, bg: 'bg-[#00897b] hover:bg-[#00796b]' },
    { id: 'expenses', name: 'المصاريف اليومية', icon: SvgIcons.MoneyBag, bg: 'bg-[#43a047] hover:bg-[#388e3c]' },
    { id: 'returns', name: 'الفواتير المرحلة', icon: SvgIcons.Returns, bg: 'bg-[#f4511e] hover:bg-[#e64a19]' },
    { id: 'items', name: 'المستودع والمواد', icon: SvgIcons.Layers, bg: 'bg-[#1e88e5] hover:bg-[#1976d2]' },
    { id: 'archive', name: 'أرشيف الفواتير المعتمد', icon: SvgIcons.Printer, bg: 'bg-[#fb8c00] hover:bg-[#f57c00]' },
    { id: 'profits', name: 'المبيعات والأرباح', icon: SvgIcons.Trending, bg: 'bg-[#7b1fa2] hover:bg-[#6a1b9a]' },
    { id: 'statement', name: 'كشف حساب زبون', icon: SvgIcons.Users, bg: 'bg-[#f06292] hover:bg-[#e91e63]' },
    { id: 'settings', name: 'الإعدادات والأمان والنسخ', icon: SvgIcons.Settings, bg: 'bg-[#3949ab] hover:bg-[#303f9f]' }
  ];

  const CASHIER_TABS = ['sale_inv', 'unpaid_debts', 'returns', 'statement', 'items'];
  const visibleCards = role === 'admin' ? dashboardCards : dashboardCards.filter(c => CASHIER_TABS.includes(c.id));

  return (
    <div className={`min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-sans select-none text-right ${fontSizeClass}`} dir="rtl">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0097a7] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">🏛️</div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base">{settings.shopName}</h1>
            <span className="text-xs text-[#0097a7] font-bold">برنامج الأمين للمحاسبة والمستودعات - Enterprise Edition</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          {lowOrOutItems.length > 0 && (
            <div
              onClick={() => setActiveTab('items')}
              className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm animate-bounce"
            >
              ⚠️ {lowOrOutItems.length} مواد بها نفاذ أو قاربت على النفاذ!
            </div>
          )}
          {role === 'admin' && integrityIssues.length > 0 && (
            <div
              onClick={() => setActiveTab('settings')}
              className="bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg cursor-pointer shadow-sm"
              title="افتح الإعدادات لعرض تفاصيل فحص التطابق"
            >
              🔍 {integrityIssues.length} عدم تطابق محاسبي
            </div>
          )}
          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-mono">1 $ = {settings.usdRate} ل.س</span>
          <span className="text-slate-600">{currentUser} ({role === 'admin' ? 'المدير العام' : 'كاشير'})</span>
          <button onClick={() => setCurrentUser(null)} className="text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
            خروج 🚪
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 p-3 shadow-inner">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {visibleCards.map(card => {
            const Icon = card.icon;
            const active = activeTab === card.id;
            return (
              <button
                key={card.id}
                onClick={() => setActiveTab(card.id as any)}
                className={`${card.bg} text-white p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-150 transform hover:-translate-y-0.5 shadow-md ${
                  active ? 'ring-4 ring-slate-800 scale-[1.02] shadow-xl' : 'opacity-95'
                }`}
              >
                <div className="p-0.5"><Icon /></div>
                <span className="text-xs font-bold tracking-tight text-center leading-tight">{card.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 p-5 overflow-y-auto max-w-7xl w-full mx-auto">
        {activeTab === 'sale_inv' && (
          <SaleInvoiceWorkspace
            items={activeItems}
            settings={settings}
            onPostInvoice={(inv, updatedItems) => {
              updateInvoices([inv, ...invoices]);
              updateItems(items.map(it => updatedItems.find(u => u.id === it.id) || it));
              addLog('sale', inv.customerName, inv.invNumber, inv.grandTotal, `فاتورة مبيعات - مدفوع ${formatCurr(inv.paidAmount, inv.currency)}`);
              printCleanA4InvoiceOffline(inv);
            }}
          />
        )}

        {activeTab === 'pur_inv' && (
          <PurchaseInvoiceWorkspace
            items={activeItems}
            settings={settings}
            onPostPurchase={(inv, updatedItems) => {
              updateInvoices([inv, ...invoices]);
              updateItems(items.map(it => updatedItems.find(u => u.id === it.id) || it));
              addLog('purchase', inv.customerName, inv.invNumber, inv.grandTotal, 'فاتورة مشتريات من التاجر');
              printCleanA4InvoiceOffline(inv);
            }}
          />
        )}

        {activeTab === 'unpaid_debts' && <UnpaidDebtsWorkspace invoices={invoices} onPay={handleCustomerPayment} onPayBatch={handleCustomerPaymentBatch} />}

        {activeTab === 'merchant_debts' && <MerchantDebtsWorkspace invoices={invoices} onPayMerchantDebt={handleMerchantPayment} />}

        {activeTab === 'merchant_statement' && (
          <MerchantStatementWorkspace
            invoices={invoices}
            payments={payments}
            onRequestAuth={requestAdminAuth}
            onDeletePayment={paymentId => {
              const pay = payments.find(p => p.id === paymentId);
              if (!pay) return;
              const targetInv = invoices.find(i => i.invNumber === pay.invNumber);
              if (targetInv) {
                const newPaid = Math.max(0, round2(targetInv.paidAmount - pay.amount));
                const newRem = Math.max(0, round2(targetInv.grandTotal - newPaid));
                updateInvoices(invoices.map(i => (i.id === targetInv.id ? { ...i, paidAmount: newPaid, remainingAmount: newRem } : i)));
              }
              updatePayments(payments.filter(p => p.id !== paymentId));
              addLog('delete', pay.partyName, pay.invNumber, pay.amount, `حذف سند دفعة تاجر ${pay.id}`);
              alert('تم حذف الدفعة وإعادة الرصيد إلى ذمة التاجر بنجاح!');
            }}
            onEditPayment={(paymentId, newAmount, newNotes) => {
              const oldPayment = payments.find(p => p.id === paymentId);
              if (!oldPayment) return;
              if (newAmount <= 0) {
                alert('المبلغ غير صحيح!');
                return;
              }
              const delta = round2(newAmount - oldPayment.amount);
              const targetInv = invoices.find(i => i.invNumber === oldPayment.invNumber);
              if (targetInv && delta > targetInv.remainingAmount) {
                alert(`الزيادة (${formatCurr(delta, targetInv.currency)}) أكبر من المتبقي للتاجر على الفاتورة (${formatCurr(targetInv.remainingAmount, targetInv.currency)})!`);
                return;
              }
              if (targetInv) {
                const newPaid = Math.max(0, round2(targetInv.paidAmount + delta));
                const newRem = Math.max(0, round2(targetInv.grandTotal - newPaid));
                updateInvoices(invoices.map(i => (i.id === targetInv.id ? { ...i, paidAmount: newPaid, remainingAmount: newRem } : i)));
              }
              updatePayments(payments.map(p => (p.id === paymentId ? { ...p, amount: newAmount, notes: newNotes } : p)));
              addLog('merchant_payment', oldPayment.partyName, oldPayment.invNumber, newAmount, `تعديل سند دفعة تاجر من ${oldPayment.amount} إلى ${newAmount}`);
              alert('تم تعديل الدفعة وتحديث الرصيد بنجاح!');
            }}
            onPrintStatement={handlePrintMerchantStatement}
          />
        )}

        {activeTab === 'expenses' && (
          <DailyExpensesWorkspace
            expenses={expenses}
            onRequestAuth={requestAdminAuth}
            onAddExpense={newExp => {
              updateExpenses([newExp, ...expenses]);
              addLog('expense', newExp.category, '-', newExp.amount, newExp.title);
            }}
            onDeleteExpense={id => {
              const e = expenses.find(x => x.id === id);
              updateExpenses(expenses.filter(x => x.id !== id));
              if (e) addLog('delete', e.category, '-', e.amount, `حذف مصروف: ${e.title}`);
            }}
          />
        )}

        {activeTab === 'returns' && (
          <PostedInvoicesWorkspace
            invoices={invoices}
            items={items}
            onPrint={printCleanA4InvoiceOffline}
            onSave={(updatedInv, updatedItems, retInv, refund, log) => {
              if (refund) updatePayments([refund, ...payments]);
              const newInvs = invoices.map(i => (i.id === updatedInv.id ? updatedInv : i));
              updateInvoices(retInv ? [retInv, ...newInvs] : newInvs);
              updateItems(updatedItems);
              addLog(log.kind, updatedInv.customerName, updatedInv.invNumber, log.amount, log.text);
              if (retInv) printCleanA4InvoiceOffline(retInv);
            }}
          />
        )}

        {activeTab === 'items' && (
          <ItemsManagementWorkspace
            items={activeItems}
            nextCode={nextItemCode}
            onRequestAuth={requestAdminAuth}
            onSaveItem={newItem => {
              // يُسمح بإضافة نفس المادة (نفس الكود أو الاسم) أكثر من مرة دون أي قيود
              updateItems([...items, newItem]);
              addLog('item', newItem.name, '-', 0, `إضافة بطاقة مادة (رصيد ${newItem.stockQty})`);
            }}
            onUpdateItem={updatedItem => {
              updateItems(items.map(it => (it.id === updatedItem.id ? updatedItem : it)));
              addLog('item', updatedItem.name, '-', 0, `تعديل بيانات المادة (رصيد ${updatedItem.stockQty})`);
              alert('تم تعديل بيانات المادة بنجاح!');
            }}
            onDeleteItem={itemId => {
              const it = items.find(x => x.id === itemId);
              updateItems(items.map(x => (x.id === itemId ? { ...x, isDeleted: true } : x)));
              if (it) addLog('delete', it.name, '-', 0, 'حذف مادة من المستودع');
              alert('تم حذف المادة بنجاح مع الحفاظ على سلامة الفواتير السابقة!');
            }}
            onPrintInventory={handlePrintCleanInventory}
            onStocktake={handleStocktake}
          />
        )}

        {activeTab === 'archive' && (
          <InvoiceArchiveWorkspace
            invoices={invoices}
            opLog={opLog}
            onRequestAuth={requestAdminAuth}
            onDeleteInvoice={invId => {
              const inv = invoices.find(i => i.id === invId);
              if (!inv) return;
              if (inv.type === 'return') {
                alert('لا يمكن حذف فاتورة مرتجع منفردة لأنها مرتبطة بالفاتورة الأصلية. احذف الفاتورة الأصلية إن لزم.');
                return;
              }
              const qtyByItem: Record<number, number> = {};
              inv.rows.forEach(r => {
                qtyByItem[r.itemId] = round4((qtyByItem[r.itemId] || 0) + r.quantity * r.factor);
              });
              const updatedItems = items.map(it => {
                const q = qtyByItem[it.id];
                if (q === undefined) return it;
                return { ...it, stockQty: round4(inv.type === 'sale' ? it.stockQty + q : Math.max(0, it.stockQty - q)) };
              });
              updateItems(updatedItems);
              updateInvoices(invoices.filter(i => i.id !== invId && i.origInvNumber !== inv.invNumber));
              updatePayments(payments.filter(p => p.invNumber !== inv.invNumber));
              addLog('delete', inv.customerName, inv.invNumber, inv.grandTotal, 'حذف الفاتورة وعكس أثرها المالي والمخزني');
              alert('تم حذف الفاتورة وإلغاء أثرها المالي والمخزني بنجاح!');
            }}
            onPrintA4={printCleanA4InvoiceOffline}
            onPrintFilteredArchive={(filteredList, filterName) => {
              const rowsHtml = filteredList
                .map(
                  (inv, i) => `
                  <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td>${esc(inv.invNumber)}</td>
                    <td style="font-weight:bold;">${inv.type === 'sale' ? 'مبيعات' : inv.type === 'purchase' ? 'مشتريات' : 'مرتجع'}</td>
                    <td>${esc(inv.customerName)}</td>
                    <td>${inv.invDate} ${inv.invTime}</td>
                    <td style="font-weight:bold;">${formatCurr(inv.grandTotal, inv.currency)}</td>
                    <td style="color:red;">${formatCurr(inv.remainingAmount, inv.currency)}</td>
                  </tr>`
                )
                .join('');

              printDoc(`
                <div class="header">
                  <div>
                    <h1 style="margin: 0; font-size: 20px;">${esc(settings.shopName)}</h1>
                    <p style="margin: 3px 0;">أرشيف الفواتير المعتمد (${filterName}) - التاريخ: ${localDateStr()}</p>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr><th>#</th><th>رقم الفاتورة</th><th>نوع الفاتورة</th><th>الطرف (السيد: / التاجر)</th><th>التاريخ والوقت</th><th>الإجمالي</th><th>المتبقي دين</th></tr>
                  </thead>
                  <tbody>${rowsHtml}</tbody>
                </table>
              `);
            }}
          />
        )}

        {activeTab === 'profits' && <ProfitsReportWorkspace invoices={invoices} expenses={expenses} payments={payments} closings={closings} onCloseDay={handleCloseDay} />}

        {activeTab === 'statement' && (
          <StatementWorkspace invoices={invoices} payments={payments} onPrintStatement={handlePrintCustomerStatement} />
        )}

        {activeTab === 'settings' && (
          <SettingsWorkspace
            settings={settings}
            allAppData={{ items, invoices, payments, expenses, settings, opLog, closings }}
            integrityIssues={integrityIssues}
            onSaveSettings={updateSettings}
            onRestoreFullData={restored => {
              if (!restored || !Array.isArray(restored.items) || !Array.isArray(restored.invoices)) {
                alert('ملف النسخة الاحتياطية غير صالح!');
                return;
              }
              updateItems(restored.items);
              updateInvoices(restored.invoices);
              updateExpenses(Array.isArray(restored.expenses) ? restored.expenses : []);
              updatePayments(Array.isArray(restored.payments) ? restored.payments : []);
              if (restored.settings) updateSettings({ ...settings, ...restored.settings });
              const lg = Array.isArray(restored.opLog) ? restored.opLog : [];
              setOpLog(lg);
              setLocal(STORAGE_KEYS.LOG, lg);
              updateClosings(Array.isArray(restored.closings) ? restored.closings : []);
              initNumbering(undefined, restored.invoices);
              alert('تمت استعادة النسخة الاحتياطية بنجاح!');
            }}
          />
        )}
      </main>

      {securityModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleVerifyAdminPass} className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl border border-rose-300">
            <div className="text-center">
              <span className="text-3xl">🔐</span>
              <h4 className="font-bold text-rose-600 text-base mt-1">{securityModal.title}</h4>
              <p className="text-slate-600 text-xs mt-1">{securityModal.description}</p>
            </div>
            <div>
              <label className="text-slate-700 block mb-1 font-bold">كلمة مرور المدير:</label>
              <input
                type="password"
                required
                placeholder="أدخل كلمة المرور..."
                value={inputPass}
                onChange={e => setInputPass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-bold"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSecurityModal({ isOpen: false, title: '', description: '', onSuccess: () => {} })}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-bold"
              >
                إلغاء
              </button>
              <button type="submit" className="px-5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm">
                تأكيد العملية
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
// ==========================================
// 4. فاتورة المبيعات
// ==========================================
function SaleInvoiceWorkspace({
  items,
  settings,
  onPostInvoice
}: {
  items: AlAmeenItem[];
  settings: AlAmeenSettings;
  onPostInvoice: (inv: AlAmeenInvoice, updatedItems: AlAmeenItem[]) => void;
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'SYP'>('USD');
  const [discountStr, setDiscountStr] = useState('0');
  const [paidStr, setPaidStr] = useState('0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [searchCode, setSearchCode] = useState('');

  const currentDate = localDateStr();
  const currentTime = timeStr();

  const conv = (usd: number) => (currency === 'SYP' ? round2(usd * settings.usdRate) : usd);

  const subTotal = round2(rows.reduce((s, r) => s + r.total, 0));
  const discount = Math.min(Math.max(0, parseMoney(discountStr)), subTotal);
  const grandTotal = Math.max(0, round2(subTotal - discount));
  const paid = parseMoney(paidStr);
  const remaining = Math.max(0, round2(grandTotal - paid));

  useEffect(() => {
    setPaidStr(String(grandTotal));
  }, [grandTotal]);

  const addRow = (it: AlAmeenItem) => {
    if (it.stockQty <= 0) {
      alert(`عذراً، المادة (${it.name}) غير متوفرة في المستودع حالياً (تم نفاذ الكمية)!`);
      return;
    }
    setRows([
      ...rows,
      {
        itemId: it.id,
        itemCode: it.code,
        itemName: it.name,
        unit: it.baseUnit,
        factor: 1,
        quantity: 1,
        price: conv(it.salePrice),
        total: conv(it.salePrice),
        cost: it.costPrice,
        addedAt: `${currentDate} ${currentTime}`
      }
    ]);
    setSearchCode('');
  };

  const updateRow = (index: number, field: keyof InvoiceRow, val: any) => {
    const list = [...rows];
    const r = { ...list[index] };
    const it = items.find(i => i.id === r.itemId);

    if (field === 'quantity') {
      const q = parseDecimal(val);
      if (it && q * r.factor > it.stockQty) {
        alert(`الكمية المطلوبة (${q} ${r.unit}) تتجاوز الرصيد المتوفر في المستودع (${it.stockQty} ${it.baseUnit})!`);
        return;
      }
      r.qtyStr = String(val);
      r.quantity = q;
      r.total = round2(r.quantity * r.price);
    } else if (field === 'price') {
      r.priceStr = String(val);
      r.price = parseDecimal(val);
      r.total = round2(r.quantity * r.price);
    } else if (field === 'unit') {
      r.unit = val;
      if (it && it.subUnitName === val) {
        r.factor = it.subUnitFactor || 1;
        r.price = conv(it.subUnitPrice || it.salePrice * r.factor);
      } else if (it) {
        r.factor = 1;
        r.price = conv(it.salePrice);
      }
      r.priceStr = undefined;
      r.total = round2(r.quantity * r.price);
    }

    list[index] = r;
    setRows(list);
  };

  const postInvoice = () => {
    if (isSubmitting) return;
    if (rows.length === 0) {
      alert('الفاتورة فارغة، يرجى إضافة مواد للبيع أولاً!');
      return;
    }
    if (!customerName.trim()) {
      alert('يرجى كتابة اسم الزبون (السيد:) أولاً!');
      return;
    }
    if (rows.some(r => r.quantity <= 0 || r.price < 0)) {
      alert('تحقق من الكميات والأسعار في بنود الفاتورة.');
      return;
    }
    if (paid < 0 || paid > grandTotal) {
      alert('المبلغ المدفوع لا يمكن أن يكون سالباً أو أكبر من صافي الفاتورة!');
      return;
    }

    // تجميع الكميات لكل مادة (يمنع خطأ تكرار نفس المادة في سطرين)
    const need: Record<number, number> = {};
    rows.forEach(r => {
      need[r.itemId] = round4((need[r.itemId] || 0) + r.quantity * r.factor);
    });
    for (const [id, qty] of Object.entries(need)) {
      const it = items.find(i => i.id === Number(id));
      if (!it || it.stockQty < qty) {
        alert(`رصيد المادة (${it ? it.name : id}) المتاح (${it ? it.stockQty : 0}) أقل من الكمية المطلوبة (${qty}).`);
        return;
      }
    }

    setIsSubmitting(true);
    const now = new Date();
    const invNumber = nextInvNumber('SAL');

    const updatedItems = items.map(it =>
      need[it.id] !== undefined ? { ...it, stockQty: round4(it.stockQty - need[it.id]) } : it
    );

    const newInv: AlAmeenInvoice = {
      id: Date.now(),
      invNumber,
      type: 'sale',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || 'لا يوجد',
      rows: rows.map(({ priceStr, qtyStr, ...r }) => r),
      subTotal,
      discount,
      discountRate: subTotal > 0 ? round4(discount / subTotal) : 0,
      grandTotal,
      initialPaid: paid,
      paidAmount: paid,
      remainingAmount: remaining,
      currency,
      exchangeRate: settings.usdRate,
      invDate: localDateStr(now),
      invTime: timeStr(now),
      notes: notes.trim()
    };

    onPostInvoice(newInv, updatedItems);
    setRows([]);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setDiscountStr('0');
    setIsSubmitting(false);
  };

  const filteredItems = searchCode.trim()
    ? items.filter(i => i.code.includes(searchCode) || i.name.toLowerCase().includes(searchCode.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 bg-[#0097a7] rounded-full inline-block"></span>
          فاتورة مبيعات جديدة (تبدأ فارغة - لا خصم تلقائي)
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-bold">العملة:</span>
          <select
            value={currency}
            disabled={rows.length > 0}
            onChange={e => setCurrency(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded px-3 py-1 font-bold text-slate-800 disabled:opacity-60"
          >
            <option value="USD">دولار أمريكي ($ USD)</option>
            <option value="SYP">ليرة سورية (ل.س SYP)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <label className="text-slate-600 block mb-1 font-bold">السيد (الزبون):</label>
          <input type="text" required placeholder="اسم الزبون..." value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-bold" />
        </div>
        <div>
          <label className="text-slate-600 block mb-1 font-bold">رقم الجوال:</label>
          <input type="text" placeholder="0912345678" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800" />
        </div>
        <div>
          <label className="text-slate-600 block mb-1 font-bold">تاريخ ووقت الفاتورة:</label>
          <div className="bg-white border border-slate-300 rounded-lg p-2 text-[#0097a7] font-mono font-bold">
            {currentDate} | {currentTime}
          </div>
        </div>
        <div className="relative">
          <label className="text-[#0097a7] block mb-1 font-bold">+ إضافة مادة للفاتورة:</label>
          <input type="text" placeholder="ابحث بالكود أو الاسم..." value={searchCode} onChange={e => setSearchCode(e.target.value)} className="w-full bg-white border border-[#0097a7] rounded-lg p-2 text-slate-800 focus:outline-none" />
          {filteredItems.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 divide-y divide-slate-100">
              {filteredItems.map(it => (
                <div key={it.id} onClick={() => addRow(it)} className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{it.code} - {it.name}</span>
                    <span className={`text-[11px] font-bold ${it.stockQty <= 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {it.stockQty <= 0 ? '⛔ تم نفاذ الكمية (0)' : `المتوفر: ${it.stockQty} ${it.baseUnit}`}
                    </span>
                  </div>
                  <span className="text-[#0097a7] font-mono font-bold">{formatPrice(conv(it.salePrice), currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">رمز المادة</th>
              <th className="p-3">اسم المادة والمواصفات</th>
              <th className="p-3">الوحدة</th>
              <th className="p-3">الكمية</th>
              <th className="p-3">السعر الإفرادي</th>
              <th className="p-3">الإجمالي</th>
              <th className="p-3 text-center">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">الفاتورة فارغة حالياً. ابحث عن مادة من الصندوق بالأعلى لإضافتها.</td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const it = items.find(i => i.id === r.itemId);
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-[#0097a7]">{r.itemCode}</td>
                    <td className="p-3 font-sans font-bold text-slate-900">{r.itemName}</td>
                    <td className="p-3 font-sans">
                      <select value={r.unit} onChange={e => updateRow(idx, 'unit', e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs">
                        <option value={it?.baseUnit}>{it?.baseUnit}</option>
                        {it?.subUnitName && <option value={it.subUnitName}>{it.subUnitName} ({it.subUnitFactor} {it.baseUnit})</option>}
                      </select>
                    </td>
                    <td className="p-3">
                      <input type="text" inputMode="decimal" value={r.qtyStr ?? r.quantity} onChange={e => updateRow(idx, 'quantity', e.target.value)} className="w-20 bg-slate-50 border border-slate-300 rounded p-1 text-center font-bold" />
                    </td>
                    <td className="p-3">
                      <input type="text" inputMode="decimal" value={r.priceStr ?? r.price} onChange={e => updateRow(idx, 'price', e.target.value)} className="w-24 bg-slate-50 border border-slate-300 rounded p-1 font-bold text-[#0097a7]" />
                    </td>
                    <td className="p-3 font-bold text-slate-900">{formatCurr(r.total, currency)}</td>
                    <td className="p-3 text-center font-sans">
                      <button onClick={() => setRows(rows.filter((_, i) => i !== idx))} className="text-rose-500 font-bold">✕</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <label className="text-slate-700 block mb-1 font-bold">ملاحظات الفاتورة (اختيارية):</label>
        <textarea rows={2} placeholder="تم الاتفاق على تسديد المبلغ الأسبوع القادم، شروط خاصة..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800 text-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-500 block mb-1 font-bold">المجموع:</span>
          <span className="text-base font-bold font-mono text-slate-900">{formatCurr(subTotal, currency)}</span>
        </div>
        <div>
          <span className="text-slate-500 block mb-1 font-bold">الخصم:</span>
          <input type="text" inputMode="decimal" value={discountStr} onChange={e => setDiscountStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono" />
        </div>
        <div>
          <span className="text-[#0097a7] font-bold block mb-1">الصافي النهائي:</span>
          <span className="text-lg font-bold font-mono text-[#0097a7]">{formatCurr(grandTotal, currency)}</span>
        </div>
        <div>
          <span className="text-slate-500 block mb-1 font-bold">المدفوع نقداً:</span>
          <input type="text" inputMode="decimal" value={paidStr} onChange={e => setPaidStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5 text-emerald-600 font-bold font-mono" />
        </div>
      </div>

      {remaining > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex justify-between items-center font-bold">
          <span>المتبقي ذمة سيتم ترحيلها لتبويب (الدين غير المقبوض):</span>
          <span className="font-mono text-base">{formatCurr(remaining, currency)}</span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={postInvoice} disabled={rows.length === 0 || isSubmitting} className="px-6 py-2.5 bg-[#0097a7] hover:bg-[#00838f] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-colors">
          {isSubmitting ? 'جارٍ الترحيل والطباعة...' : '✓ حفظ الفاتورة وإنقاص المستودع والطباعة التلقائية A4'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 5. فاتورة المشتريات والتجار
// ==========================================
function PurchaseInvoiceWorkspace({
  items,
  settings,
  onPostPurchase
}: {
  items: AlAmeenItem[];
  settings: AlAmeenSettings;
  onPostPurchase: (inv: AlAmeenInvoice, updatedItems: AlAmeenItem[]) => void;
}) {
  const [merchantName, setMerchantName] = useState('');
  const [shopName, setShopName] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'SYP'>('USD');
  const [paidStr, setPaidStr] = useState('0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number>(items[0]?.id || 1);
  const [qtyStr, setQtyStr] = useState('1');
  const [costStr, setCostStr] = useState('0');

  const subTotal = round2(rows.reduce((s, r) => s + r.total, 0));
  const paid = parseMoney(paidStr);

  const addPurchaseRow = () => {
    const it = items.find(i => i.id === selectedItemId);
    const q = parseDecimal(qtyStr);
    const c = parseDecimal(costStr) || (it ? (currency === 'SYP' ? round2(it.costPrice * settings.usdRate) : it.costPrice) : 0);
    if (!it || q <= 0) return;

    // سعر الشراء يُخزَّن بالدولار في بند التكلفة
    const costUSD = toUSD(c, currency, settings.usdRate);
    setRows([
      ...rows,
      { itemId: it.id, itemCode: it.code, itemName: it.name, unit: it.baseUnit, factor: 1, quantity: q, price: c, total: round2(q * c), cost: costUSD }
    ]);
    setQtyStr('1');
  };

  const savePurchase = () => {
    if (isSubmitting) return;
    if (rows.length === 0 || !merchantName.trim()) {
      alert('يرجى كتابة اسم التاجر وإضافة مواد للفاتورة!');
      return;
    }
    if (paid < 0 || paid > subTotal) {
      alert('المبلغ المسدد لا يمكن أن يكون سالباً أو أكبر من إجمالي الفاتورة!');
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const invNumber = nextInvNumber('PUR');
    const remaining = Math.max(0, round2(subTotal - paid));

    const addQty: Record<number, number> = {};
    const addValue: Record<number, number> = {};
    rows.forEach(r => {
      const q = r.quantity * r.factor;
      addQty[r.itemId] = round4((addQty[r.itemId] || 0) + q);
      addValue[r.itemId] = (addValue[r.itemId] || 0) + q * r.cost;
    });
    // التكلفة بالمتوسط المرجح بدل آخر سعر
    const updatedItems = items.map(it => {
      if (addQty[it.id] === undefined) return it;
      const oldQty = Math.max(0, it.stockQty);
      const newQty = round4(it.stockQty + addQty[it.id]);
      const avg = oldQty + addQty[it.id] > 0 ? round4((oldQty * it.costPrice + addValue[it.id]) / (oldQty + addQty[it.id])) : it.costPrice;
      return { ...it, stockQty: newQty, costPrice: avg };
    });

    const inv: AlAmeenInvoice = {
      id: Date.now(),
      invNumber,
      type: 'purchase',
      customerName: merchantName.trim(),
      customerPhone: '',
      merchantName: merchantName.trim(),
      shopName: shopName.trim() || settings.shopName,
      rows,
      subTotal,
      discount: 0,
      grandTotal: subTotal,
      initialPaid: paid,
      paidAmount: paid,
      remainingAmount: remaining,
      currency,
      exchangeRate: settings.usdRate,
      invDate: localDateStr(now),
      invTime: timeStr(now),
      notes: notes.trim()
    };

    onPostPurchase(inv, updatedItems);
    setRows([]);
    setMerchantName('');
    setNotes('');
    setPaidStr('0');
    setIsSubmitting(false);
    alert(
      remaining > 0
        ? `تم ترحيل المواد للمستودع، وترحيل باقي حساب التاجر (${formatCurr(remaining, currency)}) إلى تبويب (ديون التجار)!`
        : 'تم حفظ فاتورة المشتريات بالكامل وزيادة رصيد المستودع!'
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm text-xs">
      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b pb-3">
        <span className="w-3 h-3 bg-[#5e35b1] rounded-full inline-block"></span>
        فاتورة مشتريات وتوريد بضاعة من تاجر
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="text-slate-700 block mb-1 font-bold">اسم التاجر / المورد:</label>
          <input type="text" required placeholder="التاجر أبو أحمد، معمل الشام..." value={merchantName} onChange={e => setMerchantName(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold" />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">اسم المعمل أو المحل:</label>
          <input type="text" placeholder="شركة الكابلات الحديثة..." value={shopName} onChange={e => setShopName(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900" />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">العملة:</label>
          <select value={currency} disabled={rows.length > 0} onChange={e => setCurrency(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 disabled:opacity-60">
            <option value="USD">دولار أمريكي ($ USD)</option>
            <option value="SYP">ليرة سورية (ل.س SYP)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 items-end">
        <div>
          <label className="text-slate-700 block mb-1">الصنف المستلم:</label>
          <select
            value={selectedItemId}
            onChange={e => {
              const id = Number(e.target.value);
              setSelectedItemId(id);
              const it = items.find(i => i.id === id);
              if (it) setCostStr(String(currency === 'SYP' ? round2(it.costPrice * settings.usdRate) : it.costPrice));
            }}
            className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-800"
          >
            {items.map(i => (
              <option key={i.id} value={i.id}>{i.code} - {i.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-slate-700 block mb-1">عدد الصنف (الكمية):</label>
          <input type="text" inputMode="decimal" value={qtyStr} onChange={e => setQtyStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold" />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">سعر الشراء للوحدة:</label>
          <input type="text" inputMode="decimal" value={costStr} onChange={e => setCostStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold" />
        </div>
        <button onClick={addPurchaseRow} className="bg-[#5e35b1] hover:bg-[#512da8] text-white font-bold py-2 rounded shadow">+ إضافة للفاتورة</button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">اسم الصنف</th>
              <th className="p-3">العدد (الكمية)</th>
              <th className="p-3">سعر الشراء للوحدة</th>
              <th className="p-3">الإجمالي</th>
              <th className="p-3 text-center">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td className="p-3 text-slate-400">{idx + 1}</td>
                <td className="p-3 font-sans font-bold text-slate-900">{r.itemName}</td>
                <td className="p-3 text-[#5e35b1] font-bold">{r.quantity} {r.unit}</td>
                <td className="p-3">{formatPrice(r.price, currency)}</td>
                <td className="p-3 font-bold text-emerald-600">{formatCurr(r.total, currency)}</td>
                <td className="p-3 text-center font-sans">
                  <button onClick={() => setRows(rows.filter((_, i) => i !== idx))} className="text-rose-500 font-bold">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <label className="text-slate-700 block mb-1 font-bold">ملاحظات فاتورة الشراء:</label>
        <textarea rows={2} placeholder="شروط التسديد للتاجر، موعد استلام بقية المواد..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800 text-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <span className="text-slate-600 block mb-1">إجمالي الفاتورة:</span>
          <span className="text-base font-bold font-mono text-slate-900">{formatCurr(subTotal, currency)}</span>
        </div>
        <div>
          <span className="text-slate-600 block mb-1">المبلغ المسدد الآن للتاجر:</span>
          <input type="text" inputMode="decimal" value={paidStr} onChange={e => setPaidStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5 text-emerald-600 font-bold font-mono" />
        </div>
        <div>
          <span className="text-slate-600 block mb-1">المتبقي دين للتاجر:</span>
          <span className="text-base font-bold font-mono text-rose-600">{formatCurr(Math.max(0, round2(subTotal - paid)), currency)}</span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={savePurchase} disabled={rows.length === 0 || isSubmitting} className="px-6 py-2.5 bg-[#5e35b1] hover:bg-[#512da8] disabled:opacity-50 text-white font-bold rounded-xl shadow-md">
          {isSubmitting ? 'جارٍ الترحيل...' : '✓ ترحيل المواد للمستودع والفاتورة للحسابات والطباعة A4'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 6. الديون غير المقبوضة (الزبائن غير المسددين فقط)
// ==========================================
function UnpaidDebtsWorkspace({
  invoices,
  onPay,
  onPayBatch
}: {
  invoices: AlAmeenInvoice[];
  onPay: (inv: AlAmeenInvoice, amount: number, notes: string) => void;
  onPayBatch: (allocs: { inv: AlAmeenInvoice; amount: number }[], notes: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const unpaidList = useMemo(
    () =>
      invoices.filter(
        i =>
          i.type === 'sale' &&
          i.remainingAmount > 0.001 &&
          (i.customerName.toLowerCase().includes(search.toLowerCase()) ||
            i.customerPhone.includes(search) ||
            i.invNumber.includes(search))
      ),
    [invoices, search]
  );

  const byCustomer = useMemo(() => {
    const m: Record<string, number> = {};
    unpaidList.forEach(i => {
      m[i.customerName] = round2((m[i.customerName] || 0) + toUSD(i.remainingAmount, i.currency, i.exchangeRate));
    });
    return Object.entries(m);
  }, [unpaidList]);

  const totalDebt = round2(unpaidList.reduce((s, i) => s + toUSD(i.remainingAmount, i.currency, i.exchangeRate), 0));
  const activeInvoice = invoices.find(i => i.id === activeId) || null;

  // دفعة على الحساب: تُوزَّع على أقدم الفواتير المفتوحة للزبون أولاً
  const [acctCustomer, setAcctCustomer] = useState('');
  const [acctCur, setAcctCur] = useState<'USD' | 'SYP'>('USD');
  const [acctAmt, setAcctAmt] = useState('');
  const [acctNotes, setAcctNotes] = useState('');
  const debtors = Array.from(new Set(invoices.filter(i => i.type === 'sale' && i.remainingAmount > 0.001).map(i => i.customerName)));

  const payOnAccount = () => {
    const name = acctCustomer || debtors[0] || '';
    const amount = parseMoney(acctAmt);
    if (!name || amount <= 0) {
      alert('اختر الزبون وأدخل مبلغاً صحيحاً!');
      return;
    }
    const list = invoices
      .filter(i => i.type === 'sale' && i.customerName === name && i.currency === acctCur && i.remainingAmount > 0.001)
      .sort((a, b) => a.id - b.id);
    const totalCur = round2(list.reduce((s, i) => s + i.remainingAmount, 0));
    if (list.length === 0) {
      alert('لا توجد فواتير مفتوحة لهذا الزبون بهذه العملة.');
      return;
    }
    if (amount > totalCur) {
      alert(`المبلغ أكبر من إجمالي الدين (${formatCurr(totalCur, acctCur)})!`);
      return;
    }
    let left = amount;
    const allocs: { inv: AlAmeenInvoice; amount: number }[] = [];
    for (const inv of list) {
      if (left <= 0.0001) break;
      const a = round2(Math.min(left, inv.remainingAmount));
      allocs.push({ inv, amount: a });
      left = round2(left - a);
    }
    onPayBatch(allocs, acctNotes.trim() || 'دفعة على الحساب');
    setAcctAmt('');
    setAcctNotes('');
    alert(`تم توزيع الدفعة على ${allocs.length} فاتورة (الأقدم أولاً).`);
  };

  const handlePay = () => {
    if (!activeInvoice) return;
    const amount = parseMoney(payAmountStr);
    if (amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح!');
      return;
    }
    if (amount > activeInvoice.remainingAmount) {
      alert(`لا يمكن قبول هذا المبلغ!\nالمتبقي على الزبون (${formatCurr(activeInvoice.remainingAmount, activeInvoice.currency)}) فقط.`);
      return;
    }
    onPay(activeInvoice, amount, payNotes);
    setPayAmountStr('');
    setPayNotes('');
    alert('تم تسجيل الدفعة وتحديث الدين وكشف حساب الزبون.');
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-xs">
      <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#e53935] rounded-full inline-block"></span>
            الدين غير المقبوض - الزبائن غير المسددين فقط ({unpaidList.length} فاتورة)
          </h3>
          <p className="text-slate-500 text-[11px]">تسديد دفعة من الفاتورة. لسحب مواد أو إرجاع استخدم (الفواتير المرحلة).</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="ابحث عن زبون (اسم / جوال / رقم فاتورة)..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 w-64" />
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2 rounded-xl font-bold font-mono text-sm">المجموع: {formatCurr(totalDebt)}</div>
        </div>
      </div>

      {debtors.length > 0 && (
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
          <span className="text-emerald-800 font-bold block">💵 دفعة على حساب الزبون (تُوزَّع تلقائياً على الأقدم أولاً):</span>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
            <select value={acctCustomer || debtors[0] || ''} onChange={e => setAcctCustomer(e.target.value)} className="bg-white border border-slate-300 rounded p-2 font-bold">
              {debtors.map(n => (<option key={n} value={n}>{n}</option>))}
            </select>
            <select value={acctCur} onChange={e => setAcctCur(e.target.value as any)} className="bg-white border border-slate-300 rounded p-2">
              <option value="USD">دولار ($)</option>
              <option value="SYP">ليرة (ل.س)</option>
            </select>
            <input type="text" inputMode="decimal" placeholder="المبلغ..." value={acctAmt} onChange={e => setAcctAmt(e.target.value)} className="bg-white border border-slate-300 rounded p-2 text-emerald-700 font-bold font-mono" />
            <input type="text" placeholder="ملاحظات..." value={acctNotes} onChange={e => setAcctNotes(e.target.value)} className="bg-white border border-slate-300 rounded p-2" />
            <button onClick={payOnAccount} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded p-2 shadow-sm">✓ توزيع الدفعة</button>
          </div>
        </div>
      )}

      {byCustomer.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {byCustomer.map(([name, amt]) => (
            <button key={name} onClick={() => setSearch(name)} className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded-full font-bold">
              {name}: {formatCurr(amt)}
            </button>
          ))}
        </div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold">
            <tr>
              <th className="p-3">رقم الفاتورة</th>
              <th className="p-3">الزبون</th>
              <th className="p-3">الجوال</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">الإجمالي</th>
              <th className="p-3">المسدد</th>
              <th className="p-3">المتبقي</th>
              <th className="p-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
            {unpaidList.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-sans">لا توجد ديون غير مقبوضة، جميع الحسابات مسددة!</td></tr>
            ) : (
              unpaidList.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="p-3 text-[#e53935] font-bold">{inv.invNumber}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{inv.customerName}</td>
                  <td className="p-3 text-slate-500">{inv.customerPhone}</td>
                  <td className="p-3 text-slate-500">{inv.invDate} {inv.invTime}</td>
                  <td className="p-3">{formatCurr(inv.grandTotal, inv.currency)}</td>
                  <td className="p-3 text-emerald-600">{formatCurr(inv.paidAmount, inv.currency)}</td>
                  <td className="p-3 font-bold text-rose-600">{formatCurr(inv.remainingAmount, inv.currency)}</td>
                  <td className="p-3 text-center font-sans">
                    <button onClick={() => { setActiveId(inv.id); setPayAmountStr(''); setPayNotes(''); }} className="bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold px-3 py-1.5 rounded-lg shadow-sm">
                      💵 تسديد دفعة
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">فاتورة #{activeInvoice.invNumber}</h4>
                <p className="text-slate-500">السيد: {activeInvoice.customerName}</p>
              </div>
              <button onClick={() => setActiveId(null)} className="text-slate-400 font-bold text-lg">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border text-center font-mono">
              <div><span className="text-slate-500 block font-sans">الإجمالي</span><b>{formatCurr(activeInvoice.grandTotal, activeInvoice.currency)}</b></div>
              <div><span className="text-slate-500 block font-sans">المسدد</span><b className="text-emerald-600">{formatCurr(activeInvoice.paidAmount, activeInvoice.currency)}</b></div>
              <div><span className="text-slate-500 block font-sans">المتبقي</span><b className="text-rose-600">{formatCurr(activeInvoice.remainingAmount, activeInvoice.currency)}</b></div>
            </div>

            <div className="space-y-2">
              <input type="text" inputMode="decimal" placeholder="المبلغ المسدد..." value={payAmountStr} onChange={e => setPayAmountStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2 text-emerald-700 font-bold font-mono" />
              <input type="text" placeholder="ملاحظات الدفعة..." value={payNotes} onChange={e => setPayNotes(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2" />
              <button onClick={handlePay} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded p-2 shadow-sm">✓ خصم الدفعة وتحديث الرصيد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. ديون التجار
// ==========================================
function MerchantDebtsWorkspace({
  invoices,
  onPayMerchantDebt
}: {
  invoices: AlAmeenInvoice[];
  onPayMerchantDebt: (invId: number, amount: number, notes: string, merchantName: string) => void;
}) {
  const merchantDebts = useMemo(() => invoices.filter(i => i.type === 'purchase' && i.remainingAmount > 0.001), [invoices]);
  const total = round2(merchantDebts.reduce((s, i) => s + toUSD(i.remainingAmount, i.currency, i.exchangeRate), 0));

  const [activeId, setActiveId] = useState<number | null>(null);
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const activeInv = invoices.find(i => i.id === activeId) || null;

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-xs">
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#0288d1] rounded-full inline-block"></span>
            ديون التجار والموردين المستحقة ({merchantDebts.length} فاتورة)
          </h3>
          <p className="text-slate-500 text-[11px]">متابعة فواتير الشراء المعلقة وتسديد الدفعات مع التوثيق الزمني.</p>
        </div>
        <div className="bg-sky-50 border border-sky-200 text-sky-800 px-4 py-2 rounded-xl font-bold font-mono text-sm">مجموع المستحقات للتجار: {formatCurr(total)}</div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold">
            <tr>
              <th className="p-3">رقم الفاتورة</th>
              <th className="p-3">اسم التاجر / المورد</th>
              <th className="p-3">تاريخ الشراء</th>
              <th className="p-3">المواد المستلمة</th>
              <th className="p-3">إجمالي الفاتورة</th>
              <th className="p-3">المسدد له</th>
              <th className="p-3">المتبقي له دين</th>
              <th className="p-3 text-center">تسديد دفعة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
            {merchantDebts.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-sans">لا توجد أي مستحقات معلقة للتجار حالياً!</td></tr>
            ) : (
              merchantDebts.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="p-3 text-[#0288d1] font-bold">{inv.invNumber}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{inv.merchantName || inv.customerName}</td>
                  <td className="p-3 text-slate-500">{inv.invDate}</td>
                  <td className="p-3 font-sans text-slate-600">{inv.rows.map(r => `${r.itemName} (${r.quantity} ${r.unit})`).join('، ')}</td>
                  <td className="p-3">{formatCurr(inv.grandTotal, inv.currency)}</td>
                  <td className="p-3 text-emerald-600">{formatCurr(inv.paidAmount, inv.currency)}</td>
                  <td className="p-3 font-bold text-rose-600">{formatCurr(inv.remainingAmount, inv.currency)}</td>
                  <td className="p-3 text-center font-sans">
                    <button
                      onClick={() => { setActiveId(inv.id); setPayAmountStr(String(inv.remainingAmount)); setPayNotes(''); }}
                      className="bg-[#0288d1] hover:bg-[#0277bd] text-white font-bold px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      تسديد دفعة للتاجر
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeInv && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">تسديد دفعة للتاجر ({activeInv.merchantName || activeInv.customerName})</h4>
            <p className="text-slate-500 text-xs">المتبقي له: {formatCurr(activeInv.remainingAmount, activeInv.currency)}</p>
            <div>
              <label className="text-slate-700 block mb-1">المبلغ المسدد الآن:</label>
              <input type="text" inputMode="decimal" value={payAmountStr} onChange={e => setPayAmountStr(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-emerald-600 font-bold font-mono text-base" />
            </div>
            <div>
              <label className="text-slate-700 block mb-1">ملاحظات / بيان السداد:</label>
              <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="حوالة، نقدي، دفعة حساب..." className="w-full bg-slate-50 border border-slate-300 rounded p-2" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setActiveId(null)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded">إلغاء</button>
              <button
                onClick={() => {
                  const amount = parseMoney(payAmountStr);
                  if (amount <= 0) {
                    alert('أدخل مبلغاً صحيحاً!');
                    return;
                  }
                  if (amount > activeInv.remainingAmount) {
                    alert(`المبلغ أكبر من المتبقي للتاجر (${formatCurr(activeInv.remainingAmount, activeInv.currency)})!`);
                    return;
                  }
                  onPayMerchantDebt(activeInv.id, amount, payNotes, activeInv.merchantName || activeInv.customerName);
                  setActiveId(null);
                  alert('تم تسجيل الدفعة المسددة للتاجر وتوثيقها في كشف حسابه بنجاح!');
                }}
                className="px-5 py-1.5 bg-[#0288d1] text-white font-bold rounded shadow-sm"
              >
                تأكيد التسديد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. كشف حساب تاجر ومورد (حماية تعديل وحذف الدفعات بكلمة مرور)
// ==========================================
function MerchantStatementWorkspace({
  invoices,
  payments,
  onRequestAuth,
  onDeletePayment,
  onEditPayment,
  onPrintStatement
}: {
  invoices: AlAmeenInvoice[];
  payments: PaymentRecord[];
  onRequestAuth: (title: string, desc: string, cb: () => void) => void;
  onDeletePayment: (paymentId: string) => void;
  onEditPayment: (paymentId: string, newAmount: number, newNotes: string) => void;
  onPrintStatement: (merchantName: string, entries: any[], totalCredit: number, totalDebit: number, netDue: number) => void;
}) {
  const merchantInvoices = useMemo(() => invoices.filter(i => i.type === 'purchase'), [invoices]);
  const merchantNames = Array.from(new Set(merchantInvoices.map(i => i.merchantName || i.customerName)));

  const [selected, setSelected] = useState('');
  const selectedMerchant = selected || merchantNames[0] || '';
  const [filterType, setFilterType] = useState<'all' | 'invoices' | 'payments'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [editingPay, setEditingPay] = useState<PaymentRecord | null>(null);
  const [newPayAmountStr, setNewPayAmountStr] = useState('');
  const [newPayNotes, setNewPayNotes] = useState('');

  const targetInvoices = merchantInvoices.filter(i => (i.merchantName || i.customerName) === selectedMerchant);
  const targetPayments = payments.filter(p => p.partyType === 'merchant' && p.partyName === selectedMerchant);

  const combinedEntries = useMemo(() => {
    let list: { id?: string; date: string; time: string; type: string; debit: number; credit: number; statement: string; ref: string; cur: 'USD' | 'SYP'; isPaymentRecord?: boolean }[] = [];

    if (filterType === 'all' || filterType === 'invoices') {
      targetInvoices.forEach(inv => {
        list.push({
          date: inv.invDate,
          time: inv.invTime,
          type: 'فاتورة توريد بضاعة',
          debit: 0,
          credit: inv.grandTotal,
          statement: `توريد مواد: ${inv.rows.map(r => `${r.itemName} (${r.quantity})`).join('، ')}`,
          ref: inv.invNumber,
          cur: inv.currency
        });
        const initialPayment = inv.initialPaid !== undefined ? inv.initialPaid : inv.paidAmount;
        if (initialPayment > 0) {
          list.push({
            date: inv.invDate,
            time: inv.invTime,
            type: 'سند تسديد عند الشراء',
            debit: initialPayment,
            credit: 0,
            statement: `دفعة مسددة عند استلام فاتورة #${inv.invNumber}`,
            ref: `PAY-INIT-${inv.invNumber}`,
            cur: inv.currency
          });
        }
      });
    }

    if (filterType === 'all' || filterType === 'payments') {
      targetPayments.forEach(pay => {
        list.push({
          id: pay.id,
          date: pay.date,
          time: pay.time,
          type: 'سند تسديد دفعة لاحقة',
          debit: pay.amount,
          credit: 0,
          statement: pay.notes,
          ref: pay.id,
          cur: pay.currency ?? 'USD',
          isPaymentRecord: true
        });
      });
    }

    if (startDate) list = list.filter(e => e.date >= startDate);
    if (endDate) list = list.filter(e => e.date <= endDate);

    return list.sort((a, b) => tsKey(b.date, b.time).localeCompare(tsKey(a.date, a.time)));
  }, [targetInvoices, targetPayments, filterType, startDate, endDate]);

  // الإجماليات بالدولار (كل الحركات بصرف النظر عن الفلاتر)
  const totalCredit = round2(targetInvoices.reduce((s, i) => s + toUSD(i.grandTotal, i.currency, i.exchangeRate), 0));
  const totalDebit = round2(
    targetPayments.reduce((s, p) => s + toUSD(p.amount, p.currency ?? 'USD', invoices.find(i => i.invNumber === p.invNumber)?.exchangeRate ?? p.rate ?? 1), 0) +
      targetInvoices.reduce((s, i) => s + toUSD(i.initialPaid !== undefined ? i.initialPaid : i.paidAmount, i.currency, i.exchangeRate), 0)
  );
  const netDueToMerchant = round2(totalCredit - totalDebit);

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-xs">
      <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#00897b] rounded-full inline-block"></span>
            كشف حساب تاجر / مورد تفصيلي معتمد
          </h3>
          <p className="text-slate-500 text-[11px]">متابعة التوريدات والدفعات وتعديل أو حذف الدفعات بكلمة مرور المدير.</p>
        </div>
        <button
          onClick={() => onPrintStatement(selectedMerchant, combinedEntries, totalCredit, totalDebit, netDueToMerchant)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-1.5 rounded-lg shadow-sm font-bold"
        >
          🖨️ طباعة كشف التاجر A4
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="text-slate-700 block mb-1 font-bold">اختر التاجر:</label>
          <select value={selectedMerchant} onChange={e => setSelected(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold">
            {merchantNames.map((name, i) => (<option key={i} value={name}>{name}</option>))}
          </select>
        </div>
        <div>
          <label className="text-slate-700 block mb-1">نوع الحركة:</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded p-1.5">
            <option value="all">جميع الحركات (توريد ودفعات)</option>
            <option value="invoices">فواتير التوريد فقط</option>
            <option value="payments">سندات الدفعات المسددة فقط</option>
          </select>
        </div>
        <div>
          <label className="text-slate-700 block mb-1">من تاريخ:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5" />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">إلى تاريخ:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center font-mono">
        <div><span className="text-slate-500 block font-sans">مجموع بضاعة التاجر (له):</span><span className="font-bold text-slate-800">{formatCurr(totalCredit)}</span></div>
        <div><span className="text-slate-500 block font-sans">المسدد له (دفعات):</span><span className="font-bold text-emerald-600">{formatCurr(totalDebit)}</span></div>
        <div>
          <span className="text-slate-500 block font-sans">الحالة النهائية:</span>
          {netDueToMerchant > 0.001 ? (
            <span className="font-bold text-rose-600 text-sm">علينا للتاجر: {formatCurr(netDueToMerchant)}</span>
          ) : netDueToMerchant < -0.001 ? (
            <span className="font-bold text-emerald-600 text-sm">رصيد لصالحنا عند التاجر: {formatCurr(Math.abs(netDueToMerchant))}</span>
          ) : (
            <span className="font-bold text-emerald-600 text-sm">مسدد بالكامل ✓</span>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-3">التاريخ والوقت</th>
              <th className="p-3">نوع الحركة</th>
              <th className="p-3">رقم المرجع</th>
              <th className="p-3">مدين (سددنا له)</th>
              <th className="p-3">دائن (استلمنا منه)</th>
              <th className="p-3">البيان والتفاصيل</th>
              <th className="p-3 text-center">إجراءات الدفعة (محمية)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
            {combinedEntries.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-sans">لا توجد حركات مسجلة للتاجر وفق الفلاتر المحددة.</td></tr>
            ) : (
              combinedEntries.map((e, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500">{e.date} {e.time}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{e.type}</td>
                  <td className="p-3 text-teal-600 font-bold">{e.ref}</td>
                  <td className="p-3 text-emerald-600 font-bold">{e.debit > 0 ? formatCurr(e.debit, e.cur) : '-'}</td>
                  <td className="p-3 text-rose-600 font-bold">{e.credit > 0 ? formatCurr(e.credit, e.cur) : '-'}</td>
                  <td className="p-3 font-sans text-slate-600">{e.statement}</td>
                  <td className="p-3 text-center font-sans space-x-1 space-x-reverse">
                    {e.isPaymentRecord && e.id && (
                      <>
                        <button
                          onClick={() => {
                            const rec = payments.find(p => p.id === e.id);
                            if (!rec) return;
                            onRequestAuth('تعديل دفعة تاجر', `تعديل السند (${rec.id}) المسدد للتاجر (${rec.partyName}) يتطلب كلمة مرور المدير.`, () => {
                              setEditingPay(rec);
                              setNewPayAmountStr(String(rec.amount));
                              setNewPayNotes(rec.notes);
                            });
                          }}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300"
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => {
                            onRequestAuth('حذف دفعة تاجر', `حذف السند (${e.id}) وإعادة المبلغ إلى ذمة التاجر يتطلب كلمة مرور المدير.`, () => {
                              onDeletePayment(e.id!);
                            });
                          }}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-300"
                        >
                          🗑️ حذف
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-3 border border-slate-200 shadow-xl">
            <h4 className="font-bold text-slate-900 text-sm">تعديل سند سداد التاجر ({editingPay.partyName})</h4>
            <div>
              <label className="text-slate-700 block mb-1">المبلغ الجديد:</label>
              <input type="text" inputMode="decimal" value={newPayAmountStr} onChange={e => setNewPayAmountStr(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-emerald-600 font-bold font-mono" />
            </div>
            <div>
              <label className="text-slate-700 block mb-1">البيان والملاحظات:</label>
              <input type="text" value={newPayNotes} onChange={e => setNewPayNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setEditingPay(null)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded">إلغاء</button>
              <button
                onClick={() => {
                  const amt = parseMoney(newPayAmountStr);
                  if (amt <= 0) return;
                  onEditPayment(editingPay.id, amt, newPayNotes);
                  setEditingPay(null);
                }}
                className="px-5 py-1.5 bg-[#00897b] text-white font-bold rounded shadow-sm"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 9. المصاريف اليومية وتخصم من الربح
// ==========================================
function DailyExpensesWorkspace({
  expenses,
  onRequestAuth,
  onAddExpense,
  onDeleteExpense
}: {
  expenses: ExpenseItem[];
  onRequestAuth: (title: string, desc: string, cb: () => void) => void;
  onAddExpense: (e: ExpenseItem) => void;
  onDeleteExpense: (id: number) => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseItem['category']>('كهرباء وإنارة');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');

  const total = round2(expenses.reduce((s, e) => s + e.amount, 0));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseMoney(amountStr);
    if (amount <= 0 || !title.trim()) return;
    const now = new Date();
    onAddExpense({
      id: Date.now(),
      title: title.trim(),
      category,
      amount,
      currency: 'USD',
      date: localDateStr(now),
      time: timeStr(now),
      notes
    });
    setTitle('');
    setAmountStr('');
    setNotes('');
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-xs">
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#43a047] rounded-full inline-block"></span>
            المصاريف اليومية التشغيلية (تُخصم من صافي الأرباح)
          </h3>
          <p className="text-slate-500 text-[11px]">إيجار، كهرباء، رواتب، ضيافة، صيانة، نقل.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl font-bold font-mono text-sm">إجمالي المصروفات: {formatCurr(total)}</div>
      </div>

      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 items-end">
        <div>
          <label className="text-slate-700 block mb-1">بيان المصروف:</label>
          <input type="text" required placeholder="فاتورة كهرباء، أجور..." value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2" />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">البند:</label>
          <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded p-2">
            <option value="كهرباء وإنارة">كهرباء وإنارة</option>
            <option value="إيجار المحل">إيجار المحل</option>
            <option value="أجور عمال">أجور عمال</option>
            <option value="شحن ونقل">شحن ونقل</option>
            <option value="صيانة">صيانة</option>
            <option value="نثريات وضيافة">نثريات وضيافة</option>
          </select>
        </div>
        <div>
          <label className="text-slate-700 block mb-1">المبلغ ($):</label>
          <input type="text" inputMode="decimal" required value={amountStr} onChange={e => setAmountStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2 text-rose-600 font-bold font-mono" />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">ملاحظات:</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2" />
        </div>
        <button type="submit" className="bg-[#43a047] hover:bg-[#388e3c] text-white font-bold p-2.5 rounded shadow-sm">+ تسجيل المصروف</button>
      </form>

      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold">
            <tr>
              <th className="p-3">التاريخ والوقت</th>
              <th className="p-3">بيان المصروف</th>
              <th className="p-3">التصنيف</th>
              <th className="p-3">المبلغ</th>
              <th className="p-3">الملاحظات</th>
              <th className="p-3 text-center">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
            {expenses.map(e => (
              <tr key={e.id}>
                <td className="p-3 text-slate-400">{e.date} {e.time}</td>
                <td className="p-3 font-sans font-bold text-slate-900">{e.title}</td>
                <td className="p-3 font-sans text-emerald-700">{e.category}</td>
                <td className="p-3 font-bold text-rose-600">-{formatCurr(e.amount, e.currency)}</td>
                <td className="p-3 font-sans text-slate-400">{e.notes || '-'}</td>
                <td className="p-3 text-center font-sans">
                  <button
                    onClick={() => onRequestAuth('حذف مصروف', `حذف هذا المصروف (${e.title}) يتطلب كلمة مرور المدير.`, () => onDeleteExpense(e.id))}
                    className="text-rose-500 font-bold hover:underline"
                  >
                    ✕ حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 10. الفواتير المرحلة: عرض، إرجاع، سحب مواد، طباعة
// ==========================================
function PostedInvoicesWorkspace({
  invoices,
  items,
  onSave,
  onPrint
}: {
  invoices: AlAmeenInvoice[];
  items: AlAmeenItem[];
  onSave: (
    inv: AlAmeenInvoice,
    items: AlAmeenItem[],
    retInv: AlAmeenInvoice | null,
    refund: PaymentRecord | null,
    log: { kind: OpLog['kind']; amount: number; text: string }
  ) => void;
  onPrint: (inv: AlAmeenInvoice) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [retQty, setRetQty] = useState<Record<number, string>>({});
  const [pickText, setPickText] = useState('');
  const [pickItem, setPickItem] = useState<AlAmeenItem | null>(null);
  const [qtyStr, setQtyStr] = useState('1');
  const [priceStr, setPriceStr] = useState('');

  const activeItems = useMemo(() => items.filter(i => !i.isDeleted), [items]);

  const sales = useMemo(
    () =>
      invoices.filter(
        i =>
          i.type === 'sale' &&
          (i.customerName.toLowerCase().includes(search.toLowerCase()) ||
            i.customerPhone.includes(search) ||
            i.invNumber.includes(search))
      ),
    [invoices, search]
  );

  const inv = invoices.find(i => i.id === selectedId && i.type === 'sale') || null;

  const pickResults = pickText.trim()
    ? activeItems.filter(i => i.code.includes(pickText) || i.name.toLowerCase().includes(pickText.toLowerCase())).slice(0, 5)
    : [];

  const doReturn = () => {
    if (!inv) return;
    let newRows = [...inv.rows];
    let updatedItems = [...items];
    const retRows: InvoiceRow[] = [];

    for (let idx = 0; idx < inv.rows.length; idx++) {
      const q = parseDecimal(retQty[idx]);
      if (q <= 0) continue;
      const r = inv.rows[idx];
      if (q > r.quantity) {
        alert(`لا يمكن إرجاع (${q}) من (${r.itemName}) لأن الكمية في الفاتورة (${r.quantity}) فقط!`);
        return;
      }
      retRows.push({ ...r, quantity: q, total: round2(q * r.price), priceStr: undefined, qtyStr: undefined });
      updatedItems = updatedItems.map(it =>
        it.id === r.itemId ? { ...it, stockQty: round4(it.stockQty + q * r.factor) } : it
      );
      const left = round4(r.quantity - q);
      newRows[idx] = { ...r, quantity: left, total: round2(left * r.price) };
    }

    if (retRows.length === 0) {
      alert('حدد كمية للإرجاع في مادة واحدة على الأقل.');
      return;
    }

    newRows = newRows.filter(r => r.quantity > 0);
    const updated = recalcInvoice(inv, newRows);
    const refund = round2(inv.grandTotal - updated.grandTotal);
    const cashBack = Math.max(0, round2(updated.paidAmount - updated.grandTotal));
    const now = new Date();
    let finalInv = updated;
    let refundRec: PaymentRecord | null = null;
    if (
      cashBack > 0 &&
      window.confirm(
        `الزبون دفع أكثر من الصافي الجديد بمقدار ${formatCurr(cashBack, inv.currency)}.\nهل تم ردّ هذا المبلغ نقداً للزبون الآن؟\n(موافق = تسجيل سند صرف ويخرج من الصندوق، إلغاء = يبقى رصيداً للزبون عندنا)`
      )
    ) {
      const newPaid = round2(updated.paidAmount - cashBack);
      finalInv = { ...updated, paidAmount: newPaid, remainingAmount: Math.max(0, round2(updated.grandTotal - newPaid)) };
      refundRec = {
        id: `REFUND-${Date.now()}`,
        date: localDateStr(now),
        time: timeStr(now),
        amount: cashBack,
        notes: `سند صرف: ردّ نقد من مرتجع الفاتورة #${inv.invNumber}`,
        partyName: inv.customerName,
        partyType: 'customer',
        invNumber: inv.invNumber,
        currency: inv.currency,
        rate: inv.exchangeRate,
        kind: 'refund'
      };
    }

    const retInv: AlAmeenInvoice = {
      id: Date.now(),
      invNumber: nextInvNumber('RET'),
      type: 'return',
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      rows: retRows,
      subTotal: refund,
      discount: 0,
      grandTotal: refund,
      initialPaid: 0,
      paidAmount: 0,
      remainingAmount: 0,
      currency: inv.currency,
      exchangeRate: inv.exchangeRate,
      invDate: localDateStr(now),
      invTime: timeStr(now),
      notes:
        `مرتجع من الفاتورة #${inv.invNumber}\n` +
        `المواد المشتراة أصلاً: ${inv.rows.map(r => `${r.itemName} (${r.quantity} ${r.unit} × ${r.price})`).join('، ')}\n` +
        `المواد المرجعة: ${retRows.map(r => `${r.itemName} (${r.quantity} ${r.unit})`).join('، ')}`,
      origInvNumber: inv.invNumber
    };

    onSave(finalInv, updatedItems, retInv, refundRec, {
      kind: 'return',
      amount: refund,
      text: `مرتجع من الفاتورة #${inv.invNumber}: ${retRows.map(r => `${r.itemName} (${r.quantity})`).join('، ')}`
    });
    setRetQty({});
    alert(
      `تم الإرجاع للمستودع وتخفيض الفاتورة بمقدار ${formatCurr(refund, inv.currency)}.` +
        (cashBack > 0 ? (refundRec ? '\nتم تسجيل سند صرف بردّ المبلغ للزبون.' : `\nبقي للزبون رصيد ${formatCurr(cashBack, inv.currency)} عندنا (يظهر في كشف حسابه).`) : '')
    );
  };

  const doAddItem = () => {
    if (!inv || !pickItem) return;
    const q = parseDecimal(qtyStr);
    const p = parseDecimal(priceStr) || (inv.currency === 'SYP' ? round2(pickItem.salePrice * inv.exchangeRate) : pickItem.salePrice);
    if (q <= 0) return;
    const fresh = items.find(i => i.id === pickItem.id);
    if (!fresh || fresh.stockQty < q) {
      alert(`الرصيد المتاح (${fresh ? fresh.stockQty : 0} ${pickItem.baseUnit}) لا يكفي!`);
      return;
    }
    const now = new Date();
    const row: InvoiceRow = {
      itemId: fresh.id,
      itemCode: fresh.code,
      itemName: fresh.name,
      unit: fresh.baseUnit,
      factor: 1,
      quantity: q,
      price: p,
      total: round2(q * p),
      cost: fresh.costPrice,
      addedAt: `${localDateStr(now)} ${timeStr(now)}`
    };
    const updatedItems = items.map(it => (it.id === fresh.id ? { ...it, stockQty: round4(it.stockQty - q) } : it));
    const updated = recalcInvoice(inv, [...inv.rows, row]);
    onSave(updated, updatedItems, null, null, {
      kind: 'add_items',
      amount: row.total,
      text: `سحب ${q} ${row.unit} من ${row.itemName} على الفاتورة #${inv.invNumber}`
    });
    setPickItem(null);
    setPickText('');
    setQtyStr('1');
    setPriceStr('');
    alert('تم سحب المادة من المستودع وإضافتها للفاتورة وذمة الزبون.');
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-xs">
      <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 bg-[#f4511e] rounded-full inline-block"></span>
          الفواتير المرحلة - عرض، إرجاع، سحب مواد، طباعة
        </h3>
        <input type="text" placeholder="ابحث عن زبون (اسم / جوال / رقم فاتورة)..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 w-72 font-bold" />
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
            <tr>
              <th className="p-2">رقم الفاتورة</th>
              <th className="p-2">الزبون</th>
              <th className="p-2">التاريخ</th>
              <th className="p-2">الصافي</th>
              <th className="p-2">المتبقي</th>
              <th className="p-2 text-center">فتح</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {sales.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-slate-400 font-sans">لا توجد فواتير مطابقة.</td></tr>
            ) : (
              sales.map(i => (
                <tr key={i.id} className={i.id === selectedId ? 'bg-orange-50' : 'hover:bg-slate-50'}>
                  <td className="p-2 font-bold text-[#f4511e]">{i.invNumber}</td>
                  <td className="p-2 font-sans font-bold">{i.customerName}</td>
                  <td className="p-2 text-slate-500">{i.invDate}</td>
                  <td className="p-2">{formatCurr(i.grandTotal, i.currency)}</td>
                  <td className="p-2 text-rose-600">{formatCurr(i.remainingAmount, i.currency)}</td>
                  <td className="p-2 text-center font-sans">
                    <button onClick={() => { setSelectedId(i.id); setRetQty({}); }} className="bg-[#f4511e] text-white font-bold px-3 py-1 rounded shadow-sm">📂 فتح</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {inv && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">فاتورة #{inv.invNumber} - السيد: {inv.customerName}</h4>
              <p className="text-slate-500">{inv.invDate} {inv.invTime} | الجوال: {inv.customerPhone}</p>
            </div>
            <button onClick={() => onPrint(inv)} className="bg-white hover:bg-slate-100 border border-slate-300 px-4 py-1.5 rounded-lg font-bold shadow-sm">🖨️ طباعة الفاتورة A4</button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="p-2">المادة</th>
                  <th className="p-2">الكمية بالفاتورة</th>
                  <th className="p-2">السعر</th>
                  <th className="p-2">الإجمالي</th>
                  <th className="p-2">كمية الإرجاع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {inv.rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-sans font-bold">{r.itemName}</td>
                    <td className="p-2">{r.quantity} {r.unit}</td>
                    <td className="p-2">{formatPrice(r.price, inv.currency)}</td>
                    <td className="p-2 font-bold">{formatCurr(r.total, inv.currency)}</td>
                    <td className="p-2">
                      <input type="text" inputMode="decimal" placeholder="0" value={retQty[idx] ?? ''} onChange={e => setRetQty({ ...retQty, [idx]: e.target.value })} className="w-20 bg-slate-50 border border-slate-300 rounded p-1 text-center font-bold" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono bg-white p-3 rounded-lg border">
            <div><span className="text-slate-500 block font-sans">الصافي</span><b>{formatCurr(inv.grandTotal, inv.currency)}</b></div>
            <div><span className="text-slate-500 block font-sans">المسدد</span><b className="text-emerald-600">{formatCurr(inv.paidAmount, inv.currency)}</b></div>
            <div><span className="text-slate-500 block font-sans">المتبقي</span><b className="text-rose-600">{formatCurr(inv.remainingAmount, inv.currency)}</b></div>
          </div>

          <button onClick={doReturn} className="w-full py-2.5 bg-[#f4511e] hover:bg-[#e64a19] text-white font-bold rounded-xl shadow-md">
            ↩️ تأكيد إرجاع المواد المحددة للمستودع وتحديث حساب الزبون
          </button>

          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-2">
            <span className="text-amber-900 font-bold block">📦 سحب مواد من المستودع على هذه الفاتورة:</span>
            <div className="relative">
              <input type="text" placeholder="ابحث بالكود أو اسم المادة..." value={pickText} onChange={e => { setPickText(e.target.value); setPickItem(null); }} className="w-full bg-white border border-amber-300 rounded p-2" />
              {pickResults.length > 0 && !pickItem && (
                <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 divide-y">
                  {pickResults.map(it => (
                    <div
                      key={it.id}
                      onClick={() => {
                        setPickItem(it);
                        setPickText(`${it.code} - ${it.name}`);
                        setPriceStr(String(inv.currency === 'SYP' ? round2(it.salePrice * inv.exchangeRate) : it.salePrice));
                      }}
                      className="p-2.5 hover:bg-slate-50 cursor-pointer flex justify-between"
                    >
                      <span className="font-bold">{it.code} - {it.name}</span>
                      <span className={it.stockQty <= 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        {it.stockQty <= 0 ? '⛔ نفذت' : `المتوفر: ${it.stockQty} ${it.baseUnit}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <label className="text-slate-600 block mb-0.5">الكمية:</label>
                <input type="text" inputMode="decimal" value={qtyStr} onChange={e => setQtyStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold" />
              </div>
              <div>
                <label className="text-slate-600 block mb-0.5">السعر (يقبل الفاصلة):</label>
                <input type="text" inputMode="decimal" value={priceStr} onChange={e => setPriceStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold" />
              </div>
              <button onClick={doAddItem} disabled={!pickItem} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold p-2 rounded shadow-sm">
                + سحب وتثبيت على الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ==========================================
// 11. دليل بطاقات المواد وطباعة جرد المستودع
// ==========================================
function ItemsManagementWorkspace({
  items,
  onRequestAuth,
  onSaveItem,
  onUpdateItem,
  onDeleteItem,
  onPrintInventory,
  onStocktake,
  nextCode
}: {
  items: AlAmeenItem[];
  nextCode: string;
  onRequestAuth: (title: string, desc: string, cb: () => void) => void;
  onSaveItem: (item: AlAmeenItem) => void;
  onUpdateItem: (item: AlAmeenItem) => void;
  onDeleteItem: (id: number) => void;
  onPrintInventory: (list: AlAmeenItem[], label: string) => void;
  onStocktake: (adj: { item: AlAmeenItem; counted: number }[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<AlAmeenItem | null>(null);
  const [editStr, setEditStr] = useState({ stock: '', min: '', cost: '', sale: '' });
  const [filterCat, setFilterCat] = useState<'all' | AlAmeenItem['category']>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'ok' | 'low' | 'out'>('all');
  const [filterUnit, setFilterUnit] = useState<'all' | AlAmeenItem['baseUnit']>('all');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'stock'>('code');
  const [codeTouched, setCodeTouched] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const [countStr, setCountStr] = useState<Record<number, string>>({});

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AlAmeenItem['category']>('خردة');
  const [baseUnit, setBaseUnit] = useState<AlAmeenItem['baseUnit']>('كيلو غرام');
  const [costStr, setCostStr] = useState('0');
  const [priceStr, setPriceStr] = useState('0');
  const [stockStr, setStockStr] = useState('0');
  const [minStockStr, setMinStockStr] = useState('10');

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = items.filter(i => {
      if (q && !(i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q))) return false;
      if (filterCat !== 'all' && i.category !== filterCat) return false;
      if (filterUnit !== 'all' && i.baseUnit !== filterUnit) return false;
      if (filterStock === 'out' && !(i.stockQty <= 0)) return false;
      if (filterStock === 'low' && !(i.stockQty > 0 && i.stockQty <= i.minStock)) return false;
      if (filterStock === 'ok' && !(i.stockQty > i.minStock)) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sortBy === 'name'
        ? a.name.localeCompare(b.name, 'ar')
        : sortBy === 'stock'
        ? a.stockQty - b.stockQty
        : a.code.localeCompare(b.code, undefined, { numeric: true })
    );
  }, [items, searchTerm, filterCat, filterStock, filterUnit, sortBy]);

  const filterLabel = [
    filterCat !== 'all' ? filterCat : '',
    filterUnit !== 'all' ? filterUnit : '',
    filterStock === 'out' ? 'النافذة' : filterStock === 'low' ? 'القاربة على النفاذ' : filterStock === 'ok' ? 'المتوفرة' : '',
    searchTerm.trim() ? `بحث: ${searchTerm.trim()}` : ''
  ].filter(Boolean).join(' - ');

  // الترقيم التلقائي يتحدّث مع آخر رقم ما لم يكتب المستخدم رمزاً يدوياً
  useEffect(() => {
    if (showAdd && !codeTouched) setCode(nextCode);
  }, [nextCode, showAdd, codeTouched]);

  // حفظ القائمة المعروضة (بعد الفلترة) كملف CSV يفتح في Excel
  const exportCsv = () => {
    const q = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['الرمز', 'اسم المادة', 'التصنيف', 'الوحدة', 'الرصيد', 'حد التنبيه', 'سعر الشراء', 'سعر البيع', 'قيمة المخزون (تكلفة)'];
    const lines = filteredItems.map(i =>
      [i.code, i.name, i.category, i.baseUnit, i.stockQty, i.minStock, i.costPrice, i.salePrice, round2(i.stockQty * i.costPrice)].map(q).join(',')
    );
    const csv = '\uFEFF' + [head.map(q).join(','), ...lines].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `AlAmeen_Inventory_${localDateStr()}.csv`;
    a.click();
  };

  const doSave = (another: boolean) => {
    if (!name.trim() || !code.trim()) {
      alert('اكتب اسم المادة ورمزها.');
      return;
    }
    onSaveItem({
      id: Date.now(),
      code: code.trim(),
      name: name.trim(),
      category,
      baseUnit,
      costPrice: parseDecimal(costStr),
      salePrice: parseDecimal(priceStr),
      stockQty: parseDecimal(stockStr),
      minStock: parseDecimal(minStockStr)
    });
    if (another) {
      // تفريغ الحقول مع إبقاء التصنيف والوحدة، والرقم التالي يظهر تلقائياً
      setName('');
      setCostStr('0');
      setPriceStr('0');
      setStockStr('0');
      setCodeTouched(false);
    } else {
      setShowAdd(false);
    }
  };

  const saveNew = (e: React.FormEvent) => {
    e.preventDefault();
    doSave(false);
  };

  const openEdit = (it: AlAmeenItem) => {
    setEditingItem({ ...it });
    setEditStr({ stock: String(it.stockQty), min: String(it.minStock), cost: String(it.costPrice), sale: String(it.salePrice) });
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateItem({
      ...editingItem,
      stockQty: Math.max(0, parseDecimal(editStr.stock)),
      minStock: parseDecimal(editStr.min),
      costPrice: parseDecimal(editStr.cost),
      salePrice: parseDecimal(editStr.sale)
    });
    setEditingItem(null);
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-xs">
      <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#1e88e5] rounded-full inline-block"></span>
            دليل المواد وجرد المستودع الكامل
          </h3>
          <p className="text-slate-500 text-[11px]">البحث بالاسم، منع التكرار، التعديل والحذف المحميان بكلمة مرور المدير.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setCountStr({}); setShowCount(true); }} className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-4 py-2 rounded-xl border border-amber-300 shadow-sm">📋 جرد فعلي</button>
          <button onClick={() => onPrintInventory(filteredItems, filterLabel)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl border border-slate-300 shadow-sm flex items-center gap-1">🖨️ طباعة القائمة المعروضة A4</button>
          <button onClick={() => { setCodeTouched(false); setCode(nextCode); setName(''); setShowAdd(true); }} className="bg-[#1e88e5] hover:bg-[#1976d2] text-white font-bold px-4 py-2 rounded-xl shadow-sm">+ بطاقة مادة جديدة</button>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
          <div className="col-span-2">
            <label className="text-slate-600 block mb-0.5">بحث:</label>
            <input type="text" placeholder="ابحث عن مادة بالاسم أو الكود في المستودع..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 font-bold" />
          </div>
          <div>
            <label className="text-slate-600 block mb-0.5">التصنيف:</label>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded p-2">
              <option value="all">الكل</option>
              <option value="كهربائيات">كهربائيات</option>
              <option value="صحية">صحية</option>
              <option value="خردة">خردة</option>
              <option value="أدوات أخرى">أدوات أخرى</option>
            </select>
          </div>
          <div>
            <label className="text-slate-600 block mb-0.5">الوحدة:</label>
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded p-2">
              <option value="all">الكل</option>
              <option value="متر">متر</option>
              <option value="قطعة">قطعة</option>
              <option value="طقم">طقم</option>
              <option value="كيلو غرام">كيلو غرام</option>
            </select>
          </div>
          <div>
            <label className="text-slate-600 block mb-0.5">حالة الرصيد:</label>
            <select value={filterStock} onChange={e => setFilterStock(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded p-2">
              <option value="all">الكل</option>
              <option value="ok">متوفر</option>
              <option value="low">قارب على النفاذ</option>
              <option value="out">نافذ</option>
            </select>
          </div>
          <div>
            <label className="text-slate-600 block mb-0.5">الترتيب:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded p-2">
              <option value="code">حسب الرقم</option>
              <option value="name">حسب الاسم</option>
              <option value="stock">حسب الرصيد (الأقل أولاً)</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600">
          <span>المعروض: <b>{filteredItems.length}</b> من أصل <b>{items.length}</b> مادة</span>
          <div className="flex gap-2">
            <button
              onClick={() => { setSearchTerm(''); setFilterCat('all'); setFilterUnit('all'); setFilterStock('all'); setSortBy('code'); }}
              className="bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg font-bold"
            >
              ✕ مسح الفلاتر
            </button>
            <button onClick={exportCsv} disabled={filteredItems.length === 0} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">
              💾 حفظ القائمة المعروضة (Excel / CSV)
            </button>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold">
            <tr>
              <th className="p-3">رمز المادة</th>
              <th className="p-3">اسم المادة</th>
              <th className="p-3">التصنيف</th>
              <th className="p-3">الوحدة الأساسية</th>
              <th className="p-3">الرصيد المتاح</th>
              <th className="p-3">حد النفاذ والتنبيه</th>
              <th className="p-3">سعر الشراء</th>
              <th className="p-3">سعر البيع</th>
              <th className="p-3">حالة الرصيد</th>
              <th className="p-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
            {filteredItems.map(it => {
              const isOut = it.stockQty <= 0;
              const isLow = it.stockQty > 0 && it.stockQty <= it.minStock;
              return (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className="p-3 text-[#1e88e5] font-bold">{it.code}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{it.name}</td>
                  <td className="p-3 font-sans text-teal-700">{it.category}</td>
                  <td className="p-3 font-sans">{it.baseUnit}</td>
                  <td className="p-3 font-bold text-slate-900">{it.stockQty} {it.baseUnit}</td>
                  <td className="p-3 font-sans font-bold text-amber-700">{it.minStock}</td>
                  <td className="p-3">{formatPrice(it.costPrice)}</td>
                  <td className="p-3 font-bold text-emerald-600">{formatPrice(it.salePrice)}</td>
                  <td className="p-3 font-sans">
                    {isOut ? (
                      <span className="text-white bg-rose-600 px-2.5 py-0.5 rounded-full font-bold shadow-sm">⛔ تم نفاذ الكمية</span>
                    ) : isLow ? (
                      <span className="text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">⚠️ قارب على النفاذ</span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">✓ متوفر</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-sans space-x-1 space-x-reverse">
                    <button
                      onClick={() =>
                        onRequestAuth('تعديل مادة', `تعديل المادة (${it.name}) (الرصيد والأسعار) يتطلب كلمة مرور المدير.`, () => openEdit(it))
                      }
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded font-bold border border-amber-300"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() =>
                        onRequestAuth('حذف مادة من المستودع', `حذف المادة (${it.name}) يتطلب كلمة مرور المدير لتأكيد العملية.`, () => onDeleteItem(it.id))
                      }
                      className="bg-rose-100 hover:bg-rose-200 text-rose-800 px-2.5 py-1 rounded font-bold border border-rose-300"
                    >
                      🗑️ حذف
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 space-y-3 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h4 className="font-bold text-slate-900 text-sm">📋 الجرد الفعلي - أدخل الكمية الموجودة فعلياً (اترك الفارغ للمواد التي لم تُجرَد)</h4>
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 font-bold">
                <tr><th className="p-2">المادة</th><th className="p-2">رصيد النظام</th><th className="p-2">الكمية الفعلية</th><th className="p-2">الفرق</th><th className="p-2">قيمة الفرق (تكلفة)</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {items.map(it => {
                  const raw = countStr[it.id];
                  const has = raw !== undefined && raw.trim() !== '';
                  const diff = has ? round4(parseDecimal(raw) - it.stockQty) : 0;
                  return (
                    <tr key={it.id}>
                      <td className="p-2 font-sans font-bold">{it.code} - {it.name}</td>
                      <td className="p-2">{it.stockQty} {it.baseUnit}</td>
                      <td className="p-2"><input type="text" inputMode="decimal" value={raw ?? ''} onChange={e => setCountStr({ ...countStr, [it.id]: e.target.value })} className="w-24 bg-slate-50 border border-slate-300 rounded p-1 text-center font-bold" /></td>
                      <td className={`p-2 font-bold ${diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{has ? (diff > 0 ? '+' : '') + diff : '-'}</td>
                      <td className="p-2">{has && diff !== 0 ? formatCurr(round2(diff * it.costPrice)) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowCount(false)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded">إلغاء</button>
              <button
                onClick={() => {
                  const list = items
                    .filter(it => countStr[it.id] !== undefined && countStr[it.id].trim() !== '' && parseDecimal(countStr[it.id]) !== it.stockQty)
                    .map(it => ({ item: it, counted: Math.max(0, parseDecimal(countStr[it.id])) }));
                  if (list.length === 0) {
                    alert('لا توجد فروقات لتثبيتها.');
                    return;
                  }
                  onRequestAuth('تثبيت نتيجة الجرد', `سيتم تعديل رصيد ${list.length} مادة إلى الكميات الفعلية. يتطلب كلمة مرور المدير.`, () => {
                    onStocktake(list);
                    setShowCount(false);
                  });
                }}
                className="px-5 py-1.5 bg-[#1e88e5] text-white font-bold rounded shadow-sm"
              >
                تثبيت الجرد وتسجيل التسويات
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={saveNew} className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-3 shadow-2xl">
            <h4 className="font-bold text-slate-900 text-sm">إضافة بطاقة مادة جديدة بالمستودع</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 block mb-0.5">رمز المادة:</label>
                <div className="flex gap-1">
                  <input type="text" required value={code} onChange={e => { setCode(e.target.value); setCodeTouched(true); }} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono font-bold" />
                  <button type="button" title="رقم تلقائي" onClick={() => { setCodeTouched(false); setCode(nextCode); }} className="px-2 bg-slate-100 border border-slate-300 rounded font-bold">↻</button>
                </div>
                <span className="text-[10px] text-slate-500">الرقم التالي تلقائياً: {nextCode}</span>
              </div>
              <div>
                <label className="text-slate-700 block mb-0.5">التصنيف:</label>
                <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold">
                  <option value="كهربائيات">كهربائيات</option>
                  <option value="صحية">صحية</option>
                  <option value="خردة">خردة (حديد، نحاس، بلاستيك)</option>
                  <option value="أدوات أخرى">أدوات أخرى</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-slate-700 block mb-0.5">اسم المادة:</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-700 block mb-0.5">الوحدة:</label>
                <select value={baseUnit} onChange={e => setBaseUnit(e.target.value as any)} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold">
                  <option value="متر">متر</option>
                  <option value="قطعة">قطعة</option>
                  <option value="طقم">طقم</option>
                  <option value="كيلو غرام">كيلو غرام</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 block mb-0.5">الرصيد الأولي:</label>
                <input type="text" inputMode="decimal" value={stockStr} onChange={e => setStockStr(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono" />
              </div>
              <div>
                <label className="text-slate-700 block mb-0.5">حد التنبيه اليدوي:</label>
                <input type="text" inputMode="decimal" value={minStockStr} onChange={e => setMinStockStr(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-amber-700 font-bold font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 block mb-0.5">سعر التكلفة ($):</label>
                <input type="text" inputMode="decimal" value={costStr} onChange={e => setCostStr(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono" />
              </div>
              <div>
                <label className="text-slate-700 block mb-0.5">سعر البيع ($):</label>
                <input type="text" inputMode="decimal" value={priceStr} onChange={e => setPriceStr(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-emerald-600 font-bold font-mono" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded">إلغاء</button>
              <button type="button" onClick={() => doSave(true)} className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded shadow-sm">حفظ وإضافة أخرى</button>
              <button type="submit" className="px-5 py-1.5 bg-[#1e88e5] text-white font-bold rounded shadow-sm">حفظ المادة</button>
            </div>
          </form>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={saveEdit} className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-3 shadow-2xl">
            <h4 className="font-bold text-slate-900 text-sm">تعديل بيانات المادة ({editingItem.name})</h4>
            <div>
              <label className="text-slate-700 block mb-0.5">اسم المادة:</label>
              <input type="text" required value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 block mb-0.5">الكمية المتوفرة بالمستودع:</label>
                <input type="text" inputMode="decimal" value={editStr.stock} onChange={e => setEditStr({ ...editStr, stock: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono font-bold" />
              </div>
              <div>
                <label className="text-slate-700 block mb-0.5">حد النفاذ والتنبيه:</label>
                <input type="text" inputMode="decimal" value={editStr.min} onChange={e => setEditStr({ ...editStr, min: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-amber-700 font-bold font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 block mb-0.5">سعر التكلفة ($):</label>
                <input type="text" inputMode="decimal" value={editStr.cost} onChange={e => setEditStr({ ...editStr, cost: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono" />
              </div>
              <div>
                <label className="text-slate-700 block mb-0.5">سعر البيع ($):</label>
                <input type="text" inputMode="decimal" value={editStr.sale} onChange={e => setEditStr({ ...editStr, sale: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-emerald-600 font-bold font-mono" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded">إلغاء</button>
              <button type="submit" className="px-5 py-1.5 bg-emerald-600 text-white font-bold rounded shadow-sm">حفظ التعديلات</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 12. أرشيف الفواتير المعتمد + سجل جميع العمليات
// ==========================================
function InvoiceArchiveWorkspace({
  invoices,
  opLog,
  onRequestAuth,
  onDeleteInvoice,
  onPrintA4,
  onPrintFilteredArchive
}: {
  invoices: AlAmeenInvoice[];
  opLog: OpLog[];
  onRequestAuth: (title: string, desc: string, cb: () => void) => void;
  onDeleteInvoice: (invId: number) => void;
  onPrintA4: (inv: AlAmeenInvoice) => void;
  onPrintFilteredArchive: (filteredList: AlAmeenInvoice[], filterName: string) => void;
}) {
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'purchase' | 'return'>('all');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<AlAmeenInvoice | null>(null);

  const filtered = invoices.filter(inv => {
    const matchType = filterType === 'all' || inv.type === filterType;
    const matchSearch = inv.customerName.toLowerCase().includes(search.toLowerCase()) || inv.invNumber.includes(search);
    return matchType && matchSearch;
  });

  const filterNames = { all: 'جميع العمليات', sale: 'المبيعات', purchase: 'المشتريات', return: 'المرتجعات' };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-xs">
      <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#fb8c00] rounded-full inline-block"></span>
            أرشيف الفواتير المعتمد (محمي من التعديل اليدوي - للعرض والطباعة فقط)
          </h3>
          <p className="text-slate-500 text-[11px]">سجل رسمي محمي لجميع العمليات مع خيارات تصفية وطباعة متقدمة.</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="text" placeholder="بحث برقم الفاتورة أو الاسم..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5" />
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold">
            <option value="all">جميع العمليات</option>
            <option value="sale">المبيعات</option>
            <option value="purchase">المشتريات</option>
            <option value="return">المرتجعات</option>
          </select>
          <button onClick={() => onPrintFilteredArchive(filtered, filterNames[filterType])} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded font-bold shadow-sm">
            🖨️ طباعة قائمة الأرشيف
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold">
            <tr>
              <th className="p-3">رقم الفاتورة</th>
              <th className="p-3">نوع الفاتورة</th>
              <th className="p-3">الطرف (السيد: / التاجر)</th>
              <th className="p-3">رقم الجوال</th>
              <th className="p-3">تاريخ ووقت الفاتورة</th>
              <th className="p-3">الإجمالي</th>
              <th className="p-3">المتبقي دين</th>
              <th className="p-3 text-center">إجراءات العرض والطباعة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
            {filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="p-3 text-[#fb8c00] font-bold">{inv.invNumber}</td>
                <td className="p-3 font-sans font-bold">
                  {inv.type === 'sale' ? <span className="text-emerald-600">مبيعات</span> : inv.type === 'purchase' ? <span className="text-blue-600">مشتريات</span> : <span className="text-rose-600">مرتجع</span>}
                </td>
                <td className="p-3 font-sans font-bold text-slate-900">{inv.customerName}</td>
                <td className="p-3 text-slate-500">{inv.customerPhone}</td>
                <td className="p-3 text-slate-500">{inv.invDate} {inv.invTime}</td>
                <td className="p-3 font-bold">{formatCurr(inv.grandTotal, inv.currency)}</td>
                <td className="p-3 text-rose-600 font-bold">{formatCurr(inv.remainingAmount, inv.currency)}</td>
                <td className="p-3 text-center font-sans space-x-1 space-x-reverse">
                  <button onClick={() => setSelectedInvoice(inv)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded border border-slate-300">👁️ عرض</button>
                  <button onClick={() => onPrintA4(inv)} className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded border border-amber-300">🖨️ طباعة</button>
                  <button
                    onClick={() =>
                      onRequestAuth('حذف فاتورة من الأرشيف', `حذف الفاتورة #${inv.invNumber} وإلغاء أثرها المالي والمخزني يتطلب كلمة مرور المدير.`, () => onDeleteInvoice(inv.id))
                    }
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded border border-rose-200"
                  >
                    🗑️ حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <h4 className="font-bold text-slate-800 text-sm">🧾 سجل جميع العمليات (مبيعات، دفعات، مرتجعات، سحب مواد، مصاريف، حذف)</h4>
        <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-80 overflow-y-auto bg-white">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
              <tr>
                <th className="p-2">التاريخ والوقت</th>
                <th className="p-2">نوع العملية</th>
                <th className="p-2">الطرف</th>
                <th className="p-2">المرجع</th>
                <th className="p-2">المبلغ</th>
                <th className="p-2">البيان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {opLog
                .filter(l => !search || l.party.toLowerCase().includes(search.toLowerCase()) || l.invNumber.includes(search))
                .map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-2 text-slate-500">{l.date} {l.time}</td>
                    <td className="p-2 font-sans font-bold">{LOG_LABELS[l.kind]}</td>
                    <td className="p-2 font-sans">{l.party}</td>
                    <td className="p-2 text-[#fb8c00] font-bold">{l.invNumber}</td>
                    <td className="p-2 font-bold">{l.amount ? formatCurr(l.amount) : '-'}</td>
                    <td className="p-2 font-sans text-slate-600">{l.text}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base">استعراض أرشيف الفاتورة #{selectedInvoice.invNumber}</h4>
                <p className="text-slate-500 text-xs">السيد: {selectedInvoice.customerName} | التاريخ: {selectedInvoice.invDate} {selectedInvoice.invTime}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            {selectedInvoice.notes && (
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 font-sans whitespace-pre-line">
                <strong>الملاحظات المحفوظة:</strong> {selectedInvoice.notes}
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 font-bold">
                  <tr><th className="p-2">#</th><th className="p-2">المادة</th><th className="p-2">الكمية</th><th className="p-2">السعر</th><th className="p-2">الإجمالي</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {selectedInvoice.rows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-sans font-bold text-slate-900">{r.itemName}</td>
                      <td className="p-2">{r.quantity} {r.unit}</td>
                      <td className="p-2">{formatPrice(r.price, selectedInvoice.currency)}</td>
                      <td className="p-2 font-bold">{formatCurr(r.total, selectedInvoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono font-bold text-center">
              <div><span className="text-slate-500 block font-sans">الإجمالي:</span>{formatCurr(selectedInvoice.grandTotal, selectedInvoice.currency)}</div>
              <div><span className="text-slate-500 block font-sans">المدفوع:</span><span className="text-emerald-600">{formatCurr(selectedInvoice.paidAmount, selectedInvoice.currency)}</span></div>
              <div><span className="text-slate-500 block font-sans">المتبقي:</span><span className="text-rose-600">{formatCurr(selectedInvoice.remainingAmount, selectedInvoice.currency)}</span></div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-[11px] text-slate-400">هذا السجل محمي ومؤرشف رسمياً لمنع التعديل العشوائي.</span>
              <div className="flex gap-2">
                <button onClick={() => { onPrintA4(selectedInvoice); setSelectedInvoice(null); }} className="px-4 py-1.5 bg-[#0097a7] text-white font-bold rounded-lg shadow-sm">🖨️ طباعة الفاتورة A4</button>
                <button onClick={() => setSelectedInvoice(null)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg">إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 13. تقرير الأرباح والمبيعات والصندوق
// ==========================================
function ProfitsReportWorkspace({
  invoices,
  expenses,
  payments,
  closings,
  onCloseDay
}: {
  invoices: AlAmeenInvoice[];
  expenses: ExpenseItem[];
  payments: PaymentRecord[];
  closings: ClosingRecord[];
  onCloseDay: (systemCash: number, countedCash: number, notes: string) => void;
}) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [countedStr, setCountedStr] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const now = new Date();
  const todayStr = localDateStr(now);

  const inPeriod = (dateStr: string) => {
    if (period === 'today') return dateStr === todayStr;
    if (period === 'week') {
      const diff = (new Date(todayStr).getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 7;
    }
    if (period === 'month') return dateStr.slice(0, 7) === todayStr.slice(0, 7);
    return dateStr.slice(0, 4) === todayStr.slice(0, 4);
  };

  const salesInPeriod = invoices.filter(i => i.type === 'sale' && inPeriod(i.invDate));
  const expensesInPeriod = expenses.filter(e => inPeriod(e.date));

  // الفواتير تُخفَّض تلقائياً عند المرتجع، فهذا هو الصافي الفعلي
  const netSalesRevenue = round2(salesInPeriod.reduce((s, i) => s + toUSD(i.grandTotal, i.currency, i.exchangeRate), 0));
  // التكلفة (متوسط مرجح) محفوظة بالدولار في بنود الفاتورة
  const totalCost = round2(salesInPeriod.reduce((s, i) => s + i.rows.reduce((sum, r) => sum + r.cost * r.quantity * r.factor, 0), 0));
  const grossProfit = round2(netSalesRevenue - totalCost);
  const totalExp = round2(expensesInPeriod.reduce((s, e) => s + e.amount, 0));
  const fxPeriod = fxDifference(payments.filter(p => inPeriod(p.date)), invoices);
  const netProfit = round2(grossProfit - totalExp + fxPeriod);

  // الصندوق (إجمالي كل الفترات) مشتق مباشرة من الفواتير والسندات
  const cashIn = round2(invoices.filter(i => i.type === 'sale').reduce((s, i) => s + toUSD(i.paidAmount, i.currency, i.exchangeRate), 0));
  const cashOutMerchants = round2(invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + toUSD(i.paidAmount, i.currency, i.exchangeRate), 0));
  const cashOutExpenses = round2(expenses.reduce((s, e) => s + e.amount, 0));
  const fxAll = fxDifference(payments, invoices);
  const cashBox = round2(cashIn - cashOutMerchants - cashOutExpenses + fxAll);

  const counted = parseMoney(countedStr);
  const closeDiff = round2(counted - cashBox);
  const periodNames = { today: 'اليوم', week: 'الأسبوع', month: 'الشهر', year: 'السنة' };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-xs">
      <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 bg-[#7b1fa2] rounded-full inline-block"></span>
          المبيعات والأرباح الصافية (المبيعات الفعلية بعد استبعاد فواتير التجار)
        </h3>
        <div className="flex gap-1.5">
          {[
            { id: 'today', name: 'اليوم' },
            { id: 'week', name: 'الأسبوع الأخير' },
            { id: 'month', name: 'هذا الشهر' },
            { id: 'year', name: 'هذه السنة' }
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id as any)} className={`px-3 py-1.5 rounded-lg font-bold ${period === p.id ? 'bg-[#7b1fa2] text-white' : 'bg-slate-100 text-slate-600'}`}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <span className="text-slate-500 block mb-1">صافي المبيعات الفعلية ({periodNames[period]}):</span>
          <span className="text-lg font-bold font-mono text-slate-900">{formatCurr(netSalesRevenue)}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <span className="text-slate-500 block mb-1">أرباح البضاعة المباعة:</span>
          <span className="text-lg font-bold font-mono text-[#7b1fa2]">{formatCurr(grossProfit)}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <span className="text-slate-500 block mb-1">المصاريف اليومية:</span>
          <span className="text-lg font-bold font-mono text-rose-600">-{formatCurr(totalExp)}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <span className="text-slate-500 block mb-1">فروقات سعر الصرف:</span>
          <span className={`text-lg font-bold font-mono ${fxPeriod < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{formatCurr(fxPeriod)}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
          <span className="text-emerald-800 block mb-1 font-bold">صافي الربح الفعلي النهائي 🏆:</span>
          <span className="text-xl font-bold font-mono text-emerald-700">{formatCurr(netProfit)}</span>
        </div>
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl md:col-span-5">
          <span className="text-sky-800 block mb-1 font-bold">💰 رصيد الصندوق الحالي (إجمالي كل الفترات):</span>
          <span className="text-xl font-bold font-mono text-sky-700">{formatCurr(cashBox)}</span>
          <span className="text-slate-500 block mt-1">
            مقبوض {formatCurr(cashIn)} - مدفوع للتجار {formatCurr(cashOutMerchants)} - مصاريف {formatCurr(cashOutExpenses)} + فروقات صرف {formatCurr(fxAll)}
          </span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
        <span className="text-slate-800 font-bold block text-sm">🔒 الإقفال اليومي: مطابقة النقد الفعلي في الدرج مع رصيد الصندوق</span>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <div>
            <label className="text-slate-600 block mb-1">النقد الفعلي بالدولار:</label>
            <input type="text" inputMode="decimal" value={countedStr} onChange={e => setCountedStr(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2 font-bold font-mono" />
          </div>
          <div>
            <label className="text-slate-600 block mb-1">الفرق عن النظام:</label>
            <div className={`p-2 rounded border font-bold font-mono ${countedStr === '' ? 'bg-white text-slate-400' : closeDiff === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {countedStr === '' ? '-' : `${closeDiff > 0 ? '+' : ''}${formatCurr(closeDiff)}`}
            </div>
          </div>
          <div>
            <label className="text-slate-600 block mb-1">ملاحظات (سبب الفرق):</label>
            <input type="text" value={closeNotes} onChange={e => setCloseNotes(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2" />
          </div>
          <button
            onClick={() => {
              if (countedStr.trim() === '') {
                alert('أدخل النقد الفعلي أولاً.');
                return;
              }
              onCloseDay(cashBox, counted, closeNotes.trim());
              setCountedStr('');
              setCloseNotes('');
            }}
            className="bg-[#7b1fa2] hover:bg-[#6a1b9a] text-white font-bold rounded p-2 shadow-sm"
          >
            تثبيت الإقفال
          </button>
        </div>
        {closings.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white max-h-52 overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 font-bold">
                <tr><th className="p-2">التاريخ</th><th className="p-2">رصيد النظام</th><th className="p-2">النقد الفعلي</th><th className="p-2">الفرق</th><th className="p-2">ملاحظات</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {closings.slice(0, 15).map(c => (
                  <tr key={c.id}>
                    <td className="p-2 text-slate-500">{c.date} {c.time}</td>
                    <td className="p-2">{formatCurr(c.systemCash)}</td>
                    <td className="p-2">{formatCurr(c.countedCash)}</td>
                    <td className={`p-2 font-bold ${c.diff === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{c.diff > 0 ? '+' : ''}{formatCurr(c.diff)}</td>
                    <td className="p-2 font-sans text-slate-600">{c.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 14. كشف حساب زبون تفصيلي
// ==========================================
function StatementWorkspace({
  invoices,
  payments,
  onPrintStatement
}: {
  invoices: AlAmeenInvoice[];
  payments: PaymentRecord[];
  onPrintStatement: (customerName: string, customerPhone: string, invoicesList: AlAmeenInvoice[], paymentsList: PaymentRecord[], totalBilled: number, totalPaid: number, totalDebt: number) => void;
}) {
  const [searchName, setSearchName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  const customerInvoices = invoices.filter(i => i.type === 'sale' || i.type === 'return');
  const customerNames = Array.from(new Set(customerInvoices.map(i => i.customerName)));

  const typed = searchName.trim().toLowerCase();
  const activeName = typed
    ? customerNames.find(n => n.toLowerCase().includes(typed)) || ''
    : selectedCustomer || customerNames[0] || '';

  const sameName = (n: string) => n.trim().toLowerCase() === activeName.trim().toLowerCase();
  const matchedInvoices = customerInvoices.filter(i => sameName(i.customerName));
  const matchedPayments = payments.filter(p => p.partyType === 'customer' && sameName(p.partyName));
  const phone = matchedInvoices[0]?.customerPhone || 'غير مسجل';

  const sales = matchedInvoices.filter(i => i.type === 'sale');
  const returns = matchedInvoices.filter(i => i.type === 'return');

  // صافي المشتريات (الفاتورة مخفّضة تلقائياً بعد كل مرتجع وزائدة بأي سحب لاحق)
  const totalBilled = round2(sales.reduce((s, i) => s + toUSD(i.grandTotal, i.currency, i.exchangeRate), 0));
  // المسدد = ما دُفع عند البيع + سندات القبض اللاحقة (بدون تكرار)
  const paidAtSale = round2(sales.reduce((s, i) => s + toUSD(i.initialPaid ?? i.paidAmount, i.currency, i.exchangeRate), 0));
  // الدفعات تُحوَّل بسعر صرف الفاتورة (فرق الصرف يظهر منفصلاً في تقرير الأرباح)
  const rateOf = (p: PaymentRecord) => invoices.find(i => i.invNumber === p.invNumber)?.exchangeRate ?? p.rate ?? 1;
  const paidLater = round2(
    matchedPayments.reduce((s, p) => s + (p.kind === 'refund' ? -1 : 1) * toUSD(p.amount, p.currency ?? 'USD', rateOf(p)), 0)
  );
  const totalPaid = round2(paidAtSale + paidLater);
  const totalReturned = round2(returns.reduce((s, i) => s + toUSD(i.grandTotal, i.currency, i.exchangeRate), 0));
  const balance = round2(totalBilled - totalPaid);
  const totalDebt = Math.max(0, balance);
  const creditForCustomer = Math.max(0, -balance);

  const entries = [
    ...matchedInvoices.map(i => ({ kind: i.type as 'sale' | 'return', date: i.invDate, time: i.invTime, inv: i as AlAmeenInvoice | null, pay: null as PaymentRecord | null })),
    ...matchedPayments.map(p => ({ kind: 'pay' as const, date: p.date, time: p.time, inv: null as AlAmeenInvoice | null, pay: p as PaymentRecord | null }))
  ].sort((a, b) => tsKey(b.date, b.time).localeCompare(tsKey(a.date, a.time)));

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-xs">
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 bg-[#f06292] rounded-full inline-block"></span>
          كشف حساب تفصيلي للزبون
        </h3>
        <button
          onClick={() => onPrintStatement(activeName, phone, matchedInvoices, matchedPayments, totalBilled, totalPaid, totalDebt)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-1.5 rounded-lg shadow-sm font-bold"
        >
          🖨️ طباعة كشف الحساب A4
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
          <span className="text-[#f06292] font-bold block text-sm border-b pb-2">👤 بطاقة تعريف الزبون (السيد:)</span>
          <div>
            <label className="text-slate-600 block mb-1">ابحث باسم الزبون:</label>
            <input type="text" placeholder="اكتب اسم الزبون..." value={searchName} onChange={e => setSearchName(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 font-bold" />
          </div>
          <div>
            <label className="text-slate-600 block mb-1">أو اختر من المسجلين:</label>
            <select value={selectedCustomer || customerNames[0] || ''} onChange={e => { setSelectedCustomer(e.target.value); setSearchName(''); }} className="w-full bg-white border border-slate-300 rounded p-2">
              {customerNames.map((n, i) => (<option key={i} value={n}>{n}</option>))}
            </select>
          </div>
          <div className="pt-2 border-t border-slate-200 space-y-1.5 font-mono">
            <p className="font-sans font-bold text-slate-900 text-base">{activeName || 'لا يوجد زبون مطابق'}</p>
            <p className="text-slate-600">الهاتف: {phone}</p>
            <p className="text-slate-600">صافي المشتريات (بعد المرتجع): {formatCurr(totalBilled)}</p>
            <p className="text-rose-600">إجمالي المرتجعات: {formatCurr(totalReturned)}</p>
            <p className="text-emerald-600 font-bold">المسدد نقداً ودفعات: {formatCurr(totalPaid)}</p>
            <div className="pt-2 border-t">
              {totalDebt > 0.001 ? (
                <p className="text-rose-600 font-bold text-sm">لنا عند الزبون: {formatCurr(totalDebt)}</p>
              ) : creditForCustomer > 0.001 ? (
                <p className="text-sky-700 font-bold text-sm">رصيد للزبون عندنا: {formatCurr(creditForCustomer)}</p>
              ) : (
                <p className="text-emerald-600 font-bold text-sm">الحساب مسدد بالكامل ✓</p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 border border-slate-200 rounded-xl overflow-x-auto bg-white">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">نوع الحركة</th>
                <th className="p-3">المواد والكميات</th>
                <th className="p-3">قيمة الفاتورة</th>
                <th className="p-3">المسدد</th>
                <th className="p-3">المتبقي منها</th>
                <th className="p-3">مرتجع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
              {entries.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-sans">لا توجد حركات.</td></tr>
              )}
              {entries.map((e, idx) => {
                if (e.kind === 'pay' && e.pay) {
                  const p = e.pay;
                  return (
                    <tr key={idx} className="bg-emerald-50/40">
                      <td className="p-3 text-slate-500">{p.date} {p.time}</td>
                      <td className="p-3 font-sans font-bold text-emerald-800">{p.kind === 'refund' ? 'سند صرف (ردّ نقد)' : 'سند قبض'} #{p.invNumber}</td>
                      <td className="p-3 font-sans text-slate-600">{p.notes}</td>
                      <td className="p-3">-</td>
                      <td className="p-3 text-emerald-600 font-bold">{p.kind === 'refund' ? '-' : '+'}{formatCurr(p.amount, p.currency ?? 'USD')}</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                    </tr>
                  );
                }
                const i = e.inv!;
                const isRet = i.type === 'return';
                return (
                  <tr key={idx} className={isRet ? 'bg-rose-50/40' : ''}>
                    <td className="p-3 text-slate-500">{i.invDate} {i.invTime}</td>
                    <td className="p-3 font-sans font-bold">
                      {isRet ? <span className="text-rose-600">مرتجع #{i.invNumber}</span> : <span>فاتورة بيع #{i.invNumber}</span>}
                    </td>
                    <td className="p-3 font-sans text-slate-700">{i.rows.map(r => `${r.itemName} (${r.quantity} ${r.unit})`).join('، ')}</td>
                    <td className="p-3 font-bold">{isRet ? '-' : formatCurr(i.grandTotal, i.currency)}</td>
                    <td className="p-3 text-emerald-600 font-bold">{isRet ? '-' : formatCurr(i.initialPaid ?? i.paidAmount, i.currency)}</td>
                    <td className="p-3 text-rose-600 font-bold">{isRet ? '-' : formatCurr(i.remainingAmount, i.currency)}</td>
                    <td className="p-3 text-rose-600">{isRet ? formatCurr(i.grandTotal, i.currency) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 15. الإعدادات، تكبير الخط، والنسخ الاحتياطي
// ==========================================
function SettingsWorkspace({
  settings,
  allAppData,
  integrityIssues,
  onSaveSettings,
  onRestoreFullData
}: {
  settings: AlAmeenSettings;
  allAppData: any;
  integrityIssues: string[];
  onSaveSettings: (set: AlAmeenSettings) => void;
  onRestoreFullData: (data: any) => void;
}) {
  const [conf, setConf] = useState<AlAmeenSettings>(settings);
  const [rateStr, setRateStr] = useState(String(settings.usdRate));
  const [newUsername, setNewUsername] = useState(settings.adminUsername);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [cashUser, setCashUser] = useState(settings.cashierUsername);
  const [cashPass, setCashPass] = useState('');
  const [testResults, setTestResults] = useState<{ name: string; ok: boolean }[] | null>(null);

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>, key: 'logoBase64' | 'stampBase64' | 'signatureBase64') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => setConf(prev => ({ ...prev, [key]: ev.target?.result as string }));
    r.readAsDataURL(file);
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await verifyHash(oldPass.trim(), conf.adminPassHash))) {
      alert('كلمة المرور الحالية غير صحيحة!');
      return;
    }
    const updated: AlAmeenSettings = { ...conf, adminUsername: newUsername.trim() || conf.adminUsername };
    if (newPass.trim()) {
      if (newPass.trim().length < 4) {
        alert('كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل!');
        return;
      }
      updated.adminPassHash = await sha256(newPass.trim());
    }
    if (newAnswer.trim()) updated.securityAnswerHash = await sha256(newAnswer.trim().toLowerCase());
    if (cashUser.trim()) {
      if (!cashPass.trim() && !conf.cashierPassHash) {
        alert('أدخل كلمة مرور للكاشير.');
        return;
      }
      updated.cashierUsername = cashUser.trim();
      if (cashPass.trim()) updated.cashierPassHash = await sha256(cashPass.trim());
    } else {
      updated.cashierUsername = '';
      updated.cashierPassHash = '';
    }
    setConf(updated);
    onSaveSettings(updated);
    setOldPass('');
    setNewPass('');
    setNewAnswer('');
    setCashPass('');
    alert('تم تحديث بيانات الدخول والصلاحيات بنجاح!');
  };

  // الأختام والتواقيع تُحفظ فوراً
  const updateSeals = (patch: Partial<AlAmeenSettings>) => {
    const updated = { ...conf, ...patch };
    setConf(updated);
    onSaveSettings(updated);
  };

  const saveAll = () => {
    const rate = parseDecimal(rateStr);
    if (rate <= 0) {
      alert('سعر الصرف غير صحيح!');
      return;
    }
    onSaveSettings({ ...conf, usdRate: rate });
    alert('تم حفظ الإعدادات والشعار والختم بنجاح!');
  };

  const backupJson = () =>
    JSON.stringify({ ...allAppData, settings: { ...conf, usdRate: parseDecimal(rateStr) || conf.usdRate }, backupDate: new Date().toISOString() }, null, 2);

  const exportFullBackup = () => {
    const blob = new Blob([backupJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `AlAmeen_FullBackup_${localDateStr()}.json`;
    a.click();
  };

  const saveDirectlyToHardDrive = async () => {
    try {
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `AlAmeen_HardDisk_Backup_${localDateStr()}.json`,
          types: [{ description: 'JSON Backup File', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(backupJson());
        await writable.close();
        alert('تم حفظ ملف النسخة الاحتياطية في المكان المختار على القرص الصلب!');
      } else {
        exportFullBackup();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') exportFullBackup();
    }
  };

  const importFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (window.confirm('ستُستبدل جميع البيانات الحالية بمحتوى النسخة. هل أنت متأكد؟')) onRestoreFullData(parsed);
      } catch {
        alert('ملف النسخة الاحتياطية غير صالح!');
      }
    };
    r.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-2xl mx-auto space-y-5 shadow-sm text-xs">
      <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
        <span className="w-3 h-3 bg-[#3949ab] rounded-full inline-block"></span>
        الإعدادات، حجم الخط، النسخ الاحتياطي والأمان
      </h3>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <span className="text-slate-800 font-bold block text-sm">🔍 تكبير حجم خط البرنامج بالكامل:</span>
        <div className="flex gap-3">
          {[
            { id: 'normal', name: 'خط عادي قياسي' },
            { id: 'medium', name: 'خط متوسط أوضح' },
            { id: 'large', name: 'خط كبير جداً للقراءة السريعة' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                const updated = { ...conf, fontSize: f.id as any };
                setConf(updated);
                onSaveSettings(updated);
              }}
              className={`px-4 py-2 rounded-xl font-bold border transition-colors ${conf.fontSize === f.id ? 'bg-[#3949ab] text-white border-[#3949ab]' : 'bg-white text-slate-700 border-slate-300'}`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <span className="text-emerald-800 font-bold block text-sm">💾 نسخة احتياطية على القرص الصلب:</span>
        <p className="text-slate-500">بياناتك محفوظة داخل المتصفح، ومسح بيانات المتصفح يحذفها. خذ نسخة بانتظام (يومياً) واحفظها في مكان آمن خارج الجهاز.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={saveDirectlyToHardDrive} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5">📁 حفظ ملف النسخة على الهارد</button>
          <button onClick={exportFullBackup} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm">📥 تنزيل ملف JSON</button>
          <label className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center justify-center">
            📤 استعادة نسخة من ملف
            <input type="file" accept=".json" onChange={importFullBackup} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <span className="text-slate-800 font-bold block text-sm">🔍 فحص سلامة الحسابات والاختبارات الذاتية:</span>
        {integrityIssues.length === 0 ? (
          <p className="text-emerald-700 font-bold">✓ جميع الفواتير والسندات والأرصدة متطابقة محاسبياً.</p>
        ) : (
          <ul className="list-disc pr-5 space-y-1 text-rose-700 font-bold max-h-40 overflow-y-auto">
            {integrityIssues.map((m, i) => (<li key={i}>{m}</li>))}
          </ul>
        )}
        <button type="button" onClick={async () => setTestResults(await runSelfTests())} className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl shadow-sm">
          ▶ تشغيل اختبارات دوال الحساب
        </button>
        {testResults && (
          <ul className="space-y-1">
            {testResults.map((r, i) => (
              <li key={i} className={r.ok ? 'text-emerald-700' : 'text-rose-700 font-bold'}>{r.ok ? '✓' : '✗'} {r.name}</li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSaveSecurity} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <span className="text-[#3949ab] font-bold block text-sm">🔐 المدير: اسم المستخدم وكلمة المرور وسؤال الأمان:</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="text-slate-700 block mb-0.5">اسم المستخدم:</label>
            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5" />
          </div>
          <div>
            <label className="text-slate-700 block mb-0.5">كلمة المرور الحالية (مطلوبة للحفظ):</label>
            <input type="password" required value={oldPass} onChange={e => setOldPass(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5" />
          </div>
          <div>
            <label className="text-slate-700 block mb-0.5">كلمة المرور الجديدة (اختياري):</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 border-t">
          <div>
            <label className="text-slate-700 block mb-0.5">سؤال استعادة كلمة المرور:</label>
            <input type="text" value={conf.securityQuestion} onChange={e => setConf({ ...conf, securityQuestion: e.target.value })} className="w-full bg-white border border-slate-300 rounded p-1.5" />
          </div>
          <div>
            <label className="text-slate-700 block mb-0.5">إجابة جديدة (فارغ = إبقاء الحالية):</label>
            <input type="text" value={newAnswer} onChange={e => setNewAnswer(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold" />
          </div>
        </div>
        <span className="text-[#3949ab] font-bold block text-sm pt-2 border-t">👤 حساب الكاشير (صلاحيات محدودة: مبيعات، ديون، فواتير مرحلة، كشف زبون، مستودع):</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-700 block mb-0.5">اسم مستخدم الكاشير (فارغ = بدون كاشير):</label>
            <input type="text" value={cashUser} onChange={e => setCashUser(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-1.5" />
          </div>
          <div>
            <label className="text-slate-700 block mb-0.5">كلمة مرور الكاشير:</label>
            <input type="password" value={cashPass} onChange={e => setCashPass(e.target.value)} placeholder={conf.cashierPassHash ? 'اتركها فارغة للإبقاء' : ''} className="w-full bg-white border border-slate-300 rounded p-1.5" />
          </div>
        </div>
        <button type="submit" className="bg-[#3949ab] hover:bg-[#303f9f] text-white font-bold px-4 py-2 rounded shadow-sm">حفظ بيانات الدخول والصلاحيات</button>
      </form>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <span className="text-slate-800 font-bold block text-sm">🏢 بيانات المحل والفاتورة الرسمية:</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 block mb-0.5">اسم المحل الرسمي:</label>
            <input type="text" value={conf.shopName} onChange={e => setConf({ ...conf, shopName: e.target.value })} className="w-full bg-white border border-slate-300 rounded p-1.5" />
          </div>
          <div>
            <label className="text-slate-700 block mb-0.5">رقم الهاتف:</label>
            <input type="text" value={conf.phone} onChange={e => setConf({ ...conf, phone: e.target.value })} className="w-full bg-white border border-slate-300 rounded p-1.5" />
          </div>
        </div>
        <div>
          <label className="text-slate-700 block mb-0.5">العنوان بالتفصيل:</label>
          <input type="text" value={conf.address} onChange={e => setConf({ ...conf, address: e.target.value })} className="w-full bg-white border border-slate-300 rounded p-1.5" />
        </div>
        <div>
          <label className="text-slate-700 block mb-0.5">سعر صرف الدولار مقابل الليرة:</label>
          <input type="text" inputMode="decimal" value={rateStr} onChange={e => setRateStr(e.target.value)} className="w-48 bg-white border border-slate-300 rounded p-1.5 font-mono" />
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <span className="text-slate-800 font-bold block text-sm">🖼️ الشعار والختم والتوقيع الإلكتروني:</span>
        <div>
          <label className="text-slate-700 block mb-1">رفع شعار المحل (Logo):</label>
          <input type="file" accept="image/*" onChange={e => handleUploadImage(e, 'logoBase64')} className="w-full text-xs text-slate-500" />
          {conf.logoBase64 && <img src={conf.logoBase64} alt="Logo" className="h-10 object-contain bg-white p-1 rounded border mt-2" />}
        </div>
        <SealManager title="الختم" kind="stamp" items={conf.stamps || []} activeId={conf.activeStampId} show={conf.showStamp !== false} onChange={updateSeals} />
        <SealManager title="التوقيع" kind="signature" items={conf.signatures || []} activeId={conf.activeSignatureId} show={conf.showSignature !== false} onChange={updateSeals} />
        <p className="text-slate-500">الختم والتوقيع المُفعَّلان يظهران في أسفل كل مطبوع: الفواتير، كشوف الحساب، جرد المستودع، قوائم الأرشيف. تغييراتهما تُحفظ فوراً.</p>
        <button onClick={saveAll} className="w-full py-2.5 bg-[#3949ab] hover:bg-[#303f9f] text-white font-bold rounded shadow-sm mt-2">تثبيت وحفظ جميع الإعدادات والهوية</button>
      </div>
    </div>
  );
}

// ==========================================
// 15b. إدارة الأختام والتواقيع (إضافة، تفعيل، إخفاء، حذف)
// ==========================================
function SealManager({
  title,
  kind,
  items,
  activeId,
  show,
  onChange
}: {
  title: string;
  kind: 'stamp' | 'signature';
  items: SealImage[];
  activeId: string;
  show: boolean;
  onChange: (patch: Partial<AlAmeenSettings>) => void;
}) {
  const [newName, setNewName] = useState('');
  const keys =
    kind === 'stamp'
      ? { list: 'stamps', active: 'activeStampId', show: 'showStamp' }
      : { list: 'signatures', active: 'activeSignatureId', show: 'showSignature' };

  const add = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = await resizeImageFile(file, 600);
      const id = `${kind}-${Date.now()}`;
      const item: SealImage = { id, name: newName.trim() || `${title} ${items.length + 1}`, data };
      onChange({ [keys.list]: [...items, item], [keys.active]: id } as Partial<AlAmeenSettings>);
      setNewName('');
    } catch {
      alert('تعذّر قراءة الصورة، جرّب ملف PNG أو JPG آخر.');
    }
  };

  const remove = (id: string) => {
    if (!window.confirm('حذف هذه الصورة نهائياً من المكتبة؟')) return;
    const rest = items.filter(i => i.id !== id);
    onChange({ [keys.list]: rest, [keys.active]: activeId === id ? rest[0]?.id ?? '' : activeId } as Partial<AlAmeenSettings>);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-slate-800">{title}</span>
        <label className="flex items-center gap-2 cursor-pointer font-bold">
          <input
            type="checkbox"
            checked={show}
            onChange={() => onChange({ [keys.show]: !show } as Partial<AlAmeenSettings>)}
          />
          <span className={show ? 'text-emerald-700' : 'text-slate-400'}>{show ? 'ظاهر على المطبوعات' : 'مخفي (لن يُطبع)'}</span>
        </label>
      </div>

      {items.length === 0 ? (
        <p className="text-slate-400">لا توجد صور بعد. أضف صورة جديدة بالأسفل.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {items.map(it => (
            <div key={it.id} className={`border rounded-lg p-2 space-y-1 ${it.id === activeId ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
              <img src={it.data} alt={it.name} className="h-14 w-full object-contain bg-white rounded" />
              <div className="text-center font-bold text-slate-700 truncate">{it.name}</div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onChange({ [keys.active]: it.id } as Partial<AlAmeenSettings>)}
                  className={`flex-1 py-1 rounded font-bold ${it.id === activeId ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {it.id === activeId ? '✓ مُفعَّل' : 'تفعيل'}
                </button>
                <button type="button" onClick={() => remove(it.id)} className="px-2 py-1 rounded bg-rose-50 text-rose-600 font-bold border border-rose-200">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
        <input type="text" placeholder={`اسم ${title} الجديد (اختياري)`} value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 min-w-[160px] bg-slate-50 border border-slate-300 rounded p-1.5" />
        <label className="bg-[#3949ab] hover:bg-[#303f9f] text-white font-bold px-3 py-1.5 rounded cursor-pointer">
          + إضافة {title} جديد
          <input type="file" accept="image/*" onChange={add} className="hidden" />
        </label>
      </div>
    </div>
  );
}

// ==========================================
// 16. شاشة تسجيل الدخول
// ==========================================
function AlAmeenLogin({
  onLogin,
  settings,
  onUpdateSettings
}: {
  onLogin: (u: string, role: 'admin' | 'cashier') => void;
  settings: AlAmeenSettings;
  onUpdateSettings: (s: AlAmeenSettings) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [resetPassInput, setResetPassInput] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await verifyHash(answerInput.trim().toLowerCase(), settings.securityAnswerHash)) {
      if (resetPassInput.trim().length < 4) {
        alert('كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل!');
        return;
      }
      onUpdateSettings({ ...settings, adminPassHash: await sha256(resetPassInput.trim()) });
      alert('تم التحقق بنجاح! تم تعيين كلمة المرور الجديدة. يمكنك الدخول بها الآن.');
      setPassword(resetPassInput.trim());
      setShowForgot(false);
      setAnswerInput('');
      setResetPassInput('');
    } else {
      alert('إجابة سؤال الأمان غير صحيحة!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="bg-white border border-slate-200 w-full max-w-sm p-8 rounded-3xl shadow-xl space-y-5">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#0097a7] rounded-2xl flex items-center justify-center text-white text-3xl mx-auto shadow-md">🏛️</div>
          <h2 className="text-lg font-bold text-slate-900">برنامج الأمين للمحاسبة والمستودعات</h2>
          <p className="text-xs text-slate-500">إصدار الأدوات الصحية والكهربائية والخردة</p>
        </div>

        {!showForgot ? (
          <form
            onSubmit={async e => {
              e.preventDefault();
              const u = username.trim();
              const p = password.trim();
              if (u === settings.adminUsername && (await verifyHash(p, settings.adminPassHash))) {
                onLogin(u, 'admin');
              } else if (settings.cashierUsername && u === settings.cashierUsername && (await verifyHash(p, settings.cashierPassHash))) {
                onLogin(u, 'cashier');
              } else {
                alert('خطأ في اسم المستخدم أو كلمة المرور!');
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="text-slate-700 block mb-1 font-bold">اسم المستخدم:</label>
              <input type="text" required placeholder="أدخل اسم المستخدم..." value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold" autoFocus />
            </div>
            <div>
              <label className="text-slate-700 block mb-1 font-bold">كلمة المرور:</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required placeholder="أدخل كلمة المرور..." value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold pl-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-700 font-bold text-xs">
                  {showPassword ? 'إخفاء 🙈' : 'إظهار 👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-[#0097a7] hover:bg-[#00838f] text-white font-bold rounded-xl shadow-md text-sm transition-colors">دخول لملف الشركة (Enter)</button>
            <div className="flex justify-between items-center text-[11px] pt-1">
              <span className="text-slate-400">نظام محاسبي محلي</span>
              <button type="button" onClick={() => setShowForgot(true)} className="text-[#0097a7] font-bold hover:underline">نسيت كلمة المرور؟</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 font-bold">سؤال الأمان لاستعادة الحساب: {settings.securityQuestion}</div>
            <div>
              <label className="text-slate-700 block mb-1">الإجابة السرية:</label>
              <input type="text" required placeholder="اكتب الإجابة..." value={answerInput} onChange={e => setAnswerInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold" />
            </div>
            <div>
              <label className="text-slate-700 block mb-1">كلمة المرور الجديدة:</label>
              <input type="password" required placeholder="أدخل كلمة مرور جديدة..." value={resetPassInput} onChange={e => setResetPassInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowForgot(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">إلغاء</button>
              <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow">استعادة وتعيين كلمة المرور</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
