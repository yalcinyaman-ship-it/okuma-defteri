// Veri katmanı. firebaseConfig boşken tarayıcıda (localStorage) çalışır.
// Firebase'e geçmek için: firebase-kurulum.md
export const firebaseConfig = {
  apiKey: "AIzaSyAwMQV7olP8_ApaE7fYOdin-iqSGLQzPIU",
  authDomain: "okuma-defteri.firebaseapp.com",
  projectId: "okuma-defteri",
  storageBucket: "okuma-defteri.firebasestorage.app",
  messagingSenderId: "269077818285",
  appId: "1:269077818285:web:6a3f0d5ba9b4f624924f24"
};
/* örnek:
export const firebaseConfig = {
  apiKey: "...", authDomain: "...firebaseapp.com", projectId: "...",
  storageBucket: "...", messagingSenderId: "...", appId: "..."
};
*/

// Firebase'de Authentication → Users → Add user ile açtığın e-posta (şifre: giriş şifren)
export const OWNER_EMAIL = 'yaman@okuma-defteri.app';
// Firebase bağlanana kadar kullanılan şifrenin özeti (yaman1905)
const LOCAL_HASH = '8ec3c975fcafcb06987a1886a254e8ab05eeef297d0cb5130353d2692359b018';
const UNLOCK = 'okuma-defteri-acik';

const KEY = 'okuma-defteri-v1';
const V = '10.12.2';
const BASE = `https://www.gstatic.com/firebasejs/${V}/`;
let mode = 'local', fb = null, uid = null;

const userInfo = u => u ? { name: u.displayName, email: u.email } : null;

export async function init() {
  if (!firebaseConfig) return { mode: 'local', user: localStorage.getItem(UNLOCK) === LOCAL_HASH ? { name: 'Yaman' } : null };
  const [app, auth, fs] = await Promise.all([
    import(BASE + 'firebase-app.js'), import(BASE + 'firebase-auth.js'), import(BASE + 'firebase-firestore.js')
  ]);
  const a = app.initializeApp(firebaseConfig);
  fb = { auth, fs, a: auth.getAuth(a), db: fs.getFirestore(a) };
  mode = 'firebase';
  const user = await new Promise(res => { const un = auth.onAuthStateChanged(fb.a, u => { un(); res(u); }); });
  uid = user ? user.uid : null;
  return { mode, user: userInfo(user) };
}

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('okuma-defteri:' + s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Doğruysa kullanıcıyı döner, yanlışsa hata fırlatır
export async function signIn(pw) {
  if (mode === 'local') {
    const h = await sha(pw);
    if (h !== LOCAL_HASH) throw new Error('wrong');
    localStorage.setItem(UNLOCK, h);
    return { name: 'Yaman' };
  }
  const r = await fb.auth.signInWithEmailAndPassword(fb.a, OWNER_EMAIL, pw);
  uid = r.user.uid;
  return userInfo(r.user);
}
export async function signOut() {
  localStorage.removeItem(UNLOCK);
  if (fb) await fb.auth.signOut(fb.a);
  uid = null;
}

function readLocal() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
function writeLocal(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

export async function load() {
  if (mode === 'local') {
    const d = readLocal();
    if (!d) return null;
    return { texts: Object.values(d.texts || {}), quotes: Object.values(d.quotes || {}), prefs: d.prefs || null };
  }
  const { fs, db } = fb;
  const col = n => fs.collection(db, 'users', uid, n);
  const [t, q, p] = await Promise.all([
    fs.getDocs(col('texts')), fs.getDocs(col('quotes')), fs.getDoc(fs.doc(db, 'users', uid, 'meta', 'prefs'))
  ]);
  const texts = t.docs.map(d => d.data()), quotes = q.docs.map(d => d.data());
  if (!texts.length && !quotes.length && !p.exists()) return null;
  return { texts, quotes, prefs: p.exists() ? p.data() : null };
}

export async function put(colName, obj) {
  if (mode === 'local') {
    const d = readLocal() || { texts: {}, quotes: {}, prefs: null };
    if (colName === 'prefs') d.prefs = obj; else { d[colName] = d[colName] || {}; d[colName][obj.id] = obj; }
    writeLocal(d);
    return;
  }
  const { fs, db } = fb;
  if (colName === 'prefs') return fs.setDoc(fs.doc(db, 'users', uid, 'meta', 'prefs'), obj);
  return fs.setDoc(fs.doc(db, 'users', uid, colName, obj.id), obj);
}

export async function del(colName, id) {
  if (mode === 'local') {
    const d = readLocal();
    if (d && d[colName]) { delete d[colName][id]; writeLocal(d); }
    return;
  }
  return fb.fs.deleteDoc(fb.fs.doc(fb.db, 'users', uid, colName, id));
}
