'use strict';
/* Milk Ledger — offline, PIN-locked, encrypted (AES-GCM, PBKDF2) daily milk & curd book.
   No network calls, no external code, no device permissions. All data stays on this phone. */
(function () {
  const STORE = 'milkLedger.data.v1', META = 'milkLedger.meta', LANGK = 'milkLedger.lang';
  const ITER = 310000;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const $ = s => document.querySelector(s);

  let S = null, KEY = null, SALT = null, IT = ITER;
  let view = 'today', curDate = '', repRange = '7';
  let lastAct = Date.now(), hiddenAt = 0;

  /* ---------------- i18n ---------------- */
  const T = {
    en: {
      appName: 'Milk Ledger', today: 'Today', shops: 'Shops', money: 'Collect', reports: 'Reports', settings: 'Settings',
      fromAavin: 'Received from Aavin', purchaseCost: 'Aavin amount', supply: 'Supplied to shops', copyYesterday: "Copy yesterday",
      remaining: 'Remaining packets', boughtShort: 'got', tapToEnter: 'Tap to enter packets', noShops: 'No shops yet. Add your shops first.',
      addShop: 'Add shop', save: 'Save', cancel: 'Cancel', clear: 'Clear', total: 'Total', pending: 'Pending', prevPending: 'Old pending',
      todayBill: "Today's bill", paidToday: 'Paid today', balance: 'Balance', received: 'Amount received', full: 'Full', advance: 'Advance',
      collected: 'Collected', sales: 'Sales', profit: 'Profit', packets: 'Packets', bought: 'Got', supplied: 'Supplied', left: 'Left',
      shopName: 'Shop name', phone: 'Phone number (for WhatsApp)', opening: 'Old pending amount (before using this app)',
      customPrice: 'Special price for this shop (leave empty to use normal price)', active: 'Shop is active', edit: 'Edit',
      remind: 'WhatsApp reminder', history: 'History (last 30 days)', date: 'Date', bill: 'Bill', paid: 'Paid',
      products: 'Products & prices', buyPrice: 'Aavin price per packet (₹)', sellPrice: 'Selling price per packet (₹)', name: 'Name',
      shortName: 'Short name', addProduct: 'Add product', inUse: 'In use', security: 'Security', changePin: 'Change PIN',
      autoLock: 'Auto-lock after', minutes: 'min', lockNow: 'Lock now', backup: 'Backup', downloadBackup: 'Save backup file',
      shareBackup: 'Share backup (WhatsApp / Drive)', restore: 'Restore from backup', lastBackup: 'Last backup', never: 'never',
      backupDue: 'No backup for 3+ days. If the phone is lost or reset, data is gone. Tap to save a backup.',
      language: 'Language', business: 'Business name (shown in reminders)', erase: 'Erase all data',
      enterPin: 'Enter your PIN', createPin: 'Create a PIN (4–8 digits)', confirmPin: 'Enter the same PIN again',
      pinMismatch: "PINs didn't match. Start again.", wrongPin: 'Wrong PIN', tooMany: 'Too many wrong tries. Wait', sec: 'sec',
      checking: 'Checking…', pinShort: 'PIN must be 4 to 8 digits', restorePin: 'Enter the PIN of the backup file',
      setPrices: 'Prices are not set yet. Tap here to set Aavin and selling prices.', saved: 'Saved', deleted: 'Deleted',
      copied: 'Copied for {n} shops', nothingToCopy: 'Nothing new to copy from yesterday', days7: '7 days', days30: '30 days',
      thisMonth: 'This month', lastMonth: 'Last month', totalPending: 'Total pending (all shops)', byProduct: 'By product',
      byShop: 'By shop', salesVsCollected: 'Daily sales vs collected', profitNote: 'Profit = sales − Aavin amount (unsold packets count as loss).',
      noData: 'No entries in this period', aavinCost: 'Aavin amount', shopsToCollect: 'Collect money', nobodyToCollect: 'No bills or pending today.',
      allShops: 'All shops', inactive: 'inactive', del: 'Delete', delShopQ: 'Delete this shop? (Only possible when it has no entries)',
      cantDelete: 'This shop has entries. Turn off "Shop is active" instead.', perPacket: '/pkt', price: 'Price',
      currentPin: 'Current PIN', newPin: 'New PIN', newPin2: 'New PIN again', pinChanged: 'PIN changed',
      eraseQ: 'This deletes ALL data on this phone. Type DELETE to confirm.', badFile: 'This is not a valid backup file',
      restoreQ: 'Replace all data on this phone with this backup?', restored: 'Backup restored. Use the backup\'s PIN from now on.',
      backupSaved: 'Backup saved to Downloads', copyText: 'Copy backup text', copiedText: 'Copied', ok: 'OK', yes: 'Yes, replace',
      welcomeT: 'Welcome!', welcome1: 'First, go to Settings and set the Aavin and selling price for each packet (Violet, Orange, Green, Curd).',
      welcome2: 'Then add the shops you supply in the Shops tab.', welcome3: 'Your PIN cannot be recovered. Write it down safely. Save a backup every few days.',
      startNow: 'Set prices now', noPhone: 'Add a phone number to send reminders', secTitle: 'How your data is protected',
      sec1: 'Locked with your PIN. Data is encrypted on this phone (AES-256).', sec2: 'The app never connects to the internet and never asks for camera, contacts, location or files.',
      sec3: 'Backup files are encrypted too — they need the PIN to open.', sec4: 'Locks itself when not used.',
      remindMsg: 'Hello {shop}, your milk bill pending amount is {amt} as of {date}. Kindly pay. – {biz}',
      advanceOf: 'Advance', of: 'of', shopCount: 'shops', savedPay: 'Payment saved', amountQ: 'Enter an amount',
      dayTotal: 'Day total', supplyValue: 'Supply value', note: 'Unsold', wrongBackupPin: 'Wrong PIN for this backup'
    },
    ta: {
      appName: 'பால் கணக்கு', today: 'இன்று', shops: 'கடைகள்', money: 'வசூல்', reports: 'அறிக்கை', settings: 'அமைப்பு',
      fromAavin: 'ஆவினிலிருந்து வாங்கியது', purchaseCost: 'ஆவின் தொகை', supply: 'கடைகளுக்கு கொடுத்தது', copyYesterday: 'நேற்றையதை நகலெடு',
      remaining: 'மீதமுள்ள பாக்கெட்', boughtShort: 'வாங்கியது', tapToEnter: 'தொட்டு பாக்கெட் பதிவு செய்', noShops: 'இன்னும் கடைகள் இல்லை. முதலில் கடைகளைச் சேர்க்கவும்.',
      addShop: 'கடை சேர்', save: 'சேமி', cancel: 'ரத்து', clear: 'அழி', total: 'மொத்தம்', pending: 'நிலுவை', prevPending: 'பழைய நிலுவை',
      todayBill: 'இன்றைய பில்', paidToday: 'இன்று செலுத்தியது', balance: 'மீதி', received: 'பெற்ற தொகை', full: 'முழு', advance: 'முன்பணம்',
      collected: 'வசூல்', sales: 'விற்பனை', profit: 'லாபம்', packets: 'பாக்கெட்', bought: 'வாங்கியது', supplied: 'கொடுத்தது', left: 'மீதம்',
      shopName: 'கடை பெயர்', phone: 'போன் நம்பர் (வாட்ஸ்அப்)', opening: 'பழைய நிலுவைத் தொகை (ஆப் தொடங்கும் முன்)',
      customPrice: 'இந்தக் கடைக்கு தனி விலை (வேண்டாமெனில் காலியாக விடவும்)', active: 'கடை செயலில் உள்ளது', edit: 'திருத்து',
      remind: 'வாட்ஸ்அப் நினைவூட்டல்', history: 'வரலாறு (கடைசி 30 நாள்)', date: 'தேதி', bill: 'பில்', paid: 'செலுத்தியது',
      products: 'பொருட்கள் & விலை', buyPrice: 'ஆவின் விலை / பாக்கெட் (₹)', sellPrice: 'விற்பனை விலை / பாக்கெட் (₹)', name: 'பெயர்',
      shortName: 'சுருக்கப் பெயர்', addProduct: 'பொருள் சேர்', inUse: 'பயன்பாட்டில்', security: 'பாதுகாப்பு', changePin: 'PIN மாற்று',
      autoLock: 'தானாக பூட்டும் நேரம்', minutes: 'நிமி', lockNow: 'இப்போது பூட்டு', backup: 'காப்புப் பிரதி', downloadBackup: 'காப்புக் கோப்பை சேமி',
      shareBackup: 'காப்பை பகிர் (வாட்ஸ்அப் / டிரைவ்)', restore: 'காப்பிலிருந்து மீட்டெடு', lastBackup: 'கடைசி காப்பு', never: 'இல்லை',
      backupDue: '3 நாட்களுக்கு மேல் காப்பு எடுக்கவில்லை. போன் தொலைந்தால் தரவு போய்விடும். இங்கே தொட்டு சேமிக்கவும்.',
      language: 'மொழி', business: 'தொழில் பெயர் (நினைவூட்டலில் வரும்)', erase: 'அனைத்தையும் அழி',
      enterPin: 'உங்கள் PIN உள்ளிடவும்', createPin: 'புதிய PIN உருவாக்கவும் (4–8 இலக்கம்)', confirmPin: 'அதே PIN மீண்டும் உள்ளிடவும்',
      pinMismatch: 'PIN பொருந்தவில்லை. மீண்டும் தொடங்கவும்.', wrongPin: 'தவறான PIN', tooMany: 'பல முறை தவறு. காத்திருக்கவும்', sec: 'வினாடி',
      checking: 'சரிபார்க்கிறது…', pinShort: 'PIN 4 முதல் 8 இலக்கம் இருக்க வேண்டும்', restorePin: 'காப்புக் கோப்பின் PIN உள்ளிடவும்',
      setPrices: 'விலை இன்னும் அமைக்கவில்லை. இங்கே தொட்டு ஆவின் மற்றும் விற்பனை விலையை அமைக்கவும்.', saved: 'சேமிக்கப்பட்டது', deleted: 'நீக்கப்பட்டது',
      copied: '{n} கடைகளுக்கு நகலெடுக்கப்பட்டது', nothingToCopy: 'நேற்றிலிருந்து நகலெடுக்க எதுவும் இல்லை', days7: '7 நாள்', days30: '30 நாள்',
      thisMonth: 'இந்த மாதம்', lastMonth: 'கடந்த மாதம்', totalPending: 'மொத்த நிலுவை (அனைத்து கடைகள்)', byProduct: 'பொருள் வாரியாக',
      byShop: 'கடை வாரியாக', salesVsCollected: 'தினசரி விற்பனை / வசூல்', profitNote: 'லாபம் = விற்பனை − ஆவின் தொகை (விற்காத பாக்கெட் நஷ்டமாகக் கணக்கு).',
      noData: 'இந்தக் காலத்தில் பதிவு இல்லை', aavinCost: 'ஆவின் தொகை', shopsToCollect: 'பணம் வசூல்', nobodyToCollect: 'இன்று பில் அல்லது நிலுவை இல்லை.',
      allShops: 'அனைத்து கடைகள்', inactive: 'நிறுத்தப்பட்டது', del: 'நீக்கு', delShopQ: 'இந்தக் கடையை நீக்கவா? (பதிவு இல்லையெனில் மட்டும்)',
      cantDelete: 'இந்தக் கடைக்கு பதிவுகள் உள்ளன. "கடை செயலில்" என்பதை அணைக்கவும்.', perPacket: '/பாக்', price: 'விலை',
      currentPin: 'தற்போதைய PIN', newPin: 'புதிய PIN', newPin2: 'புதிய PIN மீண்டும்', pinChanged: 'PIN மாற்றப்பட்டது',
      eraseQ: 'இந்த போனில் உள்ள அனைத்து தரவும் அழியும். உறுதிப்படுத்த DELETE என்று தட்டச்சு செய்யவும்.', badFile: 'இது சரியான காப்புக் கோப்பு அல்ல',
      restoreQ: 'இந்த போனில் உள்ள தரவை இந்தக் காப்பால் மாற்றவா?', restored: 'காப்பு மீட்டெடுக்கப்பட்டது. இனி காப்பின் PIN பயன்படுத்தவும்.',
      backupSaved: 'காப்பு Downloads-இல் சேமிக்கப்பட்டது', copyText: 'காப்பு உரையை நகலெடு', copiedText: 'நகலெடுக்கப்பட்டது', ok: 'சரி', yes: 'ஆம், மாற்று',
      welcomeT: 'வரவேற்கிறோம்!', welcome1: 'முதலில் அமைப்பு பக்கத்தில் ஒவ்வொரு பால் மற்றும் தயிர் பாக்கெட்டின் ஆவின் விலை, விற்பனை விலையை அமைக்கவும்.',
      welcome2: 'பிறகு கடைகள் பக்கத்தில் நீங்கள் சப்ளை செய்யும் கடைகளைச் சேர்க்கவும்.', welcome3: 'PIN மறந்தால் மீட்க முடியாது. பாதுகாப்பாக எழுதி வைக்கவும். சில நாட்களுக்கு ஒருமுறை காப்பு எடுக்கவும்.',
      startNow: 'இப்போது விலை அமை', noPhone: 'நினைவூட்டல் அனுப்ப போன் நம்பர் சேர்க்கவும்', secTitle: 'உங்கள் தரவு எப்படி பாதுகாக்கப்படுகிறது',
      sec1: 'உங்கள் PIN-ஆல் பூட்டப்பட்டுள்ளது. தரவு இந்த போனில் மறையாக்கம் (AES-256) செய்யப்பட்டுள்ளது.', sec2: 'இந்த ஆப் இணையத்துடன் இணைவதில்லை. கேமரா, தொடர்புகள், இடம், கோப்புகள் அனுமதி கேட்பதில்லை.',
      sec3: 'காப்புக் கோப்புகளும் மறையாக்கம் செய்யப்பட்டவை — திறக்க PIN தேவை.', sec4: 'பயன்படுத்தாத போது தானாக பூட்டிக்கொள்ளும்.',
      remindMsg: 'வணக்கம் {shop}, {date} வரை உங்கள் பால் நிலுவைத் தொகை {amt}. தயவுசெய்து செலுத்தவும். – {biz}',
      advanceOf: 'முன்பணம்', of: '/', shopCount: 'கடைகள்', savedPay: 'பணம் பதிவு செய்யப்பட்டது', amountQ: 'தொகையை உள்ளிடவும்',
      dayTotal: 'நாள் மொத்தம்', supplyValue: 'சப்ளை மதிப்பு', note: 'விற்காதது', wrongBackupPin: 'இந்தக் காப்பிற்கு தவறான PIN'
    }
  };
  const lang = () => (S && S.settings.lang) || safeGet(LANGK) || 'en';
  const t = (k, vars) => {
    let s = (T[lang()] && T[lang()][k]) || T.en[k] || k;
    if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
    return s;
  };

  /* ---------------- utils ---------------- */
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return ymd(new Date()); }
  function parseD(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function addDays(s, n) { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); }
  function fmtDate(s, long) { return parseD(s).toLocaleDateString('en-IN', long ? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }); }
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const num = v => { const n = parseFloat(v); return isFinite(n) && n > 0 ? Math.min(r2(n), 10000000) : 0; };
  const int = v => { const n = parseInt(v, 10); return isFinite(n) && n > 0 ? Math.min(n, 100000) : 0; };
  const rs = n => '₹' + r2(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  function b64(buf) { const a = new Uint8Array(buf); let s = ''; for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }

  /* ---------------- crypto ---------------- */
  async function deriveKey(pin, salt, iter) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encryptObj(key, salt, iter, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    return { app: 'milk-ledger', v: 1, iter, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
  }
  function validBlob(b) {
    return b && typeof b === 'object' && b.app === 'milk-ledger' && typeof b.salt === 'string' && typeof b.iv === 'string' && typeof b.ct === 'string'
      && Number.isInteger(b.iter) && b.iter >= 100000 && b.iter <= 5000000;
  }
  async function decryptBlob(blob, pin) {
    const salt = unb64(blob.salt);
    const key = await deriveKey(pin, salt, blob.iter);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, key, unb64(blob.ct));
    return { key, salt, iter: blob.iter, data: JSON.parse(dec.decode(pt)) };
  }

  /* ---------------- data ---------------- */
  function freshData() {
    return {
      ver: 1, created: Date.now(),
      settings: {
        lang: lang(), autoLock: 3, lastBackup: 0, biz: '',
        products: [
          { id: 'v500', name: 'Violet 500 ml', short: 'Violet 500', buy: 0, sell: 0, active: true },
          { id: 'v200', name: 'Violet 200 ml', short: 'Violet 200', buy: 0, sell: 0, active: true },
          { id: 'o1000', name: 'Orange 1 L', short: 'Orange 1L', buy: 0, sell: 0, active: true },
          { id: 'o200', name: 'Orange 200 ml', short: 'Orange 200', buy: 0, sell: 0, active: true },
          { id: 'g500', name: 'Green 500 ml', short: 'Green 500', buy: 0, sell: 0, active: true },
          { id: 'c1', name: 'Curd', short: 'Curd', buy: 0, sell: 0, active: true }
        ]
      },
      shops: [], days: {}
    };
  }
  function cleanData(d) {
    if (!d || typeof d !== 'object' || !d.settings || !Array.isArray(d.settings.products) || !Array.isArray(d.shops) || typeof d.days !== 'object') throw new Error('bad');
    const days = {};
    for (const k of Object.keys(d.days)) if (DATE_RE.test(k)) {
      const D = d.days[k] || {};
      days[k] = { in: D.in || {}, inp: D.inp || {}, sup: D.sup || {}, pay: Array.isArray(D.pay) ? D.pay.filter(p => p && typeof p.s === 'string').map(p => ({ id: String(p.id || uid()), s: p.s, a: num(p.a), t: Number(p.t) || 0 })) : [] };
    }
    d.days = days;
    d.settings.autoLock = [1, 3, 5, 10].includes(d.settings.autoLock) ? d.settings.autoLock : 3;
    return d;
  }
  const prods = () => S.settings.products.filter(p => p.active !== false);
  const prod = id => S.settings.products.find(p => p.id === id);
  const shopById = id => S.shops.find(s => s.id === id);
  const sortShops = a => a.slice().sort((x, y) => String(x.name).localeCompare(String(y.name)));
  const activeShops = () => sortShops(S.shops.filter(s => s.active !== false));
  const shortName = p => p.short || p.name;
  function getDay(d) { return S.days[d] || { in: {}, inp: {}, sup: {}, pay: [] }; }
  function day(d) { if (!S.days[d]) S.days[d] = { in: {}, inp: {}, sup: {}, pay: [] }; const D = S.days[d]; D.inp = D.inp || {}; return D; }
  function priceFor(sh, pid) { const c = sh && sh.prices && Number(sh.prices[pid]); return c > 0 ? c : (Number(prod(pid) && prod(pid).sell) || 0); }
  function supBill(e) { if (!e || !e.q) return 0; let s = 0; for (const pid in e.q) s += (Number(e.q[pid]) || 0) * (Number(e.p && e.p[pid]) || 0); return r2(s); }
  function billOn(d, sid) { return supBill(getDay(d).sup[sid]); }
  function paidOn(d, sid) { return r2(getDay(d).pay.filter(p => p.s === sid).reduce((a, p) => a + p.a, 0)); }
  function balance(sid, upto) {
    const sh = shopById(sid); let b = Number(sh && sh.opening) || 0;
    for (const d in S.days) { if (upto && d > upto) continue; b += billOn(d, sid) - paidOn(d, sid); }
    return r2(b);
  }
  function suppliedQty(d, pid) { const D = getDay(d); let s = 0; for (const sid in D.sup) s += Number(D.sup[sid].q && D.sup[sid].q[pid]) || 0; return s; }
  function salesOn(d) { const D = getDay(d); let s = 0; for (const sid in D.sup) s += supBill(D.sup[sid]); return r2(s); }
  function collectedOn(d) { return r2(getDay(d).pay.reduce((a, p) => a + p.a, 0)); }
  function costOn(d) { const D = getDay(d); let s = 0; for (const pid in D.in) { const pr = D.inp && D.inp[pid] != null ? D.inp[pid] : (prod(pid) ? prod(pid).buy : 0); s += (Number(D.in[pid]) || 0) * (Number(pr) || 0); } return r2(s); }
  function hasEntries(sid) { for (const d in S.days) { const D = S.days[d]; if (D.sup[sid] || D.pay.some(p => p.s === sid)) return true; } return false; }

  let saveTimer = null, saving = Promise.resolve();
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 120); }
  function flush() {
    clearTimeout(saveTimer);
    if (!KEY || !S) return saving;
    const k = KEY, s = SALT, i = IT, data = S;
    saving = saving.then(() => encryptObj(k, s, i, data)).then(blob => { if (!safeSet(STORE, JSON.stringify(blob))) toast('Could not save — phone storage full?', true); })
      .catch(() => toast('Could not save', true));
    return saving;
  }

  /* ---------------- toast & modal ---------------- */
  let toastT;
  function toast(msg, bad) { const el = $('#toast'); el.textContent = msg; el.className = 'toast on' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => el.className = 'toast', 2200); }
  let modalOpen = false;
  function modal(html) {
    const m = $('#modal'); m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false;
    if (!modalOpen) { try { history.pushState({ m: 1 }, ''); } catch (e) { } }
    modalOpen = true; return m.firstChild;
  }
  function closeModal(fromPop) {
    const m = $('#modal'); if (m.hidden) return;
    m.hidden = true; m.innerHTML = '';
    if (modalOpen && !fromPop) { modalOpen = false; try { history.back(); } catch (e) { } }
    modalOpen = false;
  }
  window.addEventListener('popstate', () => { if (modalOpen) closeModal(true); });
  function ask(msg, okLabel, onOk, danger) {
    modal('<p>' + esc(msg) + '</p><div class="btns"><button class="btn ghost" data-act="close">' + esc(t('cancel')) + '</button><button class="btn ' + (danger ? 'danger' : '') + '" id="askOk">' + esc(okLabel) + '</button></div>');
    $('#askOk').onclick = () => { closeModal(); onOk(); };
  }

  /* ---------------- lock screen ---------------- */
  let pin = '', pinMode = 'unlock', pinFirst = '', pendingBlob = null, busy = false;
  function meta() { try { return JSON.parse(safeGet(META)) || { f: 0, u: 0 }; } catch (e) { return { f: 0, u: 0 }; } }
  function setMeta(m) { safeSet(META, JSON.stringify(m)); }

  function buildPad() {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
    $('#pad').innerHTML = keys.map(k => k === 'del' ? '<button type="button" data-k="del" aria-label="Delete">⌫</button>' : k === 'ok' ? '<button type="button" class="ok" data-k="ok">OK</button>' : '<button type="button" data-k="' + k + '">' + k + '</button>').join('');
    $('#pad').addEventListener('click', e => { const b = e.target.closest('button'); if (b) padKey(b.dataset.k); });
    document.addEventListener('keydown', e => {
      if ($('#lock').hidden) return;
      if (/^\d$/.test(e.key)) padKey(e.key); else if (e.key === 'Backspace') padKey('del'); else if (e.key === 'Enter') padKey('ok');
    });
  }
  function drawDots() { const n = Math.max(4, pin.length); let h = ''; for (let i = 0; i < Math.min(n, 8); i++) h += '<i class="' + (i < pin.length ? 'on' : '') + '"></i>'; $('#dots').innerHTML = h; }
  function lockText() {
    $('#lockTitle').textContent = t('appName');
    $('#lockMsg').textContent = pinMode === 'setup1' ? t('createPin') : pinMode === 'setup2' ? t('confirmPin') : pinMode === 'restore' ? t('restorePin') : t('enterPin');
    $('#lockRestore').textContent = t('restore');
    $('#lockRestore').hidden = !(pinMode === 'setup1' || pinMode === 'setup2');
    $('#lockLang').textContent = lang() === 'ta' ? 'English' : 'தமிழ்';
  }
  function showLock() {
    $('#app').hidden = true; $('#lock').hidden = false; closeModal();
    pin = ''; pinFirst = ''; pendingBlob = null;
    pinMode = safeGet(STORE) ? 'unlock' : 'setup1';
    $('#lockErr').textContent = ''; lockText(); drawDots(); checkLockout();
  }
  let lockoutTimer;
  function checkLockout() {
    clearInterval(lockoutTimer);
    const tick = () => { const m = meta(); const left = Math.ceil((m.u - Date.now()) / 1000); if (left > 0) { $('#lockErr').textContent = t('tooMany') + ' ' + left + ' ' + t('sec'); return true; } clearInterval(lockoutTimer); if ($('#lockErr').textContent.startsWith(t('tooMany'))) $('#lockErr').textContent = ''; return false; };
    if (tick()) lockoutTimer = setInterval(tick, 1000);
  }
  async function padKey(k) {
    if (busy) return;
    if (k === 'del') { pin = pin.slice(0, -1); drawDots(); return; }
    if (k !== 'ok') { if (pin.length < 8) { pin += k; drawDots(); $('#lockErr').textContent = ''; } return; }
    if (pin.length < 4) { $('#lockErr').textContent = t('pinShort'); return; }
    if (pinMode === 'setup1') { pinFirst = pin; pin = ''; pinMode = 'setup2'; lockText(); drawDots(); return; }
    if (pinMode === 'setup2') {
      if (pin !== pinFirst) { pin = ''; pinFirst = ''; pinMode = 'setup1'; lockText(); drawDots(); $('#lockErr').textContent = t('pinMismatch'); return; }
      busy = true; $('#lockErr').textContent = t('checking');
      try {
        SALT = crypto.getRandomValues(new Uint8Array(16)); IT = ITER; KEY = await deriveKey(pin, SALT, IT); S = freshData();
        await flush(); setMeta({ f: 0, u: 0 }); enterApp(true);
      } catch (e) { $('#lockErr').textContent = 'Error: ' + e.message; }
      busy = false; return;
    }
    const m = meta(); if (m.u > Date.now()) { checkLockout(); return; }
    busy = true; $('#lockErr').textContent = t('checking');
    const tryPin = pin; pin = ''; drawDots();
    try {
      const blob = pinMode === 'restore' ? pendingBlob : JSON.parse(safeGet(STORE));
      const r = await decryptBlob(blob, tryPin);
      const data = cleanData(r.data);
      KEY = r.key; SALT = r.salt; IT = r.iter; S = data;
      setMeta({ f: 0, u: 0 });
      if (pinMode === 'restore') { await flush(); toast(t('restored')); }
      enterApp(false);
    } catch (e) {
      if (pinMode === 'restore') { $('#lockErr').textContent = t('wrongBackupPin'); }
      else {
        const f = (m.f || 0) + 1; const u = f >= 5 ? Date.now() + Math.min(3600, 30 * Math.pow(2, f - 5)) * 1000 : 0;
        setMeta({ f, u }); $('#lockErr').textContent = t('wrongPin'); if (u) checkLockout();
      }
    }
    busy = false;
  }
  function lockNow() { flush(); KEY = null; S = null; SALT = null; $('#view').innerHTML = ''; showLock(); }

  function enterApp(first) {
    $('#lock').hidden = true; $('#app').hidden = false; lastAct = Date.now();
    curDate = today(); view = 'today'; render();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
    if (first) {
      modal('<h2>' + esc(t('welcomeT')) + '</h2><ol class="list-plain"><li>' + esc(t('welcome1')) + '</li><li>' + esc(t('welcome2')) + '</li><li><b>' + esc(t('welcome3')) + '</b></li></ol><button class="btn block" data-act="welcomeGo">' + esc(t('startNow')) + '</button>');
    }
  }

  /* ---------------- render ---------------- */
  const NAV = [['today', '🥛'], ['money', '💰'], ['shops', '🏪'], ['reports', '📊'], ['settings', '⚙️']];
  function render() {
    if (!S) return;
    document.documentElement.lang = lang() === 'ta' ? 'ta' : 'en';
    $('#appTitle').textContent = S.settings.biz || t('appName');
    $('#nav').innerHTML = NAV.map(([v, ic]) => '<button type="button" data-act="go" data-v="' + v + '" class="' + (view === v ? 'on' : '') + '"><span>' + ic + '</span>' + esc(t(v)) + '</button>').join('');
    const fn = { today: vToday, money: vMoney, shops: vShops, reports: vReports, settings: vSettings }[view];
    $('#view').innerHTML = fn();
  }
  function dateBar() {
    const isToday = curDate === today();
    return '<div class="datebar"><button type="button" data-act="dprev" aria-label="Previous day">‹</button><label class="d">' + esc(isToday ? t('today') + ' · ' : '') + esc(fmtDate(curDate, true)) +
      '<input type="date" data-act-change="pickDate" value="' + esc(curDate) + '" max="' + esc(today()) + '" aria-label="' + esc(t('date')) + '"></label><button type="button" data-act="dnext" aria-label="Next day"' + (isToday ? ' disabled' : '') + '>›</button></div>';
  }
  function backupNote() {
    const lb = Math.max(S.settings.lastBackup || 0, S.created || 0);
    const hasData = Object.keys(S.days).length > 0;
    return hasData && Date.now() - lb > 3 * 86400000 ? '<div class="note warn" data-act="go" data-v="settings">⚠️ ' + esc(t('backupDue')) + '</div>' : '';
  }

  function vToday() {
    const D = getDay(curDate), P = prods(), shops = activeShops();
    let h = dateBar() + backupNote();
    if (P.some(p => !p.sell || !p.buy)) h += '<div class="note warn" data-act="go" data-v="settings">' + esc(t('setPrices')) + '</div>';
    h += '<div class="card"><h2>📦 ' + esc(t('fromAavin')) + '</h2><div class="grid">';
    for (const p of P) h += '<label class="qty"><span>' + esc(p.name) + '</span><input type="number" inputmode="numeric" min="0" step="1" data-in="' + esc(p.id) + '" value="' + (D.in[p.id] || '') + '" placeholder="0"></label>';
    h += '</div><div class="sum"><span>' + esc(t('purchaseCost')) + '</span><b id="costV">' + rs(costOn(curDate)) + '</b></div></div>';

    h += '<div class="card"><div class="row"><h2>🚚 ' + esc(t('supply')) + '</h2>' + (shops.length ? '<button type="button" class="btn sm ghost" data-act="copyPrev">' + esc(t('copyYesterday')) + '</button>' : '') + '</div>';
    if (!shops.length) h += '<p class="muted">' + esc(t('noShops')) + '</p><button type="button" class="btn block" data-act="editShop">+ ' + esc(t('addShop')) + '</button>';
    for (const sh of shops) {
      const e = D.sup[sh.id];
      const qtxt = e ? P.filter(p => e.q[p.id]).map(p => shortName(p) + ' ' + e.q[p.id]).join(' · ') : '';
      h += '<button type="button" class="item" data-act="supply" data-id="' + esc(sh.id) + '"><div><b>' + esc(sh.name) + '</b><small>' + esc(qtxt || t('tapToEnter')) + '</small></div><div class="amt">' + (e ? rs(supBill(e)) : '—') + '</div></button>';
    }
    if (shops.length) h += '<div class="sum"><span>' + esc(t('supplyValue')) + '</span><b>' + rs(salesOn(curDate)) + '</b></div>';
    h += '</div>';

    h += '<div class="card"><h2>📋 ' + esc(t('remaining')) + '</h2><div class="rems" id="remain">' + remainHTML() + '</div></div>';
    return h;
  }
  function remainHTML() {
    const D = getDay(curDate);
    return prods().map(p => { const got = Number(D.in[p.id]) || 0; const r = got - suppliedQty(curDate, p.id); return '<div class="rem' + (r < 0 ? ' neg' : '') + '"><span>' + esc(shortName(p)) + '</span><b>' + r + '</b><small>' + esc(t('boughtShort')) + ' ' + got + '</small></div>'; }).join('');
  }
  function refreshTodayStats() { const c = $('#costV'); if (c) c.textContent = rs(costOn(curDate)); const r = $('#remain'); if (r) r.innerHTML = remainHTML(); }

  function supplyModal(sid) {
    const sh = shopById(sid); if (!sh) return;
    const e = getDay(curDate).sup[sid];
    let h = '<h2>' + esc(sh.name) + '</h2><p class="muted">' + esc(fmtDate(curDate, true)) + '</p><div class="grid">';
    for (const p of prods()) {
      const pr = e && e.q[p.id] ? e.p[p.id] : priceFor(sh, p.id);
      h += '<label class="qty"><span>' + esc(p.name) + ' · ' + rs(pr) + esc(t('perPacket')) + '</span><input type="number" inputmode="numeric" min="0" step="1" data-sq="' + esc(p.id) + '" data-pr="' + pr + '" value="' + (e && e.q[p.id] ? e.q[p.id] : '') + '" placeholder="0"></label>';
    }
    h += '</div><div class="sum"><span>' + esc(t('total')) + '</span><b id="supTot">' + rs(e ? supBill(e) : 0) + '</b></div>';
    h += '<div class="btns">' + (e ? '<button type="button" class="btn ghost" data-act="supClear" data-id="' + esc(sid) + '">' + esc(t('clear')) + '</button>' : '<button type="button" class="btn ghost" data-act="close">' + esc(t('cancel')) + '</button>') + '<button type="button" class="btn ok" data-act="supSave" data-id="' + esc(sid) + '">' + esc(t('save')) + '</button></div>';
    modal(h);
    const first = document.querySelector('[data-sq]'); if (first) setTimeout(() => first.focus(), 50);
  }
  function supTotal() { let s = 0; document.querySelectorAll('[data-sq]').forEach(i => s += int(i.value) * Number(i.dataset.pr)); const el = $('#supTot'); if (el) el.textContent = rs(s); }

  function vMoney() {
    const D = getDay(curDate);
    const prev = addDays(curDate, -1);
    const list = sortShops(S.shops).filter(sh => D.sup[sh.id] || D.pay.some(p => p.s === sh.id) || Math.abs(balance(sh.id, prev)) > 0.001 && sh.active !== false);
    let totalPend = 0; for (const sh of S.shops) totalPend += balance(sh.id, curDate);
    let h = dateBar();
    h += '<div class="kpis"><div class="kpi"><small>' + esc(t('todayBill')) + '</small><b>' + rs(salesOn(curDate)) + '</b></div><div class="kpi ok"><small>' + esc(t('collected')) + '</small><b>' + rs(collectedOn(curDate)) + '</b></div></div>';
    h += '<div class="kpis"><div class="kpi bad full"><small>' + esc(t('totalPending')) + '</small><b>' + rs(totalPend) + '</b></div></div>';
    h += '<h2>' + esc(t('shopsToCollect')) + '</h2>';
    if (!list.length) h += '<div class="card muted">' + esc(t('nobodyToCollect')) + '</div>';
    for (const sh of list) {
      const pb = balance(sh.id, prev), bill = billOn(curDate, sh.id), paid = paidOn(curDate, sh.id), due = r2(pb + bill - paid);
      h += '<div class="card"><div class="row"><b>' + esc(sh.name) + '</b><span class="amt ' + (due > 0 ? 'bad' : 'ok') + '">' + (due < 0 ? esc(t('advance')) + ' ' + rs(-due) : rs(due)) + '</span></div><div class="due">';
      h += '<span>' + esc(t('prevPending')) + '</span><b>' + (pb < 0 ? '−' + rs(-pb) : rs(pb)) + '</b><span>' + esc(t('todayBill')) + '</span><b>' + rs(bill) + '</b><span>' + esc(t('paidToday')) + '</span><b>' + rs(paid) + '</b>';
      h += '<span class="tot">' + esc(t('balance')) + '</span><b class="tot">' + (due < 0 ? '−' + rs(-due) : rs(due)) + '</b></div>';
      h += '<div class="payrow"><input type="number" inputmode="decimal" min="0" step="0.01" placeholder="' + esc(t('received')) + '" id="pay_' + esc(sh.id) + '" aria-label="' + esc(t('received')) + '">' +
        (due > 0 ? '<button type="button" class="btn ghost sm" data-act="payFull" data-id="' + esc(sh.id) + '" data-amt="' + due + '">' + esc(t('full')) + '</button>' : '') +
        '<button type="button" class="btn ok sm" data-act="paySave" data-id="' + esc(sh.id) + '">' + esc(t('save')) + '</button></div>';
      const pays = D.pay.filter(p => p.s === sh.id);
      if (pays.length) h += '<div class="chips">' + pays.map(p => '<span class="chip">' + rs(p.a) + ' · ' + esc(new Date(p.t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })) + '<button type="button" data-act="payDel" data-id="' + esc(p.id) + '" aria-label="' + esc(t('del')) + '">✕</button></span>').join('') + '</div>';
      h += '</div>';
    }
    return h;
  }

  function vShops() {
    const all = sortShops(S.shops).map(sh => ({ sh, b: balance(sh.id) })).sort((a, b) => (b.sh.active !== false) - (a.sh.active !== false) || b.b - a.b);
    let h = '<button type="button" class="btn block" data-act="editShop">+ ' + esc(t('addShop')) + '</button><div class="card mt12"><h2>' + esc(t('allShops')) + ' (' + S.shops.length + ')</h2>';
    if (!all.length) h += '<p class="muted">' + esc(t('noShops')) + '</p>';
    for (const { sh, b } of all) {
      h += '<button type="button" class="item" data-act="shopDetail" data-id="' + esc(sh.id) + '"><div><b>' + esc(sh.name) + (sh.active === false ? '<span class="tag">' + esc(t('inactive')) + '</span>' : '') + '</b><small>' + esc(sh.phone || '') + '</small></div><div class="amt ' + (b > 0 ? 'bad' : 'ok') + '">' + (b < 0 ? esc(t('advance')) + ' ' + rs(-b) : rs(b)) + '</div></button>';
    }
    return h + '</div>';
  }
  function shopDetail(sid) {
    const sh = shopById(sid); if (!sh) return;
    const b = balance(sid);
    let h = '<div class="row"><h2>' + esc(sh.name) + '</h2><button type="button" class="btn sm ghost" data-act="editShop" data-id="' + esc(sid) + '">' + esc(t('edit')) + '</button></div>';
    h += '<div class="kpis"><div class="kpi ' + (b > 0 ? 'bad' : 'ok') + ' full"><small>' + esc(t('pending')) + '</small><b>' + (b < 0 ? esc(t('advance')) + ' ' + rs(-b) : rs(b)) + '</b></div></div>';
    const digits = String(sh.phone || '').replace(/\D/g, '');
    if (b > 0 && digits.length >= 10) {
      const ph = digits.length === 10 ? '91' + digits : digits;
      const msg = t('remindMsg', { shop: sh.name, amt: rs(b), date: fmtDate(today(), true), biz: S.settings.biz || '' });
      h += '<a class="btn block ok" href="https://wa.me/' + esc(ph) + '?text=' + esc(encodeURIComponent(msg)) + '" target="_blank" rel="noopener noreferrer">💬 ' + esc(t('remind')) + '</a>';
    } else if (b > 0) h += '<p class="muted">' + esc(t('noPhone')) + '</p>';
    h += '<h2 class="mt16">' + esc(t('history')) + '</h2><table><tr><th>' + esc(t('date')) + '</th><th>' + esc(t('bill')) + '</th><th>' + esc(t('paid')) + '</th><th>' + esc(t('balance')) + '</th></tr>';
    const rows = [];
    for (let i = 0; i < 30; i++) { const d = addDays(today(), -i); const bill = billOn(d, sid), paid = paidOn(d, sid); if (bill || paid) rows.push('<tr><td>' + esc(fmtDate(d)) + '</td><td>' + rs(bill) + '</td><td>' + rs(paid) + '</td><td>' + rs(balance(sid, d)) + '</td></tr>'); }
    h += (rows.join('') || '<tr><td colspan="4" class="muted">' + esc(t('noData')) + '</td></tr>') + '</table>';
    h += '<button type="button" class="btn ghost block" data-act="close">' + esc(t('ok')) + '</button>';
    modal(h);
  }
  function editShop(sid) {
    const sh = sid ? shopById(sid) : null;
    let h = '<h2>' + esc(sh ? t('edit') : t('addShop')) + '</h2>';
    h += '<label class="field"><span>' + esc(t('shopName')) + '</span><input type="text" id="fName" maxlength="60" autocomplete="off" value="' + esc(sh ? sh.name : '') + '"></label>';
    h += '<label class="field"><span>' + esc(t('phone')) + '</span><input type="tel" id="fPhone" maxlength="15" autocomplete="off" value="' + esc(sh ? sh.phone || '' : '') + '"></label>';
    h += '<label class="field"><span>' + esc(t('opening')) + '</span><input type="number" inputmode="decimal" min="0" step="0.01" id="fOpen" value="' + esc(sh && sh.opening ? sh.opening : '') + '" placeholder="0"></label>';
    h += '<p class="muted small">' + esc(t('customPrice')) + '</p><div class="grid">';
    for (const p of prods()) h += '<label class="qty"><span>' + esc(shortName(p)) + ' (' + rs(p.sell) + ')</span><input type="number" inputmode="decimal" min="0" step="0.01" data-cp="' + esc(p.id) + '" value="' + esc(sh && sh.prices && sh.prices[p.id] ? sh.prices[p.id] : '') + '"></label>';
    h += '</div>';
    if (sh) h += '<label class="field check"><input type="checkbox" id="fActive" ' + (sh.active !== false ? 'checked' : '') + '><span>' + esc(t('active')) + '</span></label>';
    h += '<div class="btns">' + (sh ? '<button type="button" class="btn danger" data-act="delShop" data-id="' + esc(sid) + '">' + esc(t('del')) + '</button>' : '<button type="button" class="btn ghost" data-act="close">' + esc(t('cancel')) + '</button>') + '<button type="button" class="btn ok" data-act="saveShop" data-id="' + esc(sid || '') + '">' + esc(t('save')) + '</button></div>';
    modal(h);
  }

  function rangeDates() {
    const td = today(); const out = [];
    if (repRange === '7' || repRange === '30') { const n = Number(repRange); for (let i = n - 1; i >= 0; i--) out.push(addDays(td, -i)); }
    else {
      const now = parseD(td); let y = now.getFullYear(), m = now.getMonth(); if (repRange === 'lm') { m--; if (m < 0) { m = 11; y--; } }
      const last = repRange === 'lm' ? new Date(y, m + 1, 0).getDate() : now.getDate();
      for (let d = 1; d <= last; d++) out.push(ymd(new Date(y, m, d)));
    }
    return out;
  }
  function vReports() {
    const dates = rangeDates();
    let sales = 0, coll = 0, cost = 0; for (const d of dates) { sales += salesOn(d); coll += collectedOn(d); cost += costOn(d); }
    let pend = 0; for (const sh of S.shops) pend += balance(sh.id);
    const profit = sales - cost;
    let h = '<div class="seg">' + [['7', 'days7'], ['30', 'days30'], ['tm', 'thisMonth'], ['lm', 'lastMonth']].map(([k, l]) => '<button type="button" data-act="range" data-v="' + k + '" class="' + (repRange === k ? 'on' : '') + '">' + esc(t(l)) + '</button>').join('') + '</div>';
    h += '<p class="muted rangeTxt">' + esc(fmtDate(dates[0], true)) + ' – ' + esc(fmtDate(dates[dates.length - 1], true)) + '</p>';
    h += '<div class="kpis"><div class="kpi"><small>' + esc(t('sales')) + '</small><b>' + rs(sales) + '</b></div><div class="kpi ok"><small>' + esc(t('collected')) + '</small><b>' + rs(coll) + '</b></div>' +
      '<div class="kpi"><small>' + esc(t('aavinCost')) + '</small><b>' + rs(cost) + '</b></div><div class="kpi ' + (profit >= 0 ? 'ok' : 'bad') + '"><small>' + esc(t('profit')) + '</small><b>' + (profit < 0 ? '−' + rs(-profit) : rs(profit)) + '</b></div>' +
      '<div class="kpi bad full"><small>' + esc(t('totalPending')) + '</small><b>' + rs(pend) + '</b></div></div>';
    h += '<p class="muted pnote">' + esc(t('profitNote')) + '</p>';
    h += '<div class="card"><h2>' + esc(t('salesVsCollected')) + '</h2>' + chartSVG(dates) + '<div class="legend"><span><i class="l1"></i>' + esc(t('sales')) + '</span><span><i class="l2"></i>' + esc(t('collected')) + '</span></div></div>';
    // by product
    h += '<div class="card"><h2>' + esc(t('byProduct')) + '</h2><table><tr><th></th><th>' + esc(t('bought')) + '</th><th>' + esc(t('supplied')) + '</th><th>' + esc(t('left')) + '</th><th>' + esc(t('sales')) + '</th></tr>';
    for (const p of S.settings.products) {
      let got = 0, sup = 0, val = 0;
      for (const d of dates) { const D = getDay(d); got += Number(D.in[p.id]) || 0; for (const sid in D.sup) { const e = D.sup[sid]; const q = Number(e.q[p.id]) || 0; sup += q; val += q * (Number(e.p[p.id]) || 0); } }
      if (!got && !sup && p.active === false) continue;
      h += '<tr><td>' + esc(shortName(p)) + '</td><td>' + got + '</td><td>' + sup + '</td><td>' + (got - sup) + '</td><td>' + rs(val) + '</td></tr>';
    }
    h += '</table></div>';
    // by shop
    const rows = S.shops.map(sh => { let bill = 0, paid = 0; for (const d of dates) { bill += billOn(d, sh.id); paid += paidOn(d, sh.id); } return { sh, bill, paid, pend: balance(sh.id) }; }).filter(r => r.bill || r.paid || r.pend).sort((a, b) => b.bill - a.bill);
    h += '<div class="card"><h2>' + esc(t('byShop')) + '</h2><table><tr><th></th><th>' + esc(t('bill')) + '</th><th>' + esc(t('paid')) + '</th><th>' + esc(t('pending')) + '</th></tr>';
    h += rows.length ? rows.map(r => '<tr><td>' + esc(r.sh.name) + '</td><td>' + rs(r.bill) + '</td><td>' + rs(r.paid) + '</td><td>' + rs(r.pend) + '</td></tr>').join('') : '<tr><td colspan="4" class="muted">' + esc(t('noData')) + '</td></tr>';
    return h + '</table></div>';
  }
  function chartSVG(dates) {
    const data = dates.map(d => ({ d, s: salesOn(d), c: collectedOn(d) }));
    const max = Math.max(1, ...data.map(x => Math.max(x.s, x.c)));
    const W = 320, H = 160, top = 8, bot = 18, ph = H - top - bot, n = data.length, bw = W / n;
    let g = '';
    for (let k = 1; k <= 3; k++) { const y = top + ph - ph * k / 3; g += '<line class="gl" x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '"/><text x="2" y="' + (y - 2) + '">' + esc(rs(max * k / 3).replace(/\.\d+$/, '')) + '</text>'; }
    const step = Math.ceil(n / 8);
    data.forEach((x, i) => {
      const w = Math.max(1, bw * 0.36), x0 = i * bw + bw * 0.14;
      const h1 = ph * x.s / max, h2 = ph * x.c / max;
      g += '<rect class="b1" x="' + x0.toFixed(1) + '" y="' + (top + ph - h1).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h1.toFixed(1) + '"><title>' + esc(fmtDate(x.d) + ': ' + rs(x.s)) + '</title></rect>';
      g += '<rect class="b2" x="' + (x0 + w).toFixed(1) + '" y="' + (top + ph - h2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h2.toFixed(1) + '"><title>' + esc(fmtDate(x.d) + ': ' + rs(x.c)) + '</title></rect>';
      if (i % step === 0) g += '<text x="' + (i * bw + bw / 2).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(parseD(x.d).getDate()) + '</text>';
    });
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('salesVsCollected')) + '">' + g + '</svg>';
  }

  function vSettings() {
    const st = S.settings;
    let h = backupNote();
    h += '<div class="card"><label class="field"><span>' + esc(t('language')) + '</span><select data-act-change="lang"><option value="en"' + (st.lang === 'en' ? ' selected' : '') + '>English</option><option value="ta"' + (st.lang === 'ta' ? ' selected' : '') + '>தமிழ்</option></select></label>';
    h += '<label class="field m0"><span>' + esc(t('business')) + '</span><input type="text" maxlength="60" data-act-change="biz" value="' + esc(st.biz || '') + '"></label></div>';
    h += '<div class="card"><h2>' + esc(t('products')) + '</h2>';
    for (const p of st.products) h += '<button type="button" class="item" data-act="editProd" data-id="' + esc(p.id) + '"><div><b>' + esc(p.name) + (p.active === false ? '<span class="tag">' + esc(t('inactive')) + '</span>' : '') + '</b><small>Aavin ' + rs(p.buy) + ' → ' + rs(p.sell) + '</small></div><div class="amt">✏️</div></button>';
    h += '<button type="button" class="btn ghost block" data-act="editProd">+ ' + esc(t('addProduct')) + '</button></div>';
    h += '<div class="card"><h2>💾 ' + esc(t('backup')) + '</h2><p class="muted mt0">' + esc(t('lastBackup')) + ': ' + esc(st.lastBackup ? new Date(st.lastBackup).toLocaleString('en-IN') : t('never')) + '</p>';
    if (canShareFiles()) h += '<button type="button" class="btn block" data-act="shareBackup">📤 ' + esc(t('shareBackup')) + '</button>';
    h += '<button type="button" class="btn block ' + (canShareFiles() ? 'ghost' : '') + '" data-act="dlBackup">⬇️ ' + esc(t('downloadBackup')) + '</button>';
    h += '<button type="button" class="btn ghost block" data-act="restore">♻️ ' + esc(t('restore')) + '</button></div>';
    h += '<div class="card"><h2>🔐 ' + esc(t('security')) + '</h2><label class="field"><span>' + esc(t('autoLock')) + '</span><select data-act-change="autoLock">' + [1, 3, 5, 10].map(m => '<option value="' + m + '"' + (st.autoLock === m ? ' selected' : '') + '>' + m + ' ' + esc(t('minutes')) + '</option>').join('') + '</select></label>';
    h += '<button type="button" class="btn ghost block" data-act="changePin">' + esc(t('changePin')) + '</button><button type="button" class="btn ghost block" data-act="lock">🔒 ' + esc(t('lockNow')) + '</button>';
    h += '<p class="secT"><b>' + esc(t('secTitle')) + '</b></p><ul class="list-plain"><li>' + esc(t('sec1')) + '</li><li>' + esc(t('sec2')) + '</li><li>' + esc(t('sec3')) + '</li><li>' + esc(t('sec4')) + '</li></ul></div>';
    h += '<button type="button" class="btn danger block" data-act="erase">' + esc(t('erase')) + '</button>';
    return h;
  }
  function editProd(pid) {
    const p = pid ? prod(pid) : null;
    let h = '<h2>' + esc(p ? p.name : t('addProduct')) + '</h2>';
    h += '<label class="field"><span>' + esc(t('name')) + '</span><input type="text" id="pName" maxlength="40" value="' + esc(p ? p.name : '') + '"></label>';
    h += '<label class="field"><span>' + esc(t('shortName')) + '</span><input type="text" id="pShort" maxlength="12" value="' + esc(p ? p.short || '' : '') + '"></label>';
    h += '<div class="grid"><label class="qty"><span>' + esc(t('buyPrice')) + '</span><input type="number" inputmode="decimal" min="0" step="0.01" id="pBuy" value="' + esc(p && p.buy ? p.buy : '') + '"></label>';
    h += '<label class="qty"><span>' + esc(t('sellPrice')) + '</span><input type="number" inputmode="decimal" min="0" step="0.01" id="pSell" value="' + esc(p && p.sell ? p.sell : '') + '"></label></div>';
    if (p) h += '<label class="field check"><input type="checkbox" id="pActive" ' + (p.active !== false ? 'checked' : '') + '><span>' + esc(t('inUse')) + '</span></label>';
    h += '<div class="btns"><button type="button" class="btn ghost" data-act="close">' + esc(t('cancel')) + '</button><button type="button" class="btn ok" data-act="saveProd" data-id="' + esc(pid || '') + '">' + esc(t('save')) + '</button></div>';
    modal(h);
  }

  /* ---------------- backup ---------------- */
  function canShareFiles() { try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.json', { type: 'application/json' })] })); } catch (e) { return false; } }
  async function backupFile() {
    const blob = await encryptObj(KEY, SALT, IT, S);
    const name = 'milk-ledger-backup-' + today() + '.json';
    return { name, text: JSON.stringify(blob) };
  }
  function markBackup() { S.settings.lastBackup = Date.now(); save(); render(); }
  async function dlBackup() {
    const { name, text } = await backupFile();
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      markBackup(); toast(t('backupSaved'));
    } catch (e) { copyFallback(text); }
  }
  async function shareBackup() {
    const { name, text } = await backupFile();
    try { await navigator.share({ files: [new File([text], name, { type: 'application/json' })], title: name }); markBackup(); }
    catch (e) { if (e && e.name !== 'AbortError') dlBackup(); }
  }
  function copyFallback(text) {
    modal('<h2>' + esc(t('backup')) + '</h2><textarea readonly id="bkTxt" class="bkTxt">' + esc(text) + '</textarea><div class="btns"><button type="button" class="btn ghost" data-act="close">' + esc(t('cancel')) + '</button><button type="button" class="btn" id="cpBk">' + esc(t('copyText')) + '</button></div>');
    $('#cpBk').onclick = async () => { try { await navigator.clipboard.writeText(text); toast(t('copiedText')); markBackup(); } catch (e) { $('#bkTxt').select(); } };
  }
  let restoreFromLock = false;
  function pickRestore(fromLock) { restoreFromLock = fromLock; const f = $('#fileIn'); f.value = ''; f.click(); }
  $('#fileIn').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast(t('badFile'), true); return; }
    let blob; try { blob = JSON.parse(await file.text()); } catch (er) { blob = null; }
    if (!validBlob(blob)) { toast(t('badFile'), true); if (restoreFromLock) $('#lockErr').textContent = t('badFile'); return; }
    const go = () => { flush(); KEY = null; S = null; $('#app').hidden = true; $('#lock').hidden = false; closeModal(); pin = ''; pendingBlob = blob; pinMode = 'restore'; $('#lockErr').textContent = ''; lockText(); drawDots(); };
    if (!$('#lock').hidden) go(); else ask(t('restoreQ'), t('yes'), go, true);
  });

  /* ---------------- actions ---------------- */
  const acts = {
    close: () => closeModal(),
    lock: () => lockNow(),
    go: b => { view = b.dataset.v; closeModal(); render(); window.scrollTo(0, 0); },
    welcomeGo: () => { closeModal(); view = 'settings'; render(); },
    dprev: () => { curDate = addDays(curDate, -1); render(); },
    dnext: () => { if (curDate < today()) { curDate = addDays(curDate, 1); render(); } },
    supply: b => supplyModal(b.dataset.id),
    supSave: b => {
      const sid = b.dataset.id, sh = shopById(sid), q = {}, p = {}; let any = false;
      document.querySelectorAll('[data-sq]').forEach(i => { const n = int(i.value); if (n) { q[i.dataset.sq] = n; p[i.dataset.sq] = Number(i.dataset.pr) || priceFor(sh, i.dataset.sq); any = true; } });
      const D = day(curDate); if (any) D.sup[sid] = { q, p }; else delete D.sup[sid];
      save(); closeModal(); render(); toast(t('saved'));
    },
    supClear: b => { delete day(curDate).sup[b.dataset.id]; save(); closeModal(); render(); toast(t('deleted')); },
    copyPrev: () => {
      const P = getDay(addDays(curDate, -1)), D = day(curDate); let n = 0;
      for (const sid in P.sup) { const sh = shopById(sid); if (!sh || sh.active === false || D.sup[sid]) continue; const q = {}, p = {}; for (const pid in P.sup[sid].q) { if (!prod(pid) || prod(pid).active === false) continue; q[pid] = P.sup[sid].q[pid]; p[pid] = priceFor(sh, pid); } if (Object.keys(q).length) { D.sup[sid] = { q, p }; n++; } }
      if (n) { save(); render(); toast(t('copied', { n })); } else toast(t('nothingToCopy'));
    },
    payFull: b => { const i = document.getElementById('pay_' + b.dataset.id); if (i) { i.value = b.dataset.amt; i.focus(); } },
    paySave: b => {
      const sid = b.dataset.id, i = document.getElementById('pay_' + sid), a = num(i && i.value);
      if (!a) { toast(t('amountQ'), true); if (i) i.focus(); return; }
      const now = new Date(); const dt = curDate === today() ? now.getTime() : parseD(curDate).getTime() + 18 * 3600000;
      day(curDate).pay.push({ id: uid(), s: sid, a, t: dt }); save(); render(); toast(t('savedPay') + ' · ' + rs(a));
    },
    payDel: b => { const D = day(curDate); const p = D.pay.find(x => x.id === b.dataset.id); if (!p) return; ask(t('del') + ' ' + rs(p.a) + '?', t('del'), () => { D.pay = D.pay.filter(x => x.id !== p.id); save(); render(); toast(t('deleted')); }, true); },
    shopDetail: b => shopDetail(b.dataset.id),
    editShop: b => editShop(b.dataset.id),
    saveShop: b => {
      const name = $('#fName').value.trim(); if (!name) { $('#fName').focus(); return; }
      const sid = b.dataset.id; let sh = sid ? shopById(sid) : null;
      if (!sh) { sh = { id: uid(), active: true }; S.shops.push(sh); }
      sh.name = name; sh.phone = $('#fPhone').value.replace(/[^\d+ ]/g, '').trim(); sh.opening = num($('#fOpen').value);
      sh.prices = {}; document.querySelectorAll('[data-cp]').forEach(i => { const v = num(i.value); if (v) sh.prices[i.dataset.cp] = v; });
      const act = $('#fActive'); if (act) sh.active = act.checked;
      save(); closeModal(); render(); toast(t('saved'));
    },
    delShop: b => { const sid = b.dataset.id; if (hasEntries(sid)) { toast(t('cantDelete'), true); return; } ask(t('delShopQ'), t('del'), () => { S.shops = S.shops.filter(s => s.id !== sid); save(); render(); toast(t('deleted')); }, true); },
    range: b => { repRange = b.dataset.v; render(); },
    editProd: b => editProd(b.dataset.id),
    saveProd: b => {
      const name = $('#pName').value.trim(); if (!name) { $('#pName').focus(); return; }
      let p = b.dataset.id ? prod(b.dataset.id) : null;
      if (!p) { p = { id: 'p' + uid(), active: true }; S.settings.products.push(p); }
      p.name = name; p.short = $('#pShort').value.trim() || name.slice(0, 12); p.buy = num($('#pBuy').value); p.sell = num($('#pSell').value);
      const a = $('#pActive'); if (a) p.active = a.checked;
      save(); closeModal(); render(); toast(t('saved'));
    },
    dlBackup: () => dlBackup(),
    shareBackup: () => shareBackup(),
    restore: () => pickRestore(false),
    changePin: () => {
      modal('<h2>' + esc(t('changePin')) + '</h2>' + ['cp0:currentPin', 'cp1:newPin', 'cp2:newPin2'].map(x => { const [id, l] = x.split(':'); return '<label class="field"><span>' + esc(t(l)) + '</span><input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" id="' + id + '"></label>'; }).join('') +
        '<p class="err errIn" id="cpErr"></p><div class="btns"><button type="button" class="btn ghost" data-act="close">' + esc(t('cancel')) + '</button><button type="button" class="btn ok" data-act="savePin">' + esc(t('save')) + '</button></div>');
    },
    savePin: async () => {
      const c = $('#cp0').value, n1 = $('#cp1').value, n2 = $('#cp2').value, err = $('#cpErr');
      if (!/^\d{4,8}$/.test(n1)) { err.textContent = t('pinShort'); return; }
      if (n1 !== n2) { err.textContent = t('pinMismatch'); return; }
      err.textContent = t('checking');
      try { await flush(); await decryptBlob(JSON.parse(safeGet(STORE)), c); } catch (e) { err.textContent = t('wrongPin'); return; }
      SALT = crypto.getRandomValues(new Uint8Array(16)); IT = ITER; KEY = await deriveKey(n1, SALT, IT); await flush();
      closeModal(); toast(t('pinChanged'));
    },
    erase: () => {
      modal('<p>' + esc(t('eraseQ')) + '</p><label class="field"><input type="text" id="erTxt" autocomplete="off" autocapitalize="characters"></label><div class="btns"><button type="button" class="btn ghost" data-act="close">' + esc(t('cancel')) + '</button><button type="button" class="btn danger" data-act="eraseGo">' + esc(t('erase')) + '</button></div>');
    },
    eraseGo: () => {
      if ($('#erTxt').value.trim().toUpperCase() !== 'DELETE') { $('#erTxt').focus(); return; }
      clearTimeout(saveTimer); KEY = null; S = null; try { localStorage.removeItem(STORE); localStorage.removeItem(META); } catch (e) { }
      closeModal(); showLock();
    }
  };
  const changeActs = {
    pickDate: el => { if (DATE_RE.test(el.value) && el.value <= today()) { curDate = el.value; render(); } },
    lang: el => { S.settings.lang = el.value === 'ta' ? 'ta' : 'en'; safeSet(LANGK, S.settings.lang); save(); render(); },
    biz: el => { S.settings.biz = el.value.trim().slice(0, 60); save(); render(); },
    autoLock: el => { S.settings.autoLock = Number(el.value); save(); toast(t('saved')); }
  };

  document.addEventListener('click', e => {
    lastAct = Date.now();
    if (e.target.id === 'modal') { closeModal(); return; }
    const b = e.target.closest('[data-act]'); if (!b || !S && b.dataset.act !== 'close') return;
    const f = acts[b.dataset.act]; if (f) { e.preventDefault(); f(b, e); }
  });
  document.addEventListener('change', e => { const el = e.target.closest('[data-act-change]'); if (el && S) { const f = changeActs[el.dataset.actChange]; if (f) f(el); } });
  document.addEventListener('input', e => {
    lastAct = Date.now(); if (!S) return;
    const el = e.target;
    if (el.dataset.in) { const D = day(curDate); const n = int(el.value); if (n) { D.in[el.dataset.in] = n; D.inp[el.dataset.in] = prod(el.dataset.in) ? prod(el.dataset.in).buy : 0; } else { delete D.in[el.dataset.in]; delete D.inp[el.dataset.in]; } save(); refreshTodayStats(); }
    else if (el.dataset.sq) supTotal();
  });
  ['keydown', 'touchstart', 'scroll'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));

  // Auto-lock
  setInterval(() => { if (S && Date.now() - lastAct > S.settings.autoLock * 60000) lockNow(); }, 10000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); flush(); }
    else if (S && hiddenAt && Date.now() - hiddenAt > S.settings.autoLock * 60000) lockNow();
  });
  window.addEventListener('pagehide', () => flush());

  // Lock-screen buttons
  $('#lockRestore').addEventListener('click', () => pickRestore(true));
  $('#lockLang').addEventListener('click', () => { safeSet(LANGK, lang() === 'ta' ? 'en' : 'ta'); lockText(); });

  /* ---------------- boot ---------------- */
  if (!window.crypto || !crypto.subtle) {
    document.body.innerHTML = '<p class="nocrypto">This app must be opened over HTTPS (or as a local file in Chrome) so that encryption works.</p>';
    return;
  }
  buildPad(); showLock();
  if ('serviceWorker' in navigator && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').catch(() => { }); }
})();
