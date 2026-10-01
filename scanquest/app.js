const STORAGE_KEY = 'scanquest_state_v1';
const BASE_DAILY_SCANS = 3;
const FREE_SCAN_WINDOW_MS = 24*60*60*1000;
const SPECIES_TOTAL = 120;

const TYPES = ['Feuer','Wasser','Wald','Sturm','Fels','Schatten','Licht','Kosmos'];
const TYPE_ICONS = {Feuer:'🔥',Wasser:'💧',Wald:'🌿',Sturm:'⚡',Fels:'🪨',Schatten:'🌑',Licht:'✨',Kosmos:'🌌'};
const PREFIX = ['Aero','Bram','Cryo','Dra','Ember','Ferro','Glim','Hydro','Ixo','Jade','Kiro','Luma','Moro','Nyx','Orbi','Pyra','Quill','Runa','Syl','Terra'];
const SUFFIX = ['bit','fang','flare','fox','horn','ling','moth','nox','paw','rex','rift','scale','spark','tail','thorn','wing','wyrm','zen'];
const RARITY_REWARD = {'Standard':0,'Selten':8,'Episch':20,'Legendär':60,'Mythisch':120};

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

let rarityMapCache = null;
let state = loadState();
let htmlScanner = null;
let nativeScannerStream = null;
let nativeScannerTrack = null;
let nativeScanTimer = null;
let nativeFocusTimer = null;
let nativeFocusBusy = false;
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
    coins: 0,
    collection: {},
    totalScans: 0,
    retailClaims: {},
    retailPreScans: [],
    retailTransactions: {},
    market: {myListings:[],offers:{},trades:[]},
    scanCycle: {freeUsed:0,resetAt:0,extraScans:0,version:2},
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
    raw.scanCycle = raw.scanCycle || {
      freeUsed: 0,
      resetAt: 0,
      extraScans: Number(raw.daily?.bonus||0),
      version: 2
    };
    if(Number(raw.scanCycle.version||0)<2){
      raw.scanCycle.freeUsed=0;
      raw.scanCycle.resetAt=0;
      raw.scanCycle.version=2;
    }
    raw.scanCycle.freeUsed = Math.max(0,Math.min(BASE_DAILY_SCANS,Number(raw.scanCycle.freeUsed||0)));
    raw.scanCycle.extraScans = Math.max(0,Number(raw.scanCycle.extraScans||0));
    raw.scanCycle.resetAt = Number(raw.scanCycle.resetAt||0);
    raw.scanCycle.version=2;
    if(raw.scanCycle.freeUsed>=BASE_DAILY_SCANS && !raw.scanCycle.resetAt){
      raw.scanCycle.resetAt=Date.now()+FREE_SCAN_WINDOW_MS;
    }
    if(raw.scanCycle.resetAt && Date.now()>=raw.scanCycle.resetAt){
      raw.scanCycle.freeUsed=0;
      raw.scanCycle.resetAt=0;
    }
    Object.values(raw.collection).forEach(entry=>{
      if(entry && entry.firstBarcode){
        const encounters=Number(entry.encounters||1);
        const refreshed=creatureFor(normalizeBarcode(entry.firstBarcode));
        entry.creature=refreshed;
        entry.encounters=encounters;
      }
    });
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

function buildRarityMap(){
  const ranked=Array.from({length:SPECIES_TOTAL},(_,i)=>i+1)
    .sort((a,b)=>(hash32('rarity-rank:'+a)-hash32('rarity-rank:'+b)) || a-b);
  const map={};
  ranked.forEach((speciesId,rank)=>{
    map[speciesId] = rank===0 ? 'Mythisch'
      : rank===1 ? 'Legendär'
      : rank<5 ? 'Episch'
      : rank<12 ? 'Selten'
      : 'Standard';
  });
  return map;
}

function rarityFor(id){
  if(!rarityMapCache) rarityMapCache=buildRarityMap();
  return rarityMapCache[id] || 'Standard';
}

function creatureForSpecies(speciesId){
  const seed = hash32('creature:' + speciesId);
  const rarity = rarityFor(speciesId);
  const type = TYPES[seed % TYPES.length];
  const power = 35 + (hash32('p:' + speciesId) % 66);
  const speed = 35 + (hash32('s:' + speciesId) % 66);
  const energy = 35 + (hash32('e:' + speciesId) % 66);
  const luck = 20 + (hash32('l:' + speciesId) % 81);
  return {speciesId,name:speciesName(speciesId),rarity,type,power,speed,energy,luck};
}

function creatureFor(barcode){
  const speciesId = (hash32('species:' + barcode) % SPECIES_TOTAL) + 1;
  return creatureForSpecies(speciesId);
}

function hueFor(id,offset=0){ return (hash32('h:' + id) + offset) % 360; }

function creatureSVGFallback(c){
  const id=c.speciesId;
  const h1=hueFor(id,0), h2=hueFor(id,70), h3=hueFor(id,160);
  const rare=c.rarity!=='Standard';
  const epic=['Episch','Legendär','Mythisch'].includes(c.rarity);
  const top=['Legendär','Mythisch'].includes(c.rarity);
  const mythic=c.rarity==='Mythisch';

  const eyeHue=(hash32('eye:'+id)%360);
  const furLight='hsl('+h1+' 78% 76%)';
  const furMid='hsl('+h1+' 66% 55%)';
  const furDark='hsl('+h2+' 55% 28%)';
  const accent='hsl('+h3+' 90% 68%)';

  const sparkles=Array.from({length: rare?12:5},(_,i)=>{
    const x=8+(hash32('gx:'+id+':'+i)%84);
    const y=7+(hash32('gy:'+id+':'+i)%76);
    const r=rare?(0.8+(i%3)*0.45):(0.55+(i%2)*0.35);
    const op=rare?(0.38+(i%4)*0.12):(0.12+(i%3)*0.08);
    return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="white" opacity="'+op+'"/>';
  }).join('');

  const crystals=epic?[
    [14,31,7],[84,24,6],[11,65,5],[88,64,7],[28,12,5],[72,10,5]
  ].map((p,i)=>'<path d="M'+p[0]+' '+(p[1]-p[2])+' L'+(p[0]+p[2]*.62)+' '+p[1]+' L'+p[0]+' '+(p[1]+p[2])+' L'+(p[0]-p[2]*.62)+' '+p[1]+' Z" fill="url(#cr'+id+')" opacity="'+(0.55+i*.05)+'"/>').join(''):'';

  const halo=rare
    ? '<circle cx="50" cy="49" r="'+(top?42:39)+'" fill="none" stroke="url(#halo'+id+')" stroke-width="'+(top?2.2:1.3)+'" opacity="'+(top?.95:.62)+'"/>'+
      (epic?'<circle cx="50" cy="49" r="34" fill="none" stroke="url(#halo'+id+')" stroke-dasharray="3 4" stroke-width="1.2" opacity=".72"/>':'')
    : '';

  const crown=top
    ? '<path d="M38 28 L43 17 L49 24 L55 14 L61 27 L68 20 L65 34 Q50 30 35 34 Z" fill="url(#gold'+id+')" stroke="rgba(255,255,255,.5)" stroke-width=".7"/>'
    : '';

  const mythicAura=mythic
    ? '<path d="M16 48 C8 25 31 6 49 10 C66 2 91 23 84 47 C95 64 79 91 55 87 C37 96 9 79 16 48 Z" fill="url(#myth'+id+')" opacity=".22" filter="url(#glow'+id+')"/>'
    : '';

  const earStyle=id%3;
  const ears=earStyle===0
    ? '<path d="M34 43 Q15 28 18 51 Q22 61 37 55 Z" fill="'+furMid+'" stroke="rgba(255,255,255,.22)" stroke-width="1.2"/><path d="M66 43 Q85 28 82 51 Q78 61 63 55 Z" fill="'+furMid+'" stroke="rgba(255,255,255,.22)" stroke-width="1.2"/>'
    : earStyle===1
    ? '<path d="M35 42 L18 23 Q18 45 27 57 L39 53 Z" fill="'+furMid+'" stroke="rgba(255,255,255,.22)" stroke-width="1.2"/><path d="M65 42 L82 23 Q82 45 73 57 L61 53 Z" fill="'+furMid+'" stroke="rgba(255,255,255,.22)" stroke-width="1.2"/>'
    : '<path d="M35 43 Q17 20 23 56 L39 52 Z" fill="'+furMid+'" stroke="rgba(255,255,255,.22)" stroke-width="1.2"/><path d="M65 43 Q83 20 77 56 L61 52 Z" fill="'+furMid+'" stroke="rgba(255,255,255,.22)" stroke-width="1.2"/>';

  const horns=(id%4===0 || epic)
    ? '<path d="M38 35 C28 27 28 17 35 15 C31 24 36 29 42 31" fill="none" stroke="'+accent+'" stroke-width="4.2" stroke-linecap="round"/><path d="M62 35 C72 27 72 17 65 15 C69 24 64 29 58 31" fill="none" stroke="'+accent+'" stroke-width="4.2" stroke-linecap="round"/>'
    : '';

  const tail=(id%2===0)
    ? '<path d="M68 72 Q89 67 84 52 Q80 43 73 50 Q82 54 78 62 Q73 68 65 66" fill="none" stroke="'+furMid+'" stroke-width="7" stroke-linecap="round"/>'
    : '<path d="M69 73 Q87 78 88 62 Q89 49 79 45 Q84 56 78 63 Q73 68 66 66" fill="none" stroke="'+furMid+'" stroke-width="7" stroke-linecap="round"/>';

  const wing=epic
    ? '<path d="M33 58 Q15 46 12 64 Q18 72 34 69" fill="url(#wing'+id+')" opacity=".78"/><path d="M67 58 Q85 46 88 64 Q82 72 66 69" fill="url(#wing'+id+')" opacity=".78"/>'
    : '';

  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+c.name+'">'+
    '<defs>'+
      '<radialGradient id="bg'+id+'" cx="50%" cy="38%" r="72%"><stop stop-color="hsl('+h2+' 55% '+(rare?26:20)+'%)"/><stop offset="1" stop-color="#06101c"/></radialGradient>'+
      '<linearGradient id="belly'+id+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+furLight+'"/><stop offset="1" stop-color="'+furMid+'"/></linearGradient>'+
      '<linearGradient id="cr'+id+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset=".45" stop-color="'+accent+'"/><stop offset="1" stop-color="hsl('+h2+' 90% 48%)"/></linearGradient>'+
      '<linearGradient id="halo'+id+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+(mythic?'#ffffff':accent)+'"/><stop offset=".5" stop-color="'+(top?'#ffd76a':'hsl('+h1+' 95% 70%)')+'"/><stop offset="1" stop-color="'+accent+'"/></linearGradient>'+
      '<linearGradient id="gold'+id+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff6b2"/><stop offset=".45" stop-color="#ffd45d"/><stop offset="1" stop-color="#b96c12"/></linearGradient>'+
      '<linearGradient id="wing'+id+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="rgba(255,255,255,.88)"/><stop offset="1" stop-color="'+accent+'"/></linearGradient>'+
      '<radialGradient id="myth'+id+'"><stop stop-color="#fff"/><stop offset=".35" stop-color="#78f8ff"/><stop offset=".68" stop-color="#d871ff"/><stop offset="1" stop-color="#ff7db7"/></radialGradient>'+
      '<filter id="glow'+id+'" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="'+(top?2.8:1.6)+'" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
    '</defs>'+
    '<rect width="100" height="100" rx="18" fill="url(#bg'+id+')"/>'+
    mythicAura+sparkles+halo+crystals+wing+tail+horns+ears+crown+
    '<ellipse cx="50" cy="70" rx="22" ry="18" fill="'+furDark+'" opacity=".92"/>'+
    '<circle cx="50" cy="49" r="27" fill="'+furMid+'" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>'+
    '<path d="M30 50 Q34 31 50 27 Q66 31 70 50 Q63 42 55 41 Q50 34 45 41 Q37 42 30 50 Z" fill="'+furLight+'" opacity=".85"/>'+
    '<ellipse cx="50" cy="67" rx="14" ry="13" fill="url(#belly'+id+')" opacity=".92"/>'+
    '<ellipse cx="40" cy="50" rx="7.4" ry="9.2" fill="#10141d"/><ellipse cx="60" cy="50" rx="7.4" ry="9.2" fill="#10141d"/>'+
    '<ellipse cx="40" cy="50" rx="4.7" ry="6.6" fill="hsl('+eyeHue+' 82% 58%)"/><ellipse cx="60" cy="50" rx="4.7" ry="6.6" fill="hsl('+eyeHue+' 82% 58%)"/>'+
    '<circle cx="38" cy="47" r="2.2" fill="#fff"/><circle cx="58" cy="47" r="2.2" fill="#fff"/>'+
    '<circle cx="42" cy="53" r="1.1" fill="#fff" opacity=".65"/><circle cx="62" cy="53" r="1.1" fill="#fff" opacity=".65"/>'+
    '<path d="M47 59 Q50 61.5 53 59" fill="none" stroke="#412935" stroke-width="1.8" stroke-linecap="round"/>'+
    '<path d="M50 56 L47.5 58.3 L52.5 58.3 Z" fill="#6b344d"/>'+
    '<path d="M45 62 Q50 67 55 62" fill="#6d2a45" stroke="#27151e" stroke-width=".8"/>'+
    '<path d="M47 63 L48.5 67 L50 64.5" fill="#fff"/><path d="M53 63 L51.5 67 L50 64.5" fill="#fff"/>'+
    '<ellipse cx="36" cy="72" rx="7" ry="5.5" fill="'+furMid+'"/><ellipse cx="64" cy="72" rx="7" ry="5.5" fill="'+furMid+'"/>'+
    '<path d="M31 73 q5 4 10 0" fill="none" stroke="rgba(20,20,30,.45)" stroke-width="1"/><path d="M59 73 q5 4 10 0" fill="none" stroke="rgba(20,20,30,.45)" stroke-width="1"/>'+
    (rare?'<circle cx="50" cy="77" r="4.4" fill="url(#cr'+id+')" stroke="rgba(255,255,255,.75)" stroke-width=".7"/>':'')+
    '</svg>';
}


let gremlinSpriteReady=false;

const HQ_PLACEHOLDER='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384"><defs><radialGradient id="g"><stop stop-color="#183450"/><stop offset="1" stop-color="#07111f"/></radialGradient></defs><rect width="384" height="384" fill="url(#g)"/><circle cx="192" cy="185" r="72" fill="rgba(255,255,255,.05)"/></svg>');
const HQ_GREMLIN_ART={
  0:HQ_PLACEHOLDER,
  1:HQ_PLACEHOLDER,
  3:HQ_PLACEHOLDER
};

function gremlinSpriteIndex(c){
  const seed=hash32('hq-art:'+c.speciesId);
  if(c.rarity==='Mythisch' || c.rarity==='Legendär' || c.rarity==='Episch' || c.rarity==='Selten') return 3;
  return seed%2;
}

function creatureArtwork(c){
  const index=gremlinSpriteIndex(c);
  const src=HQ_GREMLIN_ART[index] || HQ_GREMLIN_ART[0];
  return '<img class="gremlin-art-img" data-hq-art="'+index+'" src="'+src+'" alt="'+c.name+'" loading="eager" decoding="async">';
}

function applyLoadedHqArt(index,src){
  HQ_GREMLIN_ART[index]=src;
  document.querySelectorAll('[data-hq-art="'+index+'"]').forEach(img=>{
    if(img.tagName==='IMG' && img.src!==src) img.src=src;
  });
}

async function loadHqB64(index,path){
  const res=await fetch(path,{cache:'force-cache'});
  if(!res.ok) throw new Error('HQ-Art '+index+' konnte nicht geladen werden');
  const b64=(await res.text()).trim();
  if(!b64.startsWith('UklG')) throw new Error('HQ-Art '+index+' ist ungültig');
  const src='data:image/webp;base64,'+b64;
  applyLoadedHqArt(index,src);
}

async function loadGremlinSprite(){
  document.documentElement.classList.add('gremlin-art-ready');
  try{
    await Promise.all([
      loadHqB64(0,'assets/hq/q8_0.b64?v=2'),
      loadHqB64(1,'assets/hq/q8_1.b64?v=2'),
      loadHqB64(3,'assets/hq/q8_3.b64?v=2')
    ]);
    gremlinSpriteReady=true;
    document.documentElement.classList.add('gremlin-hq-ready');
  }catch(e){
    console.warn('HQ-Gremlin-Artwork teilweise nicht geladen',e);
  }
}

function refreshScanCycle(){
  state.scanCycle=state.scanCycle||{freeUsed:0,resetAt:0,extraScans:0,version:2};
  if(state.scanCycle.resetAt && Date.now()>=state.scanCycle.resetAt){
    state.scanCycle.freeUsed=0;
    state.scanCycle.resetAt=0;
    saveState();
  }
}

function freeScansRemaining(){
  refreshScanCycle();
  return Math.max(0,BASE_DAILY_SCANS-Number(state.scanCycle.freeUsed||0));
}

function scansRemaining(){
  refreshScanCycle();
  return freeScansRemaining()+Math.max(0,Number(state.scanCycle.extraScans||0));
}

function scanCooldownMs(){
  refreshScanCycle();
  if(freeScansRemaining()>0 || !state.scanCycle.resetAt) return 0;
  return Math.max(0,Number(state.scanCycle.resetAt)-Date.now());
}

function formatScanCooldown(ms){
  if(ms<=0)return 'Gratis-Scans sind wieder verfügbar';
  const total=Math.ceil(ms/1000);
  const h=Math.floor(total/3600);
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

function renderScanCooldown(){
  const el=$('#scanResetLabel');
  if(!el)return;
  const free=freeScansRemaining();
  if(free>0){
    el.textContent=free+' von '+BASE_DAILY_SCANS+' Gratis-Scans verfügbar';
    el.classList.remove('cooldown');
  }else{
    el.textContent='Neue 3 Gratis-Scans in '+formatScanCooldown(scanCooldownMs());
    el.classList.add('cooldown');
  }
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
    {id:'scan3',done:state.daily.uniqueIds.length>=3},
    {id:'new2',done:state.daily.newCount>=2},
    {id:'rare1',done:state.daily.rarePlus>=1}
  ];
  quests.forEach(q=>{
    if(q.done && !state.daily.rewarded[q.id]){
      state.daily.rewarded[q.id]=true;
      toast('Quest geschafft! Coins gibt es nur durch Kaufbestätigung, Monsterverkauf oder Coin-Kauf.');
    }
  });
}

function processScan(raw){
  const barcode = normalizeBarcode(raw);
  if(!validBarcode(barcode)){ showScanStatus('Der Barcode sieht nicht gültig aus. Bitte erneut scannen oder manuell eingeben.',true); return; }
  if(scansRemaining()<=0){ showScanStatus('Deine 3 Gratis-Scans sind aufgebraucht. Kaufe einen Extra-Scan mit Coins oder warte '+formatScanCooldown(scanCooldownMs())+'.',true); return; }

  const c = creatureFor(barcode);
  const key = String(c.speciesId);
  const existed = !!state.collection[key];
  const baseReward = 0;

  if(freeScansRemaining()>0){
    state.scanCycle.freeUsed++;
    if(state.scanCycle.freeUsed>=BASE_DAILY_SCANS && !state.scanCycle.resetAt){
      state.scanCycle.resetAt=Date.now()+FREE_SCAN_WINDOW_MS;
    }
  }else if(Number(state.scanCycle.extraScans||0)>0){
    state.scanCycle.extraScans--;
  }
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

  // Ein normaler Scan gibt bewusst keine Coins. Er erzeugt nur das Monster.
  // Coins entstehen nur aus bestätigten Händlerkäufen, Monsterverkäufen oder später echten Coin-Käufen.

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
    {id:'scan3',title:'Warm-up',desc:'Entdecke heute 3 verschiedene Wesen.',progress:Math.min(state.daily.uniqueIds.length,3),goal:3,rewardLabel:'Fortschritt'},
    {id:'new2',title:'Entdecker',desc:'Finde heute 2 neue Wesen.',progress:Math.min(state.daily.newCount,2),goal:2,rewardLabel:'Fortschritt'},
    {id:'rare1',title:'Seltene Spur',desc:'Finde ein seltenes oder besseres Wesen.',progress:Math.min(state.daily.rarePlus,1),goal:1,rewardLabel:'Fortschritt'}
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
  renderScanCooldown();
  renderQuests(); renderRecent(); renderDex(); renderArena(); renderShop(); renderRetail(); renderMarket();
}

function renderQuests(){
  const qs=questData();
  $('#questDoneLabel').textContent=qs.filter(q=>q.progress>=q.goal).length+'/3 geschafft';
  $('#questList').innerHTML=qs.map(q=>{
    const done=q.progress>=q.goal;
    return '<article class="quest '+(done?'done':'')+'"><span class="reward">'+q.rewardLabel+'</span><b>'+(done?'✓ ':'')+q.title+'</b><p>'+q.desc+'</p><div class="qprog"><i style="width:'+Math.min(100,q.progress/q.goal*100)+'%"></i></div><small>'+q.progress+'/'+q.goal+'</small></article>';
  }).join('');
}

function creatureCard(entry){
  const c=entry.creature;
  return '<button class="creature-card collected-card" data-rarity="'+c.rarity+'" data-creature="'+c.speciesId+'">'+
    '<div class="creature-art">'+creatureArtwork(c)+'</div>'+
    '<div class="creature-meta"><b>#'+String(c.speciesId).padStart(3,'0')+' '+c.name+'</b>'+
    '<small>'+TYPE_ICONS[c.type]+' '+c.type+'</small><br>'+
    '<span class="rarity r-'+c.rarity+'">'+c.rarity+'</span>'+
    '<span class="dex-status collected">✓ Gesammelt</span></div></button>';
}

function lockedCreatureCard(c){
  return '<button class="creature-card locked-creature" data-rarity="'+c.rarity+'" data-locked-creature="'+c.speciesId+'">'+
    '<div class="creature-art">'+creatureArtwork(c)+'</div>'+
    '<div class="creature-meta"><b>#'+String(c.speciesId).padStart(3,'0')+' '+c.name+'</b>'+
    '<small>'+TYPE_ICONS[c.type]+' '+c.type+'</small><br>'+
    '<span class="rarity r-'+c.rarity+'">'+c.rarity+'</span>'+
    '<span class="dex-status locked">🔒 Noch nicht entdeckt</span></div></button>';
}

function renderRecent(){
  const entries=Object.values(state.collection).sort((a,b)=>b.discoveredAt-a.discoveredAt).slice(0,5);
  const el=$('#recentCreatures');
  if(!entries.length){el.className='creature-row empty-state';el.textContent='Noch keine Wesen entdeckt.';return;}
  el.className='creature-row';el.innerHTML=entries.map(creatureCard).join(''); bindCreatureCards(el);
}

function renderDex(){
  const grid=$('#dexGrid'); if(!grid)return;
  const species=[];
  for(let i=1;i<=SPECIES_TOTAL;i++){
    const owned=state.collection[String(i)] || null;
    const c=owned?.creature || creatureForSpecies(i);
    if(currentFilter==='all' || c.rarity===currentFilter) species.push({owned,c});
  }

  grid.innerHTML=species.map(({owned,c})=>
    '<div class="dex-slot">'+(owned?creatureCard(owned):lockedCreatureCard(c))+'</div>'
  ).join('');

  bindCreatureCards(grid);
  grid.querySelectorAll('[data-locked-creature]').forEach(btn=>btn.addEventListener('click',()=>{
    const c=creatureForSpecies(Number(btn.dataset.lockedCreature));
    toast(c.name+' hast du noch nicht entdeckt.');
  }));
}

function bindCreatureCards(root){
  root.querySelectorAll('[data-creature]').forEach(btn=>btn.addEventListener('click',()=>{
    const e=state.collection[btn.dataset.creature]; if(!e)return;
    showResult(e.creature,false,0,e.firstBarcode,true);
  }));
}

function showResult(c,isNew,reward,barcode,fromDex=false){
  const masked=barcode.length>5?'•••• '+barcode.slice(-5):barcode;
  $('#resultWrap').innerHTML='<article class="result-card card" data-rarity="'+c.rarity+'">'+
    '<div>'+(isNew?'<span class="new-badge">NEUE ENTDECKUNG</span>':'<span class="duplicate-badge">'+(fromDex?'SCANDEX-EINTRAG':'SCHON ENTDECKT')+'</span>')+'</div>'+
    '<div class="result-art">'+creatureArtwork(c)+'</div>'+
    '<span class="rarity r-'+c.rarity+'">'+c.rarity+'</span>'+
    '<h1>'+c.name+'</h1><p class="muted">#'+String(c.speciesId).padStart(3,'0')+' · '+TYPE_ICONS[c.type]+' '+c.type+' · Barcode '+masked+'</p>'+
    (!fromDex?'<p class="scan-coin-note"><b>'+ (isNew?'Monster gesammelt.':'Schon in deiner Sammlung.') +'</b><br><span>Für den Scan selbst gibt es keine Coins. Händler-Coins erst nach bestätigtem Kauf.</span></p>':'')+
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
  state.scanCycle=state.scanCycle||{freeUsed:0,resetAt:0,extraScans:0,version:2};
  state.scanCycle.extraScans = Number(state.scanCycle.extraScans||0)+Number(campaign.scans||0);
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
    return '<article class="card market-card" data-rarity="'+c.rarity+'">'+
      '<div class="market-creature-art">'+creatureArtwork(c)+'</div>'+
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
  $('#offerMonsterPreview').innerHTML='<div class="offer-preview">'+creatureArtwork(listing.creature)+'<div><b>'+marketEscape(listing.creature.name)+'</b><small>Preis: '+listing.price+' 🪙</small></div></div>';
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
  state.coins-=40;
  state.scanCycle=state.scanCycle||{freeUsed:0,resetAt:0,extraScans:0,version:2};
  state.scanCycle.extraScans=Number(state.scanCycle.extraScans||0)+1;
  saveState(); renderAll(); toast('+1 Extra-Scan freigeschaltet ⚡');
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
  root.querySelectorAll('[data-view]:not(.nav)').forEach(btn=>{
    if(btn.dataset.bound)return; btn.dataset.bound='1';
    btn.addEventListener('click',()=>setView(btn.dataset.view));
  });
}

const bottomNav=$('#bottomNav');
if(bottomNav){
  bottomNav.addEventListener('click',e=>{
    const btn=e.target.closest('.nav[data-view]');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    const target=btn.dataset.view;
    setView(target==='scan'?'scan':target);
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

async function optimizeCameraTrack(track){
  if(!track)return {focus:false,exposure:false,whiteBalance:false};
  try{ track.contentHint='detail'; }catch(e){}

  const caps=track.getCapabilities?.()||{};
  const advanced={};
  let focus=false,exposure=false,whiteBalance=false;

  if(Array.isArray(caps.focusMode)){
    if(caps.focusMode.includes('continuous')){
      advanced.focusMode='continuous';
      focus=true;
    }else if(caps.focusMode.includes('single-shot')){
      advanced.focusMode='single-shot';
      focus=true;
    }
  }

  if(Array.isArray(caps.exposureMode) && caps.exposureMode.includes('continuous')){
    advanced.exposureMode='continuous';
    exposure=true;
  }

  if(Array.isArray(caps.whiteBalanceMode) && caps.whiteBalanceMode.includes('continuous')){
    advanced.whiteBalanceMode='continuous';
    whiteBalance=true;
  }

  if(Object.keys(advanced).length){
    try{ await track.applyConstraints({advanced:[advanced]}); }catch(e){}
  }

  // Einige Android-Kameras reagieren besser, wenn nach dem Start noch einmal
  // ein einzelner Fokusimpuls ausgelöst wird und danach continuous übernimmt.
  if(Array.isArray(caps.focusMode) && caps.focusMode.includes('single-shot') && caps.focusMode.includes('continuous')){
    try{
      await track.applyConstraints({advanced:[{focusMode:'single-shot'}]});
      await new Promise(r=>setTimeout(r,280));
      await track.applyConstraints({advanced:[{focusMode:'continuous'}]});
      focus=true;
    }catch(e){}
  }

  return {focus,exposure,whiteBalance};
}

function cameraFocusModes(track){
  try{
    const caps=track?.getCapabilities?.()||{};
    return Array.isArray(caps.focusMode)?caps.focusMode:[];
  }catch(e){ return []; }
}

async function setContinuousCameraFocus(track){
  if(!track)return false;
  try{ track.contentHint='detail'; }catch(e){}
  const modes=cameraFocusModes(track);
  if(!modes.includes('continuous'))return false;
  try{
    await track.applyConstraints({advanced:[{focusMode:'continuous'}]});
    return true;
  }catch(e){ return false; }
}

async function refocusNativeCamera(showPulse=true){
  if(nativeFocusBusy || !nativeScannerTrack || nativeScannerTrack.readyState==='ended')return false;
  nativeFocusBusy=true;
  const reader=document.querySelector('.native-reader');

  if(showPulse && reader){
    reader.classList.remove('focus-pulse');
    void reader.offsetWidth;
    reader.classList.add('focus-pulse');
    setTimeout(()=>reader.classList.remove('focus-pulse'),650);
  }

  try{
    const modes=cameraFocusModes(nativeScannerTrack);
    if(modes.includes('single-shot')){
      await nativeScannerTrack.applyConstraints({advanced:[{focusMode:'single-shot'}]});
      await new Promise(resolve=>setTimeout(resolve,260));
    }
    if(modes.includes('continuous')){
      await nativeScannerTrack.applyConstraints({advanced:[{focusMode:'continuous'}]});
    }
    return modes.length>0;
  }catch(e){
    try{return await setContinuousCameraFocus(nativeScannerTrack);}catch(err){return false;}
  }finally{
    nativeFocusBusy=false;
  }
}

function startNativeFocusAssist(){
  if(nativeFocusTimer){
    clearInterval(nativeFocusTimer);
    nativeFocusTimer=null;
  }
  const modes=cameraFocusModes(nativeScannerTrack);
  if(!modes.includes('continuous') && modes.includes('single-shot')){
    nativeFocusTimer=setInterval(()=>{
      if(scanning)refocusNativeCamera(false);
    },2600);
  }
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
      frameRate:{ideal:30},
      advanced:[{focusMode:'continuous'}]
    },
    audio:false
  });

  nativeScannerTrack=nativeScannerStream.getVideoTracks()[0]||null;

  const reader=$('#reader');
  reader.innerHTML='<div class="native-reader"><video id="nativeBarcodeVideo" playsinline muted></video><button type="button" class="focus-tap" aria-label="Kamera neu fokussieren"><span>◎</span></button><div class="native-guide"><i></i><span>Barcode vollständig in den Rahmen halten</span></div></div>';
  const video=$('#nativeBarcodeVideo');
  video.srcObject=nativeScannerStream;
  await video.play();

  const cameraFeatures=await optimizeCameraTrack(nativeScannerTrack);
  const continuousFocus=await setContinuousCameraFocus(nativeScannerTrack);
  if(!continuousFocus && !cameraFeatures.focus)await refocusNativeCamera(false);
  startNativeFocusAssist();

  const focusTap=reader.querySelector('.focus-tap');
  if(focusTap){
    focusTap.addEventListener('click',async e=>{
      e.preventDefault();
      e.stopPropagation();
      $('#cameraHelp').textContent='Fokussiere … Barcode kurz ruhig halten.';
      await refocusNativeCamera(true);
      $('#cameraHelp').textContent='Autofokus aktiv · Barcode quer halten · ca. 10–20 cm Abstand.';
    });
  }
  video.addEventListener('pointerup',()=>refocusNativeCamera(true));

  $('#cameraHelp').textContent=(continuousFocus?'Autofokus aktiv':'Fokus-Assistent aktiv')+' · Barcode quer halten · ca. 10–20 cm Abstand · Tippen zum Nachfokussieren.';
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
  nativeScanTimer=setInterval(detect,100);
}

function ensureHtml5Qrcode(){
  if(typeof Html5Qrcode!=='undefined') return Promise.resolve(true);

  return new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(ok,err)=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      ok?resolve(true):reject(err||new Error('Scanner-Bibliothek konnte nicht geladen werden'));
    };

    const tryBackup=()=>{
      if(typeof Html5Qrcode!=='undefined'){ finish(true); return; }
      const backup=document.createElement('script');
      backup.src='https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
      backup.async=true;
      backup.dataset.scanquestFallback='1';
      backup.onload=()=>typeof Html5Qrcode!=='undefined'?finish(true):finish(false,new Error('Scanner global fehlt'));
      backup.onerror=()=>finish(false,new Error('Scanner-CDN nicht erreichbar'));
      document.head.appendChild(backup);
    };

    const existing=[...document.scripts].find(s=>String(s.src||'').includes('html5-qrcode'));
    if(existing){
      existing.addEventListener('load',()=>typeof Html5Qrcode!=='undefined'?finish(true):tryBackup(),{once:true});
      existing.addEventListener('error',tryBackup,{once:true});
      setTimeout(()=>{
        if(settled)return;
        if(typeof Html5Qrcode!=='undefined') finish(true);
        else tryBackup();
      },900);
    }else{
      tryBackup();
    }

    const timer=setTimeout(()=>finish(false,new Error('Scanner-Ladezeit überschritten')),9000);
  });
}

async function startHtml5BarcodeScanner(){
  if(typeof Html5Qrcode==='undefined'){
    $('#cameraHelp').textContent='Scanner wird geladen …';
    await ensureHtml5Qrcode();
  }
  if(typeof Html5Qrcode==='undefined') throw new Error('Fallback scanner unavailable');

  $('#reader').innerHTML='';
  htmlScanner=new Html5Qrcode('reader',{verbose:false});
  scanning=true;
  $('#cameraHelp').textContent='Fallback-Scanner aktiv · Barcode quer und vollständig in den Rahmen halten.';

  await htmlScanner.start(
    {facingMode:'environment'},
    {
      fps:24,
      qrbox:(w,h)=>({
        width:Math.max(180,Math.min(Math.floor(w*.94),w-12)),
        height:Math.max(96,Math.min(Math.floor(h*.40),h-12))
      }),
      aspectRatio:1.7778,
      disableFlip:true
    },
    decoded=>{ if(scanning) acceptScannedBarcode(decoded); },
    ()=>{}
  );

  // Auch beim Fallback versuchen wir direkt den echten Kamera-Track zu optimieren.
  try{
    await new Promise(r=>setTimeout(r,180));
    const fallbackVideo=$('#reader video');
    const fallbackTrack=fallbackVideo?.srcObject?.getVideoTracks?.()[0];
    const features=await optimizeCameraTrack(fallbackTrack);
    if(features.focus)$('#cameraHelp').textContent='Fallback-Scanner · Autofokus aktiv · Barcode ruhig und vollständig halten.';
  }catch(e){}
}

async function openScanner(){
  if(scansRemaining()<=0){
    setView('scan');
    showScanStatus('Keine Scans mehr übrig. Kaufe einen Extra-Scan mit Coins oder warte '+formatScanCooldown(scanCooldownMs())+'.',true);
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
      $('#cameraHelp').textContent='Scanner konnte nicht gestartet werden. Bitte Kameraberechtigung erlauben und erneut versuchen. Manuelle Eingabe bleibt verfügbar.';
    }
  }
}

async function stopNativeScanner(){
  if(nativeScanTimer){
    clearInterval(nativeScanTimer);
    nativeScanTimer=null;
  }
  if(nativeFocusTimer){
    clearInterval(nativeFocusTimer);
    nativeFocusTimer=null;
  }
  nativeFocusBusy=false;
  nativeDetector=null;
  nativeScannerTrack=null;
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
loadGremlinSprite();
setInterval(renderScanCooldown,1000);
