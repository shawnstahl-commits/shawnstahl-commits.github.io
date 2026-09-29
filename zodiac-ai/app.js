
const SUPABASE_URL = "https://iwgcsiwluegduubzhpxo.supabase.co";
const SUPABASE_KEY = "sb_publishable_eL7K85V0jm5gmTbTvbymwg_snIQODLX";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const zodiac = [
  {name:'Widder',symbol:'♈',dates:'21. März – 19. April',element:'Feuer'},
  {name:'Stier',symbol:'♉',dates:'20. April – 20. Mai',element:'Erde'},
  {name:'Zwillinge',symbol:'♊',dates:'21. Mai – 20. Juni',element:'Luft'},
  {name:'Krebs',symbol:'♋',dates:'21. Juni – 22. Juli',element:'Wasser'},
  {name:'Löwe',symbol:'♌',dates:'23. Juli – 22. August',element:'Feuer'},
  {name:'Jungfrau',symbol:'♍',dates:'23. August – 22. September',element:'Erde'},
  {name:'Waage',symbol:'♎',dates:'23. September – 22. Oktober',element:'Luft'},
  {name:'Skorpion',symbol:'♏',dates:'23. Oktober – 21. November',element:'Wasser'},
  {name:'Schütze',symbol:'♐',dates:'22. November – 21. Dezember',element:'Feuer'},
  {name:'Steinbock',symbol:'♑',dates:'22. Dezember – 19. Januar',element:'Erde'},
  {name:'Wassermann',symbol:'♒',dates:'20. Januar – 18. Februar',element:'Luft'},
  {name:'Fische',symbol:'♓',dates:'19. Februar – 20. März',element:'Wasser'}
];

const periodCopy = {
  today: {
    headline:'Heute zählt nicht Tempo, sondern Richtung.',
    base:'Du bemerkst schneller als sonst, welche Situationen dir Energie geben und welche nur Lärm erzeugen. Nutze den Tag, um eine Sache bewusst abzuschließen, bevor du die nächste beginnst.',
    love:'Nähe entsteht heute eher durch ehrliche kleine Gesten als durch große Worte.',
    work:'Ein klarer Fokus bringt dich weiter als fünf halbfertige Aufgaben.',
    money:'Spontane Entscheidungen kurz liegen lassen und erst dann handeln.',
    energy:'Gute Grundenergie – Pausen machen dich heute sogar produktiver.',
    focus:'Wähle heute eine Sache, die wirklich wichtig ist, und gib ihr deine volle Aufmerksamkeit.'
  },
  week: {
    headline:'Diese Woche bringt Bewegung in festgefahrene Gedanken.',
    base:'Eine Begegnung oder Information kann dir eine neue Perspektive geben. Du musst nicht alles sofort entscheiden. Beobachte erst, was sich wiederholt und was nur ein kurzer Impuls ist.',
    love:'Offene Gespräche schaffen mehr Klarheit als Vermutungen.',
    work:'Eine Aufgabe, die du lange verschoben hast, lässt sich jetzt leichter angehen.',
    money:'Plane lieber mit realistischen Zahlen als mit optimistischen Annahmen.',
    energy:'Zur Wochenmitte steigt dein Antrieb merklich.',
    focus:'Nicht jede offene Tür muss sofort durchschritten werden.'
  },
  month: {
    headline:'Der Monat lädt dich ein, deinen eigenen Rhythmus ernster zu nehmen.',
    base:'Statt dich ständig an äußeren Erwartungen zu orientieren, wird deutlicher, welche Ziele wirklich zu dir passen. Kleine konsequente Veränderungen können jetzt nachhaltiger sein als ein radikaler Neustart.',
    love:'Verlässlichkeit wird wichtiger als bloße Intensität.',
    work:'Ein langfristiges Ziel verdient wieder mehr Aufmerksamkeit.',
    money:'Ordnung und Übersicht fühlen sich diesen Monat besonders befreiend an.',
    energy:'Deine Energie kommt in Wellen – plane entsprechend.',
    focus:'Baue etwas auf, das auch nächsten Monat noch Bedeutung hat.'
  }
};

let selectedSign = zodiac[4];
let selectedPeriod = 'today';
let session = null;
let profile = null;
let balance = 0;
let chatSessionId = null;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function setView(name) {
  $$('.view').forEach(v => v.classList.remove('active'));
  $('#' + name + 'View').classList.add('active');
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === name));
  window.scrollTo({top:0,behavior:'smooth'});
}

function route(name) {
  if (name === 'chat') return openChat();
  setView(name);
  if (name === 'profile') refreshAuthUI();
}

$$('[data-route]').forEach(btn => btn.addEventListener('click', () => route(btn.dataset.route)));

function renderGrid() {
  $('#zodiacGrid').innerHTML = zodiac.map(z => `
    <button class="zodiac-card" data-zodiac="${z.name}">
      <div class="symbol">${z.symbol}</div>
      <h3>${z.name}</h3>
      <p>${z.dates}</p>
    </button>`).join('');
  $$('.zodiac-card').forEach(btn => btn.addEventListener('click', () => openReading(btn.dataset.zodiac)));
}

function openReading(name) {
  selectedSign = zodiac.find(z => z.name === name) || zodiac[0];
  selectedPeriod = 'today';
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.period === 'today'));
  renderReading();
  setView('reading');
}

function renderReading() {
  const c = periodCopy[selectedPeriod];
  $('#readingSymbol').textContent = selectedSign.symbol;
  $('#readingDates').textContent = selectedSign.dates + ' · ' + selectedSign.element;
  $('#readingTitle').textContent = selectedSign.name;
  $('#readingHeadline').textContent = c.headline;
  $('#readingText').textContent = `${selectedSign.name}: ${c.base}`;
  $('#loveText').textContent = c.love;
  $('#workText').textContent = c.work;
  $('#moneyText').textContent = c.money;
  $('#energyText').textContent = c.energy;
  $('#focusText').textContent = c.focus;
}

$$('.tab').forEach(tab => tab.addEventListener('click', () => {
  selectedPeriod = tab.dataset.period;
  $$('.tab').forEach(t => t.classList.toggle('active', t === tab));
  renderReading();
}));

function populateSelect() {
  $('#profileZodiac').insertAdjacentHTML('beforeend', zodiac.map(z => `<option value="${z.name}">${z.symbol} ${z.name}</option>`).join(''));
}

function showStatus(message, bad=false) {
  const el = $('#statusMessage');
  el.textContent = message;
  el.style.borderColor = bad ? 'rgba(255,122,147,.4)' : 'rgba(169,131,255,.35)';
  el.classList.remove('hidden');
}

async function refreshAuthUI() {
  const { data: { session: s } } = await sb.auth.getSession();
  session = s;

  $('#loggedOutPanel').classList.toggle('hidden', !!session);
  $('#loggedInPanel').classList.toggle('hidden', !session);
  $('#walletBtn').classList.toggle('hidden', !session);

  if (!session) {
    profile = null; balance = 0;
    updateBalanceUI();
    return;
  }

  $('#profileEmail').textContent = session.user.email || '';

  const [profileRes, walletRes] = await Promise.all([
    sb.from('profiles').select('display_name,birth_date,zodiac_sign').eq('id', session.user.id).maybeSingle(),
    sb.from('star_wallets').select('balance').eq('user_id', session.user.id).maybeSingle()
  ]);

  profile = profileRes.data || {};
  balance = walletRes.data?.balance ?? 0;

  $('#profileName').textContent = profile.display_name || 'Dein Profil';
  $('#displayName').value = profile.display_name || '';
  $('#birthDate').value = profile.birth_date || '';
  $('#profileZodiac').value = profile.zodiac_sign || '';
  updateBalanceUI();
}

function updateBalanceUI() {
  $('#walletBalance').textContent = balance;
  $('#profileBalance').textContent = balance;
  $('#chatBalance').textContent = balance;
}

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({
    email: $('#loginEmail').value.trim(),
    password: $('#loginPassword').value
  });
  if (error) return showStatus(error.message, true);
  showStatus('Anmeldung erfolgreich.');
  await refreshAuthUI();
});

$('#signupForm').addEventListener('submit', async e => {
  e.preventDefault();
  const { data, error } = await sb.auth.signUp({
    email: $('#signupEmail').value.trim(),
    password: $('#signupPassword').value,
    options: { data: { display_name: $('#signupName').value.trim() }, emailRedirectTo: 'https://shawnstahl-commits.github.io/zodiac-ai/' }
  });
  if (error) return showStatus(error.message, true);
  if (!data.session) showStatus('Konto erstellt. Bitte bestätige gegebenenfalls die E-Mail-Adresse und melde dich danach an.');
  else {
    showStatus('Konto erstellt. 20 ⭐ wurden deinem Testkonto gutgeschrieben.');
    await refreshAuthUI();
  }
});

$('#logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  session = null; profile = null; balance = 0; chatSessionId = null;
  updateBalanceUI();
  await refreshAuthUI();
  setView('home');
});

$('#profileForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!session) return;
  const payload = {
    display_name: $('#displayName').value.trim() || null,
    birth_date: $('#birthDate').value || null,
    zodiac_sign: $('#profileZodiac').value || null
  };
  const { error } = await sb.from('profiles').update(payload).eq('id', session.user.id);
  if (error) return showStatus(error.message, true);
  showStatus('Profil gespeichert.');
  await refreshAuthUI();
});

async function ensureChatSession() {
  await refreshAuthUI();
  if (!session) {
    setView('profile');
    showStatus('Melde dich zuerst an, um den Sternzeichen-Chat zu verwenden.');
    return false;
  }

  const signName = selectedSign?.name || profile?.zodiac_sign;
  const effectiveSign = profile?.zodiac_sign || signName || 'Löwe';
  const z = zodiac.find(x => x.name === effectiveSign) || zodiac[4];
  selectedSign = z;

  if (!chatSessionId) {
    const { data, error } = await sb.from('chat_sessions').insert({
      user_id: session.user.id,
      zodiac_sign: z.name
    }).select('id').single();
    if (error) {
      setView('profile');
      showStatus(error.message, true);
      return false;
    }
    chatSessionId = data.id;
  }

  $('#chatTitle').textContent = `Dein ${z.name}-Reading`;
  $('#chatSymbol').textContent = z.symbol;
  return true;
}

async function openChat() {
  if (!(await ensureChatSession())) return;
  await loadMessages();
  setView('chat');
}

async function loadMessages() {
  if (!chatSessionId) return;
  const { data } = await sb.from('chat_messages')
    .select('role,content,created_at')
    .eq('session_id', chatSessionId)
    .order('created_at', {ascending:true});
  const box = $('#chatMessages');
  if (!data?.length) {
    box.innerHTML = '<div class="message assistant">Frag mich etwas zu Liebe, Beruf, Finanzen oder deinem Tag.</div>';
    return;
  }
  box.innerHTML = data.map(m => `<div class="message ${m.role}">${escapeHtml(m.content)}</div>`).join('');
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

$('#chatForm').addEventListener('submit', async e => {
  e.preventDefault();
  const input = $('#chatInput');
  const msg = input.value.trim();
  if (!msg || !chatSessionId) return;
  if (balance < 1) {
    alert('Du hast keine Sterne mehr. Der echte Sterne-Kauf wird als nächstes angeschlossen.');
    return;
  }

  input.value = '';
  const box = $('#chatMessages');
  box.insertAdjacentHTML('beforeend', `<div class="message user">${escapeHtml(msg)}</div>`);
  box.scrollTop = box.scrollHeight;

  const { data, error } = await sb.rpc('zodiac_demo_chat', {
    p_session_id: chatSessionId,
    p_message: msg
  });

  if (error) {
    box.insertAdjacentHTML('beforeend', `<div class="message assistant">Das hat gerade nicht geklappt: ${escapeHtml(error.message)}</div>`);
    return;
  }

  const result = data?.[0];
  if (result) {
    balance = result.balance;
    updateBalanceUI();
    box.insertAdjacentHTML('beforeend', `<div class="message assistant">${escapeHtml(result.reply)}</div>`);
    box.scrollTop = box.scrollHeight;
  }
});

$('#bottomChatBtn').addEventListener('click', openChat);
$('#openChatFromHome').addEventListener('click', openChat);
$('#readingChatBtn').addEventListener('click', openChat);
$('#profileChatBtn').addEventListener('click', openChat);

sb.auth.onAuthStateChange(async () => {
  setTimeout(refreshAuthUI, 0);
});

renderGrid();
populateSelect();
refreshAuthUI();
