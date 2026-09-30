const PARTNER_KEY='scanquest_partner_demo_v1';
const GAME_KEY='scanquest_state_v1';

const BUILT_INS=[
  {id:'fresh-mission',partner:'DemoMarkt',title:'Frische Mission',condition:'Kaufe 3 Obst- oder Gemüseartikel.',coins:120,scans:2,icon:'🥕',builtin:true},
  {id:'family-weekend',partner:'CityFresh',title:'Familien-Wochenende',condition:'Bestätigter Einkauf ab 20 €.',coins:180,scans:1,icon:'🛒',builtin:true},
  {id:'quest-drop',partner:'DemoMarkt',title:'ScanQuest Drop',condition:'Kaufe ein teilnehmendes Aktionsprodukt.',coins:80,scans:3,icon:'🎁',builtin:true}
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
    const claimed=!!claims[c.id];
    return '<div class="partner-campaign-row">'+
      '<div><b>'+escapeHtml(c.title)+'</b><p>'+escapeHtml(c.partner)+' · '+escapeHtml(c.condition)+'</p>'+
      (claimed?'<span class="new-badge" style="margin-top:8px">KAUF BESTÄTIGT</span>':'')+'</div>'+
      '<div class="mini-rewards"><span>+'+Number(c.coins||0)+' 🪙</span><span>+'+Number(c.scans||0)+' ⚡</span></div>'+
      (!c.builtin?'<button class="secondary delete-campaign" data-id="'+c.id+'" style="grid-column:1/-1">Demo-Kampagne löschen</button>':'')+
      '</div>';
  }).join('');

  document.querySelectorAll('.delete-campaign').forEach(btn=>btn.addEventListener('click',()=>{
    const next=loadCustom().filter(c=>c.id!==btn.dataset.id);
    saveCustom(next); render();
  }));
}

function escapeHtml(v){
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

$('#campaignForm').addEventListener('submit',e=>{
  e.preventDefault();
  const partner=$('#partnerName').value.trim();
  const title=$('#campaignName').value.trim();
  const condition=$('#campaignCondition').value.trim();
  const coins=Math.max(0,Math.min(1000,Number($('#campaignCoins').value||0)));
  const scans=Math.max(0,Math.min(20,Number($('#campaignScans').value||0)));
  if(!partner||!title||!condition)return;
  const campaigns=loadCustom();
  const id='custom-'+Date.now().toString(36);
  campaigns.unshift({id,partner,title,condition,coins,scans,icon:'🏪',builtin:false,createdAt:Date.now()});
  saveCustom(campaigns);
  $('#campaignName').value='';
  $('#campaignCondition').value='';
  render();
  alert('Demo-Kampagne veröffentlicht. Sie erscheint jetzt im Rewards-Bereich der Kunden-App auf diesem Gerät.');
});

window.addEventListener('storage',render);
render();
