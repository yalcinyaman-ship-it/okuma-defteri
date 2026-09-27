# Firebase'e bağlama

Site şu an verileri tarayıcıda tutuyor, açılış şifresi `store.js` içinde. Firebase'e geçince şifreyi Firebase kontrol eder ve her cihazdan aynı kütüphaneyi görürsün.

1. console.firebase.google.com → **Proje ekle** → `okuma-defteri`.
2. **Build → Authentication → Get started → Email/Password** → Enable → Save.
3. **Authentication → Users → Add user**
   - Email: `yaman@okuma-defteri.app` (store.js'deki OWNER_EMAIL ile aynı)
   - Password: giriş şifren
4. **Authentication → Settings → Authorized domains → Add domain** → `yalcinyaman-ship-it.github.io`
5. **Build → Firestore Database → Create database** (production mode, bölge eur3).
6. Firestore **Rules** sekmesine yapıştır → Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

7. **Project settings → Your apps → Web (</>)** → uygulama ekle → çıkan `firebaseConfig` nesnesini `store.js` içindeki `firebaseConfig = null` yerine koy.

Veri yapısı: `users/{uid}/texts/{id}`, `users/{uid}/quotes/{id}`, `users/{uid}/meta/prefs`.
Açılış fotoğrafı: repoya `ali-sami-yen.jpg` adıyla yükle.
