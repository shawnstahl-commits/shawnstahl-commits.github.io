const PARTNER_KEY='scanquest_partner_demo_v1';
const GAME_KEY='scanquest_state_v1';

const BUILT_INS=[
  {id:'fresh-mission',partner:'DemoMarkt',title:'Frische Mission',condition:'Produkt zuerst im Markt scannen und anschließend kaufen.',coins:120,scans:2,icon:'🥕',builtin:true,targetBarcode:null,windowMinutes:60},
  {id:'family-weekend',partner:'CityFresh',title:'Familien-Wochenende',condition:'Produkt im Markt scannen und innerhalb von 45 Minuten kaufen.',coins:180,scans:1,icon:'🛒',builtin:true,targetBarcode:null,windowMinutes:45},
  {id:'quest-drop',partner:'DemoMarkt',title:'ScanQuest Drop',condition:'Teilnehmendes Produkt vor dem Kauf scannen.',coins:80,scans:3,icon:'🎁',builtin:true,targetBarcode:null,windowMinutes:30}
];

const $=s=>document.querySelector(s);

function loadCustom(){
  try{
    const v=JSON.parse(localStorage.getItem(PARTNER_KEY)||'[]');
    return Array.isArray(v)?v:[];
  }catch(e){return []}
}
function saveCustom(v){localStorage.setItem(PARTNER_KEY,JSON.stringify(v))}
function loadGame(){
  try{return JSON.parse(localStorage.getItem(GAME_KEY)||'{}')||{}}catch(e){return {}}
}
function allCampaigns(){return [...BUILT_INS,...loadCustom()]}

function render(){
  const custom=loadCustom();
  const all=[...BUILT_INS,...custom];
  const game=loadGame();
  const claims=game.retailClaims||{};

  $('#kpiCampaigns').textContent=all.length;
  $('#kpiClaims').textContent=Object.keys(claims).length;

  let coins=0,scans=0;
  all.forEach(c=>{
    if(claims[c.id]){coins+=Number(c.coins||0);scans+=Number(c.scans||0)}
  });
  $('#kpiCoins').textContent=coins;
  $('#kpiScans').textContent=scans;

  $('#partnerCampaignList').innerHTML=all.map(c=>{
    const claim=claims[c.id];
    const target=c.targetBarcode ? 'Barcode '+escapeHtml(c.targetBarcode) : 'beliebiger Produktbarcode';
    const windowMinutes=Math.max(1,Number(c.windowMinutes||60));
    return '<div class="partner-campaign-row">'+
      '<div><b>'+escapeHtml(c.title)+'</b><p>'+escapeHtml(c.partner)+' · '+escapeHtml(c.condition)+'</p>'+
      '<p><strong>Scan-to-Purchase:</strong> '+target+' · max. '+windowMinutes+' Min.</p>'+
      (claim?'<span class="new-badge" style="margin-top:8px">✓ SCAN + KAUF BESTÄTIGT</span><p>Scan '+formatTime(claim.scannedAt)+' · Kasse '+formatTime(claim.purchasedAt)+' · '+escapeHtml(claim.transactionId||'')+'</p>':'')+'</div>'+
      '<div class="mini-rewards"><span>+'+Number(c.coins||0)+' 🪙</span><span>+'+Number(c.scans||0)+' ⚡</span></div>'+
      (!c.builtin?'<button class="secondary delete-campaign" data-id="'+c.id+'" style="grid-column:1/-1">Demo-Kampagne löschen</button>':'')+
      '</div>';
  }).join('');

  document.querySelectorAll('.delete-campaign').forEach(btn=>btn.addEventListener('click',()=>{
    const next=loadCustom().filter(c=>c.id!==btn.dataset.id);
    saveCustom(next); render();
  }));
}

function formatTime(ts){
  if(!ts)return '--:--';
  try{return new Date(ts).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});}catch(e){return '--:--'}
}

function normalizeBarcode(v){return String(v||'').trim().replace(/\s+/g,'');}

function escapeHtml(v){
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

$('#campaignForm').addEventListener('submit',e=>{
  e.preventDefault();
  const partner=$('#partnerName').value.trim();
  const title=$('#campaignName').value.trim();
  const condition=$('#campaignCondition').value.trim();
  const targetBarcode=normalizeBarcode($('#campaignBarcode').value);
  const windowMinutes=Math.max(1,Math.min(240,Number($('#campaignWindow').value||60)));
  const coins=Math.max(0,Math.min(1000,Number($('#campaignCoins').value||0)));
  const scans=Math.max(0,Math.min(20,Number($('#campaignScans').value||0)));
  if(!partner||!title||!condition)return;
  const campaigns=loadCustom();
  const id='custom-'+Date.now().toString(36);
  campaigns.unshift({id,partner,title,condition,coins,scans,icon:'🏪',builtin:false,targetBarcode:targetBarcode||null,windowMinutes,createdAt:Date.now()});
  saveCustom(campaigns);
  $('#campaignName').value='';
  $('#campaignCondition').value='';
  $('#campaignBarcode').value='';
  render();
  alert('Demo-Kampagne veröffentlicht. Sie erscheint jetzt im Rewards-Bereich der Kunden-App auf diesem Gerät.');
});

window.addEventListener('storage',render);
render();
