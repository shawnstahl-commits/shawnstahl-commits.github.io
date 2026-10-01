const STORAGE_KEY = 'scanquest_state_v1';
const BASE_DAILY_SCANS = 5;
const SPECIES_TOTAL = 120;

const TYPES = ['Feuer','Wasser','Wald','Sturm','Fels','Schatten','Licht','Kosmos'];
const TYPE_ICONS = {Feuer:'🔥',Wasser:'💧',Wald:'🌿',Sturm:'⚡',Fels:'🪨',Schatten:'🌑',Licht:'✨',Kosmos:'🌌'};
const PREFIX = ['Aero','Bram','Cryo','Dra','Ember','Ferro','Glim','Hydro','Ixo','Jade','Kiro','Luma','Moro','Nyx','Orbi','Pyra','Quill','Runa','Syl','Terra'];
const SUFFIX = ['bit','fang','flare','fox','horn','ling','moth','nox','paw','rex','rift','scale','spark','tail','thorn','wing','wyrm','zen'];
const RARITY_REWARD = {'Gewöhnlich':0,'Selten':5,'Episch':10,'Legendär':25,'Mythisch':50};

const PARTNER_CAMPAIGNS_KEY = 'scanquest_partner_demo_v1';

const COIN_PACKAGES = {
  starter:{id:'starter',coins:500,price:'0,99 €',label:'Starter'},
  hunter:{id:'hunter',coins:1200,price:'1,99 €',label:'Jäger'},
  collector:{id:'collector',coins:3000,price:'4,99 €',label:'Sammler'},
  legend:{id:'legend',coins:7500,price:'9,99 €',label:'Legende'}
};

const DEMO_MARKET_SEEDS = [
  {id:'mk-ember',barcode:'4006381333931',seller:'Luna87',price:20},
  {id:'mk-storm',barcode:'4012345678901',seller:'ScanHunter',price:35},
  {id:'mk-forest',barcode:'5901234123457',seller:'MikaQuest',price:55},
  {id:'mk-cosmic',barcode:'7613034626844',seller:'NovaMax',price:90},
  {id:'mk-shadow',barcode:'8714100633138',seller:'PixelRex',price:140},
  {id:'mk-mythic',barcode:'5000159484695',seller:'RareFinder',price:240}
];

const RETAIL_CAMPAIGNS = [
  {id:'fresh-mission',partner:'DemoMarkt',title:'Frische Mission',condition:'Produkt zuerst im Markt scannen und anschließend kaufen.',coins:120,scans:2,icon:'🥕',targetBarcode:null,windowMinutes:60},
  {id:'family-weekend',partner:'CityFresh',title:'Familien-Wochenende',condition:'Produkt im Markt scannen und innerhalb von 45 Minuten kaufen.',coins:180,scans:1,icon:'🛒',targetBarcode:null,windowMinutes:45},
  {id:'quest-drop',partner:'DemoMarkt',title:'ScanQuest Drop',condition:'Teilnehmendes Produkt vor dem Kauf scannen.',coins:80,scans:3,icon:'🎁',targetBarcode:null,windowMinutes:30}
];

let state = loadState();
let htmlScanner = null;
let nativeScannerStream = null;
let nativeScanTimer = null;
let nativeDetector = null;
let scanning = false;
let scanCandidate = '';
let scanCandidateHits = 0;
let scanCandidateAt = 0;
let activeCreature = null;
let currentFilter = 'all';
let activeMarketOfferId = null;

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
    retailPreScans: [],
    retailTransactions: {},
    market: {myListings:[],offers:{},trades:[]},
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
    raw.retailPreScans = Array.isArray(raw.retailPreScans) ? raw.retailPreScans : [];
    raw.retailTransactions = raw.retailTransactions || {};
    raw.market = raw.market || {};
    raw.market.myListings = Array.isArray(raw.market.myListings) ? raw.market.myListings : [];
    raw.market.offers = raw.market.offers || {};
    raw.market.trades = Array.isArray(raw.market.trades) ? raw.market.trades : [];
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

function normalizeBarcode(v){
  let s=String(v||'').trim().replace(/\s+/g,'');
  if(/^\d+$/.test(s)){
    // UPC-A kann vom Scanner auch als EAN-13 mit führender 0 geliefert werden.
    if(s.length===13 && s.startsWith('0')) s=s.slice(1);
    return s;
  }
  return s;
}

function validGtinCheckDigit(code){
  if(!/^\d+$/.test(code) || ![8,12,13,14].includes(code.length)) return null;
  const digits=code.split('').map(Number);
  const check=digits.pop();
  let sum=0;
  for(let i=digits.length-1,pos=0;i>=0;i--,pos++){
    sum += digits[i] * (pos%2===0 ? 3 : 1);
  }
  return ((10-(sum%10))%10)===check;
}

function validBarcode(v){
  if(!/^[0-9A-Za-z._-]{4,32}$/.test(v)) return false;
  const gtinValid=validGtinCheckDigit(v);
  return gtinValid===null ? true : gtinValid;
}

function applyQuestRewards(){
  const quests = [
    {id:'scan3',done:state.daily.uniqueIds.length>=3,reward:20},
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
  const baseReward = existed ? 0 : 15 + RARITY_REWARD[c.rarity];

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

  // Retail demo: trusted server time comes later. For now we store the browser timestamp.
  state.retailPreScans = Array.isArray(state.retailPreScans) ? state.retailPreScans : [];
  state.retailPreScans.push({barcode,scannedAt:Date.now()});
  state.retailPreScans = state.retailPreScans
    .filter(x=>Date.now()-Number(x.scannedAt||0) <= 24*60*60*1000)
    .slice(-50);

  applyQuestRewards();
  saveState();
  activeCreature = c;
  renderAll();
  showResult(c,!existed,baseReward,barcode);
}

function questData(){
  return [
    {id:'scan3',title:'Warm-up',desc:'Entdecke heute 3 verschiedene Wesen.',progress:Math.min(state.daily.uniqueIds.length,3),goal:3,reward:20},
    {id:'new2',title:'Entdecker',desc:'Finde heute 2 neue Wesen.',progress:Math.min(state.daily.newCount,2),goal:2,reward:25},
    {id:'rare1',title:'Seltene Spur',desc:'Finde ein seltenes oder besseres Wesen.',progress:Math.min(state.daily.rarePlus,1),goal:1,reward:30}
  ];
}

function renderAll(){
  $('#coinsTop').textContent=state.coins; $('#coinCount').textContent=state.coins;
  const shopBalance=$('#coinShopBalance'); if(shopBalance) shopBalance.textContent=state.coins;
  $('#scansTop').textContent=scansRemaining(); $('#scansScan').textContent=scansRemaining();
  const count=Object.keys(state.collection).length;
  $('#dexCount').textContent=count; $('#dexCount2').textContent=count;
  $('#dexBar').style.width=(count/SPECIES_TOTAL*100)+'%';
  $('#todayCount').textContent=state.daily.used;
  renderQuests(); renderRecent(); renderDex(); renderArena(); renderShop(); renderRetail(); renderMarket();
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
    (reward?'<p><b>+'+reward+' 🪙</b> erhalten</p>':(!isNew&&!fromDex?'<p class="muted"><b>Schon in deiner Sammlung – keine zusätzlichen Coins.</b></p>':''))+
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

function formatTime(ts){
  try{return new Date(ts).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});}catch(e){return '--:--'}
}

function latestEligiblePreScan(campaign, purchaseAt=Date.now()){
  const scans=Array.isArray(state.retailPreScans)?state.retailPreScans:[];
  const maxAge=Math.max(1,Number(campaign.windowMinutes||60))*60*1000;
  return [...scans].reverse().find(s=>{
    const sameProduct=!campaign.targetBarcode || normalizeBarcode(s.barcode)===normalizeBarcode(campaign.targetBarcode);
    const age=purchaseAt-Number(s.scannedAt||0);
    return sameProduct && age>=0 && age<=maxAge;
  }) || null;
}

function renderRetail(){
  const wrap=$('#retailCampaigns');
  if(!wrap) return;
  const claims=state.retailClaims||{};
  const claimedCount=Object.keys(claims).length;
  const label=$('#retailClaimsLabel');
  if(label) label.textContent=claimedCount+' Kaufbelohnungen erhalten';

  wrap.innerHTML=allRetailCampaigns().map(c=>{
    const claimed=claims[c.id];
    const preScan=latestEligiblePreScan(c);
    const windowMinutes=Math.max(1,Number(c.windowMinutes||60));
    const target=c.targetBarcode ? 'Produkt: '+c.targetBarcode : 'Beliebiger zuvor gescannter Produktbarcode';

    let proof='';
    let buttonLabel='Erst Produkt scannen';
    let disabled='disabled';
    let buttonClass='secondary';

    if(claimed){
      proof='<div class="scan-proof success"><b>✓ Scan + Kauf verknüpft</b><small>Scan '+formatTime(claimed.scannedAt)+' · Kasse '+formatTime(claimed.purchasedAt)+' · Transaktion '+claimed.transactionId+'</small></div>';
      buttonLabel='✓ Belohnung erhalten';
    }else if(preScan){
      proof='<div class="scan-proof ready"><b>✓ Vorscan erkannt</b><small>Barcode '+preScan.barcode+' · '+formatTime(preScan.scannedAt)+' · Kauf innerhalb '+windowMinutes+' Min.</small></div>';
      buttonLabel='Demo-Kassenkauf jetzt bestätigen';
      disabled='';
      buttonClass='primary';
    }else{
      proof='<div class="scan-proof"><b>Vorscan fehlt</b><small>'+target+' · Zeitfenster '+windowMinutes+' Min.</small></div>';
    }

    return '<article class="card retail-campaign '+(claimed?'claimed':'')+'">'+
      '<div class="retail-brand"><div class="retail-logo">'+c.icon+'</div><div><small>SCAN → BUY → REWARD</small><b>'+c.partner+'</b></div></div>'+
      '<h3>'+c.title+'</h3><p>'+c.condition+'</p>'+
      '<div class="retail-rewards"><span>+'+c.coins+' 🪙</span><span>+'+c.scans+' ⚡</span><span>⏱ '+windowMinutes+' Min.</span></div>'+
      proof+
      '<button class="'+buttonClass+' retail-claim" data-campaign="'+c.id+'" '+disabled+'>'+buttonLabel+'</button>'+
      '<small class="retail-tech">'+(claimed?'Belohnung wurde nur einmal für diese Demo-Transaktion vergeben.':'Die Demo-Kaufbestätigung simuliert die spätere Rückmeldung des Kassensystems.')+'</small>'+
      '</article>';
  }).join('');

  wrap.querySelectorAll('.retail-claim:not([disabled])').forEach(btn=>btn.addEventListener('click',()=>confirmRetailPurchase(btn.dataset.campaign)));
}

function confirmRetailPurchase(id){
  const campaign=allRetailCampaigns().find(c=>c.id===id);
  if(!campaign) return;

  state.retailClaims=state.retailClaims||{};
  state.retailTransactions=state.retailTransactions||{};
  if(state.retailClaims[id]){ toast('Diese Kampagne wurde bereits eingelöst.'); return; }

  const purchasedAt=Date.now();
  const preScan=latestEligiblePreScan(campaign,purchasedAt);
  if(!preScan){
    toast('Keine gültige Vorab-Erkennung gefunden. Produkt zuerst scannen.');
    setView('scan');
    return;
  }

  const transactionId='DEMO-'+purchasedAt.toString(36).toUpperCase();
  if(state.retailTransactions[transactionId]){
    toast('Diese Kassentransaktion wurde bereits verwendet.');
    return;
  }

  const elapsedMs=purchasedAt-Number(preScan.scannedAt||0);
  const maxMs=Math.max(1,Number(campaign.windowMinutes||60))*60*1000;
  if(elapsedMs<0 || elapsedMs>maxMs){
    toast('Der Produkt-Scan liegt außerhalb des erlaubten Zeitfensters.');
    return;
  }

  const expectedBarcode=campaign.targetBarcode ? normalizeBarcode(campaign.targetBarcode) : normalizeBarcode(preScan.barcode);
  if(normalizeBarcode(preScan.barcode)!==expectedBarcode){
    toast('Der gekaufte Artikel stimmt nicht mit dem vorher gescannten Produkt überein.');
    return;
  }

  const claim={
    confirmedAt:purchasedAt,
    purchasedAt,
    scannedAt:Number(preScan.scannedAt),
    barcode:expectedBarcode,
    transactionId
  };
  state.retailClaims[id]=claim;
  state.retailTransactions[transactionId]={campaignId:id,barcode:expectedBarcode,purchasedAt};

  state.coins += Number(campaign.coins||0);
  state.daily.bonus = Number(state.daily.bonus||0)+Number(campaign.scans||0);
  saveState();
  renderAll();
  toast('Scan + Kauf bestätigt: +'+campaign.coins+' 🪙 und +'+campaign.scans+' ⚡');
}


function marketListings(){
  const boughtIds=new Set((state.market?.trades||[]).map(t=>t.listingId));
  return DEMO_MARKET_SEEDS.map(x=>({...x,creature:creatureFor(x.barcode)})).filter(x=>!boughtIds.has(x.id));
}

function isOwnedSpecies(speciesId){
  return !!state.collection[String(speciesId)];
}

function marketEscape(v){
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function marketplaceFee(price){
  return Math.max(1,Math.floor(Number(price||0)*0.05));
}

function renderMarket(){
  const wrap=$('#marketListings');
  if(!wrap)return;

  state.market=state.market||{myListings:[],offers:{},trades:[]};
  state.market.myListings=Array.isArray(state.market.myListings)?state.market.myListings:[];
  state.market.offers=state.market.offers||{};
  state.market.trades=Array.isArray(state.market.trades)?state.market.trades:[];

  const coinEl=$('#marketCoins');
  if(coinEl)coinEl.textContent=state.coins;

  const listings=marketListings();
  wrap.innerHTML=listings.map(l=>{
    const c=l.creature;
    const owned=isOwnedSpecies(c.speciesId);
    const offer=state.market.offers[l.id];
    const canBuy=!owned && state.coins>=l.price;
    let negotiation='';
    if(offer && offer.status==='countered'){
      negotiation='<div class="market-counter"><small>Dein Angebot: '+offer.amount+' 🪙</small><b>Gegenangebot: '+offer.counter+' 🪙</b>'+
        '<button class="secondary accept-counter" data-id="'+l.id+'" '+(state.coins<offer.counter?'disabled':'')+'>Gegenangebot annehmen</button></div>';
    }
    return '<article class="card market-card">'+
      '<div class="market-creature-art">'+creatureSVG(c)+'</div>'+
      '<div class="market-card-top"><span class="rarity r-'+c.rarity+'">'+c.rarity+'</span><small>von '+marketEscape(l.seller)+'</small></div>'+
      '<h3>#'+String(c.speciesId).padStart(3,'0')+' '+c.name+'</h3>'+
      '<p>'+TYPE_ICONS[c.type]+' '+c.type+' · Stärke '+c.power+' · Tempo '+c.speed+'</p>'+
      '<div class="market-price">'+l.price+' 🪙</div>'+
      (owned?'<div class="market-owned">✓ Bereits in deinem ScanDex</div>':
      '<div class="market-actions"><button class="primary market-buy" data-id="'+l.id+'" '+(canBuy?'':'disabled')+'>'+(canBuy?'Kaufen':'Zu wenig Coins')+'</button>'+
      '<button class="secondary market-negotiate" data-id="'+l.id+'">Verhandeln</button></div>')+
      negotiation+
      '</article>';
  }).join('') || '<div class="empty-state">Alle Demo-Angebote wurden gekauft.</div>';

  wrap.querySelectorAll('.market-buy').forEach(btn=>btn.addEventListener('click',()=>buyMarketListing(btn.dataset.id)));
  wrap.querySelectorAll('.market-negotiate').forEach(btn=>btn.addEventListener('click',()=>openMarketOffer(btn.dataset.id)));
  wrap.querySelectorAll('.accept-counter').forEach(btn=>btn.addEventListener('click',()=>acceptMarketCounter(btn.dataset.id)));

  const select=$('#sellMonsterSelect');
  if(select){
    const listedIds=new Set(state.market.myListings.map(x=>String(x.speciesId)));
    const entries=Object.values(state.collection)
      .filter(e=>!listedIds.has(String(e.creature.speciesId)))
      .sort((a,b)=>a.creature.speciesId-b.creature.speciesId);
    select.innerHTML=entries.length
      ? '<option value="">Monster auswählen …</option>'+entries.map(e=>'<option value="'+e.creature.speciesId+'">#'+String(e.creature.speciesId).padStart(3,'0')+' '+marketEscape(e.creature.name)+' · '+e.creature.rarity+'</option>').join('')
      : '<option value="">Keine freien Monster zum Verkaufen</option>';
    select.disabled=!entries.length;
  }

  const mine=$('#myMarketListings');
  if(mine){
    mine.innerHTML=state.market.myListings.length?state.market.myListings.map(l=>{
      const e=state.collection[String(l.speciesId)];
      const c=e?.creature || l.creature;
      if(!c)return '';
      const offer=l.incomingOffer;
      return '<div class="my-listing">'+
        '<div><b>#'+String(c.speciesId).padStart(3,'0')+' '+marketEscape(c.name)+'</b><small>'+l.price+' 🪙 Verkaufspreis</small></div>'+
        (offer?'<div class="incoming-offer"><small>Demo-Spieler bietet</small><strong>'+offer+' 🪙</strong>'+
          '<div><button class="primary accept-my-offer" data-id="'+l.id+'">Annehmen</button><button class="secondary reject-my-offer" data-id="'+l.id+'">Ablehnen</button></div></div>':
          '<button class="secondary create-demo-offer" data-id="'+l.id+'">Demo-Angebot erhalten</button>')+
        '<button class="text-btn withdraw-listing" data-id="'+l.id+'">Angebot zurückziehen</button>'+
        '</div>';
    }).join(''):'<p class="muted">Du hast noch kein Monster eingestellt.</p>';

    mine.querySelectorAll('.withdraw-listing').forEach(btn=>btn.addEventListener('click',()=>withdrawMyListing(btn.dataset.id)));
    mine.querySelectorAll('.create-demo-offer').forEach(btn=>btn.addEventListener('click',()=>createDemoBuyerOffer(btn.dataset.id)));
    mine.querySelectorAll('.accept-my-offer').forEach(btn=>btn.addEventListener('click',()=>acceptMyListingOffer(btn.dataset.id)));
    mine.querySelectorAll('.reject-my-offer').forEach(btn=>btn.addEventListener('click',()=>rejectMyListingOffer(btn.dataset.id)));
  }
}

function findMarketListing(id){
  return marketListings().find(x=>x.id===id) || null;
}

function executeMarketPurchase(listing,price){
  if(!listing)return;
  const c=listing.creature;
  if(isOwnedSpecies(c.speciesId)){toast('Dieses Monster besitzt du bereits.');return;}
  price=Math.max(1,Number(price||0));
  if(state.coins<price){toast('Du hast nicht genug ScanCoins.');return;}

  state.coins-=price;
  state.collection[String(c.speciesId)]={
    creature:c,
    firstBarcode:listing.barcode,
    discoveredAt:Date.now(),
    encounters:1,
    acquiredVia:'market'
  };
  state.market.trades.push({listingId:listing.id,price,purchasedAt:Date.now(),speciesId:c.speciesId,seller:listing.seller});
  delete state.market.offers[listing.id];
  saveState();
  renderAll();
  toast(c.name+' gekauft für '+price+' 🪙');
}

function buyMarketListing(id){
  const listing=findMarketListing(id);
  if(!listing)return;
  executeMarketPurchase(listing,listing.price);
}

function openMarketOffer(id){
  const listing=findMarketListing(id);
  if(!listing)return;
  if(isOwnedSpecies(listing.creature.speciesId)){toast('Dieses Monster besitzt du bereits.');return;}
  activeMarketOfferId=id;
  $('#offerMonsterPreview').innerHTML='<div class="offer-preview">'+creatureSVG(listing.creature)+'<div><b>'+marketEscape(listing.creature.name)+'</b><small>Preis: '+listing.price+' 🪙</small></div></div>';
  $('#marketOfferAmount').value=Math.max(1,Math.floor(listing.price*.8));
  $('#marketOfferModal').classList.remove('hidden');
}

function closeMarketOffer(){
  activeMarketOfferId=null;
  const modal=$('#marketOfferModal');
  if(modal)modal.classList.add('hidden');
}

function submitMarketOffer(amount){
  const listing=findMarketListing(activeMarketOfferId);
  if(!listing)return;
  amount=Math.max(1,Number(amount||0));
  if(state.coins<amount){toast('Für dieses Angebot hast du nicht genug Coins.');return;}

  const minimum=Math.ceil(listing.price*.85);
  if(amount>=minimum){
    closeMarketOffer();
    executeMarketPurchase(listing,amount);
    return;
  }

  const counter=Math.max(minimum,Math.ceil(listing.price*.92));
  state.market.offers[listing.id]={amount,counter,status:'countered',createdAt:Date.now()};
  saveState();
  closeMarketOffer();
  renderMarket();
  toast('Verkäufer macht ein Gegenangebot: '+counter+' 🪙');
}

function acceptMarketCounter(id){
  const listing=findMarketListing(id);
  const offer=state.market.offers[id];
  if(!listing||!offer)return;
  executeMarketPurchase(listing,offer.counter);
}

function listOwnMonster(speciesId,price){
  const entry=state.collection[String(speciesId)];
  if(!entry){toast('Monster nicht gefunden.');return;}
  if(state.market.myListings.some(x=>String(x.speciesId)===String(speciesId))){toast('Dieses Monster ist bereits eingestellt.');return;}
  price=Math.max(10,Math.min(100000,Number(price||0)));
  state.market.myListings.unshift({
    id:'mine-'+Date.now().toString(36),
    speciesId:entry.creature.speciesId,
    creature:entry.creature,
    price,
    createdAt:Date.now(),
    incomingOffer:null
  });
  saveState();
  renderMarket();
  toast(entry.creature.name+' wurde für '+price+' 🪙 eingestellt.');
}

function withdrawMyListing(id){
  state.market.myListings=state.market.myListings.filter(x=>x.id!==id);
  saveState();renderMarket();toast('Angebot zurückgezogen.');
}

function createDemoBuyerOffer(id){
  const listing=state.market.myListings.find(x=>x.id===id);
  if(!listing)return;
  const pct=80+(hash32('buyer:'+id)%11);
  listing.incomingOffer=Math.max(10,Math.floor(listing.price*pct/100));
  saveState();renderMarket();
}

function rejectMyListingOffer(id){
  const listing=state.market.myListings.find(x=>x.id===id);
  if(!listing)return;
  listing.incomingOffer=null;
  saveState();renderMarket();toast('Angebot abgelehnt.');
}

function acceptMyListingOffer(id){
  const listing=state.market.myListings.find(x=>x.id===id);
  if(!listing||!listing.incomingOffer)return;
  const entry=state.collection[String(listing.speciesId)];
  if(!entry){toast('Monster nicht mehr vorhanden.');return;}

  const gross=Number(listing.incomingOffer);
  const fee=marketplaceFee(gross);
  const net=gross-fee;
  delete state.collection[String(listing.speciesId)];
  state.coins+=net;
  state.market.trades.push({listingId:listing.id,price:gross,fee,soldAt:Date.now(),speciesId:listing.speciesId,buyer:'DemoBuyer',direction:'sale'});
  state.market.myListings=state.market.myListings.filter(x=>x.id!==id);
  saveState();renderAll();
  toast('Verkauft: '+net+' 🪙 erhalten · '+fee+' 🪙 Gebühr');
}

function openCoinShop(){
  const modal=$('#coinShopModal');
  if(!modal)return;
  const balance=$('#coinShopBalance');
  if(balance)balance.textContent=state.coins;
  const status=$('#coinPurchaseStatus');
  if(status)status.innerHTML='<b>Noch keine echte Zahlung aktiv</b><span>Die Pakete sind vorbereitet. Es wird aktuell nichts abgebucht und durch Antippen werden keine Coins gutgeschrieben.</span>';
  modal.classList.remove('hidden');
}

function closeCoinShop(){
  const modal=$('#coinShopModal');
  if(modal)modal.classList.add('hidden');
}

function prepareCoinPurchase(id){
  const pack=COIN_PACKAGES[id];
  if(!pack)return;
  const status=$('#coinPurchaseStatus');
  if(status){
    status.innerHTML='<b>'+pack.coins.toLocaleString('de-DE')+' ScanCoins · '+pack.price+'</b><span>Dieses Paket ist für den späteren Checkout vorbereitet. Zahlungsanbieter noch nicht verbunden – es wird nichts abgebucht.</span>';
  }
  toast('Coin-Paket vorbereitet – Zahlung noch nicht aktiv.');
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
  if(name==='market')renderMarket();
}

function bindViewButtons(root=document){
  root.querySelectorAll('[data-view]').forEach(btn=>{
    if(btn.dataset.bound)return; btn.dataset.bound='1';
    btn.addEventListener('click',()=>setView(btn.dataset.view));
  });
}

async function acceptScannedBarcode(raw){
  if(!scanning)return false;
  const normalized=normalizeBarcode(raw);
  if(!validBarcode(normalized)){
    $('#cameraHelp').textContent='Barcode gesehen, aber noch nicht sauber gelesen – etwas Abstand halten und ruhig bleiben.';
    return false;
  }
  scanning=false;
  $('#cameraHelp').textContent='✓ Barcode erkannt: '+normalized;
  await closeScanner();
  processScan(normalized);
  return true;
}

async function startNativeBarcodeScanner(){
  if(!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) throw new Error('Native scanner unavailable');

  let supported=[];
  try{ supported=await BarcodeDetector.getSupportedFormats(); }catch(e){}
  const wanted=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','codabar','itf'];
  const formats=wanted.filter(x=>!supported.length || supported.includes(x));
  nativeDetector=new BarcodeDetector(formats.length?{formats}:undefined);

  nativeScannerStream=await navigator.mediaDevices.getUserMedia({
    video:{
      facingMode:{ideal:'environment'},
      width:{ideal:1920},
      height:{ideal:1080},
      frameRate:{ideal:30}
    },
    audio:false
  });

  const reader=$('#reader');
  reader.innerHTML='<div class="native-reader"><video id="nativeBarcodeVideo" playsinline muted></video><div class="native-guide"><i></i><span>Barcode vollständig in den Rahmen halten</span></div></div>';
  const video=$('#nativeBarcodeVideo');
  video.srcObject=nativeScannerStream;
  await video.play();

  try{
    const track=nativeScannerStream.getVideoTracks()[0];
    const caps=track.getCapabilities?.()||{};
    if(Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')){
      await track.applyConstraints({advanced:[{focusMode:'continuous'}]});
    }
  }catch(e){}

  $('#cameraHelp').textContent='Scanner 2.0 aktiv · Barcode quer halten · ca. 10–20 cm Abstand.';
  scanning=true;

  const detect=async()=>{
    if(!scanning || !nativeDetector || !video || video.readyState<2)return;
    try{
      const results=await nativeDetector.detect(video);
      for(const result of results||[]){
        if(result?.rawValue && await acceptScannedBarcode(result.rawValue)) return;
      }
    }catch(e){}
  };
  nativeScanTimer=setInterval(detect,110);
}

async function startHtml5BarcodeScanner(){
  if(typeof Html5Qrcode==='undefined') throw new Error('Fallback scanner unavailable');

  $('#reader').innerHTML='';
  htmlScanner=new Html5Qrcode('reader',{verbose:false});
  scanning=true;
  $('#cameraHelp').textContent='Fallback-Scanner aktiv · Barcode quer und vollständig in den Rahmen halten.';

  await htmlScanner.start(
    {facingMode:'environment'},
    {
      fps:20,
      qrbox:(w,h)=>({
        width:Math.max(160,Math.min(Math.floor(w*.92),w-12)),
        height:Math.max(90,Math.min(Math.floor(h*.42),h-12))
      }),
      aspectRatio:1.7778,
      disableFlip:true
    },
    decoded=>{ if(scanning) acceptScannedBarcode(decoded); },
    ()=>{}
  );
}

async function openScanner(){
  if(scansRemaining()<=0){
    showScanStatus('Keine Scans mehr übrig. Hol dir im Shop einen Extra-Scan.',true);
    setView('shop');
    return;
  }

  await closeScanner();
  $('#scannerModal').classList.remove('hidden');
  $('#cameraHelp').textContent='Kamera wird gestartet …';

  try{
    await startNativeBarcodeScanner();
  }catch(nativeError){
    try{
      await stopNativeScanner();
      await startHtml5BarcodeScanner();
    }catch(fallbackError){
      scanning=false;
      $('#cameraHelp').textContent='Kamera-Scanner konnte nicht gestartet werden. Prüfe die Kameraberechtigung oder gib den Barcode unten manuell ein.';
    }
  }
}

async function stopNativeScanner(){
  if(nativeScanTimer){
    clearInterval(nativeScanTimer);
    nativeScanTimer=null;
  }
  nativeDetector=null;
  if(nativeScannerStream){
    nativeScannerStream.getTracks().forEach(t=>t.stop());
    nativeScannerStream=null;
  }
  const video=$('#nativeBarcodeVideo');
  if(video)video.srcObject=null;
}

async function closeScanner(){
  scanning=false;
  scanCandidate='';
  scanCandidateHits=0;
  scanCandidateAt=0;

  await stopNativeScanner();

  if(htmlScanner){
    try{await htmlScanner.stop();}catch(e){}
    try{htmlScanner.clear();}catch(e){}
    htmlScanner=null;
  }

  const reader=$('#reader');
  if(reader)reader.innerHTML='';
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
$('#openCoinShopBtn').addEventListener('click',openCoinShop);
$('#closeCoinShopBtn').addEventListener('click',closeCoinShop);
$('[data-coin-pack]').forEach(btn=>btn.addEventListener('click',()=>prepareCoinPurchase(btn.dataset.coinPack)));
$('#sellMonsterForm').addEventListener('submit',e=>{e.preventDefault();const speciesId=$('#sellMonsterSelect').value;const price=$('#sellMonsterPrice').value;if(!speciesId)return;listOwnMonster(speciesId,price);});
$('#marketOfferForm').addEventListener('submit',e=>{e.preventDefault();submitMarketOffer($('#marketOfferAmount').value);});
$('#closeOfferModalBtn').addEventListener('click',closeMarketOffer);
$$('.filter').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');currentFilter=btn.dataset.rarity;renderDex();}));
$('#scannerModal').addEventListener('click',e=>{if(e.target===$('#scannerModal'))closeScanner();});
$('#marketOfferModal').addEventListener('click',e=>{if(e.target===$('#marketOfferModal'))closeMarketOffer();});
$('#coinShopModal').addEventListener('click',e=>{if(e.target===$('#coinShopModal'))closeCoinShop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&scanning)closeScanner();});

bindViewButtons();
renderAll();
