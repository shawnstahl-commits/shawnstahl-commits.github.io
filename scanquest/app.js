const STORAGE_KEY = 'scanquest_state_v1';
const BASE_DAILY_SCANS = 5;
const SPECIES_TOTAL = 120;

const TYPES = ['Feuer','Wasser','Wald','Sturm','Fels','Schatten','Licht','Kosmos'];
const TYPE_ICONS = {Feuer:'🔥',Wasser:'💧',Wald:'🌿',Sturm:'⚡',Fels:'🪨',Schatten:'🌑',Licht:'✨',Kosmos:'🌌'};
const PREFIX = ['Aero','Bram','Cryo','Dra','Ember','Ferro','Glim','Hydro','Ixo','Jade','Kiro','Luma','Moro','Nyx','Orbi','Pyra','Quill','Runa','Syl','Terra'];
const SUFFIX = ['bit','fang','flare','fox','horn','ling','moth','nox','paw','rex','rift','scale','spark','tail','thorn','wing','wyrm','zen'];
const RARITY_REWARD = {'Gewöhnlich':0,'Selten':5,'Episch':10,'Legendär':25,'Mythisch':50};

const PARTNER_CAMPAIGNS_KEY = 'scanquest_partner_demo_v1';

const RETAIL_CAMPAIGNS = [
  {id:'fresh-mission',partner:'DemoMarkt',title:'Frische Mission',condition:'Kaufe 3 Obst- oder Gemüseartikel.',coins:120,scans:2,icon:'🥕'},
  {id:'family-weekend',partner:'CityFresh',title:'Familien-Wochenende',condition:'Bestätigter Einkauf ab 20 €.',coins:180,scans:1,icon:'🛒'},
  {id:'quest-drop',partner:'DemoMarkt',title:'ScanQuest Drop',condition:'Kaufe ein teilnehmendes Aktionsprodukt.',coins:80,scans:3,icon:'🎁'}
];

let state = loadState();
let htmlScanner = null;
let scanning = false;
let activeCreature = null;
let currentFilter = 'all';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function localDateKey(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function freshState(){
  return {
    coins: 25,
    collection: {},
    totalScans: 0,
    retailClaims: {},
    daily: {date:localDateKey(),used:0,bonus:0,newCount:0,rarePlus:0,uniqueIds:[],rewarded:{}}
  };
}

function loadState(){
  try{
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if(!raw || typeof raw !== 'object') return freshState();
    raw.collection = raw.collection || {};
    raw.coins = Number(raw.coins || 0);
    raw.totalScans = Number(raw.totalScans || 0);
    raw.retailClaims = raw.retailClaims || {};
    raw.daily = raw.daily || {};
    if(raw.daily.date !== localDateKey()){
      raw.daily = {date:localDateKey(),used:0,bonus:0,newCount:0,rarePlus:0,uniqueIds:[],rewarded:{}};
    }
    raw.daily.uniqueIds = raw.daily.uniqueIds || [];
    raw.daily.rewarded = raw.daily.rewarded || {};
    return raw;
  }catch(e){ return freshState(); }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hash32(input){
  let h = 2166136261 >>> 0;
  for(let i=0;i<input.length;i++){
    h ^= input.charCodeAt(i);
    h = Math.imul(h,16777619);
  }
  h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
  return h >>> 0;
}

function speciesName(id){
  const a = PREFIX[id % PREFIX.length];
  const b = SUFFIX[Math.floor(id / PREFIX.length) % SUFFIX.length];
  return a + b;
}

function rarityFor(id){
  const r = hash32('rarity:' + id) % 1000;
  if(r < 10) return 'Mythisch';
  if(r < 60) return 'Legendär';
  if(r < 180) return 'Episch';
  if(r < 400) return 'Selten';
  return 'Gewöhnlich';
}

function creatureFor(barcode){
  const speciesId = (hash32('species:' + barcode) % SPECIES_TOTAL) + 1;
  const seed = hash32('creature:' + speciesId);
  const rarity = rarityFor(speciesId);
  const type = TYPES[seed % TYPES.length];
  const power = 35 + (hash32('p:' + speciesId) % 66);
  const speed = 35 + (hash32('s:' + speciesId) % 66);
  const energy = 35 + (hash32('e:' + speciesId) % 66);
  const luck = 20 + (hash32('l:' + speciesId) % 81);
  return {speciesId,name:speciesName(speciesId),rarity,type,power,speed,energy,luck};
}

function hueFor(id,offset=0){ return (hash32('h:' + id) + offset) % 360; }

function creatureSVG(c){
  const id = c.speciesId;
  const h1 = hueFor(id,0), h2 = hueFor(id,90), h3 = hueFor(id,180);
  const eye = c.rarity === 'Mythisch' ? '#ff8be7' : c.rarity === 'Legendär' ? '#ffd166' : '#8ff7ff';
  const hornMode = id % 4;
  const earMode = id % 3;
  const wing = id % 5 === 0;
  const crest = id % 4 === 1;
  const stars = [0,1,2,3,4,5].map(i=>{
    const x=12+(hash32('sx:'+id+':'+i)%76), y=10+(hash32('sy:'+id+':'+i)%70), r=1+(i%2);
    return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="white" opacity="'+(.18+i*.06)+'"/>';
  }).join('');
  const horns = hornMode===0
    ? '<path d="M36 38 C18 20,20 8,34 10 C28 20,31 28,41 32" fill="none" stroke="url(#g2)" stroke-width="6" stroke-linecap="round"/><path d="M64 38 C82 20,80 8,66 10 C72 20,69 28,59 32" fill="none" stroke="url(#g2)" stroke-width="6" stroke-linecap="round"/>'
    : hornMode===1
    ? '<path d="M36 38 L24 14 L44 31 Z" fill="url(#g2)"/><path d="M64 38 L76 14 L56 31 Z" fill="url(#g2)"/>'
    : hornMode===2
    ? '<path d="M37 34 Q25 20 31 9 Q42 19 44 31" fill="url(#g2)"/><path d="M63 34 Q75 20 69 9 Q58 19 56 31" fill="url(#g2)"/>'
    : '';
  const ears = earMode===0
    ? '<path d="M34 40 Q17 31 20 49 Q26 55 36 51" fill="url(#g1)"/><path d="M66 40 Q83 31 80 49 Q74 55 64 51" fill="url(#g1)"/>'
    : earMode===1
    ? '<path d="M35 40 L21 30 L25 52 Z" fill="url(#g1)"/><path d="M65 40 L79 30 L75 52 Z" fill="url(#g1)"/>'
    : '';
  const wings = wing ? '<path d="M33 58 Q9 43 10 70 Q22 74 36 68" fill="url(#g3)" opacity=".8"/><path d="M67 58 Q91 43 90 70 Q78 74 64 68" fill="url(#g3)" opacity=".8"/>' : '';
  const crestPath = crest ? '<path d="M43 35 L50 16 L57 35 L53 41 L47 41 Z" fill="url(#g3)"/>' : '';
  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+c.name+'">'+
    '<defs><radialGradient id="bg'+id+'" cx="35%" cy="25%" r="80%"><stop stop-color="hsl('+h2+' 55% 24%)"/><stop offset="1" stop-color="#07111f"/></radialGradient>'+
    '<linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl('+h1+' 80% 67%)"/><stop offset="1" stop-color="hsl('+h2+' 75% 38%)"/></linearGradient>'+
    '<linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl('+h3+' 90% 78%)"/><stop offset="1" stop-color="hsl('+h1+' 70% 45%)"/></linearGradient>'+
    '<linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl('+h2+' 88% 70%)"/><stop offset="1" stop-color="hsl('+h3+' 80% 40%)"/></linearGradient></defs>'+
    '<rect width="100" height="100" rx="18" fill="url(#bg'+id+')"/>'+stars+
    '<circle cx="50" cy="56" r="34" fill="hsl('+h1+' 35% 10%)" opacity=".45"/>'+wings+horns+ears+crestPath+
    '<path d="M31 47 Q50 31 69 47 L66 72 Q50 86 34 72 Z" fill="url(#g1)" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>'+
    '<ellipse cx="40" cy="55" rx="5" ry="6" fill="#07111f"/><ellipse cx="60" cy="55" rx="5" ry="6" fill="#07111f"/>'+
    '<circle cx="40" cy="54" r="2.2" fill="'+eye+'"/><circle cx="60" cy="54" r="2.2" fill="'+eye+'"/>'+
    '<path d="M46 65 Q50 68 54 65" fill="none" stroke="#07111f" stroke-width="2" stroke-linecap="round"/>'+
    '<path d="M50 59 L46 63 L54 63 Z" fill="hsl('+h3+' 65% 25%)"/>'+
    '<circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="1"/>'+
    '</svg>';
}

function scansRemaining(){
  return Math.max(0, BASE_DAILY_SCANS + Number(state.daily.bonus||0) - Number(state.daily.used||0));
}

function isRarePlus(r){ return ['Selten','Episch','Legendär','Mythisch'].includes(r); }

function normalizeBarcode(v){ return String(v||'').trim().replace(/\s+/g,''); }

function validBarcode(v){ return /^[0-9A-Za-z._-]{4,32}$/.test(v); }

function applyQuestRewards(){
  const quests = [
    {id:'scan3',done:state.daily.used>=3,reward:20},
    {id:'new2',done:state.daily.newCount>=2,reward:25},
    {id:'rare1',done:state.daily.rarePlus>=1,reward:30}
  ];
  quests.forEach(q=>{
    if(q.done && !state.daily.rewarded[q.id]){
      state.daily.rewarded[q.id]=true;
      state.coins += q.reward;
      toast('Quest geschafft: +' + q.reward + ' 🪙');
    }
  });
}

function processScan(raw){
  const barcode = normalizeBarcode(raw);
  if(!validBarcode(barcode)){ showScanStatus('Der Barcode sieht nicht gültig aus. Bitte erneut scannen oder manuell eingeben.',true); return; }
  if(scansRemaining()<=0){ showScanStatus('Deine Gratis-Scans sind für heute aufgebraucht. Du kannst im Shop für 40 Coins einen Extra-Scan holen.',true); setView('shop'); return; }

  const c = creatureFor(barcode);
  const key = String(c.speciesId);
  const existed = !!state.collection[key];
  const baseReward = existed ? 3 : 15 + RARITY_REWARD[c.rarity];

  state.daily.used++;
  state.totalScans++;
  if(!state.daily.uniqueIds.includes(c.speciesId)) state.daily.uniqueIds.push(c.speciesId);

  if(!existed){
    state.collection[key] = {creature:c,firstBarcode:barcode,discoveredAt:Date.now(),encounters:1};
    state.daily.newCount++;
    if(isRarePlus(c.rarity)) state.daily.rarePlus++;
  }else{
    state.collection[key].encounters = Number(state.collection[key].encounters||1)+1;
  }

  state.coins += baseReward;
  applyQuestRewards();
  saveState();
  activeCreature = c;
  renderAll();
  showResult(c,!existed,baseReward,barcode);
}

function questData(){
  return [
    {id:'scan3',title:'Warm-up',desc:'Scanne heute 3 Barcodes.',progress:Math.min(state.daily.used,3),goal:3,reward:20},
    {id:'new2',title:'Entdecker',desc:'Finde heute 2 neue Wesen.',progress:Math.min(state.daily.newCount,2),goal:2,reward:25},
    {id:'rare1',title:'Seltene Spur',desc:'Finde ein seltenes oder besseres Wesen.',progress:Math.min(state.daily.rarePlus,1),goal:1,reward:30}
  ];
}

function renderAll(){
  $('#coinsTop').textContent=state.coins; $('#coinCount').textContent=state.coins;
  $('#scansTop').textContent=scansRemaining(); $('#scansScan').textContent=scansRemaining();
  const count=Object.keys(state.collection).length;
  $('#dexCount').textContent=count; $('#dexCount2').textContent=count;
  $('#dexBar').style.width=(count/SPECIES_TOTAL*100)+'%';
  $('#todayCount').textContent=state.daily.used;
  renderQuests(); renderRecent(); renderDex(); renderArena(); renderShop(); renderRetail();
}

function renderQuests(){
  const qs=questData();
  $('#questDoneLabel').textContent=qs.filter(q=>q.progress>=q.goal).length+'/3 geschafft';
  $('#questList').innerHTML=qs.map(q=>{
    const done=q.progress>=q.goal;
    return '<article class="quest '+(done?'done':'')+'"><span class="reward">+'+q.reward+' 🪙</span><b>'+(done?'✓ ':'')+q.title+'</b><p>'+q.desc+'</p><div class="qprog"><i style="width:'+Math.min(100,q.progress/q.goal*100)+'%"></i></div><small>'+q.progress+'/'+q.goal+'</small></article>';
  }).join('');
}

function creatureCard(entry){
  const c=entry.creature;
  return '<button class="creature-card" data-creature="'+c.speciesId+'"><div class="creature-art">'+creatureSVG(c)+'</div><div class="creature-meta"><b>#'+String(c.speciesId).padStart(3,'0')+' '+c.name+'</b><small>'+TYPE_ICONS[c.type]+' '+c.type+'</small><br><span class="rarity r-'+c.rarity+'">'+c.rarity+'</span></div></button>';
}

function renderRecent(){
  const entries=Object.values(state.collection).sort((a,b)=>b.discoveredAt-a.discoveredAt).slice(0,5);
  const el=$('#recentCreatures');
  if(!entries.length){el.className='creature-row empty-state';el.textContent='Noch keine Wesen entdeckt.';return;}
  el.className='creature-row';el.innerHTML=entries.map(creatureCard).join(''); bindCreatureCards(el);
}

function renderDex(){
  const grid=$('#dexGrid'); if(!grid)return;
  if(currentFilter!=='all'){
    const entries=Object.values(state.collection).filter(e=>e.creature.rarity===currentFilter).sort((a,b)=>a.creature.speciesId-b.creature.speciesId);
    grid.innerHTML=entries.length?entries.map(e=>'<div class="dex-slot">'+creatureCard(e)+'</div>').join(''):'<div class="empty-state" style="grid-column:1/-1">Noch kein Wesen dieser Seltenheit.</div>';
    bindCreatureCards(grid); return;
  }
  let html='';
  for(let i=1;i<=SPECIES_TOTAL;i++){
    const e=state.collection[String(i)];
    html += e?'<div class="dex-slot">'+creatureCard(e)+'</div>':'<div class="dex-slot locked"><div>?</div><small>#'+String(i).padStart(3,'0')+'<br>unentdeckt</small></div>';
  }
  grid.innerHTML=html; bindCreatureCards(grid);
}

function bindCreatureCards(root){
  root.querySelectorAll('[data-creature]').forEach(btn=>btn.addEventListener('click',()=>{
    const e=state.collection[btn.dataset.creature]; if(!e)return;
    showResult(e.creature,false,0,e.firstBarcode,true);
  }));
}

function showResult(c,isNew,reward,barcode,fromDex=false){
  const masked=barcode.length>5?'•••• '+barcode.slice(-5):barcode;
  $('#resultWrap').innerHTML='<article class="result-card card">'+
    '<div>'+(isNew?'<span class="new-badge">NEUE ENTDECKUNG</span>':'<span class="duplicate-badge">'+(fromDex?'SCANDEX-EINTRAG':'SCHON ENTDECKT')+'</span>')+'</div>'+
    '<div class="result-art">'+creatureSVG(c)+'</div>'+
    '<span class="rarity r-'+c.rarity+'">'+c.rarity+'</span>'+
    '<h1>'+c.name+'</h1><p class="muted">#'+String(c.speciesId).padStart(3,'0')+' · '+TYPE_ICONS[c.type]+' '+c.type+' · Barcode '+masked+'</p>'+
    (reward?'<p><b>+'+reward+' 🪙</b> erhalten</p>':'')+
    '<div class="stats"><div class="stat"><small>STÄRKE</small><b>'+c.power+'</b></div><div class="stat"><small>TEMPO</small><b>'+c.speed+'</b></div><div class="stat"><small>ENERGIE</small><b>'+c.energy+'</b></div><div class="stat"><small>GLÜCK</small><b>'+c.luck+'</b></div></div>'+
    '<div class="result-actions"><button id="shareCreatureBtn" class="secondary">↗ Teilen</button><button class="primary" data-view="scan">📷 Weiter scannen</button></div></article>';
  activeCreature=c; setView('result'); bindViewButtons($('#resultWrap'));
  $('#shareCreatureBtn').addEventListener('click',shareCreature);
}

function shareCreature(){
  if(!activeCreature)return;
  const txt='Ich habe in ScanQuest '+activeCreature.name+' (#'+String(activeCreature.speciesId).padStart(3,'0')+') entdeckt – '+activeCreature.rarity+', Typ '+activeCreature.type+'!';
  if(navigator.share) navigator.share({title:'ScanQuest',text:txt,url:location.origin+location.pathname}).catch(()=>{});
  else navigator.clipboard?.writeText(txt).then(()=>toast('Text kopiert'));
}

function renderArena(){
  const entries=Object.values(state.collection).sort((a,b)=>a.creature.speciesId-b.creature.speciesId);
  const opts=entries.map(e=>'<option value="'+e.creature.speciesId+'">#'+String(e.creature.speciesId).padStart(3,'0')+' '+e.creature.name+'</option>').join('');
  $('#fighterA').innerHTML=opts||'<option>Erst Wesen sammeln</option>';
  $('#fighterB').innerHTML=opts||'<option>Erst Wesen sammeln</option>';
  if(entries.length>1) $('#fighterB').selectedIndex=1;
  $('#battleBtn').disabled=entries.length<2;
}

function runBattle(){
  const a=state.collection[$('#fighterA').value]?.creature, b=state.collection[$('#fighterB').value]?.creature;
  if(!a||!b){toast('Du brauchst mindestens zwei Wesen.');return;}
  const bonusA=hash32('battle:'+a.speciesId+':'+b.speciesId)%31;
  const bonusB=hash32('battle:'+b.speciesId+':'+a.speciesId)%31;
  const scoreA=a.power*1.1+a.speed*.65+a.energy*.8+a.luck*.35+bonusA;
  const scoreB=b.power*1.1+b.speed*.65+b.energy*.8+b.luck*.35+bonusB;
  const winner=scoreA===scoreB?(a.luck>=b.luck?a:b):(scoreA>scoreB?a:b);
  $('#battleResult').innerHTML='<div class="battle-log"><div class="battle-line">'+a.name+' eröffnet mit Stärke '+a.power+'.</div><div class="battle-line">'+b.name+' kontert mit Tempo '+b.speed+'.</div><div class="battle-line">Die Energie entscheidet die Schlussphase…</div><div class="winner">🏆 '+winner.name+' gewinnt den Testkampf!</div></div>';
}

function allRetailCampaigns(){
  let custom=[];
  try{
    const parsed=JSON.parse(localStorage.getItem(PARTNER_CAMPAIGNS_KEY)||'[]');
    if(Array.isArray(parsed)) custom=parsed;
  }catch(e){}
  return [...RETAIL_CAMPAIGNS,...custom];
}

function renderRetail(){
  const wrap=$('#retailCampaigns');
  if(!wrap) return;
  const claims=state.retailClaims||{};
  const claimedCount=Object.keys(claims).length;
  const label=$('#retailClaimsLabel');
  if(label) label.textContent=claimedCount+' Demo-Käufe bestätigt';
  wrap.innerHTML=allRetailCampaigns().map(c=>{
    const claimed=!!claims[c.id];
    return '<article class="card retail-campaign '+(claimed?'claimed':'')+'">'+
      '<div class="retail-brand"><div class="retail-logo">'+c.icon+'</div><div><small>PARTNER-DEMO</small><b>'+c.partner+'</b></div></div>'+
      '<h3>'+c.title+'</h3><p>'+c.condition+'</p>'+
      '<div class="retail-rewards"><span>+'+c.coins+' 🪙</span><span>+'+c.scans+' ⚡</span></div>'+
      '<button class="'+(claimed?'secondary':'primary')+' retail-claim" data-campaign="'+c.id+'" '+(claimed?'disabled':'')+'>'+
      (claimed?'✓ Belohnung erhalten':'Demo-Kauf bestätigen')+'</button>'+
      '<small class="retail-tech">'+(claimed?'Bestätigung gespeichert.':'Simuliert später die Rückmeldung von Kasse / Loyalty-System.')+'</small>'+
      '</article>';
  }).join('');
  wrap.querySelectorAll('.retail-claim').forEach(btn=>btn.addEventListener('click',()=>confirmRetailPurchase(btn.dataset.campaign)));
}

function confirmRetailPurchase(id){
  const campaign=allRetailCampaigns().find(c=>c.id===id);
  if(!campaign) return;
  state.retailClaims=state.retailClaims||{};
  if(state.retailClaims[id]){ toast('Diese Demo-Kampagne wurde bereits eingelöst.'); return; }
  const confirmationId='DEMO-'+Date.now().toString(36).toUpperCase();
  state.retailClaims[id]={confirmedAt:Date.now(),confirmationId};
  state.coins += campaign.coins;
  state.daily.bonus = Number(state.daily.bonus||0)+campaign.scans;
  saveState();
  renderAll();
  toast('Kauf bestätigt: +'+campaign.coins+' 🪙 und +'+campaign.scans+' ⚡');
}

function renderShop(){
  const btn=$('#buyScanBtn');
  btn.disabled=state.coins<40;
  btn.textContent=state.coins<40?'Noch '+(40-state.coins)+' 🪙 nötig':'⚡ +1 Scan für 40 🪙';
}

function buyExtraScan(){
  if(state.coins<40){toast('Nicht genug Coins.');return;}
  state.coins-=40; state.daily.bonus=(state.daily.bonus||0)+1; saveState(); renderAll(); toast('+1 Extra-Scan freigeschaltet ⚡');
}

function showScanStatus(msg,bad=false){
  const el=$('#scanStatus'); el.textContent=msg; el.classList.remove('hidden'); el.style.borderColor=bad?'rgba(255,123,145,.35)':'rgba(92,225,230,.3)';
}

function setView(name){
  $$('.view').forEach(v=>v.classList.remove('active'));
  const el=$('#'+name+'View'); if(el)el.classList.add('active');
  $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='dex')renderDex();
  if(name==='arena')renderArena();
  if(name==='rewards')renderRetail();
}

function bindViewButtons(root=document){
  root.querySelectorAll('[data-view]').forEach(btn=>{
    if(btn.dataset.bound)return; btn.dataset.bound='1';
    btn.addEventListener('click',()=>setView(btn.dataset.view));
  });
}

async function openScanner(){
  if(scansRemaining()<=0){showScanStatus('Keine Scans mehr übrig. Hol dir im Shop einen Extra-Scan.',true);setView('shop');return;}
  $('#scannerModal').classList.remove('hidden');
  $('#cameraHelp').textContent='Erlaube den Kamerazugriff und halte den Barcode ruhig in den Rahmen.';
  if(typeof Html5Qrcode==='undefined'){ $('#cameraHelp').textContent='Scanner-Bibliothek konnte nicht geladen werden. Nutze bitte die manuelle Eingabe.'; return; }
  try{
    if(htmlScanner) await closeScanner();
    $('#scannerModal').classList.remove('hidden');
    htmlScanner=new Html5Qrcode('reader');
    scanning=true;
    await htmlScanner.start(
      {facingMode:'environment'},
      {fps:10,qrbox:{width:280,height:160},aspectRatio:1.5},
      async decoded=>{
        if(!scanning)return;
        scanning=false;
        try{await htmlScanner.stop();}catch(e){}
        try{htmlScanner.clear();}catch(e){}
        htmlScanner=null; $('#scannerModal').classList.add('hidden');
        processScan(decoded);
      },
      ()=>{}
    );
  }catch(e){
    scanning=false;
    $('#cameraHelp').textContent='Kamera konnte nicht gestartet werden. Prüfe die Berechtigung oder nutze die manuelle Eingabe.';
  }
}

async function closeScanner(){
  scanning=false;
  if(htmlScanner){
    try{await htmlScanner.stop();}catch(e){}
    try{htmlScanner.clear();}catch(e){}
    htmlScanner=null;
  }
  $('#scannerModal').classList.add('hidden');
}

function toast(msg){
  const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.add('hidden'),2200);
}

$('#heroScanBtn').addEventListener('click',()=>setView('scan'));
$('#openCameraBtn').addEventListener('click',openScanner);
$('#closeScannerBtn').addEventListener('click',closeScanner);
$('#manualForm').addEventListener('submit',e=>{e.preventDefault();processScan($('#barcodeInput').value);$('#barcodeInput').value='';});
$('#battleBtn').addEventListener('click',runBattle);
$('#buyScanBtn').addEventListener('click',buyExtraScan);
$$('.filter').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');currentFilter=btn.dataset.rarity;renderDex();}));
$('#scannerModal').addEventListener('click',e=>{if(e.target===$('#scannerModal'))closeScanner();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&scanning)closeScanner();});

bindViewButtons();
renderAll();
