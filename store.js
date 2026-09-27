// Veri katmanı. firebaseConfig boşken tarayıcıda (localStorage) çalışır.
// Firebase'e geçmek için: firebase-kurulum.md
export const firebaseConfig = null;
/* örnek:
export const firebaseConfig = {
  apiKey: "...", authDomain: "...firebaseapp.com", projectId: "...",
  storageBucket: "...", messagingSenderId: "...", appId: "..."
};
*/

const KEY = 'okuma-defteri-v1';
const V = '10.12.2';
const BASE = `https://www.gstatic.com/firebasejs/${V}/`;
let mode = 'local', fb = null, uid = null;

const userInfo = u => u ? { name: u.displayName, email: u.email } : null;

export async function init() {
  if (!firebaseConfig) return { mode: 'local', user: null };
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

export async function signIn() {
  const r = await fb.auth.signInWithPopup(fb.a, new fb.auth.GoogleAuthProvider());
  uid = r.user.uid;
  return userInfo(r.user);
}
export async function signOut() { if (fb) await fb.auth.signOut(fb.a); uid = null; }

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
