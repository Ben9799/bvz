/* Wolf Lasermark — Kasse fuer den Privat-Shop (privat-shop-ducett.html).
   Uebernommen aus dem bewaehrten Checkout von privat-gravur.html:
   Firestore "privat-bestellungen" (Auto-Rechnung liest das), Storage-Upload der Gravurdatei,
   Gutscheine, Formspree-Benachrichtigung, PayPal + Karte (LIVE-App "WL Gravur Shop Live").

   Aufruf:  WLCheckout.open(order)
     order = { key, produkt, form, variante, material, schmuck:bool, unit:Number,
               gravurText, details:{Label:Wert}, kettenlaenge, designDaten:Object,
               svg:()=>Promise<string>|string, png:()=>Promise<dataURL>|dataURL,
               foto:dataURL|'' , mitFoto:bool, mitKarte:bool, karteOrt }

   Rechtliches (IT-Recht-AGB 2.4, §312j BGB): erst der eigene Knopf "Zahlungspflichtig
   bestellen" schliesst die Bestellung ab — die PayPal-/Kartenknoepfe sind nur der Zahlungsschritt.
   Ohne Haken bei AGB/Widerruf bleibt der Knopf gesperrt. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getFirestore, doc, setDoc, getDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* LIVE-Client-ID (geprueft 2026-08-30 gegen developer.paypal.com/dashboard/applications/live,
   App "WL Gravur Shop Live"). Die alte Sandbox-ID AVoTaZt4… NIE wieder einsetzen. */
const PAYPAL_CLIENT_ID = "BAAhZHJG81nSPL2TIZk4WBfahJJW7YsXSrYtYm2Iv0etpBHE2UGvZNfvro66TlHpCH_WQ8j2Xzp4M0XUXs";
const FORMSPREE = "https://formspree.io/f/xpqjjobb";
const AGB_URL = "https://itrk.legal/Ipk.2Y.Cj6.html";
const WIDERRUF_URL = "https://itrk.legal/Ipk.2J.Cj6.html";

const firebaseConfig = {
  apiKey:"AIzaSyBLSp0en7wDD_71PF1n3qYXPF0YNTEWmIc",
  authDomain:"auftrage-edc6d.firebaseapp.com",
  projectId:"auftrage-edc6d",
  storageBucket:"auftrage-edc6d.firebasestorage.app",
  messagingSenderId:"675308449934",
  appId:"1:675308449934:web:b4c1fc2e190647ace419df"
};
const app = getApps().find(a=>a.name==="wl-privat") || initializeApp(firebaseConfig, "wl-privat");
const storage = getStorage(app), db = getFirestore(app), auth = getAuth(app);
const authReady = new Promise(resolve=>{
  let done=false;
  onAuthStateChanged(auth, u=>{ if(u && !done){ done=true; resolve(true); } });
  signInAnonymously(auth).catch(e=>{ console.error("Anon-Auth",e); if(!done){ done=true; resolve(false); } });
});
function upload(blob, path, contentType){
  return new Promise((resolve,reject)=>{
    const task=uploadBytesResumable(ref(storage,path), blob, {contentType});
    task.on("state_changed", null, reject, async()=>{ try{ resolve(await getDownloadURL(task.snapshot.ref)); }catch(e){ reject(e); } });
  });
}
async function saveOrder(id, data){
  await authReady;
  return setDoc(doc(db,"privat-bestellungen",id), Object.assign({}, data, { status:"neu", createdAt: serverTimestamp() }));
}
function couponUses(c){
  let maxUses=Number(c.max_uses); if(!Number.isFinite(maxUses)||maxUses<1) maxUses=1;
  let usesCount=Number(c.uses_count);
  if(!Number.isFinite(usesCount)||usesCount<0) usesCount = c.status==="redeemed" ? maxUses : 0;
  const refs=Array.isArray(c.redeemed_refs)?c.redeemed_refs.slice():(c.redeemed_ref?[c.redeemed_ref]:[]);
  return { maxUses, usesCount, refs, remaining:maxUses-usesCount };
}
async function validateCoupon(code){
  code=String(code||"").trim().toUpperCase();
  if(!code) return { ok:false, reason:"Bitte einen Code eingeben." };
  try{
    await authReady;
    const snap=await getDoc(doc(db,"coupons",code));
    if(!snap.exists()) return { ok:false, reason:"Code nicht gefunden." };
    const c=snap.data();
    if(c.status==="expired" || (c.expires_at && c.expires_at<Date.now())) return { ok:false, reason:"Code abgelaufen." };
    if(couponUses(c).remaining<=0) return { ok:false, reason:"Code bereits eingelöst." };
    return { ok:true, percent:Number(c.percent)||0 };
  }catch(e){ console.error("Coupon-Prüfung",e); return { ok:false, reason:"Prüfung fehlgeschlagen." }; }
}
async function redeemCoupon(code, refId){
  code=String(code||"").trim().toUpperCase(); if(!code) return { ok:false };
  const cRef=doc(db,"coupons",code);
  try{
    await authReady;
    return await runTransaction(db, async tx=>{
      const snap=await tx.get(cRef); if(!snap.exists()) return { ok:false };
      const c=snap.data();
      if(c.status==="expired" || (c.expires_at && c.expires_at<Date.now())) return { ok:false };
      const u=couponUses(c);
      if(refId && u.refs.includes(refId)) return { ok:true, already:true };
      if(u.remaining<=0) return { ok:false };
      const n=u.usesCount+1;
      tx.update(cRef,{ status:n>=u.maxUses?"redeemed":"issued", uses_count:n, redeemed_at:Date.now(), redeemed_ref:refId||"", redeemed_refs:refId?[...u.refs,refId]:u.refs });
      return { ok:true };
    });
  }catch(e){ console.error("Coupon-Einlösung",e); return { ok:false }; }
}

/* ---------- Oberflaeche ---------- */
const CSS=`
.co-back{position:fixed;inset:0;z-index:9000;background:rgba(28,28,28,.45);display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 14px}
.co-back.show{display:flex}
.co-card{position:relative;width:100%;max-width:560px;background:#fff;color:#1c1c1c;padding:28px 26px 30px;margin:auto;font-family:'Nunito',system-ui,sans-serif}
.co-card h2{font:400 1.5rem 'Instrument Sans',system-ui,sans-serif;margin:0 0 4px}
.co-sub{color:#6a6a6a;font-size:.86rem;margin:0 0 16px}
.co-x{position:absolute;top:10px;right:12px;font-size:1.6rem;line-height:1;width:40px;height:40px;background:none;border:0;cursor:pointer;color:#1c1c1c}
.co-item{display:grid;grid-template-columns:72px 1fr auto;gap:14px;align-items:center;border-top:1px solid #ddd;border-bottom:1px solid #ddd;padding:14px 0;margin-bottom:14px}
.co-item img{width:72px;height:72px;object-fit:contain;background:#f4f1ee}
.co-item .nm{font-weight:600}
.co-item .dt{font-size:.8rem;color:#6a6a6a;line-height:1.45;overflow-wrap:anywhere}
.co-item .pr{font:500 1.05rem 'Instrument Sans',sans-serif;white-space:nowrap}
.co-sumrow{display:flex;justify-content:space-between;font-size:.86rem;color:#6a6a6a;margin:2px 0}
.co-sumrow.tot{font:600 1.1rem 'Instrument Sans',sans-serif;color:#1c1c1c;border-top:1px solid #ddd;padding-top:10px;margin-top:8px}
.co-sumrow.disc{color:#1c1c1c}
.co-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.co-fld{margin-bottom:10px}.co-fld.full{grid-column:1/-1}
.co-fld label{display:block;font:500 .66rem 'Instrument Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;margin:0 0 5px}
.co-fld input,.co-fld textarea{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:0;background:#fff;color:#1c1c1c;padding:10px 11px;font:inherit;font-size:.92rem}
.co-fld input:focus,.co-fld textarea:focus{outline:none;border-color:#1c1c1c}
.co-fld input[readonly]{background:#f7f2f1;color:#6a6a6a}
.co-qty{display:flex;align-items:center;gap:6px}.co-qty input{width:64px;text-align:center}
.co-qty button,.co-cpbtn{border:1px solid #ddd;background:#fff;padding:9px 13px;cursor:pointer;font:inherit}
.co-legal{background:#f7f2f1;padding:12px 14px;font-size:.8rem;color:#4a4a4a;line-height:1.5;margin:6px 0 10px}
.co-legal ul{margin:0 0 6px;padding-left:1.1rem}
.co-legal a,.co-agb a,.co-gpsr a{color:#1c1c1c;text-decoration:underline}
.co-gpsr{border:1px solid #ddd;padding:10px 14px;font-size:.78rem;color:#4a4a4a;line-height:1.5;margin:0 0 10px}
.co-gpsr summary{cursor:pointer;font:500 .7rem 'Instrument Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#1c1c1c}
.co-gpsr p{margin:8px 0 0}
.co-agb{display:flex;gap:10px;align-items:flex-start;font-size:.84rem;line-height:1.45;margin:10px 0 6px;cursor:pointer}
.co-agb input{width:18px;height:18px;margin-top:2px;flex:none;accent-color:#1c1c1c}
.co-msg{min-height:1.2em;font-size:.84rem;margin:6px 0}
.co-msg.err{color:#8a2b2b}
.co-order{display:block;width:100%;border:1px solid #1c1c1c;background:#1c1c1c;color:#fff;font:500 .78rem 'Instrument Sans',sans-serif;letter-spacing:.16em;text-transform:uppercase;padding:16px;cursor:pointer;margin-top:6px}
.co-order:disabled{opacity:.4;cursor:not-allowed}
#co-paypal{margin-top:12px;min-height:48px}
.co-note{font-size:.76rem;color:#6a6a6a;margin-top:10px}
.co-ok{text-align:center;padding:10px 0}
.co-ok h2{margin:10px 0}
.co-ok p{color:#4a4a4a;font-size:.92rem}
@media(max-width:560px){.co-back{padding:0}.co-card{min-height:100%;padding:24px 16px 30px}.co-row{grid-template-columns:1fr}.co-item{grid-template-columns:56px 1fr;}.co-item img{width:56px;height:56px}.co-item .pr{grid-column:2}}
`;
const HTML=`
<div class="co-card">
  <button class="co-x" id="coClose" aria-label="Schließen">×</button>
  <div id="coForm">
    <h2>Bestellung</h2>
    <p class="co-sub">Sicher bezahlen mit PayPal oder Kredit-/Debitkarte.</p>
    <div class="co-item"><img id="coImg" alt=""><div><div class="nm" id="coName"></div><div class="dt" id="coDet"></div></div><div class="pr" id="coUnit"></div></div>
    <div id="coStep1">
      <div class="co-row">
        <div class="co-fld"><label for="coQty">Menge</label><div class="co-qty"><button type="button" id="coMinus" aria-label="weniger">−</button><input type="number" id="coQty" value="1" min="1" max="50" inputmode="numeric"><button type="button" id="coPlus" aria-label="mehr">+</button></div></div>
        <div class="co-fld"><label for="coCoupon">Gutschein (optional)</label><div style="display:flex;gap:6px"><input id="coCoupon" autocomplete="off" style="text-transform:uppercase"><button type="button" class="co-cpbtn" id="coCpBtn">Einlösen</button></div><div id="coCpMsg" style="font-size:.76rem;color:#6a6a6a;margin-top:4px"></div></div>
      </div>
      <div class="co-row">
        <div class="co-fld"><label for="coNameIn">Vor- und Nachname *</label><input id="coNameIn" autocomplete="name"></div>
        <div class="co-fld"><label for="coEmail">E-Mail *</label><input id="coEmail" type="email" autocomplete="email"></div>
        <div class="co-fld full"><label for="coStr">Straße &amp; Hausnummer *</label><input id="coStr" autocomplete="street-address"></div>
        <div class="co-fld"><label for="coPlz">PLZ *</label><input id="coPlz" autocomplete="postal-code" inputmode="numeric"></div>
        <div class="co-fld"><label for="coOrt">Ort *</label><input id="coOrt" autocomplete="address-level2"></div>
        <div class="co-fld"><label for="coTel">Telefon (optional)</label><input id="coTel" autocomplete="tel"></div>
        <div class="co-fld"><label for="coLand">Land</label><input id="coLand" value="Deutschland" readonly title="Lieferung nur innerhalb Deutschlands"></div>
        <div class="co-fld full"><label for="coNote">Anmerkung (optional)</label><textarea id="coNote" rows="2"></textarea></div>
      </div>
    </div>
    <div class="co-sumrow"><span id="coSumLbl">Zwischensumme</span><span id="coSub"></span></div>
    <div class="co-sumrow disc" id="coDiscRow" hidden><span id="coDiscLbl"></span><span id="coDisc"></span></div>
    <div class="co-sumrow"><span>Versand (Deutschland)</span><span>kostenlos</span></div>
    <div class="co-sumrow tot"><span>Gesamt</span><span id="coTotal"></span></div>
    <div class="co-legal">
      <ul>
        <li>Versandkostenfrei innerhalb Deutschlands (Lieferung nur innerhalb Deutschlands)</li>
        <li>Lieferzeit: 5–10 Werktage</li>
        <li>Gesamtpreis inkl. Versand – gemäß § 19 UStG wird keine Umsatzsteuer berechnet</li>
      </ul>
      Da jedes Stück nach deinen persönlichen Vorgaben graviert wird, besteht für diese Ware kein Widerrufsrecht (§ 312g Abs. 2 Nr. 1 BGB) – siehe <a href="${WIDERRUF_URL}" target="_blank" rel="noopener">Widerrufsbelehrung</a>. Hinweise zur Verarbeitung deiner Daten findest du in unserer <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a>.
    </div>
    <details class="co-gpsr" id="coGpsr"><summary>Herstellerangaben &amp; Produktsicherheit</summary><div id="coGpsrBody"></div></details>
    <div id="coStep1b">
      <label class="co-agb"><input type="checkbox" id="coAgb"><span>Ich habe die <a href="${AGB_URL}" target="_blank" rel="noopener">AGB</a> und die <a href="${WIDERRUF_URL}" target="_blank" rel="noopener">Widerrufsbelehrung</a> gelesen und akzeptiere sie. Mir ist bekannt, dass für personalisierte Ware kein Widerrufsrecht besteht. *</span></label>
      <div class="co-msg" id="coMsg"></div>
      <button type="button" class="co-order" id="coOrderBtn" disabled>Zahlungspflichtig bestellen</button>
    </div>
    <div id="coStep2" hidden>
      <p style="font-size:.9rem;margin:12px 0 0"><b>Bitte schließe deine Bestellung jetzt mit der Zahlung ab.</b> Wähle PayPal oder Kredit-/Debitkarte.</p>
      <div class="co-msg" id="coMsg2"></div>
      <div id="co-paypal"></div>
      <p class="co-note"><a href="#" id="coEdit" style="color:#6a6a6a">Angaben ändern</a></p>
    </div>
  </div>
  <div id="coOk" class="co-ok" hidden>
    <div style="font-size:2.4rem">✓</div>
    <h2>Vielen Dank<span id="coThx"></span>!</h2>
    <p>Deine Bestellung ist eingegangen und bezahlt. Du erhältst in Kürze eine Bestätigung per E-Mail.</p>
    <p style="font-size:.78rem;color:#7a7a7a">Bestellnummer: <span id="coNo"></span></p>
    <button type="button" class="co-order" id="coDone" style="max-width:220px;margin:18px auto 0">Schließen</button>
  </div>
</div>`;

const st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
const back=document.createElement('div'); back.className='co-back'; back.id='coBack';
back.setAttribute('role','dialog'); back.setAttribute('aria-modal','true'); back.setAttribute('aria-label','Bestellung');
back.innerHTML=HTML; document.body.appendChild(back);

const $=id=>document.getElementById(id);
const val=id=>($(id)&&$(id).value||'').trim();
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const eur=n=>(Math.round(n*100)/100).toFixed(2).replace('.',',')+' €';
let O=null, coupon=null, couponBusy=false, ppLoaded=false, ppRendered=false, busy=false;

const qty=()=>Math.max(1,Math.min(50,parseInt($('coQty').value,10)||1));
const subtotal=()=>+(O.unit*qty()).toFixed(2);
const discount=()=>coupon?+(subtotal()*coupon.percent/100).toFixed(2):0;
const total=()=>Math.max(0,+(subtotal()-discount()).toFixed(2));
const prodName=()=>O.produkt+(O.variante?' · '+O.variante:'');
const detailText=()=>Object.entries(O.details||{}).filter(([,v])=>v!=null&&String(v).trim()!=='').map(([k,v])=>k+': '+v).join(' · ');

function msg(t,err){ const m=$(O&&!$('coStep2').hidden?'coMsg2':'coMsg'); m.textContent=t||''; m.className='co-msg'+(err?' err':''); }
function summary(){
  $('coName').textContent=prodName();
  const g=O.gravurText?'Gravur: „'+O.gravurText+'“':'';
  $('coDet').innerHTML=[g,detailText(),O.material?'Material: '+O.material:''].filter(Boolean).map(esc).join('<br>');
  $('coUnit').textContent=eur(O.unit);
  $('coSumLbl').textContent='Zwischensumme ('+qty()+' Stück)';
  $('coSub').textContent=eur(subtotal());
  const d=discount();
  $('coDiscRow').hidden=!(coupon&&d>0);
  if(coupon){ $('coDiscLbl').textContent='Gutschein '+coupon.code+' (−'+coupon.percent+' %)'; $('coDisc').textContent='−'+eur(d); }
  $('coTotal').textContent=eur(total());
}
function gpsr(){
  /* Herstellerangaben stehen EINMAL auf der Seite (#gpsrHersteller, aus store/seller-legal.json
     generiert) — hier nur gespiegelt, damit es keine zweite, abweichende Adresse gibt. */
  const h=document.getElementById('gpsrHersteller');
  const parts=[];
  if(h) parts.push('<p><b>Hersteller:</b> '+h.innerHTML+'</p>');
  if(O.material) parts.push('<p><b>Material:</b> '+esc(O.material)+'</p>');
  if(O.schmuck) parts.push('<p><b>Sicherheitshinweise:</b> Enthält Kleinteile – nicht für Kinder unter 3 Jahren geeignet, Erstickungsgefahr. Schmuck nicht von Kleinkindern unbeaufsichtigt tragen lassen. Bei bekannter Metallallergie bitte die Materialangabe beachten und bei Hautreizungen nicht weiter tragen.</p>');
  parts.push('<p><b>Produktidentifikation:</b> Produktbezeichnung und Bestellnummer stehen auf der beiliegenden Produktkarte und in der Bestellbestätigung (Verordnung (EU) 2023/988, GPSR).</p>');
  $('coGpsrBody').innerHTML=parts.join('');
}
function validate(){
  if(!O.gravurText && !O.mitFoto && !O.mitKarte){ msg('Bitte zuerst eine Gravur eingeben.',true); return false; }
  for(const [id,l] of [['coNameIn','Name'],['coEmail','E-Mail'],['coStr','Straße & Hausnummer'],['coPlz','PLZ'],['coOrt','Ort']]){
    if(!val(id)){ msg('Bitte '+l+' ausfüllen.',true); $(id).focus(); return false; }
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('coEmail'))){ msg('Bitte eine gültige E-Mail-Adresse eingeben.',true); $('coEmail').focus(); return false; }
  if(!/^\d{5}$/.test(val('coPlz'))){ msg('Bitte eine gültige deutsche PLZ (5 Ziffern) eingeben.',true); $('coPlz').focus(); return false; }
  if(!$('coAgb').checked){ msg('Bitte bestätige die AGB und die Widerrufsbelehrung.',true); return false; }
  msg(''); return true;
}
function step(n){
  $('coStep1').hidden=n!==1; $('coStep1b').hidden=n!==1; $('coStep2').hidden=n!==2;
  if(n===2){ loadPaypal(); }
}
async function toggleCoupon(){
  if(couponBusy) return;
  const m=$('coCpMsg');
  if(coupon){ coupon=null; $('coCoupon').disabled=false; $('coCpBtn').textContent='Einlösen'; m.textContent=''; summary(); return; }
  const code=val('coCoupon').toUpperCase();
  if(!code){ m.textContent='Bitte einen Code eingeben.'; return; }
  couponBusy=true; m.textContent='Code wird geprüft …';
  try{
    const r=await validateCoupon(code);
    if(!r.ok){ m.textContent=r.reason||'Code ungültig.'; return; }
    coupon={code,percent:r.percent}; $('coCoupon').value=code; $('coCoupon').disabled=true; $('coCpBtn').textContent='Entfernen';
    m.textContent='Gutschein aktiv: −'+r.percent+' %'; summary();
  } finally { couponBusy=false; }
}
function dataURLtoBlob(d){ const [h,b]=d.split(','); const mime=(h.match(/:(.*?);/)||[,'image/png'])[1];
  const bin=atob(b); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i); return new Blob([u],{type:mime}); }
const call=async f=>{ try{ return typeof f==='function' ? await f() : (f||''); }catch(e){ console.error(e); return ''; } };

/* Wird nach erfolgreicher Zahlung aufgerufen — Feldnamen identisch zum alten Checkout,
   damit Auto-Rechnung (scripts/firebase-sync/auto-invoice.js), Dashboard und Rechnung-App
   die Bestellung ohne Anpassung lesen. */
async function finalize(orderID, details, opts){
  opts=opts||{};
  msg('Design wird übermittelt …');
  const id=(opts.idPrefix||'')+Date.now()+'-'+Math.random().toString(36).slice(2,8);
  let svgUrl='', pngUrl='', fotoUrl='';
  const svg=await call(O.svg), png=await call(O.png);
  if(!opts.dry){
    try{
      if(svg) svgUrl=await upload(new Blob([svg],{type:'image/svg+xml'}),'privat-bestellungen/'+id+'/design.svg','image/svg+xml');
      if(png) pngUrl=await upload(dataURLtoBlob(png),'privat-bestellungen/'+id+'/vorschau.png','image/png');
      if(O.foto) fotoUrl=await upload(dataURLtoBlob(O.foto),'privat-bestellungen/'+id+'/original-foto.png','image/png');
    }catch(e){ console.error('Upload-Fehler',e); }
  }
  const payer=(details&&details.payer)||{};
  const T=total(), D=discount();
  const data={
    produkt: prodName(),
    produktKey: O.key||'',
    form: O.form||O.produkt,
    variante: O.variante||'',
    material: O.material||'',
    kettenlaenge: O.kettenlaenge||'–',
    gravurText: O.gravurText||'',
    details: detailText(),
    designDaten: O.designDaten?JSON.stringify(O.designDaten):'',
    tafelDaten: O.key==='tafel'&&O.designDaten?JSON.stringify(O.designDaten):'',
    mitFoto: !!O.mitFoto,
    mitKarte: !!O.mitKarte,
    karteOrt: O.karteOrt||'',
    menge: qty(),
    einzelpreis: eur(O.unit),
    originalpreis: eur(subtotal()),
    gesamtpreis: eur(T),
    pricePaid: Number(T.toFixed(2)),
    gutscheinCode: coupon?coupon.code:'',
    gutscheinProzent: coupon?coupon.percent:0,
    rabattBetrag: D,
    name: val('coNameIn'), email: val('coEmail'), telefon: val('coTel'),
    strasse: val('coStr'), plz: val('coPlz'), ort: val('coOrt'), land: val('coLand')||'Deutschland',
    adresse: val('coStr')+', '+val('coPlz')+' '+val('coOrt')+', '+(val('coLand')||'Deutschland'),
    anmerkung: val('coNote'),
    agbAkzeptiert: true,
    designSvgUrl: svgUrl, vorschauPngUrl: pngUrl, originalFotoUrl: fotoUrl,
    paypalOrderId: orderID||'', paypalStatus: (details&&details.status)||'', paypalPayer: payer.email_address||'',
    quelle: 'privat-shop'
  };
  if(opts.dry){ return { id, data, svgLen:svg.length, pngLen:png.length }; }
  try{ await saveOrder(id,data); }catch(e){ console.error('Firestore-Bestellung-Fehler',e); }
  if(coupon){ try{ await redeemCoupon(coupon.code,id); }catch(e){ console.error(e); } }
  try{
    const fd=new FormData();
    fd.append('Produkt',data.produkt); fd.append('Details',data.details||'–');
    fd.append('Gravur',data.gravurText||(data.mitFoto?'(nur Foto)':'–'));
    if(data.designDaten) fd.append('Design_Daten',data.designDaten.slice(0,4000));
    fd.append('Material',data.material||'–');
    fd.append('Menge',String(data.menge)); fd.append('Einzelpreis',data.einzelpreis);
    if(coupon) fd.append('Gutschein',coupon.code+' (−'+coupon.percent+'% = −'+eur(D)+')');
    fd.append('Gesamtpreis',data.gesamtpreis);
    fd.append('Name',data.name); fd.append('Email',data.email); fd.append('Telefon',data.telefon||'–');
    fd.append('Adresse',data.adresse); fd.append('Anmerkung',data.anmerkung||'–');
    fd.append('Design_SVG',svgUrl||'(Upload fehlgeschlagen)'); fd.append('Vorschau_PNG',pngUrl||'(kein PNG)');
    if(fotoUrl) fd.append('Original_Foto',fotoUrl);
    fd.append('PayPal_OrderID',data.paypalOrderId); fd.append('PayPal_Status',data.paypalStatus); fd.append('PayPal_Payer',data.paypalPayer);
    fd.append('Bestellnummer',id);
    fd.append('_replyto',data.email);
    fd.append('_subject','🛒 Neue PRIVAT-Shop Bestellung: '+data.produkt+' ×'+data.menge+' – '+data.name);
    await fetch(FORMSPREE,{method:'POST',headers:{'Accept':'application/json'},body:fd});
  }catch(e){ console.error('Formspree-Fehler',e); }
  $('coThx').textContent=data.name?', '+data.name.split(' ')[0]:'';
  $('coNo').textContent=id;
  $('coForm').hidden=true; $('coOk').hidden=false;
  try{ window.dispatchEvent(new CustomEvent('wl-order-done',{detail:{id}})); }catch(e){}
  return { id, data };
}
function renderPaypal(){
  if(ppRendered || !window.paypal) return;
  ppRendered=true;
  window.paypal.Buttons({
    style:{layout:'vertical',shape:'rect',label:'pay'},
    onClick:(d,actions)=> (O && validate()) ? actions.resolve() : actions.reject(),
    createOrder:(d,actions)=> actions.order.create({
      purchase_units:[{ amount:{ value: total().toFixed(2), currency_code:'EUR' },
        description:(prodName()+' ×'+qty()+' – Wolf Lasermark Gravur').slice(0,127) }]
    }),
    onApprove:async(d,actions)=>{
      if(busy) return; busy=true;
      msg('Zahlung wird bestätigt …');
      try{ const details=await actions.order.capture(); await finalize(d.orderID,details); }
      catch(e){ console.error(e); msg('Fehler bei der Verarbeitung. Bitte schreib uns an info@wolf-lasermark.de.',true); }
      finally{ busy=false; }
    },
    onError:e=>{ console.error('PayPal-Fehler',e); msg('Es gab ein Problem mit der Zahlung. Bitte versuche es erneut.',true); }
  }).render('#co-paypal');
}
function loadPaypal(){
  if(ppLoaded){ renderPaypal(); return; }
  if(document.querySelector('script[data-wl-paypal]')) return;
  const s=document.createElement('script'); s.dataset.wlPaypal='1';
  s.src="https://www.paypal.com/sdk/js?client-id="+encodeURIComponent(PAYPAL_CLIENT_ID)+"&currency=EUR&locale=de_DE&components=buttons&enable-funding=card&disable-funding=sofort,giropay";
  s.onload=()=>{ ppLoaded=true; renderPaypal(); };
  s.onerror=()=>msg('PayPal konnte nicht geladen werden. Bitte später erneut versuchen.',true);
  document.head.appendChild(s);
}
function open(order){
  if(!order || !(order.unit>0)){ console.warn('WLCheckout: kein Preis'); return false; }
  O=order; coupon=null; $('coCoupon').disabled=false; $('coCoupon').value=''; $('coCpBtn').textContent='Einlösen'; $('coCpMsg').textContent='';
  $('coQty').value=1; $('coAgb').checked=false; $('coOrderBtn').disabled=true;
  $('coImg').src=order.img||''; $('coImg').style.visibility=order.img?'visible':'hidden';
  $('coForm').hidden=false; $('coOk').hidden=true; step(1); msg('');
  summary(); gpsr();
  back.classList.add('show'); document.body.style.overflow='hidden';
  setTimeout(()=>$('coNameIn').focus({preventScroll:true}),50);
  return true;
}
function close(){ back.classList.remove('show'); document.body.style.overflow=document.querySelector('.pd.open,.ed.open')?'hidden':''; }

$('coClose').onclick=close; $('coDone').onclick=close;
back.addEventListener('click',e=>{ if(e.target===back) close(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && back.classList.contains('show')) close(); });
$('coAgb').addEventListener('change',()=>{ $('coOrderBtn').disabled=!$('coAgb').checked; if($('coAgb').checked) msg(''); });
$('coOrderBtn').onclick=()=>{ if(!validate()) return; summary(); step(2); };
$('coEdit').onclick=e=>{ e.preventDefault(); step(1); };
$('coQty').addEventListener('input',summary);
$('coPlus').onclick=()=>{ $('coQty').value=Math.min(50,qty()+1); summary(); };
$('coMinus').onclick=()=>{ $('coQty').value=Math.max(1,qty()-1); summary(); };
$('coCpBtn').onclick=toggleCoupon;
$('coCoupon').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); toggleCoupon(); } });

/* _dryFinalize nur fuer Tests: baut den Firestore-Datensatz OHNE Upload/Speichern/Mail. */
window.WLCheckout={ open, close, _dryFinalize:()=>finalize('TEST-DRY',{status:'COMPLETED',payer:{email_address:'test@example.invalid'}},{dry:true}) };
window.dispatchEvent(new Event('wl-checkout-ready'));
