
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

function zodiacIndex(name) {
  const i = zodiac.findIndex(z => z.name === name);
  return i < 0 ? 4 : i;
}

function zodiacPosition(name) {
  return (zodiacIndex(name) * 100 / 11).toFixed(4) + '%';
}

function setZodiacArt(el, name) {
  if (!el) return;
  el.textContent = '';
  el.classList.add('zodiac-art');
  el.style.setProperty('--z-pos', zodiacPosition(name));
}

const horoscopeBank = {
  today: {
    headline:[
      'Heute zählt nicht Tempo, sondern Richtung.',
      'Ein kleiner Perspektivwechsel kann heute viel bewegen.',
      'Deine Stärke liegt heute in ruhiger Klarheit.',
      'Heute lohnt es sich, auf feine Signale zu achten.',
      'Weniger Ablenkung bringt heute mehr Wirkung.',
      'Ein ehrlicher Moment kann heute vieles sortieren.',
      'Heute darfst du Entscheidungen etwas langsamer treffen.',
      'Dein Tag gewinnt, wenn du Prioritäten klar setzt.'
    ],
    base:[
      'Du bemerkst schneller als sonst, welche Situationen dir Energie geben und welche nur Lärm erzeugen. Nutze den Tag, um eine Sache bewusst abzuschließen, bevor du die nächste beginnst.',
      'Heute fällt dir leichter auf, wo du dich unnötig unter Druck setzt. Ein ruhiger Schritt in die richtige Richtung kann mehr bewirken als ein großer Sprung.',
      'Du kannst heute besonders gut unterscheiden, was wirklich wichtig ist und was nur dringend wirkt. Halte den Fokus bewusst schmal.',
      'Eine kleine Beobachtung kann dir heute eine neue Sicht auf etwas Vertrautes geben. Lass den Gedanken kurz wirken, bevor du handelst.',
      'Deine Aufmerksamkeit ist heute wertvoll. Verteile sie nicht auf zu viele Baustellen, sondern entscheide dich bewusst für einen Schwerpunkt.',
      'Ein offenes Gespräch oder ein ehrlicher Gedanke kann heute überraschend befreiend wirken. Du musst nicht alles sofort lösen.',
      'Heute ist kein Tag für übereilte Entscheidungen. Prüfe erst, ob dein erster Impuls auch morgen noch stimmig wirkt.',
      'Wenn du dir heute eine klare Reihenfolge setzt, fühlt sich der Tag deutlich leichter an. Kleine Erfolge geben dir zusätzlichen Schwung.'
    ],
    love:[
      'Nähe entsteht heute eher durch ehrliche kleine Gesten als durch große Worte.',
      'Ein ruhiges Gespräch kann mehr verbinden als eine große Erklärung.',
      'Heute hilft es, zuzuhören, ohne sofort eine Lösung anzubieten.',
      'Zeig Interesse an den kleinen Dingen – genau dort entsteht Nähe.',
      'Ein Missverständnis lässt sich mit etwas Geduld leichter auflösen.',
      'Heute zählt Verlässlichkeit stärker als große Romantik.',
      'Sag klar, was du brauchst, ohne Vorwürfe daraus zu machen.',
      'Gemeinsame Zeit wirkt heute besonders gut, wenn sie unkompliziert bleibt.'
    ],
    work:[
      'Ein klarer Fokus bringt dich weiter als fünf halbfertige Aufgaben.',
      'Eine ungeliebte Aufgabe wird leichter, wenn du einfach mit dem ersten kleinen Schritt beginnst.',
      'Heute lohnt sich sauberes Arbeiten mehr als schnelles Arbeiten.',
      'Eine kurze Pause kann dir genau die Idee bringen, die vorher gefehlt hat.',
      'Setze Grenzen bei Dingen, die nicht wirklich zu deinen Aufgaben gehören.',
      'Ein konkretes Ziel für den Tag sorgt für mehr Ruhe im Kopf.',
      'Heute kannst du mit Struktur mehr erreichen als mit Druck.',
      'Eine kleine Rückfrage verhindert heute möglicherweise unnötige Mehrarbeit.'
    ],
    money:[
      'Spontane Entscheidungen kurz liegen lassen und erst dann handeln.',
      'Ein kurzer Überblick über Ausgaben schafft heute ein gutes Gefühl.',
      'Heute ist Zurückhaltung bei Impulskäufen wahrscheinlich die angenehmere Entscheidung.',
      'Prüfe kleine laufende Kosten – dort steckt oft mehr Potenzial als gedacht.',
      'Ein Vergleich lohnt sich heute eher als eine schnelle Zusage.',
      'Plane lieber mit einem kleinen Puffer als zu knapp.',
      'Heute bringt Übersicht mehr als Optimismus.',
      'Eine Entscheidung wird klarer, wenn du Nutzen und Preis getrennt betrachtest.'
    ],
    energy:[
      'Gute Grundenergie – Pausen machen dich heute sogar produktiver.',
      'Deine Energie steigt, wenn du dich nicht mit Kleinigkeiten verzettelst.',
      'Ein ruhiger Start hilft dir heute mehr als sofortige Hektik.',
      'Bewegung oder frische Luft kann deinen Kopf schnell sortieren.',
      'Heute schwankt dein Energielevel etwas – plane kurze Erholungsphasen ein.',
      'Du hast genug Kraft, wenn du nicht versuchst, alles gleichzeitig zu schaffen.',
      'Ein klarer Tagesrhythmus stabilisiert heute deine Energie.',
      'Heute tut dir ein bewusster Abschluss des Tages besonders gut.'
    ],
    focus:[
      'Wähle heute eine Sache, die wirklich wichtig ist, und gib ihr deine volle Aufmerksamkeit.',
      'Lass heute bewusst eine unwichtige Sache liegen.',
      'Treffe eine Entscheidung erst, wenn sie sich klar statt nur dringend anfühlt.',
      'Achte heute darauf, was dir tatsächlich Energie gibt.',
      'Beende eine kleine offene Aufgabe vollständig.',
      'Sag einmal bewusst Nein, wenn etwas nicht zu dir passt.',
      'Schaffe dir heute zehn Minuten ohne Ablenkung.',
      'Mach aus einem großen Vorhaben einen kleinen nächsten Schritt.'
    ]
  },
  week: {
    headline:[
      'Diese Woche bringt Bewegung in festgefahrene Gedanken.',
      'Die Woche belohnt klare Entscheidungen und kleine Schritte.',
      'Ein neues Gespräch kann diese Woche viel in Bewegung bringen.',
      'Diese Woche geht es weniger um Tempo und mehr um Konsequenz.',
      'Eine alte Idee bekommt diese Woche eine neue Chance.',
      'Diese Woche wird leichter, wenn du nicht alles gleichzeitig lösen willst.'
    ],
    base:[
      'Eine Begegnung oder Information kann dir eine neue Perspektive geben. Du musst nicht alles sofort entscheiden. Beobachte erst, was sich wiederholt und was nur ein kurzer Impuls ist.',
      'Du kannst diese Woche mit kleinen, konsequenten Schritten mehr erreichen als mit einem großen Kraftakt. Halte dir genug Raum für spontane Anpassungen.',
      'Ein Gespräch kann dir diese Woche helfen, etwas klarer zu sehen. Höre besonders auf das, was zwischen den Zeilen mitschwingt.',
      'Diese Woche lohnt es sich, Prioritäten sichtbar zu machen. Sobald du weißt, was zuerst kommt, nimmt der innere Druck spürbar ab.',
      'Etwas, das du fast schon abgeschrieben hattest, kann diese Woche wieder interessant werden. Prüfe es neu, aber ohne alte Erwartungen.',
      'Du musst nicht jede offene Frage sofort beantworten. Diese Woche bringt mehr Ruhe, wenn du bewusst zwischen wichtig und nur laut unterscheidest.'
    ],
    love:['Offene Gespräche schaffen mehr Klarheit als Vermutungen.','Gemeinsame Zeit wirkt diese Woche stärker als große Versprechen.','Ein ruhiger Austausch kann Nähe vertiefen.','Diese Woche lohnt sich Ehrlichkeit ohne Schärfe.','Kleine Gesten haben jetzt besonders viel Wirkung.','Geduld verhindert unnötige Missverständnisse.'],
    work:['Eine Aufgabe, die du lange verschoben hast, lässt sich jetzt leichter angehen.','Diese Woche zahlt sich gute Vorbereitung aus.','Ein klarer Plan verhindert unnötigen Stress.','Eine Rückfrage kann dir viel doppelte Arbeit ersparen.','Konzentriere dich auf das, was wirklich fertig werden muss.','Ein kleines Erfolgserlebnis gibt dir Mitte der Woche neuen Schwung.'],
    money:['Plane lieber mit realistischen Zahlen als mit optimistischen Annahmen.','Ein Ausgabencheck bringt diese Woche schnell Übersicht.','Warte bei größeren Käufen eine Nacht länger.','Ein Vergleich kann sich diese Woche lohnen.','Halte einen kleinen Puffer zurück.','Diese Woche ist Übersicht wichtiger als Schnäppchenjagd.'],
    energy:['Zur Wochenmitte steigt dein Antrieb merklich.','Plane Erholung genauso bewusst wie Aufgaben.','Deine Energie bleibt stabiler, wenn du Pausen nicht aufschiebst.','Ein ruhiger Wochenstart zahlt sich später aus.','Bewegung hilft dir diese Woche beim Abschalten.','Gegen Ende der Woche brauchst du etwas mehr Ruhe.'],
    focus:['Nicht jede offene Tür muss sofort durchschritten werden.','Mach weniger, aber dafür konsequent.','Ein klarer Wochenfokus reicht völlig aus.','Lass Unwichtiges bewusst kleiner werden.','Halte an einem guten Rhythmus fest.','Beobachte erst, bevor du eine große Entscheidung triffst.']
  },
  month: {
    headline:[
      'Der Monat lädt dich ein, deinen eigenen Rhythmus ernster zu nehmen.',
      'Dieser Monat bringt mehr Klarheit in langfristige Entscheidungen.',
      'Ein ruhiger Aufbau ist diesen Monat stärker als ein schneller Neustart.',
      'Diesen Monat darfst du Prioritäten neu ordnen.',
      'Der Monat unterstützt alles, was du konsequent statt hektisch angehst.'
    ],
    base:[
      'Statt dich ständig an äußeren Erwartungen zu orientieren, wird deutlicher, welche Ziele wirklich zu dir passen. Kleine konsequente Veränderungen können jetzt nachhaltiger sein als ein radikaler Neustart.',
      'Im Laufe des Monats wird klarer, welche Themen wirklich langfristig Bedeutung haben. Gib dir Zeit, bevor du größere Entscheidungen festschreibst.',
      'Dieser Monat belohnt Beständigkeit. Wenn du regelmäßig kleine Schritte machst, kann sich mehr verändern als durch einen einmaligen großen Kraftakt.',
      'Du darfst diesen Monat neu sortieren, was dir wichtig ist. Nicht alles, was früher gepasst hat, muss automatisch bleiben.',
      'Ein klarer Rhythmus hilft dir diesen Monat, Energie sinnvoll einzusetzen. Weniger Wechsel und mehr Kontinuität tun dir gut.'
    ],
    love:['Verlässlichkeit wird wichtiger als bloße Intensität.','Ehrliche Gespräche schaffen diesen Monat stabile Nähe.','Gemeinsame Pläne dürfen konkreter werden.','Geduld hilft, alte Missverständnisse zu lösen.','Nähe wächst durch Beständigkeit.'],
    work:['Ein langfristiges Ziel verdient wieder mehr Aufmerksamkeit.','Struktur bringt diesen Monat spürbar Entlastung.','Ein Projekt profitiert von konsequenten kleinen Schritten.','Setze klare Grenzen für deine Zeit.','Langfristige Planung zahlt sich aus.'],
    money:['Ordnung und Übersicht fühlen sich diesen Monat besonders befreiend an.','Ein Monatsbudget schafft mehr Sicherheit.','Größere Ausgaben sollten gut vorbereitet sein.','Kleine laufende Kosten verdienen Aufmerksamkeit.','Ein finanzieller Puffer gibt dir Ruhe.'],
    energy:['Deine Energie kommt in Wellen – plane entsprechend.','Ein stabiler Rhythmus hilft dir durch den Monat.','Plane Erholung bevor du sie dringend brauchst.','Regelmäßige Pausen wirken besser als seltene Auszeiten.','Achte auf einen guten Wechsel zwischen Aktivität und Ruhe.'],
    focus:['Baue etwas auf, das auch nächsten Monat noch Bedeutung hat.','Setze auf Beständigkeit statt auf Druck.','Ordne deine Prioritäten neu.','Ein langfristiger Schritt zählt mehr als viele spontane.','Schütze deine Zeit bewusster.']
  }
};

function seedForPeriod(period, signIndex) {
  const now = new Date();
  if (period === 'today') {
    const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    return day + signIndex * 3;
  }
  if (period === 'week') {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getUTCFullYear() * 53 + weekNo + signIndex * 2;
  }
  return now.getFullYear() * 12 + now.getMonth() + signIndex;
}

function pick(arr, seed, offset=0) {
  return arr[(seed + offset) % arr.length];
}

function getHoroscope(period, sign) {
  const bank = horoscopeBank[period];
  const signIndex = zodiac.findIndex(z => z.name === sign.name);
  const seed = seedForPeriod(period, Math.max(signIndex,0));
  return {
    headline: pick(bank.headline, seed, 0),
    base: pick(bank.base, seed, 1),
    love: pick(bank.love, seed, 2),
    work: pick(bank.work, seed, 3),
    money: pick(bank.money, seed, 4),
    energy: pick(bank.energy, seed, 5),
    focus: pick(bank.focus, seed, 6)
  };
}

let selectedSign = zodiac[4];
let selectedPeriod = 'today';
let session = null;
let profile = null;
let balance = 0;
let chatSessionId = null;
let currentChatSign = null;
let voiceEnabled = true;
let lastAssistantReply = '';
let preferredVoice = null;

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
  $('#zodiacGrid').innerHTML = zodiac.map((z, i) => `
    <button class="zodiac-card" data-zodiac="${z.name}">
      <div class="symbol zodiac-card-art zodiac-art" style="--z-pos:${(i * 100 / 11).toFixed(4)}%"></div>
      <h3>${z.name}</h3>
      <p>${z.dates}</p>
    </button>`).join('');
  $$('.zodiac-card').forEach(btn => btn.addEventListener('click', () => openReading(btn.dataset.zodiac)));
}

function openReading(name) {
  const nextSign = zodiac.find(z => z.name === name) || zodiac[0];
  if (selectedSign?.name !== nextSign.name) {
    chatSessionId = null;
    currentChatSign = null;
  }
  selectedSign = nextSign;
  selectedPeriod = 'today';
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.period === 'today'));
  renderReading();
  setView('reading');
}

function renderReading() {
  const c = getHoroscope(selectedPeriod, selectedSign);
  setZodiacArt($('#readingSymbol'), selectedSign.name);
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

  const [profileRes, walletRes, subscriptionRes] = await Promise.all([
    sb.from('profiles').select('display_name,birth_date,zodiac_sign').eq('id', session.user.id).maybeSingle(),
    sb.from('star_wallets').select('balance').eq('user_id', session.user.id).maybeSingle(),
    sb.from('user_subscriptions').select('plan_code,status').eq('user_id', session.user.id).maybeSingle()
  ]);

  profile = profileRes.data || {};
  balance = walletRes.data?.balance ?? 0;
  const subscription = subscriptionRes.data || { plan_code:'free', status:'free' };
  const planEl = $('#planStatus');
  if (planEl) planEl.textContent = subscription.plan_code === 'premium' && subscription.status === 'active' ? 'Premium' : 'Free';

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
  session = null; profile = null; balance = 0; chatSessionId = null; currentChatSign = null;
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
  const effectiveSign = signName || 'Löwe';
  const z = zodiac.find(x => x.name === effectiveSign) || zodiac[4];
  selectedSign = z;

  if (!chatSessionId || currentChatSign !== z.name) {
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
  setZodiacArt($('#chatAvatar'), z.name);
  $('#chatAvatarLabel').textContent = z.name;
  setZodiacArt($('#premiumPreviewAvatar'), z.name);
  currentChatSign = z.name;
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
    const welcome = `Ich bin dein ${selectedSign.name}-Guide. Frag mich etwas zu Liebe, Beruf, Finanzen oder deinem Tag.`;
    lastAssistantReply = welcome;
    box.innerHTML = `<div class="message assistant">${escapeHtml(welcome)}</div>`;
    $('#replayVoiceBtn').disabled = false;
    return;
  }
  box.innerHTML = data.map(m => `<div class="message ${m.role}">${escapeHtml(m.content)}</div>`).join('');
  const lastAssistant = [...data].reverse().find(m => m.role === 'assistant');
  lastAssistantReply = lastAssistant?.content || '';
  $('#replayVoiceBtn').disabled = !lastAssistantReply;
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function loadGermanVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  preferredVoice =
    voices.find(v => /^de[-_]/i.test(v.lang) && /google|microsoft|samsung|natural/i.test(v.name)) ||
    voices.find(v => /^de[-_]/i.test(v.lang)) ||
    null;
}

async function speakReply(text) {
  if (!voiceEnabled || !text) return;

  if (session?.access_token && selectedSign?.name) {
    try {
      const res = await fetch(SUPABASE_URL + '/functions/v1/zodiac-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
          'apikey': SUPABASE_KEY
        },
        body: JSON.stringify({ sign: selectedSign.name, text })
      });

      if (res.ok && (res.headers.get('content-type') || '').includes('audio')) {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
        return;
      }
    } catch (_) {}
  }

  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  const fallbackProfiles = {
    'Widder': { rate: 1.08, pitch: 1.08 },
    'Stier': { rate: .90, pitch: .88 },
    'Zwillinge': { rate: 1.12, pitch: 1.12 },
    'Krebs': { rate: .94, pitch: 1.04 },
    'Löwe': { rate: .94, pitch: .88 },
    'Jungfrau': { rate: .98, pitch: .98 },
    'Waage': { rate: .97, pitch: 1.05 },
    'Skorpion': { rate: .90, pitch: .82 },
    'Schütze': { rate: 1.08, pitch: 1.04 },
    'Steinbock': { rate: .91, pitch: .84 },
    'Wassermann': { rate: 1.02, pitch: .96 },
    'Fische': { rate: .90, pitch: 1.10 }
  };
  const p = fallbackProfiles[selectedSign?.name] || { rate: .95, pitch: 1 };
  utterance.rate = p.rate;
  utterance.pitch = p.pitch;
  if (preferredVoice) utterance.voice = preferredVoice;
  window.speechSynthesis.speak(utterance);
}

if ('speechSynthesis' in window) {
  loadGermanVoice();
  window.speechSynthesis.onvoiceschanged = loadGermanVoice;
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
    lastAssistantReply = result.reply;
    $('#replayVoiceBtn').disabled = false;
    box.scrollTop = box.scrollHeight;
    speakReply(result.reply);
  }
});

$('#voiceToggleBtn').addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  if (!voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  $('#voiceToggleBtn').textContent = voiceEnabled ? '🔊 Stimme an' : '🔇 Stimme aus';
});

$('#replayVoiceBtn').addEventListener('click', () => {
  if (lastAssistantReply) speakReply(lastAssistantReply);
});

$('#bottomChatBtn').addEventListener('click', openChat);
$('#openChatFromHome').addEventListener('click', openChat);
$('#readingChatBtn').addEventListener('click', openChat);
$('#profileChatBtn').addEventListener('click', async () => {
  if (profile?.zodiac_sign) {
    selectedSign = zodiac.find(z => z.name === profile.zodiac_sign) || selectedSign;
    chatSessionId = null;
    currentChatSign = null;
  }
  await openChat();
});

sb.auth.onAuthStateChange(async () => {
  setTimeout(refreshAuthUI, 0);
});

renderGrid();
populateSelect();
refreshAuthUI();
