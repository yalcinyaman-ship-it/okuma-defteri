# Firebase'e bağlama

Site şu an verileri tarayıcıda tutuyor. Firebase'e geçince her cihazdan aynı kütüphaneyi görürsün.

1. console.firebase.google.com → **Proje ekle**.
2. **Build → Authentication → Sign-in method → Google**'ı aç.
3. **Build → Firestore Database → Create database** (production mode).
4. Firestore **Rules** sekmesine yapıştır (verileri yalnızca sen görürsün):

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

5. **Project settings → Your apps → Web (</>)** → uygulama ekle, çıkan `firebaseConfig` nesnesini `store.js` içindeki `firebaseConfig = null` yerine koy.
6. **Authentication → Settings → Authorized domains**'e siteyi yayınladığın alan adını ekle (ör. `kullaniciadi.github.io`).

## GitHub Pages
Tüm dosyaları bir repoya yükle → **Settings → Pages → Branch: main / root**. Giriş sayfası `Okuma Defteri.dc.html`; istersen adını `index.html` yap.

Veri yapısı: `users/{uid}/texts/{id}`, `users/{uid}/quotes/{id}`, `users/{uid}/meta/prefs`.
Tarayıcıdaki mevcut verin Firebase'e otomatik taşınmaz; ilk girişte örnek metinlerle başlar.
