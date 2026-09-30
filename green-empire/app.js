const key='greenEmpireGamePlantV2';
const $=id=>document.getElementById(id);

const stageNames=['Keimling','Jungpflanze','Wachstum','Vorblüte','Blüte'];
const strains=[
  {id:'dream',name:'Green Dream',duration:90,yield:42,value:6,hue:116},
  {id:'storm',name:'Purple Storm',duration:115,yield:58,value:8,hue:103},
  {id:'lemon',name:'Lemon Sky',duration:140,yield:72,value:10,hue:88},
  {id:'gold',name:'Northern Gold',duration:170,yield:95,value:13,hue:105}
];
const orders=[['dream',20,170],['storm',25,260],['lemon',30,390],['gold',35,570]];
const rivals=[['Kiosk Crew',3,220],['Dockside Boys',8,540],['Night Owls',15,1100],['City Kings',24,2400]];

const base={
  name:'Rookie',level:1,xp:0,cash:750,gems:30,rep:0,room:1,
  inventory:{dream:0,storm:0,lemon:0,gold:0},
  slots:[null,null,null,null,null],
  upgrades:{rack:1,speed:0,rep:0},
  log:['Green Empire gestartet. Drei Grow-Slots sind bereit.']
};
let s=JSON.parse(localStorage.getItem(key)||'null')||structuredClone(base);
while(s.slots.length<5)s.slots.push(null);

function strain(id){return strains.find(x=>x.id===id)}
function xpNeed(){return 80+(s.level-1)*60}
function slotMax(){return Math.min(5,2+s.upgrades.rack)}
function totalStock(){return Object.values(s.inventory).reduce((a,b)=>a+b,0)}
function effectiveTime(t){return Math.max(35,Math.round(t*(1-s.upgrades.speed*.15)))}
function progress(slot){return slot?Math.min(100,((Date.now()-slot.start)/slot.duration)*100):0}
function stageIndex(p){if(p<20)return 0;if(p<40)return 1;if(p<65)return 2;if(p<90)return 3;return 4}
function timeLeft(slot){const sec=Math.max(0,Math.ceil((slot.duration-(Date.now()-slot.start))/1000));return Math.floor(sec/60)+'m '+String(sec%60).padStart(2,'0')+'s'}
function note(msg,cls=''){s.log.unshift({msg,cls});s.log=s.log.slice(0,25)}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1300)}
function save(){localStorage.setItem(key,JSON.stringify(s));render()}
function addXp(n){s.xp+=n;while(s.xp>=xpNeed()){s.xp-=xpNeed();s.level++;s.cash+=250;note('Level '+s.level+' erreicht: +250 €','good')}}

function plantSvg(stage,pct,seed=0,hue=112){
  const scale=[.32,.48,.68,.86,1][stage] * (.92 + Math.min(1,pct/100)*.08);
  const stemH=[48,82,118,145,160][stage];
  const sets=[1,3,5,7,8][stage];
  const leafLight='hsl('+hue+',55%,46%)';
  const leafMid='hsl('+hue+',58%,32%)';
  const leafDark='hsl('+hue+',62%,18%)';
  let clusters='';
  for(let i=0;i<sets;i++){
    const y=148-(i*(stage<2?24:18));
    const side=i%2===0?-1:1;
    const rot=(i%3-1)*10 + side*3;
    const size=stage===0?.7:Math.min(1.08,.72+i*.055+stage*.04);
    clusters+=`
      <g transform="translate(100 ${y}) rotate(${rot}) scale(${size})">
        <g transform="rotate(${side*2})">
          <path d="M0 0 C-5 -8 -6 -26 0 -42 C7 -25 6 -8 0 0Z" fill="url(#leafG)" stroke="${leafDark}" stroke-width="1"/>
          <path d="M-2 -5 C-13 -10 -27 -24 -31 -39 C-14 -33 -4 -19 0 -7Z" fill="url(#leafG)" stroke="${leafDark}" stroke-width="1"/>
          <path d="M2 -5 C13 -10 27 -24 31 -39 C14 -33 4 -19 0 -7Z" fill="url(#leafG)" stroke="${leafDark}" stroke-width="1"/>
          <path d="M-3 -3 C-15 -4 -31 -12 -40 -24 C-23 -23 -8 -14 0 -5Z" fill="url(#leafG)" stroke="${leafDark}" stroke-width="1"/>
          <path d="M3 -3 C15 -4 31 -12 40 -24 C23 -23 8 -14 0 -5Z" fill="url(#leafG)" stroke="${leafDark}" stroke-width="1"/>
          <path d="M-1 -1 C-11 1 -24 -1 -34 -8 C-20 -10 -7 -6 0 -2Z" fill="url(#leafG)" stroke="${leafDark}" stroke-width="1"/>
          <path d="M1 -1 C11 1 24 -1 34 -8 C20 -10 7 -6 0 -2Z" fill="url(#leafG)" stroke="${leafDark}" stroke-width="1"/>
          <path d="M0 -2 L0 -37" stroke="rgba(210,255,210,.35)" stroke-width="1"/>
        </g>
      </g>`;
  }

  let buds='';
  if(stage>=3){
    const budCount=stage===3?5:10;
    for(let i=0;i<budCount;i++){
      const x=100 + ((i%2===0?-1:1)*(8+(i%4)*8));
      const y=45 + (i*9)%78;
      const r=stage===3?5+(i%3):7+(i%4);
      buds+=`<g transform="translate(${x} ${y})">
        <ellipse rx="${r*.72}" ry="${r}" fill="url(#budG)" filter="url(#soft)"/>
        <path d="M-${r*.45} -${r*.55} Q0 -${r*1.35} ${r*.45} -${r*.55}" stroke="#f6d49a" stroke-width="1.3" fill="none" opacity=".85"/>
        <path d="M-${r*.5} 0 Q0 -${r*.8} ${r*.5} 0" stroke="#e9b16b" stroke-width="1" fill="none" opacity=".75"/>
      </g>`;
    }
  }

  const branches = stage>=1 ? Array.from({length:Math.min(7,sets)},(_,i)=>{
    const y=151-i*18, dir=i%2===0?-1:1, len=22+stage*6+i*2;
    return `<path d="M100 ${y} Q${100+dir*10} ${y-12} ${100+dir*len} ${y-24}" stroke="url(#stemG)" stroke-width="${stage<2?3:4}" fill="none" stroke-linecap="round"/>`;
  }).join('') : '';

  return `<svg class="plantAsset" viewBox="0 0 200 230" preserveAspectRatio="xMidYMax meet">
    <defs>
      <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${leafLight}"/><stop offset=".48" stop-color="${leafMid}"/><stop offset="1" stop-color="${leafDark}"/></linearGradient>
      <linearGradient id="stemG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#245d2b"/><stop offset=".5" stop-color="#68a74c"/><stop offset="1" stop-color="#1b4822"/></linearGradient>
      <radialGradient id="budG"><stop offset="0" stop-color="${stage===4?'#e7d9a6':'#b9d688'}"/><stop offset=".55" stop-color="${stage===4?'#88a94f':'#6d9442'}"/><stop offset="1" stop-color="#3f642c"/></radialGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
      <filter id="soft"><feGaussianBlur stdDeviation=".18"/></filter>
    </defs>
    <ellipse cx="100" cy="213" rx="55" ry="10" fill="rgba(0,0,0,.42)"/>
    <g transform="translate(100 204) scale(${scale}) translate(-100 -204)" filter="url(#shadow)">
      <path d="M100 196 C98 158 101 ${196-stemH*.7} 100 ${196-stemH}" stroke="url(#stemG)" stroke-width="${stage===0?4:6}" fill="none" stroke-linecap="round"/>
      ${branches}
      ${clusters}
      ${buds}
    </g>
    <g>
      <ellipse cx="100" cy="189" rx="43" ry="9" fill="#5b3924"/>
      <path d="M57 189 L64 218 Q100 229 136 218 L143 189Z" fill="url(#potG)" stroke="#2a211b" stroke-width="2"/>
      <ellipse cx="100" cy="189" rx="43" ry="9" fill="#2e2118"/>
      <ellipse cx="100" cy="187.5" rx="37" ry="6.5" fill="#4a321e"/>
    </g>
    <defs><linearGradient id="potG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#252a27"/><stop offset=".5" stop-color="#101310"/><stop offset="1" stop-color="#343a35"/></linearGradient></defs>
  </svg>`;
}

function startPlant(i,id){
  if(i>=slotMax())return toast('Slot noch gesperrt');
  if(s.slots[i])return;
  const st=strain(id),cost=Math.round(st.value*6);
  if(s.cash<cost)return toast('Zu wenig Cash');
  s.cash-=cost;s.slots[i]={strainId:id,start:Date.now(),duration:effectiveTime(st.duration)*1000,boosted:false};
  note(st.name+' in Slot '+(i+1)+' gestartet (-'+cost+' €)');save();
}
function careBoost(i){
  const sl=s.slots[i];if(!sl)return;if(sl.boosted)return toast('Pflegebonus schon genutzt');
  sl.start-=Math.round(sl.duration*.08);sl.boosted=true;note('Pflegebonus für Slot '+(i+1)+' aktiviert','good');save();
}
function harvest(i){
  const sl=s.slots[i];if(!sl||progress(sl)<100)return;
  const st=strain(sl.strainId),amount=Math.round(st.yield*(1+s.room*.05));
  s.inventory[st.id]+=amount;s.slots[i]=null;s.rep+=1+s.upgrades.rep;addXp(18);note(amount+' g '+st.name+' geerntet','good');save();
}
function removePlant(i){if(!s.slots[i])return;if(!confirm('Pflanze wirklich entfernen?'))return;s.slots[i]=null;note('Pflanze aus Slot '+(i+1)+' entfernt','bad');save()}

function emptyRoomPlant(i){
  if(i>=slotMax())return '<article class="roomPlant"><div class="roomPlantCard"><div class="roomPlantPhoto locked">🔒</div><div class="roomPlantInfo"><strong>Slot '+(i+1)+'</strong><div class="stageName">Gesperrt</div><button class="startPlantBtn" disabled>Upgrade nötig</button></div></div></article>';
  const st=strains[(i+s.level)%strains.length];
  return '<article class="roomPlant"><div class="roomPlantCard"><div class="roomPlantPhoto gamePlant">'+plantSvg(0,0,i,st.hue)+'</div><div class="roomPlantInfo"><strong>Freier Topf · Slot '+(i+1)+'</strong><div class="stageName">Neue Pflanze wählen</div><select class="select" id="roomSelect'+i+'">'+strains.map(x=>'<option value="'+x.id+'">'+x.name+' · '+Math.round(x.value*6)+' €</option>').join('')+'</select><button class="startPlantBtn" onclick="startSelectedPlant('+i+')">Starten</button></div></div></article>';
}
function startSelectedPlant(i){
  const sel=$('roomSelect'+i);
  if(!sel)return toast('Auswahl konnte nicht geladen werden');
  startPlant(i,sel.value);
}
window.startSelectedPlant=startSelectedPlant;
window.startPlant=startPlant;
window.careBoost=careBoost;
window.harvest=harvest;
window.sell=sell;
window.completeOrder=completeOrder;
window.upgrade=upgrade;
window.fight=fight;
window.testPack=testPack;
window.finishAll=finishAll;
window.vipBoost=vipBoost;
window.resetGame=resetGame;

function activeRoomPlant(i){
  const sl=s.slots[i],st=strain(sl.strainId),p=progress(sl),stage=stageIndex(p);
  return '<article class="roomPlant"><div class="roomPlantCard"><div class="roomPlantPhoto gamePlant">'+plantSvg(stage,p,i,st.hue)+'</div><div class="roomPlantInfo"><strong>'+st.name+'</strong><div class="stageName">'+(stage+1)+'. '+stageNames[stage]+'</div><div class="progress"><i style="width:'+p+'%"></i></div><div class="roomPlantMeta"><span>'+Math.floor(p)+'%</span><span>'+(p>=100?'erntereif':timeLeft(sl))+'</span></div><div class="roomPlantActions"><button onclick="careBoost('+i+')" '+(sl.boosted||p>=100?'disabled':'')+'>Pflegebonus</button><button onclick="harvest('+i+')" '+(p<100?'disabled':'')+'>Ernten</button></div></div></div></article>';
}
function renderRoomPlants(){document.getElementById('roomPlants').innerHTML=[0,1,2,3,4].map(i=>s.slots[i]?activeRoomPlant(i):emptyRoomPlant(i)).join('')}
function renderPlantOverview(){
  document.getElementById('plantOverview').innerHTML=[0,1,2,3,4].map(i=>{
    if(i>=slotMax())return '<div class="miniPlant"><div class="miniPlantPhoto lockedMini">🔒</div><div class="miniPlantBody"><b>Slot '+(i+1)+'</b><small>gesperrt</small></div></div>';
    const sl=s.slots[i];
    if(!sl){const st=strains[(i+s.level)%strains.length];return '<div class="miniPlant"><div class="miniPlantPhoto gamePlant">'+plantSvg(0,0,i,st.hue)+'</div><div class="miniPlantBody"><b>Slot '+(i+1)+'</b><small>frei</small></div></div>'}
    const st=strain(sl.strainId),p=progress(sl),stage=stageIndex(p);
    return '<div class="miniPlant"><div class="miniPlantPhoto gamePlant">'+plantSvg(stage,p,i,st.hue)+'</div><div class="miniPlantBody"><b>'+st.name+'</b><small>'+stageNames[stage]+' · '+Math.floor(p)+'%</small><div class="progress"><i style="width:'+p+'%"></i></div></div></div>';
  }).join('');
}

function sell(id,amount){const st=strain(id);if(s.inventory[id]<amount)return toast('Nicht genug Bestand');const money=Math.round(amount*st.value*(1+s.rep*.002));s.inventory[id]-=amount;s.cash+=money;addXp(8);note(amount+' g '+st.name+' an NPC verkauft: +'+money+' €','good');save()}
function renderSell(){document.getElementById('sellList').innerHTML=strains.map(st=>'<div class="sellCard row"><div><b>'+st.name+'</b><div class="muted">Sofortverkauf: 10 g</div></div><button class="cta green" onclick="sell(\''+st.id+'\',10)">+'+Math.round(10*st.value*(1+s.rep*.002))+' €</button></div>').join('')}
function renderInventory(){document.getElementById('inventoryList').innerHTML=strains.map(st=>'<div class="inventoryCard row"><div><b>'+st.name+'</b><div class="muted">Lagerbestand</div></div><b>'+s.inventory[st.id]+' g</b></div>').join('')}
function completeOrder(id,amount,reward,rep){if(s.inventory[id]<amount)return toast('Nicht genug Bestand');s.inventory[id]-=amount;s.cash+=reward+s.level*12;s.rep+=rep;addXp(20);note('Auftrag abgeschlossen: +'+(reward+s.level*12)+' € / +'+rep+' Ruf','good');save()}
function renderOrders(){document.getElementById('ordersList').innerHTML=orders.map((o,i)=>{const st=strain(o[0]);return '<div class="orderCard"><div class="row"><div><b>NPC-Auftrag #'+(i+1)+': '+st.name+'</b><div class="muted">'+o[1]+' g · +'+(4+i)+' Ruf</div></div><button class="cta green" onclick="completeOrder(\''+o[0]+'\','+o[1]+','+o[2]+','+(4+i)+')">'+(o[2]+s.level*12)+' €</button></div></div>'}).join('')}
function upgrade(type){const baseCost={rack:900,speed:1200,rep:1500}[type],level=s.upgrades[type],cost=Math.round(baseCost*Math.pow(1.7,level));if(s.cash<cost)return toast('Zu wenig Cash');if(type==='rack'&&level>=3)return toast('Maximal');if(type!=='rack'&&level>=3)return toast('Maximal');s.cash-=cost;s.upgrades[type]++;if(type==='rack')s.room++;note('Upgrade gekauft: '+type+' Stufe '+s.upgrades[type],'good');save()}
function renderUpgrades(){const data=[['rack','Zusätzlicher Pflanzenslot','Mehr sichtbare Töpfe im Grow Room'],['speed','Raumtempo','Kürzere Spieltimer'],['rep','Kontakt-Netzwerk','Mehr Ruf pro Ernte']];document.getElementById('upgradeList').innerHTML=data.map(x=>{const k=x[0],baseCost={rack:900,speed:1200,rep:1500}[k],cost=Math.round(baseCost*Math.pow(1.7,s.upgrades[k]));return '<div class="upgradeCard row"><div><b>'+x[1]+' · Stufe '+s.upgrades[k]+'</b><div class="muted">'+x[2]+'</div></div><button class="cta green" onclick="upgrade(\''+k+'\')">'+cost+' €</button></div>'}).join('')}
function fight(i){const r=rivals[i],power=s.level+s.rep*.15+s.room*2,chance=Math.max(.2,Math.min(.85,.5+(power-r[1])*.035));if(Math.random()<chance){s.cash+=r[2];s.rep+=3+i;addXp(16);note('Rivale '+r[0]+' geschlagen: +'+r[2]+' €','good');toast('Sieg!')}else{const loss=Math.min(s.cash,Math.round(r[2]*.15));s.cash-=loss;note('Gegen '+r[0]+' verloren: -'+loss+' €','bad');toast('Niederlage')}save()}
function renderRivals(){
  document.getElementById('rivalList').innerHTML=rivals.map((r,i)=>{
    const power=s.level+s.rep*.15+s.room*2;
    const chance=Math.round(Math.max(.2,Math.min(.85,.5+(power-r[1])*.035))*100);
    return '<div class="rivalCard row"><div><b>'+r[0]+'</b><div class="muted">Schwierigkeit '+r[1]+' · ca. '+chance+'% Chance</div></div><button class="cta green" onclick="fight('+i+')">Duell</button></div>';
  }).join('');
}
function renderRanking(){const score=Math.round(s.level*1200+s.rep*80+s.cash+totalStock()*4);const rows=[['GreenWolf',18400],['PurpleKing',15100],['DockBoss',11900],['NeonLeaf',8700],[s.name,score],['Rookie77',4100],['BasementBen',2300]].sort((a,b)=>b[1]-a[1]);document.getElementById('rankingList').innerHTML=rows.map((r,i)=>'<div class="rank '+(r[0]===s.name?'me':'')+'"><b>#'+(i+1)+'</b><span>'+r[0]+'</span><b>'+r[1].toLocaleString('de-DE')+'</b></div>').join('')}
function renderLog(){document.getElementById('logList').innerHTML=(s.log||[]).map(x=>typeof x==='string'?'<div>'+x+'</div>':'<div class="'+(x.cls||'')+'">'+x.msg+'</div>').join('')}
function testPack(g,c){s.gems+=g;s.cash+=c;note('Test-Premium: +'+g+' 💎 / +'+c+' €','good');save()}
function finishAll(){if(s.gems<25)return toast('Zu wenig Diamanten');s.gems-=25;s.slots=s.slots.map(p=>p?Object.assign({},p,{start:Date.now()-p.duration}):p);note('Growth Boost aktiviert (-25 💎)','good');save()}
function vipBoost(){if(s.gems<20)return toast('Zu wenig Diamanten');s.gems-=20;s.rep+=10;s.cash+=500;note('VIP Bonus: +10 Ruf / +500 €','good');save()}
function resetGame(){if(!confirm('Spielstand wirklich zurücksetzen?'))return;s=structuredClone(base);localStorage.removeItem(key);save()}
function activateTab(id){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));document.querySelectorAll('.tab').forEach(t=>t.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})}
window.activateTab=activateTab;

function render(){
  const active=s.slots.filter(Boolean).length;
  const setText=(id,val)=>{const el=$(id);if(el)el.textContent=val};
  setText('playerNameLabel',s.name);
  setText('levelStat',s.level);
  setText('cashStat',Math.round(s.cash).toLocaleString('de-DE')+' €');
  setText('stockStat',totalStock()+' g');
  setText('gemsStat',s.gems);
  setText('repStat',s.rep);
  setText('roomStat',s.room);
  setText('roomStat2',s.room);
  setText('activePlantsStat',active);
  setText('slotStat',slotMax());
  setText('freeSlotsStat',Math.max(0,slotMax()-active));
  setText('speedStat','Stufe '+s.upgrades.speed);
  setText('contactStat','Stufe '+s.upgrades.rep);
  setText('levelOverview',s.level);
  setText('repOverview',s.rep);
  setText('roomOverview','Stufe '+s.room);
  setText('xpText',s.xp+' / '+xpNeed());
  const xp=$('xpBar'); if(xp) xp.style.width=Math.min(100,s.xp/xpNeed()*100)+'%';
  const input=$('nameInput'); if(input&&document.activeElement!==input) input.value=s.name;
  renderRoomPlants();
  renderPlantOverview();
  renderSell();
  renderInventory();
  renderOrders();
  renderUpgrades();
  renderRivals();
  renderRanking();
  renderLog();
  localStorage.setItem(key,JSON.stringify(s));
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>activateTab(b.dataset.tab)));
const nameField=$('nameInput');
if(nameField) nameField.addEventListener('change',e=>{s.name=e.target.value.trim()||'Rookie';save()});
try{
  render();
  setInterval(render,1000);
}catch(err){
  console.error(err);
  const t=$('toast');
  if(t){t.textContent='Spiel konnte nicht geladen werden – bitte Seite neu laden.';t.classList.add('show');}
}