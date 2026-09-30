const key='greenEmpireRealGrowV1';

const stageImages=[
  'https://commons.wikimedia.org/wiki/Special:FilePath/Seedling%20cannabis%20plant.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Young%20cannabis%20plant%20in%20the%20vegetative%20stage%2001.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Untrained%20cannabis%20plant%20in%20the%20vegetative%20stage.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Cannabis%20sativa-flowering%20phase%20side.jpg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Mature%20cannabis%20plant.jpg'
];
const stageNames=['Keimling','Jungpflanze','Wachstum','Vorblüte','Blüte'];

const strains=[
  {id:'dream',name:'Green Dream',duration:90,yield:42,value:6},
  {id:'storm',name:'Purple Storm',duration:115,yield:58,value:8},
  {id:'lemon',name:'Lemon Sky',duration:140,yield:72,value:10},
  {id:'gold',name:'Northern Gold',duration:170,yield:95,value:13}
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
if(!Array.isArray(s.slots)) s.slots=[null,null,null,null,null];
while(s.slots.length<5) s.slots.push(null);
if(!s.upgrades) s.upgrades={rack:1,speed:0,rep:0};
if(typeof s.upgrades.rack!=='number') s.upgrades.rack=1;

function strain(id){return strains.find(x=>x.id===id)}
function xpNeed(){return 80+(s.level-1)*60}
function slotMax(){return Math.min(5,2+s.upgrades.rack)}
function totalStock(){return Object.values(s.inventory).reduce((a,b)=>a+b,0)}
function effectiveTime(baseTime){return Math.max(35,Math.round(baseTime*(1-s.upgrades.speed*.15)))}
function progress(slot){return slot?Math.min(100,((Date.now()-slot.start)/slot.duration)*100):0}
function stageIndex(p){if(p<20)return 0;if(p<40)return 1;if(p<65)return 2;if(p<90)return 3;return 4}
function timeLeft(slot){const sec=Math.max(0,Math.ceil((slot.duration-(Date.now()-slot.start))/1000));const m=Math.floor(sec/60);const ss=String(sec%60).padStart(2,'0');return m+'m '+ss+'s'}
function note(msg,cls=''){s.log.unshift({msg,cls});s.log=s.log.slice(0,25)}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1300)}
function save(){localStorage.setItem(key,JSON.stringify(s));render()}
function addXp(n){s.xp+=n;while(s.xp>=xpNeed()){s.xp-=xpNeed();s.level++;s.cash+=250;note('Level '+s.level+' erreicht: +250 €','good')}}

function startPlant(slotIndex,id){
  if(slotIndex>=slotMax())return toast('Slot noch gesperrt');
  if(s.slots[slotIndex])return;
  const st=strain(id),cost=Math.round(st.value*6);
  if(s.cash<cost)return toast('Zu wenig Cash');
  s.cash-=cost;
  s.slots[slotIndex]={strainId:id,start:Date.now(),duration:effectiveTime(st.duration)*1000,boosted:false};
  note(st.name+' in Slot '+(slotIndex+1)+' gestartet (-'+cost+' €)');
  save();
}
function careBoost(slotIndex){
  const sl=s.slots[slotIndex];
  if(!sl)return;
  if(sl.boosted)return toast('Pflegebonus schon genutzt');
  sl.start-=Math.round(sl.duration*.08);
  sl.boosted=true;
  note('Pflegebonus für Slot '+(slotIndex+1)+' aktiviert','good');
  save();
}
function harvest(slotIndex){
  const sl=s.slots[slotIndex];
  if(!sl||progress(sl)<100)return;
  const st=strain(sl.strainId);
  const amount=Math.round(st.yield*(1+s.room*.05));
  s.inventory[st.id]+=amount;
  s.slots[slotIndex]=null;
  s.rep+=1+s.upgrades.rep;
  addXp(18);
  note(amount+' g '+st.name+' geerntet','good');
  save();
}
function removePlant(slotIndex){
  if(!s.slots[slotIndex])return;
  if(!confirm('Pflanze wirklich entfernen?'))return;
  s.slots[slotIndex]=null;
  note('Pflanze aus Slot '+(slotIndex+1)+' entfernt','bad');
  save();
}

function emptyRoomPlant(i){
  const locked=i>=slotMax();
  const defaultStrain=strains[(i+s.level)%strains.length];
  if(locked){
    return '<article class="roomPlant"><div class="roomPlantCard"><div class="roomPlantPhoto locked">🔒</div><div class="roomPlantInfo"><strong>Slot '+(i+1)+'</strong><div class="stageName">Gesperrt</div><button class="startPlantBtn" disabled>Upgrade nötig</button></div></div></article>';
  }
  return '<article class="roomPlant"><div class="roomPlantCard"><div class="roomPlantPhoto" style="background-image:url(\''+stageImages[0]+'\')"></div><div class="roomPlantInfo"><strong>Freier Topf · Slot '+(i+1)+'</strong><div class="stageName">Neue Pflanze wählen</div><select class="select" id="roomSelect'+i+'">'+strains.map(st=>'<option value="'+st.id+'">'+st.name+' · '+Math.round(st.value*6)+' €</option>').join('')+'</select><button class="startPlantBtn" onclick="startPlant('+i+',document.getElementById(\'roomSelect'+i+'\').value)">Starten</button></div></div></article>';
}
function activeRoomPlant(i){
  const sl=s.slots[i],st=strain(sl.strainId),p=progress(sl),stage=stageIndex(p);
  return '<article class="roomPlant"><div class="roomPlantCard"><div class="roomPlantPhoto" style="background-image:url(\''+stageImages[stage]+'\')"></div><div class="roomPlantInfo"><strong>'+st.name+'</strong><div class="stageName">'+(stage+1)+'. '+stageNames[stage]+'</div><div class="progress"><i style="width:'+p+'%"></i></div><div class="roomPlantMeta"><span>'+Math.floor(p)+'%</span><span>'+(p>=100?'erntereif':timeLeft(sl))+'</span></div><div class="roomPlantActions"><button onclick="careBoost('+i+')" '+(sl.boosted||p>=100?'disabled':'')+'>Pflegebonus</button><button onclick="harvest('+i+')" '+(p<100?'disabled':'')+'>Ernten</button></div></div></div></article>';
}
function renderRoomPlants(){
  document.getElementById('roomPlants').innerHTML=[0,1,2,3,4].map(i=>s.slots[i]?activeRoomPlant(i):emptyRoomPlant(i)).join('');
}
function renderPlantOverview(){
  document.getElementById('plantOverview').innerHTML=[0,1,2,3,4].map(i=>{
    if(i>=slotMax())return '<div class="miniPlant"><div class="miniPlantPhoto" style="display:grid;place-items:center;font-size:36px">🔒</div><div class="miniPlantBody"><b>Slot '+(i+1)+'</b><small>gesperrt</small></div></div>';
    const sl=s.slots[i];
    if(!sl)return '<div class="miniPlant"><div class="miniPlantPhoto" style="background-image:url(\''+stageImages[0]+'\')"></div><div class="miniPlantBody"><b>Slot '+(i+1)+'</b><small>frei</small></div></div>';
    const st=strain(sl.strainId),p=progress(sl),stage=stageIndex(p);
    return '<div class="miniPlant"><div class="miniPlantPhoto" style="background-image:url(\''+stageImages[stage]+'\')"></div><div class="miniPlantBody"><b>'+st.name+'</b><small>'+stageNames[stage]+' · '+Math.floor(p)+'%</small><div class="progress"><i style="width:'+p+'%"></i></div></div></div>';
  }).join('');
}

function sell(id,amount){
  const st=strain(id);
  if(s.inventory[id]<amount)return toast('Nicht genug Bestand');
  const money=Math.round(amount*st.value*(1+s.rep*.002));
  s.inventory[id]-=amount;s.cash+=money;addXp(8);
  note(amount+' g '+st.name+' an NPC verkauft: +'+money+' €','good');save();
}
function renderSell(){
  document.getElementById('sellList').innerHTML=strains.map(st=>'<div class="sellCard row"><div><b>'+st.name+'</b><div class="muted">Sofortverkauf: 10 g</div></div><button class="cta green" onclick="sell(\''+st.id+'\',10)">+'+Math.round(10*st.value*(1+s.rep*.002))+' €</button></div>').join('');
}
function renderInventory(){
  document.getElementById('inventoryList').innerHTML=strains.map(st=>'<div class="inventoryCard row"><div><b>'+st.name+'</b><div class="muted">Lagerbestand</div></div><b>'+s.inventory[st.id]+' g</b></div>').join('');
}
function completeOrder(id,amount,reward,rep){
  if(s.inventory[id]<amount)return toast('Nicht genug Bestand');
  s.inventory[id]-=amount;s.cash+=reward+s.level*12;s.rep+=rep;addXp(20);
  note('Auftrag abgeschlossen: +'+(reward+s.level*12)+' € / +'+rep+' Ruf','good');save();
}
function renderOrders(){
  document.getElementById('ordersList').innerHTML=orders.map((o,i)=>{const st=strain(o[0]);return '<div class="orderCard"><div class="row"><div><b>NPC-Auftrag #'+(i+1)+': '+st.name+'</b><div class="muted">'+o[1]+' g · +'+(4+i)+' Ruf</div></div><button class="cta green" onclick="completeOrder(\''+o[0]+'\','+o[1]+','+o[2]+','+(4+i)+')">'+(o[2]+s.level*12)+' €</button></div></div>'}).join('');
}
function upgrade(type){
  const baseCost={rack:900,speed:1200,rep:1500}[type],level=s.upgrades[type],cost=Math.round(baseCost*Math.pow(1.7,level));
  if(s.cash<cost)return toast('Zu wenig Cash');
  if(type==='rack'&&level>=3)return toast('Maximal');
  if(type!=='rack'&&level>=3)return toast('Maximal');
  s.cash-=cost;s.upgrades[type]++;
  if(type==='rack')s.room++;
  note('Upgrade gekauft: '+type+' Stufe '+s.upgrades[type],'good');save();
}
function renderUpgrades(){
  const data=[['rack','Zusätzlicher Pflanzenslot','Mehr sichtbare Töpfe im Grow Room'],['speed','Raumtempo','Kürzere Spieltimer'],['rep','Kontakt-Netzwerk','Mehr Ruf pro Ernte']];
  document.getElementById('upgradeList').innerHTML=data.map(x=>{const k=x[0],baseCost={rack:900,speed:1200,rep:1500}[k],cost=Math.round(baseCost*Math.pow(1.7,s.upgrades[k]));return '<div class="upgradeCard row"><div><b>'+x[1]+' · Stufe '+s.upgrades[k]+'</b><div class="muted">'+x[2]+'</div></div><button class="cta green" onclick="upgrade(\''+k+'\')">'+cost+' €</button></div>'}).join('');
}
function fight(i){
  const r=rivals[i],power=s.level+s.rep*.15+s.room*2,chance=Math.max(.2,Math.min(.85,.5+(power-r[1])*.035));
  if(Math.random()<chance){s.cash+=r[2];s.rep+=3+i;addXp(16);note('Rivale '+r[0]+' geschlagen: +'+r[2]+' €','good');toast('Sieg!')}
  else{const loss=Math.min(s.cash,Math.round(r[2]*.15));s.cash-=loss;note('Gegen '+r[0]+' verloren: -'+loss+' €','bad');toast('Niederlage')}
  save();
}
function renderRivals(){
  document.getElementById('rivalList').innerHTML=rivals.map((r,i)=>{const power=s.level+s.rep*.15+s.room*2,chance=Math.round(Math.max(.2,Math.min(.85,.5+(power-r[1])*.035))*100);return '<div class="rivalCard row"><div><b>'+r[0]+'</b><div class="muted">Schwierigkeit '+r[1]+' · ca. '+chance+'% Chance</div></div><button class="cta green" onclick="fight('+i+')">Duell</button></div>'}).join('');
}
function renderRanking(){
  const score=Math.round(s.level*1200+s.rep*80+s.cash+totalStock()*4);
  const rows=[['GreenWolf',18400],['PurpleKing',15100],['DockBoss',11900],['NeonLeaf',8700],[s.name,score],['Rookie77',4100],['BasementBen',2300]].sort((a,b)=>b[1]-a[1]);
  document.getElementById('rankingList').innerHTML=rows.map((r,i)=>'<div class="rank '+(r[0]===s.name?'me':'')+'"><b>#'+(i+1)+'</b><span>'+r[0]+'</span><b>'+r[1].toLocaleString('de-DE')+'</b></div>').join('');
}
function renderLog(){document.getElementById('logList').innerHTML=(s.log||[]).map(x=>typeof x==='string'?'<div>'+x+'</div>':'<div class="'+(x.cls||'')+'">'+x.msg+'</div>').join('')}
function testPack(g,c){s.gems+=g;s.cash+=c;note('Test-Premium: +'+g+' 💎 / +'+c+' €','good');save()}
function finishAll(){if(s.gems<25)return toast('Zu wenig Diamanten');s.gems-=25;s.slots=s.slots.map(p=>p?Object.assign({},p,{start:Date.now()-p.duration}):p);note('Growth Boost aktiviert (-25 💎)','good');save()}
function vipBoost(){if(s.gems<20)return toast('Zu wenig Diamanten');s.gems-=20;s.rep+=10;s.cash+=500;note('VIP Bonus: +10 Ruf / +500 €','good');save()}
function resetGame(){if(!confirm('Spielstand wirklich zurücksetzen?'))return;s=structuredClone(base);localStorage.removeItem(key);save()}
function activateTab(id){
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
  document.querySelectorAll('.tab').forEach(t=>t.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo({top:0,behavior:'smooth'});
}
window.activateTab=activateTab;

function render(){
  const active=s.slots.filter(Boolean).length;
  document.getElementById('playerNameLabel').textContent=s.name;
  document.getElementById('levelStat').textContent=s.level;
  document.getElementById('cashStat').textContent=Math.round(s.cash).toLocaleString('de-DE')+' €';
  document.getElementById('stockStat').textContent=totalStock()+' g';
  document.getElementById('gemsStat').textContent=s.gems;
  document.getElementById('repStat').textContent=s.rep;
  document.getElementById('roomStat').textContent=s.room;
  document.getElementById('roomStat2').textContent=s.room;
  document.getElementById('activePlantsStat').textContent=active;
  document.getElementById('slotStat').textContent=slotMax();
  document.getElementById('freeSlotsStat').textContent=Math.max(0,slotMax()-active);
  document.getElementById('speedStat').textContent='Stufe '+s.upgrades.speed;
  document.getElementById('contactStat').textContent='Stufe '+s.upgrades.rep;
  document.getElementById('levelOverview').textContent=s.level;
  document.getElementById('repOverview').textContent=s.rep;
  document.getElementById('roomOverview').textContent='Stufe '+s.room;
  document.getElementById('xpText').textContent=s.xp+' / '+xpNeed();
  document.getElementById('xpBar').style.width=Math.min(100,s.xp/xpNeed()*100)+'%';
  const input=document.getElementById('nameInput');if(input&&document.activeElement!==input)input.value=s.name;
  renderRoomPlants();renderPlantOverview();renderSell();renderInventory();renderOrders();renderUpgrades();renderRivals();renderRanking();renderLog();
  localStorage.setItem(key,JSON.stringify(s));
}

document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>activateTab(b.dataset.tab)));
document.getElementById('nameInput').addEventListener('change',e=>{s.name=e.target.value.trim()||'Rookie';save()});
setInterval(render,1000);
render();