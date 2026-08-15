const CITIES = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"];

const $ = (id) => document.getElementById(id);
const state = { playerCount: 4, draftNames: Array(8).fill(''), durationMinutes: 2, players: [], currentIndex: 0, used: [], seconds: 120, interval: null };
const escapeHTML = (value) => value.replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);

function normalize(value) {
  return value.trim().toLocaleLowerCase('tr-TR').replace(/î/g, 'i').replace(/â/g, 'a').replace(/û/g, 'u');
}
function renderNameInputs() {
  $('player-count-value').textContent = state.playerCount;
  $('player-count').value = state.playerCount;
  $('names-wrap').innerHTML = Array.from({ length: state.playerCount }, (_, i) => `<input class="name-field" data-player-index="${i}" maxlength="20" placeholder="${i + 1}. oyuncunun adı" value="${escapeHTML(state.draftNames[i])}" aria-label="${i + 1}. oyuncunun adı">`).join('');
  document.querySelectorAll('.name-field').forEach(input => input.addEventListener('input', (event) => { state.draftNames[Number(event.target.dataset.playerIndex)] = event.target.value; }));
}
function saveVisibleNames() { document.querySelectorAll('.name-field').forEach(input => { state.draftNames[Number(input.dataset.playerIndex)] = input.value; }); }
function setPlayerCount(next) { saveVisibleNames(); state.playerCount = Math.max(2, Math.min(8, next)); renderNameInputs(); }
function renderDuration() { $('duration-value').textContent = `${state.durationMinutes} dk`; $('duration').value = state.durationMinutes; }
function setDuration(next) { state.durationMinutes = Math.max(1, Math.min(10, next)); renderDuration(); }
function showScreen(name) { ['setup','game','winner'].forEach((screen) => $(screen + '-screen').classList.toggle('hidden', screen !== name)); }
function activePlayers() { return state.players.filter(p => p.active); }
function sortedUsedCities() { return [...state.used].sort((a, b) => a.localeCompare(b, 'tr-TR')); }
function formatTime(value) { return `${String(Math.floor(value / 60)).padStart(2,'0')}:${String(value % 60).padStart(2,'0')}`; }
function renderGame() {
  const player = state.players[state.currentIndex];
  $('current-player').textContent = player.name;
  $('used-count').textContent = state.used.length;
  $('used-cities').innerHTML = state.used.length ? sortedUsedCities().map(c => `<span class="city-chip">${c}</span>`).join('') : '<p class="empty-list">Henüz hiçbir il söylenmedi.</p>';
  $('players-list').innerHTML = state.players.map((p, index) => `<div class="player-row ${p.active ? '' : 'out'} ${index === state.currentIndex ? 'active' : ''}"><span class="player-dot"></span><span>${p.name}</span><span class="player-status">${p.active ? (index === state.currentIndex ? 'Sırası' : 'Oyunda') : 'Elendi'}</span></div>`).join('');
  updateTimerUI();
}
function updateTimerUI() {
  const pct = Math.max(0, state.seconds / (state.durationMinutes * 60) * 100);
  $('timer').textContent = formatTime(state.seconds);
  $('timer-fill').style.width = pct + '%';
  $('timer').className = 'timer' + (state.seconds <= 15 ? ' danger' : state.seconds <= 30 ? ' warning' : '');
  $('timer-fill').style.background = state.seconds <= 15 ? '#ff8f7b' : state.seconds <= 30 ? '#ffcb70' : 'var(--aqua)';
}
function startTimer() {
  clearInterval(state.interval);
  state.seconds = state.durationMinutes * 60;
  updateTimerUI();
  state.interval = setInterval(() => {
    state.seconds -= 1;
    updateTimerUI();
    if (state.seconds <= 0) eliminateCurrentPlayer();
  }, 1000);
}
function nextActiveIndex(from) {
  for (let i = 1; i <= state.players.length; i++) { const index = (from + i) % state.players.length; if (state.players[index].active) return index; }
  return -1;
}
function endGame(winner) {
  clearInterval(state.interval);
  $('winner-title').textContent = `${winner.name} kazandı!`;
  $('winner-copy').textContent = state.used.length === 81 ? 'Türkiye’nin 81 ilinin tamamı söylendi.' : `${state.used.length} farklı il söylendi. Son ayakta kalan oyuncu sensin.`;
  $('summary-cities').textContent = `Toplam ${state.used.length} il bulundu.`;
  showScreen('winner');
}
function eliminateCurrentPlayer() {
  const player = state.players[state.currentIndex];
  player.active = false;
  clearInterval(state.interval);
  if (activePlayers().length <= 1) return endGame(activePlayers()[0] || player);
  $('turn-message').textContent = `${player.name} süreyi kaçırdı ve elendi.`;
  state.currentIndex = nextActiveIndex(state.currentIndex);
  renderGame();
  setTimeout(() => { $('turn-message').textContent = 'Yeni bir il yaz ve turu bitir.'; startTimer(); $('city-input').focus(); }, 950);
}
function advanceTurn() {
  if (state.used.length === CITIES.length) return endGame(state.players[state.currentIndex]);
  state.currentIndex = nextActiveIndex(state.currentIndex);
  renderGame(); startTimer(); $('city-input').focus();
}

$('minus-button').addEventListener('click', () => setPlayerCount(state.playerCount - 1));
$('plus-button').addEventListener('click', () => setPlayerCount(state.playerCount + 1));
$('player-count').addEventListener('input', e => setPlayerCount(Number(e.target.value)));
$('duration-minus-button').addEventListener('click', () => setDuration(state.durationMinutes - 1));
$('duration-plus-button').addEventListener('click', () => setDuration(state.durationMinutes + 1));
$('duration').addEventListener('input', e => setDuration(Number(e.target.value)));
$('setup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  saveVisibleNames();
  const names = state.draftNames.slice(0, state.playerCount).map((name, i) => name.trim() || `Oyuncu ${i + 1}`);
  if (new Set(names.map(normalize)).size !== names.length) { $('setup-error').textContent = 'Her oyuncunun adı farklı olmalı.'; return; }
  state.players = names.map(name => ({name, active:true})); state.currentIndex = 0; state.used = [];
  $('setup-error').textContent = ''; $('city-error').textContent = ''; showScreen('game'); renderGame(); startTimer(); setTimeout(() => $('city-input').focus(), 100);
});
$('city-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = $('city-input').value;
  const city = CITIES.find(c => normalize(c) === normalize(raw));
  if (!city) { $('city-error').textContent = 'Bu, Türkiye’deki 81 ilden biri değil. Tekrar dene.'; return; }
  if (state.used.includes(city)) { $('city-error').textContent = `${city} zaten söylendi. Yeni bir il bul!`; return; }
  clearInterval(state.interval);
  state.used.push(city); $('city-input').value = ''; $('city-error').textContent = ''; $('turn-message').textContent = `${city} kabul edildi!`;
  setTimeout(advanceTurn, 350);
});
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'tr-TR'; recognition.interimResults = false; recognition.maxAlternatives = 1;
  $('voice-button').addEventListener('click', () => { $('city-error').textContent = 'Dinliyorum…'; recognition.start(); });
  recognition.onstart = () => $('voice-button').classList.add('listening');
  recognition.onend = () => $('voice-button').classList.remove('listening');
  recognition.onresult = (event) => { $('city-input').value = event.results[0][0].transcript; $('city-error').textContent = 'Duyduğum ili kontrol edip “Söyle”ye bas.'; };
  recognition.onerror = () => { $('city-error').textContent = 'Sesi anlayamadım. İstersen ili yazarak gir.'; };
} else {
  $('voice-button').hidden = true;
}
$('new-game-button').addEventListener('click', () => { clearInterval(state.interval); renderNameInputs(); showScreen('setup'); });
$('play-again-button').addEventListener('click', () => { renderNameInputs(); showScreen('setup'); });
$('show-all-button').addEventListener('click', () => { $('dialog-cities').innerHTML = sortedUsedCities().map(c => `<span class="city-chip">${c}</span>`).join('') || '<p class="empty-list">Henüz hiçbir il söylenmedi.</p>'; $('cities-dialog').showModal(); });
$('close-dialog').addEventListener('click', () => $('cities-dialog').close());
renderNameInputs(); renderDuration();
