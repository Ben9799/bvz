// Wolf Lasermark — anonyme Webstatistik (kein Cookie, keine IP, keine PII).
// Schreibt pro Seitenaufruf ein Event in Firestore (collection 'analytics').
// Der Server (WL_projekt sync-analytics.js) liest & loescht die Events,
// aggregiert sie lokal und zeigt sie im Dashboard. DSGVO-konform.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLSp0en7wDD_71PF1n3qYXPF0YNTEWmIc",
  authDomain: "auftrage-edc6d.firebaseapp.com",
  projectId: "auftrage-edc6d",
  storageBucket: "auftrage-edc6d.firebasestorage.app",
  messagingSenderId: "675308449934",
  appId: "1:675308449934:web:b4c1fc2e190647ace419df"
};

try {
  // Bots / Headless-Browser nicht zaehlen.
  if (navigator.webdriver) throw 0;

  const app = getApps().find(a => a.name === "wl-analytics") || initializeApp(firebaseConfig, "wl-analytics");
  const db = getFirestore(app);

  // Anonyme Session-ID: nur fuer die Tab-Sitzung, kein persistentes Cookie.
  let sid = sessionStorage.getItem("wl_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("wl_sid", sid);
  }

  const w = window.innerWidth || screen.width || 0;
  const device = w < 768 ? "mobile" : (w < 1024 ? "tablet" : "desktop");

  let ref = "";
  try {
    if (document.referrer) {
      const h = new URL(document.referrer).hostname;
      if (h && h !== location.hostname) ref = h;
    }
  } catch (_) { /* ignore */ }

  addDoc(collection(db, "analytics"), {
    path: (location.pathname || "/").slice(0, 256),
    ref: ref.slice(0, 128),
    device,
    lang: (navigator.language || "").slice(0, 16),
    sid,
    ts: serverTimestamp()
  }).catch(() => { /* still & silent */ });
} catch (_) { /* analytics darf die Seite nie stoeren */ }
