/* Erinnerungstafel-Editor — aus privat-gravur.html uebernommen (2026-11-16), angepasst an die
   130 x 180 mm-Tafel des neuen Shops. Vorlagen-gesteuert: der Kunde fuellt Felder, das Layout bleibt gesetzt. */
/* Vorlagen-gesteuerte Tafel: der Kunde fuellt Felder, das Layout bleibt gesetzt.
   Anders als beim Anhaenger gibt es hier bewusst KEINE freie Positionierung —
   die Komposition soll sich nicht zerstoeren lassen. */
(function(){
  /* Entwurfsraum = die bewaehrte 105 x 148-Komposition (alle Layouts rechnen darin).
     Die echte Tafel ist 130 x 180 mm (Kunden-DXF: oben R20, unten R6, 2 mm, ohne Sockel);
     Entwurf -> echt: x' = OX + K*x, y' = OY + K*y. Gravurfeld der echten Tafel 106 x 150 mm
     (12 mm Rand, oben 18 mm) — K/OX/OY so gewaehlt, dass jede Vorlage hineinpasst. */
  const PLATE={w:105,h:148,rTop:26,rBot:4,insert:9,thick:2};
  const REAL={w:130,h:180,rTop:20,rBot:6,thick:2}, K=1.12, OX=6.14, OY=9.9;   // gemessen: alle 5 Vorlagen in 12..118 x 18..168 mm
  const RX0=-OX/K, RX1=(REAL.w-OX)/K, RY0=-OY/K, RY1=(REAL.h-OY)/K;
  function realPlatePath(){
    const W=REAL.w,H=REAL.h,rt=REAL.rTop,rb=REAL.rBot;
    return `M${rt} 0H${W-rt}A${rt} ${rt} 0 0 1 ${W} ${rt}V${H-rb}A${rb} ${rb} 0 0 1 ${W-rb} ${H}H${rb}A${rb} ${rb} 0 0 1 0 ${H-rb}V${rt}A${rt} ${rt} 0 0 1 ${rt} 0Z`;
  }
  const S=1.6, X0=(300-PLATE.w*S)/2, Y0=20;
  const ENG='#3c414a';
  const X=mm=>X0+mm*S, Y=mm=>Y0+mm*S, P=mm=>mm*S;
  const NS='http://www.w3.org/2000/svg';
  const $=id=>document.getElementById(id);

  /* --- Linienmotive, 24x24, reine Strichzeichnung --- */
  const ICONS={
    kaffee:{label:'Kaffee · Kennenlernen',d:['M6.5 9h9.5v4.2a4.75 4.75 0 0 1-9.5 0z','M16 10.4h1.5a2.1 2.1 0 0 1 0 4.2H16','M4.8 19.2h13.4','M10 4.6c0 1.1-1 1.4-1 2.5','M13 4.6c0 1.1-1 1.4-1 2.5']},
    ringe:{label:'Ringe',d:['M9.6 13.6m-4.4 0a4.4 4.4 0 1 0 8.8 0a4.4 4.4 0 1 0-8.8 0','M14.4 13.6m-4.4 0a4.4 4.4 0 1 0 8.8 0a4.4 4.4 0 1 0-8.8 0','M14.4 8.8l-1.5-2.1h3z']},
    haus:{label:'Haus · Zuhause',d:['M4 11.6 12 5.2l8 6.4V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z','M10 20v-4.6h4V20']},
    familie:{label:'Familie',d:['M7 9.4m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0','M12 8.2m-2.3 0a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0-4.6 0','M17 9.4m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0','M3.6 19.4c0-2.2 1.5-3.6 3.4-3.6','M20.4 19.4c0-2.2-1.5-3.6-3.4-3.6','M8.4 19.4c0-2.6 1.6-4.2 3.6-4.2s3.6 1.6 3.6 4.2']},
    herz:{label:'Herz · Liebe',d:['M12 19.8S4.8 15.1 4.8 10.6A3.9 3.9 0 0 1 12 8.3a3.9 3.9 0 0 1 7.2 2.3c0 4.5-7.2 9.2-7.2 9.2z']},
    stern:{label:'Stern · Besonderes',d:['M12 4.2l2.35 5.05 5.45.65-4.05 3.7 1.15 5.4L12 16.2l-4.9 2.8 1.15-5.4-4.05-3.7 5.45-.65z']},
    kinderwagen:{label:'Kinderwagen',d:['M5 13.2a7 7 0 0 1 14 0z','M19 13.2V6.6a3 3 0 0 0-3-3','M5 13.2h14','M8.4 18.2m-1.7 0a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0','M16.4 18.2m-1.7 0a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0']},
    flugzeug:{label:'Flugzeug · Reise',d:['M21.2 4.8 2.8 12.4l7 2.8 2.8 7z','M21.2 4.8 9.8 15.2']},
    pfote:{label:'Pfote · Tier',d:['M8.2 8.4m-1.7 0a1.7 2.2 0 1 0 3.4 0a1.7 2.2 0 1 0-3.4 0','M12 7.2m-1.7 0a1.7 2.3 0 1 0 3.4 0a1.7 2.3 0 1 0-3.4 0','M15.8 8.4m-1.7 0a1.7 2.2 0 1 0 3.4 0a1.7 2.2 0 1 0-3.4 0','M12 12.4c2.9 0 4.9 2.1 4.9 4.1s-2.2 2.8-4.9 2.8-4.9-.8-4.9-2.8 2-4.1 4.9-4.1z']},
    torte:{label:'Torte',d:['M5 19.4V12h14v7.4z','M3.4 19.4h17.2','M12 12V8.6','M12 8.6c-.9-.8-.35-2 0-2.5.35.5.9 1.7 0 2.5z']}
  };
  const ICON_KEYS=Object.keys(ICONS);

  /* Startpunkte statt leerer Felder: wer schon eine fertige Tafel vor sich
     sieht, tauscht Namen und Jahre aus, statt vor dem leeren Blatt zu sitzen. */
  const PRESETS=[
    {key:'weg', name:'Lebensweg', hint:'Für Paare', layout:'timeline',
     title:'Unsere Geschichte', quote:'Ich würde dich immer wieder wählen.', names:'Anna & Lukas',
     ms:[{year:'1998',l1:'Unser erstes',l2:'Kennenlernen',icon:'kaffee'},
         {year:'2003',l1:'Unsere',l2:'Hochzeit',icon:'ringe'},
         {year:'2012',l1:'Unser erstes',l2:'Zuhause',icon:'haus'},
         {year:'2026',l1:'Unsere',l2:'Familie',icon:'familie'}]},
    {key:'jahr', name:'Jahrestag', hint:'Gemeinsame Jahre', layout:'jubilee',
     title:'Unser Jahrestag', quote:'Und wir würden es wieder tun.', names:'Martina & Stefan',
     bigNum:'25', bigLabel:'Jahre', dateA:'2001', dateB:'2026'},
    {key:'danke', name:'Danksagung', hint:'Ein Dankeschön', layout:'dedication',
     title:'Danke', names:'Klasse 4b', sub:'Für Frau Keller',
     msg:'Für jede Frage, die nie zu viel war.\nFür die Geduld an den zähen Tagen.\nFür das Vertrauen, das uns getragen hat.\nWir vergessen das nicht.'},
    {key:'trophae', name:'Auszeichnung', hint:'Trophäe', layout:'award',
     title:'Auszeichnung', quote:'Verdient — und nicht vergessen.', names:'Team Fertigung',
     bigNum:'1', sub:'Regionalfinale Fertigungstechnik', dateA:'14. Juni 2026'},
    {key:'ruhestand', name:'Ruhestand', hint:'Zum Abschied', layout:'career',
     title:'Vierzig Jahre', quote:'Und jetzt: alle Zeit der Welt.', names:'Für Peter',
     ms:[{year:'1986',l1:'Der erste Arbeitstag',l2:'',icon:'kaffee'},
         {year:'1994',l1:'Die eigene Abteilung',l2:'',icon:'haus'},
         {year:'2010',l1:'Hundert Azubis',l2:'',icon:'familie'},
         {year:'2026',l1:'Der letzte Arbeitstag',l2:'',icon:'stern'}]}
  ];

  const st={
    preset:'weg',
    layout:'timeline',
    title:'Unsere Geschichte',
    quote:'Ich würde dich immer wieder wählen.',
    names:'Anna & Lukas',
    /* Nur einzelne Anlaesse brauchen diese Felder — welche, sagt LAYOUTS[].fields.
       Sie leben trotzdem immer im State, damit ein Wechsel hin und zurueck die
       Eingaben nicht verliert. */
    bigNum:'', bigLabel:'', dateA:'', dateB:'', sub:'', msg:'',
    line:64,
    detail:55,         // 0 = nur Hauptzuege, 100 = jedes Detail
    smooth:45,         // Douglas-Peucker-Toleranz: links treu, rechts glatt
    lw:100,            // Linienstaerke in Prozent (nur Strichzeichnung)
    crop:32,           // 0 = oberer Bildrand, 100 = unterer
    px:50,             // waagerechte Verschiebung: 0 = links, 100 = rechts
    pz:1,              // Zoom: 1 = Cover (fuellt den Rahmen genau aus)
    sketchW:0, sketchH:0,
    artStyle:'line',   // fest: die weiche Bleistift-Zeichnung — sie kommt am besten an
    art:null,          // {d,tw,th,stroke} — Pfade, gehen als echter Vektor in den Export
    photo:null,        // Original-DataURL (geht mit in die Bestellung)
    sketch:null,       // erzeugte Linienzeichnung als DataURL
    ms:[
      {year:'1998',l1:'Unser erstes',l2:'Kennenlernen',icon:'kaffee'},
      {year:'2003',l1:'Unsere',l2:'Hochzeit',icon:'ringe'},
      {year:'2012',l1:'Unser erstes',l2:'Zuhause',icon:'haus'},
      {year:'2026',l1:'Unsere',l2:'Familie',icon:'familie'}
    ]
  };

  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const up=s=>String(s||'').toLocaleUpperCase('de-DE');

  function platePath(){
    const x0=X(RX0),x1=X(RX1),y0=Y(RY0),y1=Y(RY1),rt=P(REAL.rTop/K),rb=P(REAL.rBot/K);
    return `M${x0+rt} ${y0}H${x1-rt}A${rt} ${rt} 0 0 1 ${x1} ${y0+rt}V${y1-rb}A${rb} ${rb} 0 0 1 ${x1-rb} ${y1}`
         + `H${x0+rb}A${rb} ${rb} 0 0 1 ${x0} ${y1-rb}V${y0+rt}A${rt} ${rt} 0 0 1 ${x0+rt} ${y0}Z`;
  }

  function brushTexture(){
    let out='';
    for(let i=0;i<210;i++){
      const yy=Y(RY0)+Math.random()*P(RY1-RY0);
      const o=(0.02+Math.random()*0.07).toFixed(3);
      const c=Math.random()<.5?'#ffffff':'#8f959d';
      out+=`<line x1="${X(RX0).toFixed(1)}" y1="${yy.toFixed(1)}" x2="${X(RX1).toFixed(1)}" y2="${yy.toFixed(1)}" stroke="${c}" stroke-opacity="${o}" stroke-width=".45"/>`;
    }
    return out;
  }

  function standMarkup(){
    const topY=Y(PLATE.h-PLATE.insert), h=34, w=222, x=150-w/2;
    return `<rect x="${x}" y="${topY}" width="${w}" height="${h}" rx="${h/2}" fill="url(#tafBase)"/>`
      + `<rect x="${x+10}" y="${topY+2.5}" width="${w-20}" height="7" rx="3.5" fill="#0a0a0c" opacity=".85"/>`
      + `<path d="M${x+16} ${topY+h-9}h${w-32}" stroke="#ffffff" stroke-opacity=".07" stroke-width="1.4" stroke-linecap="round"/>`
      + `<g transform="translate(150 ${topY+20}) scale(.62)" fill="none" stroke="#6e6a66" stroke-width="1.6" stroke-linejoin="round">`
      + `<path d="M-9-6-6 2l6 4 6-4 3-8-4 3-5-3-5 3z"/><path d="M-3 0h.01M3 0h.01"/></g>`;
  }

  function dividerMarkup(ymm){
    const cx=X(PLATE.w/2), y=Y(ymm), half=P(21), gap=P(2.6);
    return `<path d="M${cx-half} ${y}H${cx-gap}M${cx+gap} ${y}H${cx+half}" stroke="${ENG}" stroke-width="1" stroke-linecap="round"/>`
         + `<circle cx="${cx}" cy="${y}" r="1.5" fill="${ENG}"/>`;
  }

  function iconMarkup(key,cxmm,cymm,sizemm){
    const ic=ICONS[key]||ICONS.herz, s=P(sizemm)/24, ox=X(cxmm)-P(sizemm)/2, oy=Y(cymm)-P(sizemm)/2;
    return `<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${s.toFixed(4)})" fill="none" stroke="${ENG}" `
      + `stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">`
      + ic.d.map(d=>`<path d="${d}"/>`).join('') + `</g>`;
  }

  /* ---------- Bausteine, die sich die Anlass-Layouts teilen ---------- */
  const CX=()=>X(PLATE.w/2);

  function txt(str,ymm,o){
    if(!str && str!==0) return '';
    o=o||{};
    const fam=o.serif?'Cormorant Garamond,serif':'Inter,sans-serif';
    const a=[`x="${o.x!=null?X(o.x):CX()}"`,`y="${Y(ymm)}"`,`text-anchor="${o.anchor||'middle'}"`,
      `font-family="${fam}"`,`font-size="${P(o.size||3.4)}"`,`fill="${ENG}"`];
    if(o.weight) a.push(`font-weight="${o.weight}"`);
    if(o.italic) a.push('font-style="italic"');
    if(o.track) a.push(`letter-spacing="${P(o.track)}"`);
    if(o.op) a.push(`opacity="${o.op}"`);
    /* Linksbuendige Zeilen haben weniger Platz als die Plattenbreite —
       shrinkToFit muss ihr eigenes Limit kennen, sonst laufen sie ueber. */
    if(o.maxw) a.push(`data-maxw="${o.maxw}"`);
    return `<text ${a.join(' ')}>${esc(o.raw?str:String(str))}</text>`;
  }

  const headline=t=>txt(up(t),15,{size:4.1,track:1.5,weight:500});

  /* Grosse Zahl mit Wort — beim Jahrestag darunter, in der Auszeichnung
     darueber: unten laufen im Kranz die beiden Stiele zusammen, dort waere das
     Wort halb verdeckt. Oben steht der Kranz offen. */
  function numeralMarkup(num,label,ymm,above){
    let out=txt(num,ymm,{serif:true,size:22,weight:600});
    if(label) out+=txt(up(label),above?ymm-17:ymm+8.5,{size:3.6,track:2.2,weight:500});
    return out;
  }

  /* Ein Lorbeerblatt: spitze Mandelform, entlang +x liegend, dann gedreht.
     Ellipsen sahen aus wie Schlaufen — ein Blatt braucht zwei Spitzen. */
  function leafMM(xmm,ymm,lenmm,angDeg){
    const L=P(lenmm), w=L*.34, x=X(xmm), y=Y(ymm);
    return `<path d="M0 0 Q ${(L*.5).toFixed(2)} ${(-w).toFixed(2)} ${L.toFixed(2)} 0 `
      + `Q ${(L*.5).toFixed(2)} ${w.toFixed(2)} 0 0 Z" fill="none" stroke="${ENG}" `
      + `stroke-width="${P(.45)}" stroke-linejoin="round" `
      + `transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angDeg.toFixed(1)})"/>`;
  }

  /* Halber Lorbeerkranz: quadratischer Stiel von unten aussen nach oben, die
     Blaetter tangential daran. Zweimal gespiegelt ergibt den Kranz der
     Auszeichnung. */
  function laurel(cxmm,cymm,rmm,mirror){
    const d=mirror?-1:1;
    const p0=[cxmm,cymm+rmm], p1=[cxmm+d*rmm*1.16,cymm+rmm*.42], p2=[cxmm+d*rmm*.66,cymm-rmm*.62];
    const B=t=>[Math.pow(1-t,2)*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0],
                Math.pow(1-t,2)*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]];
    const T=t=>[2*(1-t)*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]),
                2*(1-t)*(p1[1]-p0[1])+2*t*(p2[1]-p1[1])];
    let out=`<path d="M${X(p0[0])} ${Y(p0[1])} Q ${X(p1[0])} ${Y(p1[1])} ${X(p2[0])} ${Y(p2[1])}" `
      + `fill="none" stroke="${ENG}" stroke-width="${P(.6)}" stroke-linecap="round"/>`;
    for(let i=0;i<5;i++){
      const t=.16+i*.19, pt=B(t), tan=T(t);
      const base=Math.atan2(tan[1],tan[0])*180/Math.PI;
      out+=leafMM(pt[0],pt[1],rmm*.42,base-d*42);
      out+=leafMM(pt[0],pt[1],rmm*.42,base+d*42);
    }
    return out;
  }

  /* Waagerechter Zweig — flankiert die grosse Zahl des Jahrestags, ohne wie
     ein Kranz zu wirken. */
  function sprig(cxmm,cymm,lenmm,dir){
    let out=`<path d="M${X(cxmm)} ${Y(cymm)} H${X(cxmm+dir*lenmm)}" fill="none" `
      + `stroke="${ENG}" stroke-width="${P(.6)}" stroke-linecap="round"/>`;
    for(let i=0;i<4;i++){
      const x=cxmm+dir*lenmm*(.18+i*.24);
      out+=leafMM(x,cymm,lenmm*.34,dir>0?-38:180+38);
      out+=leafMM(x,cymm,lenmm*.34,dir>0?38:180-38);
    }
    return out;
  }

  /* Senkrechte Stationsliste — die Ruhestand-Tafel liest sich wie ein
     Dienstzeugnis, nicht wie der geschwungene Lebensweg. */
  function stationListMarkup(y0,step){
    const list=st.ms.slice(0,4);
    const xYear=44, xText=52, xDot=48;
    let out='';
    list.forEach((m,i)=>{
      const y=y0+i*step;
      if(m.year) out+=txt(m.year,y,{x:xYear,anchor:'end',serif:true,size:5.4,weight:600});
      out+=`<circle cx="${X(xDot)}" cy="${Y(y-1.5)}" r="${P(.9)}" fill="${ENG}"/>`;
      if(i<list.length-1) out+=`<path d="M${X(xDot)} ${Y(y+.4)}V${Y(y+step-3.4)}" stroke="${ENG}" `
        + `stroke-width=".6" opacity=".5" stroke-linecap="round"/>`;
      const label=[m.l1,m.l2].filter(Boolean).join(' ');
      if(label) out+=txt(label,y,{x:xText,anchor:'start',size:3.4,maxw:PLATE.w-xText-8});
    });
    return out;
  }

  /* Freier Widmungstext: der Kunde tippt Zeilenumbrueche, wir gravieren sie. */
  function messageMarkup(y0,step,maxLines){
    return String(st.msg||'').split('\n').map(s=>s.trim()).filter(Boolean).slice(0,maxLines)
      .map((l,i)=>txt(l,y0+i*step,{size:3.5})).join('');
  }

  function timelineMarkup(){
    const list=st.ms.slice(0,5), n=list.length;
    if(!n) return '';
    const cy=90, r=5.2, m=15;
    const xs=n===1?[PLATE.w/2]:list.map((_,i)=>m+(PLATE.w-2*m)*i/(n-1));
    let out='';
    for(let i=0;i<n-1;i++){
      const a=X(xs[i]+r), b=X(xs[i+1]-r), yy=Y(cy), amp=P(i%2?-3.2:3.2), d=(b-a)/3;
      out+=`<path d="M${a} ${yy}C${a+d} ${yy+amp},${b-d} ${yy-amp},${b} ${yy}" fill="none" stroke="${ENG}" stroke-width=".7" opacity=".75"/>`;
    }
    // Mennyi hely jut egy allomasnak? A szomszedig tarto tavolsag, es a
    // szelso allomasoknal a tabla szeleig -- a felirat kozepre igazitott,
    // tehat mindket iranyba a fele lohet ki.
    const GAP=2.4, MARG=4;
    const step=n>1?(PLATE.w-2*m)/(n-1):(PLATE.w-2*m);
    list.forEach((it,i)=>{
      const cx=xs[i];
      const maxw=Math.max(7, Math.min(step-GAP, 2*(cx-MARG), 2*(PLATE.w-cx-MARG)));
      out+=`<circle cx="${X(cx)}" cy="${Y(cy)}" r="${P(r)}" fill="none" stroke="${ENG}" stroke-width=".8"/>`;
      out+=iconMarkup(it.icon,cx,cy,6.2);
      if(it.year) out+=`<text x="${X(cx)}" y="${Y(100.4)}" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="${P(5)}" font-weight="600" fill="${ENG}" data-maxw="${maxw.toFixed(1)}">${esc(it.year)}</text>`;
      if(it.l1) out+=`<text x="${X(cx)}" y="${Y(105.1)}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${P(2.9)}" fill="${ENG}" data-maxw="${maxw.toFixed(1)}" data-msline="1">${esc(it.l1)}</text>`;
      if(it.l2) out+=`<text x="${X(cx)}" y="${Y(108.9)}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${P(2.9)}" fill="${ENG}" data-maxw="${maxw.toFixed(1)}" data-msline="1">${esc(it.l2)}</text>`;
    });
    return out;
  }

  /* Der gestrichelte Rahmen ist reine Bildschirm-Hilfe (data-ph). Der Export
     streift ihn ab, sonst stuende er samt "Euer Foto" spaeter im Stahl. */
  const hasArtwork=()=>!!(st.sketch||(st.art&&st.art.d));

  /* Ein Pfad, zwei Bedeutungen: die Clipart ist gefuellt, die Strichzeichnung
     wird nur nachgefahren. Vorschau und Export holen ihn hier — sonst driften
     sie auseinander. */
  function artPathMarkup(color){
    if(!st.art||!st.art.d) return '';
    return st.art.stroke
      ? `<path d="${st.art.d}" fill="none" stroke="${color}" stroke-width="${st.art.stroke}" `
        + `stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="${st.art.d}" fill="${color}" fill-rule="evenodd"/>`;
  }

  function placeholder(){
    const p=port(); if(!p || hasArtwork()) return '';
    return `<g data-ph="1"><rect x="${X(p.x)}" y="${Y(p.y)}" width="${P(p.w)}" height="${P(p.h)}" rx="${P(p.rx)}" fill="none" `
      + `stroke="${ENG}" stroke-opacity=".28" stroke-width=".7" stroke-dasharray="${P(2)} ${P(1.6)}"/>`
      + txt('Euer Foto',p.y+p.h/2+1,{size:3,op:'.5'})+`</g>`;
  }

  /* Jeder Anlass bekommt eine eigene Komposition. Ein Jahrestag lebt von der
     grossen Zahl, eine Danksagung vom Widmungstext, eine Auszeichnung von der
     Urkunden-Achse — der geschwungene Lebensweg passt eben nur zum Lebensweg.
     `port` ist das Portraitfeld (rx=w/2 ergibt den Kreis), `fields` steuert,
     welche Eingabefelder ueberhaupt sichtbar sind. */
  const LAYOUTS={
    timeline:{
      port:{x:15,y:25,w:75,h:54,rx:2},
      fields:['title','photo','ms','quote','names'],
      labels:{ms:'Eure Stationen',quote:'Satz in der Mitte',names:'Namen'},
      msMax:5,
      draw(){
        return headline(st.title)+dividerMarkup(20)+placeholder()+timelineMarkup()
          + txt(st.quote,120,{serif:true,italic:true,size:6.4})
          + dividerMarkup(126.5)
          + txt(up(st.names),134,{size:3.4,track:1.1,weight:500});
      }
    },
    jubilee:{
      port:{x:27.5,y:27,w:50,h:50,rx:25},
      fields:['title','photo','bigNum','bigLabel','dateA','dateB','quote','names'],
      labels:{bigNum:'Zahl in der Mitte',bigLabel:'Wort darunter',dateA:'Von',dateB:'Bis',
              quote:'Euer Satz',names:'Namen'},
      draw(){
        const span=[st.dateA,st.dateB].filter(Boolean).join('  —  ');
        return headline(st.title)+dividerMarkup(20)+placeholder()
          + sprig(30,94,13,-1)+sprig(75,94,13,1)
          + numeralMarkup(st.bigNum,st.bigLabel,99)
          + txt(span,115,{serif:true,size:4.6,track:.4})
          + dividerMarkup(120.5)
          + txt(st.quote,129,{serif:true,italic:true,size:6})
          + txt(up(st.names),136.5,{size:3.4,track:1.1,weight:500});
      }
    },
    /* Das Andenken-Layout ist am 2026-08-09 entfallen: Bence will keinen
       Trauer-Anlass im Shop ("az szomoru"). Wer es je zurueckholt, braucht
       auch wieder den Preset-Eintrag mit layout:'memorial'. */
    dedication:{
      port:{x:20,y:26,w:65,h:44,rx:2},
      fields:['title','photo','sub','msg','names'],
      labels:{title:'Grosses Wort oben',sub:'Für wen',msg:'Widmung',names:'Unterschrift'},
      draw(){
        return txt(up(st.title),17,{size:6.2,track:3,weight:500})+dividerMarkup(22.5)+placeholder()
          + txt(st.sub,81,{serif:true,italic:true,size:5.6})
          + messageMarkup(92,7.5,4)
          + dividerMarkup(122)
          + txt(up(st.names),133,{size:3.4,track:1.1,weight:500});
      }
    },
    award:{
      port:null,
      fields:['title','bigNum','names','sub','quote','dateA'],
      labels:{bigNum:'Platzierung',names:'Ausgezeichnet',sub:'Anlass',quote:'Satz',dateA:'Datum'},
      draw(){
        /* Nur das Wort "PLATZ" ist am 2026-08-09 entfallen (Bence), die Zahl
           bleibt: sie steht allein und mittig im Kranz. */
        return headline(st.title)+dividerMarkup(20)
          + laurel(52.5,51,20,true)+laurel(52.5,51,20,false)
          + numeralMarkup(st.bigNum,'',60)
          + txt(st.names,86,{serif:true,size:8,weight:600})
          + txt(st.sub,95.5,{size:3.6,maxw:80})
          + dividerMarkup(102)
          + txt(st.quote,115,{serif:true,italic:true,size:6})
          + txt(up(st.dateA),129,{size:3.2,track:1.1,weight:500});
      }
    },
    career:{
      port:{x:32.5,y:25,w:40,h:40,rx:2},
      fields:['title','photo','ms','quote','names'],
      labels:{ms:'Stationen',quote:'Satz',names:'Namen'},
      msMax:4,
      draw(){
        return headline(st.title)+dividerMarkup(20)+placeholder()
          + stationListMarkup(78,10.5)
          + dividerMarkup(117)
          + txt(st.quote,127,{serif:true,italic:true,size:6})
          + txt(up(st.names),136,{size:3.4,track:1.1,weight:500});
      }
    }
  };

  const LAY=()=>LAYOUTS[st.layout]||LAYOUTS.timeline;
  /* Steht in der Bestellung ganz vorne: die Werkstatt sieht sofort, welche
     Komposition graviert werden soll. */
  const LAY_NAME=()=>{ const p=PRESETS.find(x=>x.key===st.preset); return p?p.name:''; };
  const port=()=>LAY().port;
  const hasField=f=>LAY().fields.indexOf(f)>=0;

  function engravingMarkup(){ return LAY().draw(); }

  /* Ueberlange Zeilen schrumpfen, statt ueber den Rand zu laufen. */
  function shrinkToFit(){
    const plateMax=P(PLATE.w-18);
    $('tafEng').querySelectorAll('text').forEach(t=>{
      let w;
      try{ w=t.getComputedTextLength(); }catch(_){ return; }
      const own=parseFloat(t.getAttribute('data-maxw'));
      const lim=own>0?P(own):plateMax;
      if(!w||w<=lim) return;
      const fs=parseFloat(t.getAttribute('font-size'));
      t.setAttribute('font-size',(fs*lim/w).toFixed(2));
      const ls=t.getAttribute('letter-spacing');
      if(ls) t.setAttribute('letter-spacing',(parseFloat(ls)*lim/w).toFixed(2));
    });
    balanceStationLines();
  }

  /* Az allomas-feliratok EGY meretet kapnak: a legkisebbet, amit a leghosszabb
     szoveg megkovetelt. Kulonben az egyik allomas alatt nagy, a masik alatt
     apro betu allna -- az atfedes megszunne, de a tabla rendetlen maradna. */
  function balanceStationLines(){
    const els=$('tafEng').querySelectorAll('text[data-msline]');
    if(els.length<2) return;
    let min=Infinity;
    els.forEach(t=>{ const f=parseFloat(t.getAttribute('font-size')); if(f>0&&f<min) min=f; });
    if(!isFinite(min)) return;
    els.forEach(t=>{ t.setAttribute('font-size',min.toFixed(2)); });
  }

  function rulerMarkup(){
    const y=Y(RY1)+20, x0=X(RX0), x1=X(RX1);
    let out=`<g class="rul"><line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>`
      + `<line x1="${x0}" y1="${y-4}" x2="${x0}" y2="${y+4}"/><line x1="${x1}" y1="${y-4}" x2="${x1}" y2="${y+4}"/></g>`;
    out+=`<text class="rlbl" x="150" y="${y+13}" text-anchor="middle">${REAL.w} mm</text>`;
    const rx=X(RX1)+16, ry0=Y(RY0), ry1=Y(RY1);
    out+=`<g class="rul"><line x1="${rx}" y1="${ry0}" x2="${rx}" y2="${ry1}"/>`
      + `<line x1="${rx-4}" y1="${ry0}" x2="${rx+4}" y2="${ry0}"/><line x1="${rx-4}" y1="${ry1}" x2="${rx+4}" y2="${ry1}"/></g>`;
    out+=`<text class="rlbl" x="${rx+6}" y="${(ry0+ry1)/2}" text-anchor="start">${REAL.h} mm</text>`;
    return out;
  }

  /* Cover-Zuschnitt: das Bild fuellt das Portraitfeld immer ganz aus, der
     sichtbare Ausschnitt laesst sich senkrecht verschieben (Gesichter sitzen
     selten in der Bildmitte). */
  function portraitGeom(){
    const p=port()||{x:15,y:25,w:75,h:54,rx:2};
    const rw=P(p.w), rh=P(p.h), a=(st.sketchW&&st.sketchH)?st.sketchW/st.sketchH:rw/rh;
    let w,h;
    if(a>rw/rh){ h=rh; w=rh*a; } else { w=rw; h=rw/a; }
    w*=(st.pz||1); h*=(st.pz||1);
    /* A 0..100 ertek azt mondja meg, hol all a kep a keretben: 0 = balra/felul
       zarva, 100 = jobbra/alul. Cover-nel (kep > keret) ez a lathato kivagast
       tolja; nagyitasnal ugyanez a keplet mukodik. */
    const fx=(st.px==null?50:st.px)/100, fy=(st.crop==null?32:st.crop)/100;
    return {x:X(p.x)+(rw-w)*fx, y:Y(p.y)+(rh-h)*fy, w:w, h:h};
  }

  let brushCache='';
  function render(){
    const d=platePath();
    $('tafPlateBody').setAttribute('d',d);
    $('tafPlateEdge').setAttribute('d',d);
    $('tafPlateClipPath').setAttribute('d',d);
    if(!brushCache) brushCache=brushTexture();
    $('tafBrush').innerHTML=brushCache;
    $('tafStand').innerHTML='';   // neue Tafel: kein Sockel
    $('tafRuler').innerHTML=rulerMarkup();

    const img=$('tafPortrait'), rect=$('tafPortraitRect'), p=port();
    /* rx = halbe Breite macht aus demselben <rect> den Kreis des Jahrestags —
       dafuer braucht die Buehne keinen zweiten Clip-Pfad. */
    if(p){
      rect.setAttribute('x',X(p.x)); rect.setAttribute('y',Y(p.y));
      rect.setAttribute('width',P(p.w)); rect.setAttribute('height',P(p.h));
      rect.setAttribute('rx',P(p.rx));
    }
    if(st.sketch && p){
      const g=portraitGeom();
      img.setAttribute('href',st.sketch);
      img.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',st.sketch);
      img.setAttribute('preserveAspectRatio','none');
      img.setAttribute('x',g.x); img.setAttribute('y',g.y);
      img.setAttribute('width',g.w); img.setAttribute('height',g.h);
      img.style.display='';
      const da=$('tafDragArea');
      if(da){
        da.setAttribute('x',X(p.x)); da.setAttribute('y',Y(p.y));
        da.setAttribute('width',P(p.w)); da.setAttribute('height',P(p.h));
        da.style.display='';
      }
    } else {
      img.style.display='none';
      const da=$('tafDragArea'); if(da) da.style.display='none';
    }

    /* Die Clipart wird in der Vorschau aus denselben Pfaden gezeichnet, die
       spaeter exportiert werden — sonst bestellt der Kunde etwas anderes,
       als er sieht. */
    const art=$('tafPortraitArt');
    if(st.art && st.art.d && p){
      const g=portraitGeom();
      art.innerHTML=`<g transform="translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) `
        + `scale(${(g.w/st.art.tw).toFixed(5)} ${(g.h/st.art.th).toFixed(5)})">`
        + artPathMarkup(ENG)+`</g>`;
    } else art.innerHTML='';

    $('tafEng').innerHTML=engravingMarkup();
    shrinkToFit();
    $('tafDimCaption').textContent=`${REAL.w} × ${REAL.h} mm · ${String(REAL.thick).replace('.',',')} mm Edelstahl, geschliffen`;
  }

  /* ---------- Foto -> Linienzeichnung (Dodge-Verfahren, komplett lokal) ---------- */
  function toGray(d){ const g=new Float32Array(d.length/4);
    for(let i=0,j=0;i<d.length;i+=4,j++) g[j]=.299*d[i]+.587*d[i+1]+.114*d[i+2];
    return g; }

  function boxBlur(src,w,h,r){
    const tmp=new Float32Array(src.length), out=new Float32Array(src.length), win=2*r+1;
    for(let y=0;y<h;y++){ let acc=0; const o=y*w;
      for(let x=-r;x<=r;x++) acc+=src[o+Math.min(w-1,Math.max(0,x))];
      for(let x=0;x<w;x++){ tmp[o+x]=acc/win;
        acc+=src[o+Math.min(w-1,x+r+1)]-src[o+Math.min(w-1,Math.max(0,x-r))]; } }
    for(let x=0;x<w;x++){ let acc=0;
      for(let y=-r;y<=r;y++) acc+=tmp[Math.min(h-1,Math.max(0,y))*w+x];
      for(let y=0;y<h;y++){ out[y*w+x]=acc/win;
        acc+=tmp[Math.min(h-1,y+r+1)*w+x]-tmp[Math.min(h-1,Math.max(0,y-r))*w+x]; } }
    return out;
  }

  function sharpness(g,w,h){
    let s=0,n=0;
    for(let y=1;y<h-1;y+=2) for(let x=1;x<w-1;x+=2){
      const i=y*w+x;
      s+=Math.abs(4*g[i]-g[i-1]-g[i+1]-g[i-w]-g[i+w]); n++;
    }
    return n?s/n:0;
  }

  function makeSketch(img,strength,opts){
    /* opts.max: Aufloesung; opts.gray: deckendes Schwarz-auf-Weiss statt der
       getoenten, transparenten Vorschau — das ist die Datei fuer den Laser;
       opts.rad: Weichzeichner-Radius in Pixeln. Ohne Vorgabe haengt er an der
       Bildgroesse — wer nur einen AUSSCHNITT rechnet (Gravur-Export), muss ihn
       mitgeben, sonst faellt die Zeichnung feiner aus als in der Vorschau.
       img darf ein <img> oder ein Canvas sein. */
    const NW=img.naturalWidth||img.width, NH=img.naturalHeight||img.height;
    const MAX=(opts&&opts.max)||1000, sc=Math.min(1,MAX/Math.max(NW,NH));
    const w=Math.max(1,Math.round(NW*sc)), h=Math.max(1,Math.round(NH*sc));
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const cx=c.getContext('2d',{willReadFrequently:true});
    /* Erst ohne Unterlage zeichnen und stichprobenartig die Deckkraft pruefen:
       so erkennen wir freigestellte Fotos und koennen es dem Kunden bestaetigen. */
    cx.drawImage(img,0,0,w,h);
    let cut=false;
    { const d=cx.getImageData(0,0,w,h).data;
      for(let i=3;i<d.length;i+=4*499){ if(d[i]<250){ cut=true; break; } } }
    /* Freigestellte Fotos (PNG mit transparentem Hintergrund) wuerden sonst als
       Schwarz gelesen und die ganze Flaeche vollzeichnen. Weiss unterlegen —
       dann bleibt der leere Hintergrund wirklich leer, und der Stift zeichnet
       NUR die Person. */
    cx.clearRect(0,0,w,h);
    cx.fillStyle='#fff'; cx.fillRect(0,0,w,h);
    cx.drawImage(img,0,0,w,h);
    const id=cx.getImageData(0,0,w,h), g0=toGray(id.data);
    const sharp=sharpness(g0,w,h);
    /* Dunkle Handyfotos und flaue Scans spreizen: ohne das findet das
       Dodge-Verfahren kaum Kanten und das Gesicht bleibt matschig. */
    const g=stretchContrast(g0);
    const inv=new Float32Array(g.length);
    for(let i=0;i<g.length;i++) inv[i]=255-g[i];
    const R=(opts&&opts.rad)||Math.max(2,Math.round(Math.min(w,h)/90));
    const bl=boxBlur(boxBlur(inv,w,h,R),w,h,R);
    // Color-Dodge: helle Flaechen brennen aus, nur Kanten bleiben stehen
    const k=(strength-30)/60;               // 0..1
    const gamma=2.6-1.7*k, floor=250-70*k;  // kraeftiger = dunklere, dickere Linien
    const gray=!!(opts&&opts.gray);
    const er=parseInt(ENG.slice(1,3),16), eg=parseInt(ENG.slice(3,5),16), eb=parseInt(ENG.slice(5,7),16);
    let bx0=w, by0=h, bx1=-1, by1=-1;    // a tenyleges rajz hatarai
    for(let i=0;i<g.length;i++){
      const den=255-bl[i];
      let v=den<=1?255:Math.min(255,g[i]*255/den);
      let a=v>=floor?0:Math.pow((floor-v)/floor,1/gamma)*255;
      a=Math.max(0,Math.min(255,a));
      if(a>28){                       // ide mar rajzolt a ceruza
        const qx=i%w, qy=(i/w)|0;
        if(qx<bx0)bx0=qx; if(qx>bx1)bx1=qx;
        if(qy<by0)by0=qy; if(qy>by1)by1=qy;
      }
      const o=i*4;
      if(gray){ const t=Math.round(255-a); id.data[o]=id.data[o+1]=id.data[o+2]=t; id.data[o+3]=255; }
      else { id.data[o]=er; id.data[o+1]=eg; id.data[o+2]=eb; id.data[o+3]=a; }
    }
    cx.putImageData(id,0,0);
    // A hatarok 0..1 aranyban, hogy fuggetlenek legyenek a felbontastol.
    const box=(bx1>=bx0&&by1>=by0)
      ? {x:bx0/w, y:by0/h, w:(bx1-bx0+1)/w, h:(by1-by0+1)/h} : null;
    return {url:c.toDataURL('image/png'),canvas:c,sharp,cut,box,rad:R,
            w:NW,h:NH};
  }

  /* ---------- Foto -> echte Vektor-Clipart ---------- */
  /* Die Dodge-Linienzeichnung bleibt ein Bild: der Laser rastert sie Zeile fuer
     Zeile, und wer sie vergroessert, sieht Pixel. Eine Clipart aus echten Pfaden
     ist dagegen Vektor — LightBurn faehrt Konturen ab, jede Groesse bleibt sauber.
     Deshalb tracen wir selbst, komplett lokal und ohne Bibliothek:
     Otsu-Schwelle -> Flecken putzen -> Pixelkanten zu Schleifen -> Douglas-Peucker
     -> weiche Quadratik-Kurven. */

  function otsuThreshold(gray){
    const hist=new Uint32Array(256);
    for(let i=0;i<gray.length;i++) hist[Math.max(0,Math.min(255,gray[i]|0))]++;
    const total=gray.length;
    let sum=0; for(let t=0;t<256;t++) sum+=t*hist[t];
    let sumB=0,wB=0,best=-1,thr=128;
    for(let t=0;t<256;t++){
      wB+=hist[t]; if(!wB) continue;
      const wF=total-wB; if(!wF) break;
      sumB+=t*hist[t];
      const mB=sumB/wB, mF=(sum-sumB)/wF, between=wB*wF*(mB-mF)*(mB-mF);
      if(between>best){ best=between; thr=t; }
    }
    return thr;
  }

  /* Einzelne Streupixel wuerden hunderte Mini-Pfade erzeugen. Wer kleiner ist
     als die Mindestflaeche, wird der Umgebung zugeschlagen — bei BEIDEN Farben,
     sonst bleiben Naselocher im Gesicht stehen. */
  function despeckle(m,w,h,minArea){
    const lab=new Int32Array(w*h).fill(-1), sizes=[], stack=[];
    let comp=0;
    for(let i=0;i<m.length;i++){
      if(lab[i]>=0) continue;
      const v=m[i]; let n=0; stack.length=0; stack.push(i); lab[i]=comp;
      while(stack.length){
        const p=stack.pop(); n++;
        const x=p%w, y=(p/w)|0;
        if(x>0     && lab[p-1]<0 && m[p-1]===v){ lab[p-1]=comp; stack.push(p-1); }
        if(x<w-1   && lab[p+1]<0 && m[p+1]===v){ lab[p+1]=comp; stack.push(p+1); }
        if(y>0     && lab[p-w]<0 && m[p-w]===v){ lab[p-w]=comp; stack.push(p-w); }
        if(y<h-1   && lab[p+w]<0 && m[p+w]===v){ lab[p+w]=comp; stack.push(p+w); }
      }
      sizes.push(n); comp++;
    }
    for(let i=0;i<m.length;i++) if(sizes[lab[i]]<minArea) m[i]=m[i]?0:1;
    return m;
  }

  /* Jede Grenze zwischen Vorder- und Hintergrundpixel ist eine Einheitskante.
     Gerichtet gesammelt und an den Ecken verkettet ergeben sie geschlossene
     Schleifen — Aussenkanten und Loecher gleichermassen. Mit fill-rule=evenodd
     stanzen sich die Loecher von selbst aus. */
  function traceLoops(m,w,h){
    const stride=w+1, edges=new Map();
    const at=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:m[y*w+x];
    const push=(x0,y0,x1,y1)=>{
      const k=y0*stride+x0, a=edges.get(k);
      if(a) a.push([x1,y1]); else edges.set(k,[[x1,y1]]);
    };
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      if(!m[y*w+x]) continue;
      if(!at(x,y-1)) push(x,y,x+1,y);
      if(!at(x+1,y)) push(x+1,y,x+1,y+1);
      if(!at(x,y+1)) push(x+1,y+1,x,y+1);
      if(!at(x-1,y)) push(x,y+1,x,y);
    }
    const loops=[];
    for(const [k,arr] of edges){
      const sx=k%stride, sy=(k/stride)|0;
      while(arr.length){
        const pts=[[sx,sy]];
        let cur=arr.pop(), guard=0;
        while(cur && guard++<400000){
          pts.push(cur);
          if(cur[0]===sx && cur[1]===sy) break;
          const na=edges.get(cur[1]*stride+cur[0]);
          if(!na || !na.length) break;
          cur=na.pop();
        }
        if(pts.length>5){
          const f=pts[0], l=pts[pts.length-1];
          if(f[0]===l[0] && f[1]===l[1]) pts.pop();
          loops.push(pts);
        }
      }
    }
    return loops;
  }

  function simplifyRing(pts,eps){
    const n=pts.length;
    if(n<4) return pts;
    const keep=new Uint8Array(n); keep[0]=keep[n-1]=1;
    const stack=[[0,n-1]];
    while(stack.length){
      const seg=stack.pop(), a=seg[0], b=seg[1];
      if(b<=a+1) continue;
      const ax=pts[a][0], ay=pts[a][1], dx=pts[b][0]-ax, dy=pts[b][1]-ay;
      const len=Math.hypot(dx,dy)||1;
      let best=-1, bi=-1;
      for(let i=a+1;i<b;i++){
        const d=Math.abs((pts[i][0]-ax)*dy-(pts[i][1]-ay)*dx)/len;
        if(d>best){ best=d; bi=i; }
      }
      if(best>eps){ keep[bi]=1; stack.push([a,bi],[bi,b]); }
    }
    const out=[];
    for(let i=0;i<n;i++) if(keep[i]) out.push(pts[i]);
    return out;
  }

  /* Treppenstufen weichzeichnen: der Pfad laeuft ueber die Kantenmitten, die
     Ecke selbst wird zum Kontrollpunkt. Aus dem Pixelrand wird eine Rundung. */
  function ringPath(pts){
    const n=pts.length;
    if(n<3) return '';
    const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
    const m0=mid(pts[n-1],pts[0]);
    let d='M'+m0[0].toFixed(2)+' '+m0[1].toFixed(2);
    for(let i=0;i<n;i++){
      const c=pts[i], m=mid(c,pts[(i+1)%n]);
      d+='Q'+c[0].toFixed(2)+' '+c[1].toFixed(2)+' '+m[0].toFixed(2)+' '+m[1].toFixed(2);
    }
    return d+'Z';
  }

  function makeClipart(img,strength){
    const MAX=560, sc=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
    const w=Math.max(1,Math.round(img.naturalWidth*sc)), h=Math.max(1,Math.round(img.naturalHeight*sc));
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const cx=c.getContext('2d',{willReadFrequently:true});
    cx.drawImage(img,0,0,w,h);
    const g=toGray(cx.getImageData(0,0,w,h).data);
    const sharp=sharpness(g,w,h);
    const bl=boxBlur(g,w,h,Math.max(1,Math.round(Math.min(w,h)/150)));
    /* Otsu trennt Motiv und Hintergrund von selbst; der Regler verschiebt die
       Schwelle nur noch, damit der Kunde mehr oder weniger Flaeche bekommt. */
    const thr=otsuThreshold(bl)+(strength-60)*1.7;
    const m=new Uint8Array(w*h);
    for(let i=0;i<m.length;i++) m[i]=bl[i]<thr?1:0;
    const det=(st.detail==null?55:st.detail)/100;
    despeckle(m,w,h,Math.max(6,Math.round(w*h*(0.0022-det*0.0019))));
    const loops=traceLoops(m,w,h);
    const eps=0.5+((st.smooth==null?45:st.smooth)/100)*1.5;
    let d='', nodes=0, paths=0;
    for(const lp of loops){
      const s=simplifyRing(lp,eps);
      if(s.length<3) continue;
      nodes+=s.length; paths++; d+=ringPath(s);
    }
    return {d,tw:w,th:h,nodes,paths,sharp,w:img.naturalWidth,h:img.naturalHeight};
  }

  /* ---------- Foto -> Vektor-Strichzeichnung ---------- */
  /* Flaechen muss der Laser zeilenweise ausfuellen, Striche faehrt er einfach ab:
     schneller, weniger Waerme im Blech, und das Motiv bleibt lesbar. Wir suchen
     die Kanten also als LINIEN, nicht als Flecken: Differenz zweier Unschaerfen
     (Difference of Gaussians) findet, wo es dunkler ist als die Umgebung, die
     Skelettierung duennt das auf einen Pixel aus, und die Verfolgung macht daraus
     Polylinien. */

  /* Nur Vordergrund-Krimskrams entfernen — anders als beim Clipart darf hier
     NICHTS zugeschuettet werden, sonst wachsen die Linien zu Flaechen zusammen. */
  function dropSmallFg(m,w,h,minArea){
    const lab=new Int32Array(w*h).fill(-1), sizes=[], stack=[];
    let comp=0;
    for(let i=0;i<m.length;i++){
      if(!m[i]||lab[i]>=0) continue;
      let n=0; stack.length=0; stack.push(i); lab[i]=comp;
      while(stack.length){
        const p=stack.pop(); n++;
        const x=p%w, y=(p/w)|0;
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
          const a=x+dx, b=y+dy;
          if(a<0||b<0||a>=w||b>=h) continue;
          const q=b*w+a;
          if(m[q] && lab[q]<0){ lab[q]=comp; stack.push(q); }
        }
      }
      sizes.push(n); comp++;
    }
    for(let i=0;i<m.length;i++) if(m[i] && sizes[lab[i]]<minArea) m[i]=0;
    return m;
  }

  /* Zhang-Suen: duennt die Kantenbaender auf eine Pixelbreite aus, ohne die
     Linien zu zerreissen. */
  function thin(m,w,h){
    const at=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:m[y*w+x];
    const del=[];
    let changed=true, guard=0;
    while(changed && guard++<40){
      changed=false;
      for(let step=0;step<2;step++){
        del.length=0;
        for(let y=0;y<h;y++) for(let x=0;x<w;x++){
          if(!m[y*w+x]) continue;
          const p2=at(x,y-1),p3=at(x+1,y-1),p4=at(x+1,y),p5=at(x+1,y+1),
                p6=at(x,y+1),p7=at(x-1,y+1),p8=at(x-1,y),p9=at(x-1,y-1);
          const B=p2+p3+p4+p5+p6+p7+p8+p9;
          if(B<2||B>6) continue;
          const s=[p2,p3,p4,p5,p6,p7,p8,p9,p2];
          let A=0;
          for(let i=0;i<8;i++) if(s[i]===0&&s[i+1]===1) A++;
          if(A!==1) continue;
          if(step===0){ if(p2*p4*p6) continue; if(p4*p6*p8) continue; }
          else       { if(p2*p4*p8) continue; if(p2*p6*p8) continue; }
          del.push(y*w+x);
        }
        if(del.length){ changed=true; for(let i=0;i<del.length;i++) m[del[i]]=0; }
      }
    }
    return m;
  }

  /* Erst von den Enden her verfolgen, damit die Striche ganz bleiben; was dann
     noch uebrig ist, sind geschlossene Ringe. Gerade Nachbarn vor den
     diagonalen — sonst zickzackt die Linie durch das Pixelgitter. */
  function tracePolylines(m,w,h,minLen){
    const NB=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];
    const at=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:m[y*w+x];
    const used=new Uint8Array(w*h), lines=[];
    const degree=(x,y)=>{ let c=0; for(const d of NB) c+=at(x+d[0],y+d[1]); return c; };
    function walk(sx,sy){
      const pts=[[sx,sy]]; used[sy*w+sx]=1;
      let x=sx,y=sy;
      for(;;){
        let nx=-1,ny=-1;
        for(const d of NB){
          const a=x+d[0], b=y+d[1];
          if(at(a,b) && !used[b*w+a]){ nx=a; ny=b; break; }
        }
        if(nx<0) break;
        used[ny*w+nx]=1; pts.push([nx,ny]); x=nx; y=ny;
      }
      if(pts.length>=minLen) lines.push(pts);
    }
    for(let y=0;y<h;y++) for(let x=0;x<w;x++)
      if(m[y*w+x] && !used[y*w+x] && degree(x,y)===1) walk(x,y);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++)
      if(m[y*w+x] && !used[y*w+x]) walk(x,y);
    return lines;
  }

  /* Offener Streckenzug, an den Kantenmitten weich gefuehrt; Anfang und Ende
     bleiben stehen, damit die Linie nicht schrumpft. */
  function polyPath(pts){
    const n=pts.length;
    if(n<2) return '';
    const f=v=>v.toFixed(2);
    if(n===2) return `M${f(pts[0][0])} ${f(pts[0][1])}L${f(pts[1][0])} ${f(pts[1][1])}`;
    let d=`M${f(pts[0][0])} ${f(pts[0][1])}`;
    for(let i=1;i<n-1;i++){
      const c=pts[i];
      d+=`Q${f(c[0])} ${f(c[1])} ${f((c[0]+pts[i+1][0])/2)} ${f((c[1]+pts[i+1][1])/2)}`;
    }
    return d+`L${f(pts[n-1][0])} ${f(pts[n-1][1])}`;
  }

  /* Dunkle Handyfotos und flaue Scans liefern sonst kaum Kanten: die Grauwerte
     werden zwischen dem 2%- und 98%-Perzentil auf die volle Skala gespreizt. */
  function stretchContrast(g){
    const hist=new Uint32Array(256);
    for(let i=0;i<g.length;i++) hist[Math.max(0,Math.min(255,g[i]|0))]++;
    const n=g.length; let lo=0,hi=255,acc=0;
    for(let t=0;t<256;t++){ acc+=hist[t]; if(acc>=n*0.02){ lo=t; break; } }
    acc=0;
    for(let t=255;t>=0;t--){ acc+=hist[t]; if(acc>=n*0.02){ hi=t; break; } }
    if(hi-lo<30) return g;
    const k=255/(hi-lo), out=new Float32Array(n);
    for(let i=0;i<n;i++) out[i]=Math.max(0,Math.min(255,(g[i]-lo)*k));
    return out;
  }

  function makeLineArt(img,strength){
    /* Hoeher aufgeloest getraced als frueher: erst so ueberleben Wimpern und
       Haarstraehnen die Skelettierung. Die Striche bleiben trotzdem duenn,
       weil die Strichstaerke in Trace-Pixeln gemessen und mitskaliert wird. */
    const MAX=780, sc=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
    const w=Math.max(1,Math.round(img.naturalWidth*sc)), h=Math.max(1,Math.round(img.naturalHeight*sc));
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const cx=c.getContext('2d',{willReadFrequently:true});
    cx.drawImage(img,0,0,w,h);
    const g0=toGray(cx.getImageData(0,0,w,h).data);
    const sharp=sharpness(g0,w,h);
    const g=stretchContrast(g0);
    const base=boxBlur(g,w,h,1);
    const r1=Math.max(1,Math.round(Math.min(w,h)/300));
    const b1=boxBlur(base,w,h,r1);
    const b2=boxBlur(base,w,h,Math.max(r1+1,Math.round(r1*2.9)));
    /* Hysterese statt harter Schwelle: eine kraeftige Kante (tauHi) zieht ihre
       schwaecheren Auslaeufer (tauLo) mit, sofern sie zusammenhaengen. So
       bleiben Linien GANZ, ohne dass freistehendes Rauschen mitkommt. */
    const tauHi=Math.max(1.8,12.5-(strength-30)*0.155);
    const tauLo=tauHi*0.42;
    const seed=[], cand=new Uint8Array(w*h), m=new Uint8Array(w*h);
    for(let i=0;i<cand.length;i++){
      const dd=b1[i]-b2[i];
      if(dd<-tauLo){ cand[i]=1; if(dd<-tauHi){ m[i]=1; seed.push(i); } }
    }
    while(seed.length){
      const p=seed.pop(), x=p%w, y=(p/w)|0;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
        const a=x+dx, b=y+dy;
        if(a<0||b<0||a>=w||b>=h) continue;
        const q=b*w+a;
        if(cand[q] && !m[q]){ m[q]=1; seed.push(q); }
      }
    }
    /* Detailgrad: wie kleine Inseln und wie kurze Striche ueberleben. */
    const det=(st.detail==null?55:st.detail)/100;
    dropSmallFg(m,w,h,Math.max(4,Math.round(w*h*(0.00055-det*0.00049))));
    thin(m,w,h);
    const minLen=Math.max(4,Math.round(Math.min(w,h)/(24+det*66)));
    const lines=tracePolylines(m,w,h,minLen);
    const eps=0.35+((st.smooth==null?45:st.smooth)/100)*1.5;
    let d='', nodes=0, paths=0;
    for(const lp of lines){
      const s=simplifyRing(lp,eps);
      if(s.length<2) continue;
      nodes+=s.length; paths++; d+=polyPath(s);
    }
    const stroke=Math.max(.6,1.3*((st.lw==null?100:st.lw)/100));
    return {d,tw:w,th:h,stroke,nodes,paths,sharp,w:img.naturalWidth,h:img.naturalHeight};
  }

  function msg(kind,txt){ const m=$('tafPhotoMsg'); m.className='photo-msg '+kind; m.textContent=txt; }

  let photoImg=null;
  /* Automatikus illesztes: a rajz TARTALMAT igazitjuk a kerethez, nem a
     kepfajl szeleit. Egy fenykepen a szemely gyakran nem kozepen all, es sok
     ures hely veszi korul -- sima cover-illesztessel az ures resz foglalna el
     a keret felet. Innen indul a vasarlo, es onnan huzassal finomit. */
  function autoFitPhoto(){
    const b=st.sketchBox, p=port();
    if(!b || !p){ st.px=50; st.crop=32; st.pz=1; return; }
    const rw=P(p.w), rh=P(p.h);
    const a=(st.sketchW&&st.sketchH)?st.sketchW/st.sketchH:rw/rh;
    let w0,h0;
    if(a>rw/rh){ h0=rh; w0=rh*a; } else { w0=rw; h0=rw/a; }
    // Mennyit kell nagyitani, hogy a tartalom kitoltse a keretet? Kis levegot
    // hagyunk (FILL), es sosem kicsinyitunk 1 ala -- az ures szelet adna.
    const FILL=0.94;
    const z=Math.max(0.3, Math.min(3,
      Math.min(rw*FILL/Math.max(1e-6,b.w*w0), rh*FILL/Math.max(1e-6,b.h*h0))));
    st.pz=z;
    const w=w0*z, h=h0*z, cx=b.x+b.w/2, cy=b.y+b.h/2, dw=rw-w, dh=rh-h;
    const cl=v=>Math.max(0,Math.min(100,v));
    st.px  = Math.abs(dw)<0.01 ? 50 : cl((rw/2-cx*w)/dw*100);
    st.crop= Math.abs(dh)<0.01 ? 50 : cl((rh/2-cy*h)/dh*100);
    syncPhotoUI();
  }
  function syncPhotoUI(){
    const c=$('tafCropRange'), z=$('tafZoomRange');
    if(c){ c.value=Math.round(st.crop); const o=$('tafCropValue'); if(o) o.value=c.value; }
    if(z){ z.value=Math.round((st.pz||1)*100); const o=$('tafZoomValue'); if(o) o.value=z.value+'%'; }
  }

  function applyPhoto(isNew){
    if(!photoImg) return;
    /* Es gibt nur noch einen Stil: die weiche Bleistift-Zeichnung. */
    const r=makeSketch(photoImg,st.line);
    st.sketch=r.url; st.art=null;
    st.sketchW=r.w; st.sketchH=r.h; st.sketchBox=r.box;
    if(isNew) autoFitPhoto();
    const small=Math.min(r.w,r.h)<900;
    const blurry=r.sharp<7;
    if(small&&blurry) msg('warn','Das Foto ist klein und wirkt unscharf — bitte ein größeres, schärferes Bild wählen.');
    else if(small) msg('warn',`Das Foto ist recht klein (${r.w}×${r.h} px). Für feine Linien sind mindestens 900 px auf der kurzen Seite besser.`);
    else if(blurry) msg('warn','Das Foto wirkt unscharf. Ein schärferes Bild gibt deutlich feinere Linien.');
    else if(r.cut) msg('ok','Freigestelltes Foto erkannt — gezeichnet wird nur die Person, der Hintergrund bleibt leer.');
    else msg('ok','Sieht gut aus — so wird euer Porträt graviert. Noch schöner: Foto vorher freistellen, dann bleibt nur die Person.');
    render();
  }

  /* Der Regler rechnet das ganze Bild neu — waehrend des Ziehens nur den
     Wert anzeigen, gerechnet wird erst, wenn der Finger kurz ruht. */
  let reTimer=0;
  function reprocess(){ clearTimeout(reTimer); reTimer=setTimeout(()=>{ if(photoImg) applyPhoto(); },140); }

  /* ---------- Das Portrait als Gravur-Datei ---------- */
  /* Am Bildschirm ist die weiche Graustufen-Zeichnung schoen — als Vorlage
     fuer den Laser ist sie die schlechtere Datei. LightBurn muesste die
     Grauwerte selbst in Punkte aufloesen, auf einem Pixelraster, das nicht zum
     Zeilenabstand passt: Moire, zugelaufene Mitteltoene, matschiges Gesicht.
     Deshalb kommt das Portrait fertig aufbereitet aus dem Konfigurator:

       1. exakt in der Groesse des Portraitfeldes und im Zeilenraster des
          Gravierers gerechnet — ein Bildpunkt ist ein Laserpunkt, LightBurn
          rechnet nichts um und skaliert nichts,
       2. genau der Ausschnitt, den der Kunde sieht (Zoom und Verschiebung
          inbegriffen), ausserhalb des — beim Jahrestag runden — Feldes weiss;
          einen clip-path kennt LightBurn naemlich nicht,
       3. Tonwertkorrektur gegen den Punktzuwachs: ein Laserpunkt brennt
          breiter, als er gerechnet ist,
       4. 1 Bit schwarz auf weiss mit Floyd-Steinberg, wobei kraeftige Linien
          geschlossen bleiben und helle Flaechen wirklich leer.

     In LightBurn danach nur noch: Bildmodus "Threshold" (NICHT noch einmal
     dithern) und Zeilenabstand 0,04 mm. Das steht auch im <desc> der Datei. */

  /* 0,04 mm je Pixel = 635 dpi: der Zeilenabstand, mit dem die Tafel graviert
     wird. Feiner braeuchte der Faserlaser nicht, gruober saehe man das Raster. */
  const ENG_MM_PER_PX=0.04/K, ENG_DPI=Math.round(25.4/(ENG_MM_PER_PX*K));   // im Entwurfsraum; auf der echten Tafel genau 0,04 mm
  /* Punktzuwachs-Ausgleich: >1 nimmt den Mitteltoenen Deckung weg. */
  const ENG_GAIN=1.22;

  /* Wo das Foto im Portraitfeld liegt — dieselbe Rechnung wie portraitGeom(),
     nur in Pixeln der Zielleinwand. Der alte Export kannte nur die senkrechte
     Verschiebung und hat Zoom und Seitenversatz ignoriert; graviert wurde dann
     ein anderer Ausschnitt als der bestellte. */
  function portraitPlacement(outW){
    const p=port(); if(!p) return null;
    const rw=P(p.w), rh=P(p.h), K=outW/rw;
    const a=(st.sketchW&&st.sketchH)?st.sketchW/st.sketchH:rw/rh;
    let w,h;
    if(a>rw/rh){ h=rh; w=rh*a; } else { w=rw; h=rw/a; }
    w*=(st.pz||1); h*=(st.pz||1);
    const fx=(st.px==null?50:st.px)/100, fy=(st.crop==null?32:st.crop)/100;
    return {x:(rw-w)*fx*K, y:(rh-h)*fy*K, w:w*K, h:h*K};
  }

  /* Alles ausserhalb des — beim Jahrestag runden — Feldes wird weiss. Von Hand
     gerechnet statt mit einem Canvas-Pfad: dessen weiche Kante wuerde beim
     Dithern zu einzelnen schwarzen Punkten JENSEITS des Rahmens gerinnen
     (gemessen: 7 Stueck). So bleibt der Rand exakt. */
  function maskField(cx,w,h,p){
    const r=Math.min(Math.min(w,h)/2,(p.rx||0)/ENG_MM_PER_PX);
    if(r<0.5) return;
    const id=cx.getImageData(0,0,w,h), d=id.data, r2=r*r;
    for(let y=0;y<h;y++){
      const py=y+0.5, dy=py<r?r-py:(py>h-r?py-(h-r):0);
      if(!dy) continue;
      for(let x=0;x<w;x++){
        const px=x+0.5, dx=px<r?r-px:(px>w-r?px-(w-r):0);
        if(dx && dx*dx+dy*dy>r2){ const o=(y*w+x)*4; d[o]=d[o+1]=d[o+2]=255; d[o+3]=255; }
      }
    }
    cx.putImageData(id,0,0);
  }

  /* Floyd-Steinberg im Zickzack (weniger Wurmmuster). Zwei Schutzzonen: was
     schon fast schwarz ist, wird ganz schwarz — sonst zerfiele eine feine
     Haarlinie in gestrichelte Punkte; was fast weiss ist, bleibt leer, damit
     der Laser nicht ueber die ganze Flaeche Staub streut. */
  function ditherForLaser(cx,w,h){
    const id=cx.getImageData(0,0,w,h), d=id.data, n=w*h;
    const src=new Float32Array(n), v=new Float32Array(n);
    for(let i=0,j=0;i<d.length;i+=4,j++){
      const cov=(255-(.299*d[i]+.587*d[i+1]+.114*d[i+2]))/255;
      src[j]=v[j]=255-255*Math.pow(Math.max(0,cov),ENG_GAIN);
    }
    const SOLID=90, CLEAR=242;
    for(let y=0;y<h;y++){
      const l2r=(y&1)===0;
      for(let k=0;k<w;k++){
        const x=l2r?k:w-1-k, i=y*w+x;
        let val, err=0;
        if(src[i]<=SOLID) val=0;
        else if(src[i]>=CLEAR) val=255;
        else { val=v[i]<128?0:255; err=v[i]-val; }
        v[i]=val;
        if(err){
          const s=l2r?1:-1, xr=x+s, xl=x-s;
          if(xr>=0&&xr<w) v[i+s]+=err*7/16;
          if(y+1<h){
            const b=i+w;
            if(xl>=0&&xl<w) v[b-s]+=err*3/16;
            v[b]+=err*5/16;
            if(xr>=0&&xr<w) v[b+s]+=err*1/16;
          }
        }
      }
    }
    for(let i=0,j=0;i<d.length;i+=4,j++){
      const t=v[j]<128?0:255;
      d[i]=d[i+1]=d[i+2]=t; d[i+3]=255;
    }
    cx.putImageData(id,0,0);
  }

  /* opts.smooth = die weiche Graustufen-Fassung (Vorschau und Kunden-Download),
     sonst die gerasterte Gravur-Datei. */
  function engraveCanvas(opts){
    const p=port();
    if(!photoImg||!p) return null;
    const outW=Math.max(1,Math.round(p.w/ENG_MM_PER_PX)),
          outH=Math.max(1,Math.round(p.h/ENG_MM_PER_PX));
    const g=portraitPlacement(outW); if(!g) return null;
    /* Erst den sichtbaren Ausschnitt in Gravurgroesse ausschneiden, dann
       zeichnen — das ganze Foto in dieser Aufloesung zu rechnen waere ein
       Vielfaches an Speicher fuer Pixel, die niemand graviert. Der Rand
       bekommt Zugabe, sonst sieht der Weichzeichner dort Weiss und die
       Zeichnung wuerde zum Rahmen hin ausbleichen. */
    const rad=Math.max(2,Math.round(Math.min(g.w,g.h)/90)), PAD=3*rad;
    const cc=document.createElement('canvas');
    cc.width=outW+2*PAD; cc.height=outH+2*PAD;
    const ccx=cc.getContext('2d');
    ccx.imageSmoothingEnabled=true; ccx.imageSmoothingQuality='high';
    ccx.drawImage(photoImg,g.x+PAD,g.y+PAD,g.w,g.h);
    const r=makeSketch(cc,st.line,{max:Math.max(cc.width,cc.height),gray:true,rad});
    const out=document.createElement('canvas');
    out.width=outW; out.height=outH;
    const cx=out.getContext('2d',{willReadFrequently:true});
    cx.fillStyle='#fff'; cx.fillRect(0,0,outW,outH);
    cx.drawImage(r.canvas,PAD,PAD,outW,outH,0,0,outW,outH);
    maskField(cx,outW,outH,p);
    if(!(opts&&opts.smooth)) ditherForLaser(cx,outW,outH);
    return out;
  }

  /* Der Kunde laedt die weiche Fassung herunter: die gerasterte saehe am
     Bildschirm wie Rauschen aus, obwohl sie im Stahl genauso aussieht. */
  function croppedSketchCanvas(){ return engraveCanvas({smooth:true}); }

  function downloadSketchPNG(){
    const out=croppedSketchCanvas();
    if(!out) return;
    const p=port();
    const el=document.createElement('a');
    el.href=out.toDataURL('image/png');
    el.download=p?`wolf-lasermark-bleistift-${p.w}x${p.h}mm.png`:'wolf-lasermark-bleistift.png';
    document.body.appendChild(el); el.click(); el.remove();
  }

  /* ---------- Text -> Pfade fuer den Gravur-Export ---------- */
  /* LightBurn importiert SVG-<text> ohne die eingebettete Schrift — die Datei
     saehe auf jedem Rechner anders aus. Deshalb werden die Buchstaben beim
     Export in echte Vektor-Umrisse gewandelt: exakt dieselben Schnitte
     (Cormorant Garamond / Inter, statische Gewichte von jsDelivr), Zeichen
     fuer Zeichen gesetzt, inklusive Laufweite und Kerning. */
  const EF={fonts:null,promise:null,
    URLS:{
      'cg-400':'https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@4.5.10/files/cormorant-garamond-latin-400-normal.woff',
      'cg-500':'https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@4.5.10/files/cormorant-garamond-latin-500-normal.woff',
      'cg-600':'https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@4.5.10/files/cormorant-garamond-latin-600-normal.woff',
      'cg-700':'https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@4.5.10/files/cormorant-garamond-latin-700-normal.woff',
      'cg-400i':'https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@4.5.10/files/cormorant-garamond-latin-400-italic.woff',
      'cg-500i':'https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond@4.5.10/files/cormorant-garamond-latin-500-italic.woff',
      'in-400':'https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.15/files/inter-latin-400-normal.woff',
      'in-500':'https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.15/files/inter-latin-500-normal.woff',
      'in-600':'https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.15/files/inter-latin-600-normal.woff'
    }};
  function ensureExportFonts(){
    if(EF.promise) return EF.promise;
    EF.promise=(async()=>{
      const loadScript=src=>new Promise((ok,bad)=>{
        const sc=document.createElement('script');
        sc.src=src; sc.onload=ok; sc.onerror=()=>bad(new Error(src+' nicht ladbar'));
        document.head.appendChild(sc);
      });
      if(!window.opentype) await loadScript('https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js');
      /* fuers Verschmelzen der Strich-Umrisse; wenn es fehlt, bleiben die
         Umrisse einzeln — Export funktioniert trotzdem */
      if(!window.polygonClipping){
        try{ await loadScript('https://cdn.jsdelivr.net/npm/polygon-clipping@0.15.7/dist/polygon-clipping.umd.js'); }
        catch(e){ console.error(e); }
      }
      const out={};
      await Promise.all(Object.keys(EF.URLS).map(async k=>{
        const r=await fetch(EF.URLS[k]);
        if(!r.ok) throw new Error('Font '+k);
        out[k]=opentype.parse(await r.arrayBuffer());
      }));
      EF.fonts=out;
    })();
    /* Bei Fehlern (offline, CDN weg) faellt der Export still auf <text>
       zurueck — Bestellungen duerfen daran nie scheitern. */
    EF.promise.catch(e=>console.error('Export-Fonts',e));
    return EF.promise;
  }
  function efKey(fam,weight,italic){
    const serif=/Cormorant/i.test(fam||'');
    const wgt=parseInt(weight||'400',10)||400;
    if(serif){
      if(italic) return wgt>=450?'cg-500i':'cg-400i';
      return wgt>=650?(wgt>=700?'cg-700':'cg-600'):(wgt>=550?'cg-600':(wgt>=450?'cg-500':'cg-400'));
    }
    return wgt>=550?'in-600':(wgt>=450?'in-500':'in-400');
  }
  /* Zeichenweise setzen wie der Browser: Advance + Kerning + letter-spacing,
     dann text-anchor durch Verschieben der Startposition. */
  function efTextPath(font,str,x,y,size,ls,anchor){
    const sc=size/font.unitsPerEm, glyphs=font.stringToGlyphs(str);
    let w=0;
    for(let i=0;i<glyphs.length;i++){
      w+=glyphs[i].advanceWidth*sc;
      if(i<glyphs.length-1){
        w+=ls;
        const k=font.getKerningValue(glyphs[i],glyphs[i+1]);
        if(k) w+=k*sc;
      }
    }
    let cx=x;
    if(anchor==='middle') cx=x-w/2; else if(anchor==='end') cx=x-w;
    let d='';
    for(let i=0;i<glyphs.length;i++){
      d+=glyphs[i].getPath(cx,y,size).toPathData(3);
      cx+=glyphs[i].advanceWidth*sc;
      if(i<glyphs.length-1){
        cx+=ls;
        const k=font.getKerningValue(glyphs[i],glyphs[i+1]);
        if(k) cx+=k*sc;
      }
    }
    return d;
  }
  function efConvert(root){
    if(!EF.fonts) return false;
    root.querySelectorAll('text').forEach(t=>{
      const str=t.textContent||'';
      if(!str.trim()){ t.remove(); return; }
      const font=EF.fonts[efKey(t.getAttribute('font-family'),t.getAttribute('font-weight'),
        (t.getAttribute('font-style')||'')==='italic')];
      const d=efTextPath(font,str,
        parseFloat(t.getAttribute('x'))||0, parseFloat(t.getAttribute('y'))||0,
        parseFloat(t.getAttribute('font-size'))||10,
        parseFloat(t.getAttribute('letter-spacing'))||0,
        t.getAttribute('text-anchor')||'start');
      const pth=document.createElementNS(NS,'path');
      pth.setAttribute('d',d);
      pth.setAttribute('data-t','1');
      pth.setAttribute('fill',t.getAttribute('fill')||ENG);
      const op=t.getAttribute('opacity'); if(op) pth.setAttribute('opacity',op);
      t.replaceWith(pth);
    });
    return true;
  }

  /* ---------- Striche -> verschmolzene Doppel-Umrisse ---------- */
  /* Ein Strich wird beidseitig um die halbe Staerke versetzt und geschlossen —
     erst so laesst er sich als Flaeche FUELLEN. Alle Umrisse werden danach
     boolesch VEREINIGT (polygon-clipping): wo sich Linien kreuzen oder Kreise
     und Verbinder beruehren, gehen die Konturen sauber ineinander ueber,
     statt sich zu ueberlagern und beim Fuellen Loecher zu stanzen. */
  function efOutlineRings(runs,w2){
    const polys=[];
    for(const pts of runs){
      const n=pts.length;
      if(n<2) continue;
      const closed=Math.hypot(pts[0][0]-pts[n-1][0],pts[0][1]-pts[n-1][1])<w2*0.5;
      const m=closed?n-1:n;
      const nx=new Float64Array(m), ny=new Float64Array(m);
      for(let i=0;i<m;i++){
        const a=closed?pts[(i-1+m)%m]:pts[Math.max(0,i-1)];
        const b=closed?pts[(i+1)%m]:pts[Math.min(n-1,i+1)];
        const dx=b[0]-a[0], dy=b[1]-a[1];
        const L=Math.hypot(dx,dy)||1;
        nx[i]=-dy/L; ny[i]=dx/L;
      }
      if(closed){
        /* Ring: Aussenkontur plus gegenlaeufige Innenkontur — die Doppellinie.
           Welche Seite aussen liegt, haengt von der Laufrichtung des Pfads ab:
           deshalb entscheidet die FLAECHE, nicht die Versatzrichtung — sonst
           haelt polygon-clipping das Loch fuer die Aussenkontur und
           verwirft den Ring als ungueltig. */
        const outer=[], inner=[];
        for(let i=0;i<m;i++) outer.push([pts[i][0]+nx[i]*w2,pts[i][1]+ny[i]*w2]);
        for(let i=m-1;i>=0;i--) inner.push([pts[i][0]-nx[i]*w2,pts[i][1]-ny[i]*w2]);
        const area=r=>{let a=0;for(let i=0;i<r.length;i++){const p=r[i],q=r[(i+1)%r.length];a+=p[0]*q[1]-q[0]*p[1];}return Math.abs(a)/2;};
        polys.push(area(inner)>area(outer)?[inner,outer]:[outer,inner]);
      } else {
        /* offener Zug: Band mit runden Kappen an beiden Enden */
        const ring=[];
        for(let i=0;i<m;i++) ring.push([pts[i][0]+nx[i]*w2,pts[i][1]+ny[i]*w2]);
        const e=pts[m-1];
        for(let k=1;k<8;k++){
          const a=Math.atan2(ny[m-1],nx[m-1])-Math.PI*k/8;
          ring.push([e[0]+Math.cos(a)*w2,e[1]+Math.sin(a)*w2]);
        }
        for(let i=m-1;i>=0;i--) ring.push([pts[i][0]-nx[i]*w2,pts[i][1]-ny[i]*w2]);
        const s0=pts[0];
        for(let k=1;k<8;k++){
          const a=Math.atan2(-ny[0],-nx[0])-Math.PI*k/8;
          ring.push([s0[0]+Math.cos(a)*w2,s0[1]+Math.sin(a)*w2]);
        }
        polys.push([ring]);
      }
    }
    return polys;
  }
  /* simplifyRing ankert an den Endpunkten — bei polygon-clipping-Ringen sind
     Anfang und Ende aber DERSELBE Punkt (Null-Sehne), und alles kollabiert.
     Deshalb: Duplikat entfernen, am entferntesten Punkt aufschneiden und die
     beiden offenen Haelften einzeln vereinfachen. */
  function efSimplifyClosed(r,eps){
    let n=r.length;
    if(n>1&&Math.hypot(r[0][0]-r[n-1][0],r[0][1]-r[n-1][1])<1e-9){ r=r.slice(0,-1); n--; }
    if(n<6) return r;
    let far=1,best=-1;
    for(let i=1;i<n;i++){
      const d=(r[i][0]-r[0][0])*(r[i][0]-r[0][0])+(r[i][1]-r[0][1])*(r[i][1]-r[0][1]);
      if(d>best){ best=d; far=i; }
    }
    const a=simplifyRing(r.slice(0,far+1),eps);
    const b=simplifyRing(r.slice(far).concat([r[0]]),eps);
    return a.concat(b.slice(1,-1));
  }
  function efPolysToPath(mp){
    const f=v=>v.toFixed(2);
    let d='';
    for(const poly of mp) for(let ring of poly){
      if(ring.length>8) ring=efSimplifyClosed(ring,0.05);
      d+='M'+ring.map(p=>f(p[0])+' '+f(p[1])).join('L')+'Z';
    }
    return d;
  }
  /* Icons sitzen in translate/scale-Gruppen: vor dem Vereinigen muessen alle
     Punkte in denselben Koordinatenraum. */
  function efXform(el,root){
    const chain=[];
    for(let n=el;n&&n.getAttribute;n=n.parentNode){
      const t=n.getAttribute('transform');
      if(t){
        const ops=[]; const re=/(translate|scale)\(([^)]*)\)/g; let m;
        while((m=re.exec(t))) ops.push([m[1],m[2].split(/[\s,]+/).map(Number)]);
        chain.push(ops);
      }
      if(n===root) break;
    }
    return p=>{
      let x=p[0], y=p[1];
      for(const ops of chain)               // von innen nach aussen
        for(let i=ops.length-1;i>=0;i--){   // im Attribut von rechts nach links
          const k=ops[i][0], a=ops[i][1];
          if(k==='scale'){ x*=a[0]; y*=(a.length>1?a[1]:a[0]); }
          else { x+=a[0]||0; y+=a[1]||0; }
        }
      return [x,y];
    };
  }
  let efMeas=null;
  function efSamplePath(d){
    if(!efMeas){
      const sv=document.createElementNS(NS,'svg');
      sv.setAttribute('width','0'); sv.setAttribute('height','0');
      sv.style.cssText='position:absolute;left:-9999px;top:-9999px';
      efMeas=document.createElementNS(NS,'path');
      sv.appendChild(efMeas); document.body.appendChild(sv);
    }
    efMeas.setAttribute('d',d);
    const L=efMeas.getTotalLength();
    if(!L) return [];
    const step=Math.min(0.3,L/24);
    const runs=[]; let run=[], prev=null;
    for(let t=0;t<=L+1e-6;t+=step){
      const p=efMeas.getPointAtLength(Math.min(t,L));
      /* Ein Sprung, der viel groesser ist als die Schrittweite, markiert den
         Wechsel zum naechsten Teilpfad (M mitten im d). */
      if(prev && Math.hypot(p.x-prev.x,p.y-prev.y)>step*4){
        if(run.length>1) runs.push(run);
        run=[];
      }
      run.push([p.x,p.y]); prev=p;
    }
    if(run.length>1) runs.push(run);
    return runs;
  }
  function efAttr(el,name){
    for(let n=el;n&&n.getAttribute;n=n.parentNode){
      const v=n.getAttribute(name);
      if(v!=null&&v!=='') return v;
    }
    return null;
  }
  function efStrokesToOutlines(root){
    const polys=[], doomed=[];
    root.querySelectorAll('path,circle').forEach(el=>{
      try{
        if(el.getAttribute('data-t')) return;   // schon konvertierter Text
        const isC=el.tagName.toLowerCase()==='circle';
        const stroke=efAttr(el,'stroke');
        const fill=el.getAttribute('fill');
        let out=null;
        if(stroke&&stroke!=='none'){
          let d=el.getAttribute('d');
          if(isC){
            const cx=+el.getAttribute('cx')||0, cy=+el.getAttribute('cy')||0, r=+el.getAttribute('r')||0;
            if(!r) return;
            d=`M${cx-r} ${cy}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
          }
          if(!d) return;
          const w2=(parseFloat(efAttr(el,'stroke-width')||'1'))/2;
          const runs=efSamplePath(d);
          if(!runs.length) return;
          out=efOutlineRings(runs,w2);
        } else if(isC&&fill&&fill!=='none'){
          /* gefuellte Punkte (Trenner-Mitte, Zeitlinien-Dots) wandern MIT in
             die Verschmelzung — sonst stanzen sie Loecher in die Linie,
             auf der sie sitzen */
          const cx=+el.getAttribute('cx')||0, cy=+el.getAttribute('cy')||0, r=+el.getAttribute('r')||0;
          if(!r) return;
          const ring=[];
          for(let i=0;i<48;i++){ const a=i/48*2*Math.PI; ring.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]); }
          out=[[ring]];
        } else return;
        if(!out||!out.length) return;
        const xf=efXform(el,root);
        for(const poly of out) polys.push(poly.map(ring=>ring.map(xf)));
        doomed.push(el);
      }catch(e){ console.error('Strich-Umriss',e); }
    });
    if(!doomed.length) return;
    doomed.forEach(el=>el.remove());
    /* Deckkraft spielt fuer die Gravur keine Rolle (alles gleich tief) —
       darum darf ALLES in eine einzige Vereinigung. */
    if(window.polygonClipping){
      try{
        const u=polygonClipping.union(...polys);
        const pth=document.createElementNS(NS,'path');
        pth.setAttribute('d',efPolysToPath(u));
        pth.setAttribute('fill',ENG);
        pth.setAttribute('fill-rule','evenodd');
        pth.setAttribute('stroke','none');
        root.appendChild(pth);
        return;
      }catch(e){ console.error('Verschmelzen',e); }
    }
    /* Rueckfall ohne Bibliothek: jede Form als eigener nonzero-Pfad —
       unverschmolzen, aber korrekt gefuellt. */
    for(const poly of polys){
      const pth=document.createElementNS(NS,'path');
      pth.setAttribute('d',efPolysToPath([poly]));
      pth.setAttribute('fill',ENG);
      pth.setAttribute('stroke','none');
      root.appendChild(pth);
    }
  }

  function loadPhoto(file){
    if(!file) return;
    if(file.size>14*1024*1024){ msg('warn','Das Bild ist größer als 14 MB. Bitte etwas kleiner speichern.'); return; }
    const fr=new FileReader();
    fr.onload=()=>{
      const im=new Image();
      im.onload=()=>{
        photoImg=im; st.photo=fr.result;
        $('tafUploadText').textContent=file.name.length>26?file.name.slice(0,24)+'…':file.name;
        $('tafPhotoActions').style.display='block';
        $('tafPhotoTools').style.display='block';
        ensureExportFonts();
        applyPhoto(true);   // uj kep: illesszunk automatikusan
      };
      im.onerror=()=>msg('warn','Diese Bilddatei konnte nicht gelesen werden.');
      im.src=fr.result;
    };
    fr.onerror=()=>msg('warn','Die Datei konnte nicht gelesen werden.');
    fr.readAsDataURL(file);
  }

  function clearPhoto(){
    photoImg=null; st.photo=null; st.sketch=null; st.art=null;
    $('tafPhotoInput').value='';
    $('tafUploadText').textContent='Foto auswählen';
    $('tafPhotoActions').style.display='none';
    $('tafPhotoTools').style.display='none';
    msg('','');
    render();
  }

  /* ---------- Meilenstein-Zeilen ---------- */
  function renderPresets(){
    $('tafPresets').innerHTML=PRESETS.map(p=>
      `<button type="button" class="taf-preset${p.key===st.preset?' on':''}" data-preset="${p.key}"
         aria-pressed="${p.key===st.preset?'true':'false'}"><b>${esc(p.name)}</b><span>${esc(p.hint)}</span></button>`).join('');
  }

  /* Nur die Felder zeigen, die der gewaehlte Anlass wirklich graviert — und
     sie so benennen, wie sie dort heissen ("Namen" vs. "Ausgezeichnet"). */
  const FLD_INPUT={title:'tafTitle',quote:'tafQuote',names:'tafNames',sub:'tafSub',
    msg:'tafMsg',bigNum:'tafBigNum',bigLabel:'tafBigLabel',dateA:'tafDateA',dateB:'tafDateB'};

  /* Ohne Grundwerte bliebe die Beschriftung des zuletzt gewaehlten Anlasses
     stehen, sobald der naechste sie nicht ueberschreibt. */
  const DEFAULT_LABELS={title:'Überschrift',quote:'Satz in der Mitte',names:'Namen',
    sub:'Für wen',msg:'Widmung',bigNum:'Zahl in der Mitte',bigLabel:'Wort darunter',
    dateA:'Von',dateB:'Bis',ms:'Eure Stationen'};

  function syncFields(){
    const lay=LAY(), labels=Object.assign({},DEFAULT_LABELS,lay.labels||{});
    document.querySelectorAll('#paneTafel [data-fld]').forEach(el=>{
      el.style.display=hasField(el.dataset.fld)?'':'none';
    });
    Object.keys(FLD_INPUT).forEach(f=>{
      const inp=$(FLD_INPUT[f]); if(!inp) return;
      const lab=inp.previousElementSibling;
      if(labels[f] && lab && lab.tagName==='LABEL') lab.textContent=labels[f];
    });
    $('tafMsLabel').textContent=labels.ms;
    /* Bleibt von einem Zweier-Paar nur ein Feld uebrig (Auszeichnung: Zahl ohne
       Wort), soll es die ganze Breite nehmen statt eine leere Spalte zu lassen. */
    document.querySelectorAll('#paneTafel .taf-pair').forEach(p=>{
      const shown=[...p.children].filter(c=>c.style.display!=='none').length;
      p.style.gridTemplateColumns=shown>1?'':'1fr';
    });
    const max=lay.msMax||5;
    $('tafAddMs').style.display=st.ms.length>=max?'none':'';
  }

  function applyPreset(key){
    const p=PRESETS.find(x=>x.key===key); if(!p) return;
    st.preset=key; st.layout=p.layout||'timeline';
    ['title','quote','names','sub','msg','bigNum','bigLabel','dateA','dateB'].forEach(f=>{
      st[f]=p[f]||'';
      const inp=$(FLD_INPUT[f]); if(inp) inp.value=st[f];
    });
    if(p.ms) st.ms=JSON.parse(JSON.stringify(p.ms));
    renderPresets(); renderMs(); syncFields(); render();
  }

  const shortLabel=k=>ICONS[k].label.split('·')[0].trim();
  // Egy mentett dizajn hozhat ismeretlen ikon-kulcsot; ne dobjunk hibat miatta.
  const icoKey=k=>(ICONS[k]?k:ICON_KEYS[0]);
  const icoLabel=k=>ICONS[icoKey(k)].label;
  function iconPreview(k){
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" `
      + `stroke-linecap="round" stroke-linejoin="round">${ICONS[k].d.map(d=>`<path d="${d}"/>`).join('')}</svg>`;
  }

  function renderMs(){
    const box=$('tafMilestones');
    box.innerHTML=st.ms.map((m,i)=>
      `<div class="ms-row" data-i="${i}">
         <input class="ms-year" data-f="year" maxlength="4" inputmode="numeric" value="${esc(m.year)}" aria-label="Jahr">
         <div class="ms-stack">
           <input data-f="l1" maxlength="20" value="${esc(m.l1)}" placeholder="Zeile 1" aria-label="Zeile 1">
           <input data-f="l2" maxlength="20" value="${esc(m.l2)}" placeholder="Zeile 2" aria-label="Zeile 2">
         </div>
         <button type="button" class="ms-del" data-del="${i}" title="Station entfernen" aria-label="Station entfernen">×</button>
           <button type="button" class="ms-pick" data-pick="${i}" aria-expanded="false"
             aria-label="Motiv wählen — aktuell ${esc(icoLabel(m.icon))}">
             ${iconPreview(icoKey(m.icon))}<span>${esc(shortLabel(icoKey(m.icon)))}</span><i class="ms-caret">▾</i>
           </button>
         <div class="ms-icons" role="radiogroup" aria-label="Motiv" hidden>${ICON_KEYS.map(k=>
           `<button type="button" class="ms-ico${k===m.icon?' on':''}" data-ico="${k}" role="radio"
              aria-checked="${k===m.icon?'true':'false'}" title="${esc(ICONS[k].label)}">
              ${iconPreview(k)}<span>${esc(shortLabel(k))}</span></button>`).join('')}</div>
       </div>`).join('');
    $('tafAddMs').style.display=st.ms.length>=(LAY().msMax||5)?'none':'';
  }

  /* ---------- Bindings ---------- */
  function bindProductSwitch(){
    document.querySelectorAll('#prodSwitch .ps-card').forEach(b=>{
      b.addEventListener('click',()=>{
        const p=b.dataset.product;
        document.querySelectorAll('#prodSwitch .ps-card').forEach(o=>{
          const on=o===b; o.classList.toggle('on',on); o.setAttribute('aria-selected',on?'true':'false');
        });
        $('paneTafel').hidden=(p!=='tafel');
        $('paneKette').hidden=(p!=='kette');
        window.WL_PRODUCT=p;
        $('cfgHeadline').textContent=p==='tafel'?'Eure Geschichte, in Stahl':'Deine Kette, deine Gravur';
        $('cfgIntro').textContent=p==='tafel'
          ? 'Trage ein, was zwischen euch zählt — und sieh sofort, wie es auf dem Stahl steht. Der Maßstab zeigt dir die echte Größe in Millimetern.'
          : 'Wähle Form und Länge, tippe deinen Text — und sieh sofort, wie dein Anhänger aussehen wird. Der Maßstab zeigt dir die echte Größe in Millimetern.';
        if(p==='tafel') render();
      });
    });
  }

  function bind(){
    $('tafPresets').addEventListener('click',e=>{
      const b=e.target.closest('[data-preset]'); if(b) applyPreset(b.dataset.preset);
    });
    Object.keys(FLD_INPUT).forEach(f=>{
      const inp=$(FLD_INPUT[f]); if(!inp) return;
      inp.addEventListener('input',e=>{ st[f]=e.target.value; render(); });
    });
    $('tafLineRange').addEventListener('input',e=>{
      st.line=+e.target.value; $('tafLineValue').value=e.target.value; reprocess();
    });
    /* Huzas az elonezetben. Termeszetesebb, mint csuszkazni: a vasarlo azt
       mozgatja, amit lat. A csuszkak megmaradnak -- egerrel/finom allitasra
       jobbak --, es a ketto ugyanazt az allapotot irja. */
    (function(){
      const sv=$('tafSvg'), da=$('tafDragArea');
      if(!sv||!da) return;
      let drag=null;
      const toSvg=e=>{
        const r=sv.getBoundingClientRect(), vb=sv.viewBox.baseVal;
        return {x:vb.x+(e.clientX-r.left)*vb.width/r.width,
                y:vb.y+(e.clientY-r.top)*vb.height/r.height};
      };
      da.addEventListener('pointerdown',e=>{
        if(!st.sketch) return;
        const p=port(); if(!p) return;
        const q=toSvg(e), g=portraitGeom();
        drag={qx:q.x,qy:q.y,gx:g.x,gy:g.y,
              dw:P(p.w)-g.w, dh:P(p.h)-g.h, x0:X(p.x), y0:Y(p.y)};
        // A capture nem letfontossagu (a pointerup a dokumentumon is elkapjuk),
        // es nehany kornyezetben dob -- ne vigye magaval a huzast.
        try{ da.setPointerCapture(e.pointerId); }catch(_){}
        da.style.cursor='grabbing';
        e.preventDefault();
      });
      da.addEventListener('pointermove',e=>{
        if(!drag) return;
        const q=toSvg(e);
        const nx=drag.gx+(q.x-drag.qx), ny=drag.gy+(q.y-drag.qy);
        const cl=v=>Math.max(0,Math.min(100,v));
        // A 0..100 tartomany a hatarra zar: nem lehet ures szelet huzni.
        if(Math.abs(drag.dw)>0.01) st.px  =cl((nx-drag.x0)/drag.dw*100);
        if(Math.abs(drag.dh)>0.01) st.crop=cl((ny-drag.y0)/drag.dh*100);
        syncPhotoUI(); render();
      });
      const end=()=>{ if(!drag) return; drag=null; da.style.cursor='grab'; };
      da.addEventListener('pointerup',end);
      da.addEventListener('pointercancel',end);
      document.addEventListener('pointerup',end);
    })();

    $('tafZoomRange') && $('tafZoomRange').addEventListener('input',e=>{
      st.pz=(+e.target.value)/100;
      const o=$('tafZoomValue'); if(o) o.value=e.target.value+'%';
      render();
    });
    $('tafAutoFit') && $('tafAutoFit').addEventListener('click',()=>{ autoFitPhoto(); render(); });

    $('tafCropRange').addEventListener('input',e=>{
      st.crop=+e.target.value; $('tafCropValue').value=e.target.value; render();
    });
    $('tafPhotoInput').addEventListener('change',e=>loadPhoto(e.target.files&&e.target.files[0]));
    $('tafPhotoRemove').addEventListener('click',clearPhoto);
    $('tafSketchDl').addEventListener('click',downloadSketchPNG);
    $('tafMilestones').addEventListener('input',e=>{
      const row=e.target.closest('.ms-row'); if(!row) return;
      const i=+row.dataset.i, f=e.target.dataset.f; if(!f||!st.ms[i]) return;
      st.ms[i][f]=e.target.value; render();
    });
    $('tafMilestones').addEventListener('click',e=>{
      const row=e.target.closest('.ms-row'); if(!row) return;
      const i=+row.dataset.i;
      const pick=e.target.closest('[data-pick]');
      if(pick){
        const open=!row.classList.contains('open');
        // Egyszerre csak EGY paletta legyen nyitva -- kulonben visszakapnank a
        // regi allapotot, ahol minden ikon egyszerre latszott.
        $('tafMilestones').querySelectorAll('.ms-row.open').forEach(r=>{
          r.classList.remove('open');
          const q=r.querySelector('.ms-icons'); if(q) q.hidden=true;
          const t=r.querySelector('.ms-pick'); if(t) t.setAttribute('aria-expanded','false');
        });
        if(open){
          row.classList.add('open');
          const pal=row.querySelector('.ms-icons'); if(pal) pal.hidden=false;
          pick.setAttribute('aria-expanded','true');
        }
        return;
      }
      const ico=e.target.closest('[data-ico]');
      if(ico && st.ms[i]){
        st.ms[i].icon=ico.dataset.ico;
        row.querySelectorAll('.ms-ico').forEach(b=>{
          const on=b===ico; b.classList.toggle('on',on); b.setAttribute('aria-checked',on?'true':'false');
        });
        // Valasztas utan zarunk: a dolog el van intezve, ne alljon utban.
        const pk=row.querySelector('.ms-pick');
        if(pk){
          const key=icoKey(ico.dataset.ico), lab=icoLabel(key);
          pk.innerHTML=iconPreview(key)+'<span>'+esc(shortLabel(key))+'</span><i class="ms-caret">▾</i>';
          pk.setAttribute('aria-expanded','false');
          pk.setAttribute('aria-label','Motiv wählen — aktuell '+lab);
        }
        row.classList.remove('open');
        const pal=row.querySelector('.ms-icons'); if(pal) pal.hidden=true;
        return render();
      }
      const b=e.target.closest('[data-del]'); if(!b) return;
      if(st.ms.length<=1) return;
      st.ms.splice(+b.dataset.del,1); renderMs(); render();
    });
    $('tafAddMs').addEventListener('click',()=>{
      if(st.ms.length>=(LAY().msMax||5)) return;
      st.ms.push({year:'',l1:'',l2:'',icon:'herz'}); renderMs(); render();
    });
    bindProductSwitch();

  }

  const LASER_BLACK='#000000', LASER_REF='#ff0000';

  /* Fuer den Laser ist jede Linie gleich: volles Schwarz, keine Deckkraft.
     Der Stahlton der Vorschau und die halbtransparenten Zierlinien wuerden in
     LightBurn sonst auf eigenen Ebenen landen (LightBurn sortiert nach Farbe),
     und eine "schwaechere" Linie kann der Laser ohnehin nicht — graviert wird
     alles gleich tief. */
  function blackenForLaser(root){
    root.querySelectorAll('*').forEach(n=>{
      ['opacity','fill-opacity','stroke-opacity'].forEach(a=>{
        if(n.hasAttribute(a)) n.setAttribute(a,'1');
      });
      const f=n.getAttribute('fill');   if(f&&f!=='none') n.setAttribute('fill',LASER_BLACK);
      const k=n.getAttribute('stroke'); if(k&&k!=='none') n.setAttribute('stroke',LASER_BLACK);
      if(n.style){ n.style.removeProperty('opacity'); n.style.removeProperty('fill'); n.style.removeProperty('stroke'); }
    });
  }

  /* Export fuer Bestellung/Kasse. preview=true liefert dieselbe Zeichnung mit
     weichem Portrait — die Bestell-Vorschau als PNG wird stark verkleinert,
     und ein gerastertes Bild wuerde dabei zu grauem Rauschen zerfallen. */
  function exportSVG(preview){
    const w=REAL.w, h=REAL.h;
    const eng=$('tafEng').cloneNode(true);
    eng.querySelectorAll('[data-ph]').forEach(n=>n.remove());
    /* Buchstaben in echte Umrisspfade wandeln (sofern die Export-Schnitte
       schon geladen sind) — sonst bleiben sie <text> als Notloesung. */
    efConvert(eng);
    /* Danach alle Striche zu fuellbaren Doppel-Umrissen aufweiten. */
    efStrokesToOutlines(eng);
    blackenForLaser(eng);
    const inner=eng.innerHTML;
    /* Das Portrait als EIGENE Ebene, bereits fertig beschnitten: kein
       clip-path (LightBurn kennt keinen), das eingebettete Bild ist exakt der
       sichtbare Feld-Ausschnitt in Gravurqualitaet, an seiner mm-Position. */
    let portOut='';
    const p=port();
    if(p && photoImg){
      const c=engraveCanvas(preview?{smooth:true}:null);
      if(c){
        const u=c.toDataURL('image/png');
        portOut=`<image x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" `
          + `preserveAspectRatio="none" href="${u}" xlink:href="${u}"/>`;
      }
    } else if(hasArtwork() && p){
      /* Rueckfall (z. B. Foto-Objekt nicht mehr im Speicher): Vorschau-Bild
         mit Clip wie frueher — besser als ein leeres Feld. */
      const g2=portraitGeom();
      const mx=(g2.x-X0)/S, my=(g2.y-Y0)/S, mw=g2.w/S, mh=g2.h/S;
      portOut=`<clipPath id="portClip"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.rx}"/></clipPath>`
        + `<g clip-path="url(#portClip)"><image x="${mx.toFixed(3)}" y="${my.toFixed(3)}" `
        + `width="${mw.toFixed(3)}" height="${mh.toFixed(3)}" `
        + `preserveAspectRatio="none" href="${st.sketch}" xlink:href="${st.sketch}"/></g>`;
    }
    // Zurueck in echte mm: die Vorschau rechnet in px, der Export soll 1:1 mm sein.
    const g=`<g transform="translate(${(-X0/S).toFixed(4)} ${(-Y0/S).toFixed(4)}) scale(${(1/S).toFixed(6)})">${inner}</g>`;
    /* Die Kontur ist nur Referenz (die Tafel kommt fertig zugeschnitten) —
       in Rot, damit LightBurn sie auf eine eigene Ebene legt und sie mit
       einem Klick auf "keine Ausgabe" steht. Gravur und Portrait: Schwarz. */
    const cut=preview?LASER_BLACK:LASER_REF;
    const hint=`Wolf Lasermark · Erinnerungstafel ${w}×${h} mm. `
      + `Ebene "Kontur" (rot) = nur Referenz, nicht gravieren. `
      + `Portrait: 1 Bit, ${ENG_DPI} dpi — in LightBurn Bildmodus "Threshold" `
      + `(nicht erneut dithern), Zeilenabstand ${String(+(ENG_MM_PER_PX*K).toFixed(3)).replace('.',',')} mm.`;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" `
      + `width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">`
      + `<title>Erinnerungstafel ${w}×${h} mm</title><desc>${hint}</desc>`
      + `<g id="Kontur"><path d="${realPlatePath()}" fill="none" stroke="${cut}" stroke-width=".2"/></g>`
      + `<g transform="translate(${OX} ${OY}) scale(${K})"><g id="Portrait">${portOut}</g>`
      + `<g id="Gravur">${g}</g></g></svg>`;
  }

  window.WL_PRODUCT='tafel';
  window.TAF={
    name:()=>`Erinnerungstafel ${REAL.w}×${REAL.h} mm · Edelstahl`,
    real:REAL,
    summary:()=>{
      /* Nur mitschicken, was der gewaehlte Anlass auch graviert — sonst stuenden
         Felder in der Bestellung, die auf der Tafel gar nicht vorkommen. */
      const f=x=>hasField(x)?st[x]:'';
      const stations=hasField('ms')
        ? st.ms.map(m=>[m.year,m.l1,m.l2].filter(Boolean).join(' ')).filter(Boolean).join(' · ') : '';
      const num=[f('bigNum'),f('bigLabel')].filter(Boolean).join(' ');
      const span=[f('dateA'),f('dateB')].filter(Boolean).join(' — ');
      const parts=[LAY_NAME(), f('title'), num, span, f('sub'),
        String(f('msg')||'').split('\n').filter(Boolean).join(' / '), stations, f('quote'), f('names')];
      return parts.filter(Boolean).join(' | ');
    },
    hasPhoto:hasArtwork,
    fontsReady:ensureExportFonts,
    photo:()=>st.photo,
    sketch:()=>st.sketch,
    state:()=>JSON.parse(JSON.stringify({preset:st.preset,layout:st.layout,title:st.title,
      quote:st.quote,names:st.names,sub:st.sub,msg:st.msg,bigNum:st.bigNum,bigLabel:st.bigLabel,
      dateA:st.dateA,dateB:st.dateB,ms:st.ms,line:st.line,detail:st.detail,smooth:st.smooth,lw:st.lw})),
    svg:()=>exportSVG(false),
    svgPreview:()=>exportSVG(true),
    validate:()=>{
      /* Leer ist nur, was der Anlass ueberhaupt anbietet — eine Auszeichnung
         ohne "quote" ist vollstaendig, eine Tafel ganz ohne Text nicht. */
      const filled=LAY().fields.some(f=>f!=='photo'&&f!=='ms'&&String(st[f]||'').trim())
        || (hasField('ms')&&st.ms.some(m=>[m.year,m.l1,m.l2].some(v=>String(v||'').trim())));
      return filled?'':'Bitte trage mindestens eine Zeile ein.';
    },
    render:render
  };

  /* Nur fuers Held-Bild: eine feine Strichzeichnung statt des leeren Foto-Platzhalters. */
  function coupleArt(){
    const s=`fill="none" stroke="${ENG}" stroke-width="${P(.55)}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g opacity=".85">`
      + `<circle cx="${X(45)}" cy="${Y(48)}" r="${P(7)}" ${s}/>`
      + `<path d="M${X(45-9.5)} ${Y(79)} C ${X(45-8)} ${Y(63)}, ${X(45-4)} ${Y(58)}, ${X(45)} ${Y(58)} C ${X(45+4)} ${Y(58)}, ${X(45+8)} ${Y(63)}, ${X(45+9.5)} ${Y(79)}" ${s}/>`
      + `<path d="M${X(38.4)} ${Y(45)} C ${X(39.5)} ${Y(38.5)}, ${X(50.5)} ${Y(38.5)}, ${X(51.6)} ${Y(45)}" ${s}/>`
      + `<circle cx="${X(62)}" cy="${Y(45)}" r="${P(7.5)}" ${s}/>`
      + `<path d="M${X(62-10.5)} ${Y(79)} C ${X(62-9)} ${Y(61)}, ${X(62-4.5)} ${Y(55)}, ${X(62)} ${Y(55)} C ${X(62+4.5)} ${Y(55)}, ${X(62+9)} ${Y(61)}, ${X(62+10.5)} ${Y(79)}" ${s}/>`
      + `<path d="M${X(54.8)} ${Y(43)} C ${X(55.5)} ${Y(36)}, ${X(68.5)} ${Y(36)}, ${X(69.2)} ${Y(43)} C ${X(69.6)} ${Y(48)}, ${X(68.6)} ${Y(50)}, ${X(68.2)} ${Y(52)}" ${s}/>`
      + `</g>`;
  }

  // Held-Bild oben: eine Kopie der lebenden Tafel, damit es nur einen Renderer gibt.
  // Die IDs muessen umbenannt werden, sonst greifen die url(#…)-Referenzen der Buehne auf den Klon.
  function paintHero(){
    const src=$('tafSvg');
    if(!src) return;
    const html=cloneTafel(src);
    ['heroTafel','collTafel'].forEach((id,i)=>{
      const host=document.getElementById(id);
      if(host) host.innerHTML=i? html.split('Hero').join('Coll') : html;
    });
  }
  function cloneTafel(src){
    const c=src.cloneNode(true);
    c.removeAttribute('id'); c.removeAttribute('style');
    const ruler=c.querySelector('#tafRuler'); if(ruler) ruler.remove();
    const eng=c.querySelector('#tafEng');
    if(eng && !st.sketch){
      eng.querySelectorAll('rect[stroke-dasharray]').forEach(n=>n.remove());
      eng.querySelectorAll('text').forEach(n=>{ if(n.textContent==='Euer Foto') n.remove(); });
      eng.insertAdjacentHTML('afterbegin',coupleArt());
    }
    let html=c.outerHTML;
    ['tafSteel','tafBase','tafPlateClipPath','tafPortraitClip','tafPortraitRect','tafPlateBody','tafBrush','tafPortrait','tafPortraitArt','tafEng','tafPlateEdge','tafStand','tafPlate','tafDragArea']
      .forEach(id=>{ html=html.split(id).join(id+'Hero'); });
    return html;
  }

  renderPresets(); renderMs(); syncFields(); bind(); render(); paintHero();
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ render(); paintHero(); });
})();

/* ---- Bestellung (2026-11-16): nur im Shop-iframe mit ?buy=1&price=… — der Shop fuehrt Preis,
   Material und die Kasse (privat-checkout.js). Uebergeben wird genau, was die alte Kasse speicherte:
   Zusammenfassung, Tafel-Daten, LightBurn-SVG (130 x 180 mm, Kontur rot), weiche PNG-Vorschau, Originalfoto. */
(function(){
  const q=new URLSearchParams(location.search), btn=document.getElementById('tafBestellBtn');
  const price=parseFloat(q.get('price')||'');
  if(price>0) document.getElementById('tafPrice').innerHTML=price.toFixed(2).replace('.',',')+'&nbsp;€';
  if(q.get('buy')!=='1' || !(price>0) || window.parent===window || !btn) return;
  btn.textContent='Weiter zur Bestellung'; btn.classList.add('ready'); btn.removeAttribute('aria-disabled'); btn.setAttribute('role','button'); btn.href='#';
  const png=svg=>new Promise(res=>{
    const R=window.TAF.real, s=6, img=new Image();
    img.onload=()=>{ try{ const c=document.createElement('canvas'); c.width=R.w*s; c.height=R.h*s; const x=c.getContext('2d');
      x.fillStyle='#ffffff'; x.fillRect(0,0,c.width,c.height); x.drawImage(img,0,0,c.width,c.height); res(c.toDataURL('image/png')); }catch(e){ res(''); } };
    img.onerror=()=>res(''); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  });
  let busy=false;
  btn.addEventListener('click',async e=>{
    e.preventDefault(); if(busy) return;
    const T=window.TAF, err=T.validate();
    const hint=document.getElementById('tafOrderMsg');
    if(err){ if(hint) hint.textContent=err; return; }
    busy=true; const label=btn.textContent; btn.textContent='Einen Moment …';
    try{
      try{ await T.fontsReady(); }catch(_){}          // echte Buchstaben-Pfade in design.svg
      const svg='<?xml version="1.0" encoding="UTF-8"?>\n'+T.svg();
      const order={ shape:'tafel', title:'Erinnerungstafel', gravurText:T.summary(), designDaten:T.state(),
        svg, png:await png(T.svgPreview()), foto:T.photo()||'', mitFoto:!!T.hasPhoto(), mitKarte:false,
        details:{ 'Größe':T.real.w+' × '+T.real.h+' mm', 'Porträt':T.hasPhoto()?'ja':'' } };
      window.parent.postMessage({wlEditor:'order', order}, location.origin);
    }catch(x){ console.error(x); }
    finally{ busy=false; btn.textContent=label; }
  });
  btn.insertAdjacentHTML('afterend','<p class="mini-help" id="tafOrderMsg" role="status"></p>');
})();
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && window.parent!==window){ try{ window.parent.postMessage({wlEditor:'close'}, location.origin); }catch(_){} }});
