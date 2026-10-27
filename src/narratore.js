(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const BP = window.BPArcade;
  const PLAYER_BUTTONS = ["P1", "P2", "P3", "P4"];
  const COLORS = BP.colors();
  const COLOR_EMOJI = {P1: "🔴", P2: "🔵", P3: "🟡", P4: "🟢"};
  const GAMES_PER_MATCH = 5;
  const ORDINALS = ["primo", "secondo", "terzo", "quarto"];
  // Nei giochi a squadre (4 giocatori) la classifica elenca prima i due vincitori, poi i due sconfitti.
  const TEAM_GAMES = new Set(["tug", "thirsty"]);

  // Nella stessa partita si estrae al massimo un gioco per gruppo.
  const GAME_GROUPS = [
    ["bomb", "horse", "tennis"],                   // palla esplosiva, cavallino, tennis (si passa il turno)
    ["disturber", "beeper"],                       // disturbatore, bippatore
    ["duel", "bounty"],                            // duello, taglia
    ["tug", "lesson", "grinder", "freeze", "typewriter"],   // fune, lezione, mola a disco, uno due tre stai là, macchina da scrivere
    ["pig", "door", "restaurant"],                 // maiale, porta, ristorante
    ["mine", "parachute", "pot", "mosquito"],      // miniera, paracadute, piglia tutto, zanzara (scegliere il momento giusto)
    ["tapas", "rally", "simon"],                   // tapas, rally, simon (sequenze da ripetere)
    ["beat", "copyrhythm", "rope"]                 // tieni il tempo, copia il ritmo, saltare la corda (ritmo)
  ];
  const GROUP_OF = Object.fromEntries(GAME_GROUPS.flatMap((g, i) => g.map(id => [id, i])));

  const state = {
    phase: "start",          // start | connect | register | lineup | playing | final
    players: [],
    games: [],
    gameIndex: 0,
    totals: {},
    lastPoints: {}
  };

  let centerWaiter = null, registerDone = null, finishWaiter = null;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const color = id => COLORS[id].toLowerCase();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  const listWords = words => words.length < 2 ? words.join("") : words.slice(0, -1).join(", ") + " e " + words.at(-1);

  // Tiene lo schermo acceso finché la pagina è aperta (si gioca senza guardarlo: se si spegne, l'audio può fermarsi).
  let wakeLock = null;
  async function keepScreenOn() {
    if (!("wakeLock" in navigator) || wakeLock || document.visibilityState !== "visible") return;
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } catch (error) {
      console.warn("Wake lock non disponibile:", error);
    }
  }
  document.addEventListener("visibilitychange", keepScreenOn);   // il blocco si perde quando la pagina va in secondo piano
  document.addEventListener("pointerdown", keepScreenOn);
  document.addEventListener("keydown", keepScreenOn);
  keepScreenOn();

  BP.setMenuStart(false);
  BP.ble.setEnabled(true);

  function setPhase(eyebrow, title) {
    $("#narrator-phase").textContent = eyebrow;
    $("#narrator-title").textContent = title;
  }

  function speak(text) {
    $("#narrator-text").textContent = text;
    return BP.speak(text);
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  // Aspetta che la sintesi vocale resti in silenzio per un po' (es. dopo "Vince rosso").
  async function waitSilence(maxMs = 10000, quietMs = 1200) {
    if (!("speechSynthesis" in window)) return;
    const t0 = Date.now();
    let quiet = 0;
    while (Date.now() - t0 < maxMs && quiet < quietMs) {
      quiet = speechSynthesis.speaking || speechSynthesis.pending ? 0 : quiet + 200;
      await sleep(200);
    }
  }

  // Parla e poi aspetta il tasto centrale; premendolo durante la voce si salta il messaggio.
  async function speakAndWaitCenter(text) {
    const pressed = new Promise(r => {
      centerWaiter = r;
    });
    await Promise.race([speak(text), pressed]);
    await pressed;
  }

  // Schermo oscurato durante i giochi (solo con il controller Bluetooth: senza, i pulsanti virtuali devono restare visibili).
  let dimWanted = false;
  function applyDim() {
    document.body.classList.toggle("nar-dim", dimWanted && BP.ble.isConnected());
  }
  function setDim(on) {
    dimWanted = on;
    applyDim();
  }

  // Il controller virtuale resta nascosto: compare solo se il Bluetooth non è disponibile e si gioca con tastiera o tocco.
  let showVirtualController = false;

  function updateInputPill() {
    const bluetoothConnected = BP.ble.isConnected();
    applyDim();
    $("#narrator-input").textContent = bluetoothConnected ? "Controller: Bluetooth 🔵" : "Controller: tastiera ⌨️";
    $("#virtual-controller").hidden = bluetoothConnected || !showVirtualController;
    $(".hint").hidden = bluetoothConnected || !showVirtualController;   // suggerimento tastiera: solo senza Bluetooth
  }

  updateInputPill();
  setInterval(updateInputPill, 1000);

  // --- Fase 1: connessione ---

  let btBusy = false;        // true mentre è aperto il popup (o è in corso una riconnessione)
  let flowStarted = false;   // true quando si passa alla registrazione dei giocatori

  async function tryBluetooth() {
    if (BP.ble.isConnected()) return true;
    if (!navigator.bluetooth) return false;
    btBusy = true;
    try {
      await BP.ble.connect();
      return BP.ble.isConnected();
    } catch (error) {
      console.warn("Connessione BLE non riuscita:", error);
      return false;
    } finally {
      btBusy = false;
    }
  }

  async function beginFlow(withBluetooth) {
    if (flowStarted) return;
    flowStarted = true;
    showVirtualController = !withBluetooth;
    state.phase = "connect";
    BP.unlockAudio();
    $("#narrator-retry-ble").hidden = true;
    updateInputPill();
    setPhase("FASE 1 · CONTROLLER", withBluetooth ? "Controller collegato" : "Controller: tastiera");
    if (withBluetooth) {
      await speak("Benvenuti a Buttons party! Controller collegato.");
    } else {
      await speak(
        "Benvenuti a Buttons party! Il Bluetooth non è disponibile, quindi usate la tastiera: " +
        "i tasti uno, due, tre e quattro sono rosso, blu, giallo e verde. " +
        "La barra spaziatrice è il tasto centrale."
      );
    }
    registerPlayers();
  }

  // Finché il controller non è collegato, ogni gesto riapre il popup di scelta del dispositivo.
  async function onGesture(e) {
    if (flowStarted || btBusy) return;
    if (e.type === "keydown" && e.key === "Escape") return;
    BP.unlockAudio();
    if (BP.ble.isConnected()) return beginFlow(true);
    if (!navigator.bluetooth) return beginFlow(false);
    // requestDevice va chiamato subito, dentro il gesto dell'utente.
    const ok = await tryBluetooth();
    updateInputPill();
    if (ok) beginFlow(true);
    else {
      setPhase("FASE 1 · CONTROLLER", "Scegli il controller Bluetooth");
      $("#narrator-text").textContent = "Nessun controller scelto. Tocca lo schermo o premi un tasto per riaprire la scelta.";
    }
  }

  document.addEventListener("pointerdown", e => {
    if (e.target.closest("a, select")) return;
    onGesture(e);
  });
  document.addEventListener("keydown", onGesture);

  // All'apertura: prima si prova un controller già autorizzato, poi si apre subito il popup di scelta.
  // Il browser può rifiutare il popup senza un gesto: in quel caso si apre al primo tocco o tasto.
  (async () => {
    if (navigator.bluetooth) {
      setPhase("FASE 1 · CONTROLLER", "Scegli il controller Bluetooth");
      $("#narrator-text").textContent = "Scegli il controller Bluetooth nella finestra. Se non compare, tocca lo schermo o premi un tasto.";
      btBusy = true;
      try {
        await BP.ble.reconnectKnown();
      } catch {
      } finally {
        btBusy = false;
      }
      updateInputPill();
      if (BP.ble.isConnected()) {
        setPhase("FASE 1 · CONTROLLER", "Controller collegato");
        $("#narrator-text").textContent = "Controller collegato. Tocca lo schermo o premi un tasto per iniziare.";
        return;
      }
      if (await tryBluetooth()) {
        updateInputPill();
        beginFlow(true);
      }
    }
  })();

  // --- Fase 2: registrazione dei giocatori ---

  function renderPlayers() {
    $("#narrator-content").innerHTML = `<div class="nar-players">${PLAYER_BUTTONS.map(id => {
      const on = state.players.includes(id);
      return `<div class="nar-player ${id.toLowerCase()} ${on ? "ready" : ""}"><span class="nar-emoji">${COLOR_EMOJI[id]}</span><strong>${COLORS[id]}</strong><span>${on ? "In gioco" : "Libero"}</span></div>`;
    }).join("")}</div>`;
  }

  async function registerPlayers() {
    state.phase = "register";
    state.players = [];
    renderPlayers();
    setPhase("FASE 2 · GIOCATORI", "Premete il vostro tasto");
    const done = new Promise(r => {
      registerDone = r;
    });
    speak(
      "Registrazione dei giocatori. Ogni giocatore prema il tasto colorato che vuole usare. " +
      "Quando tutti sono pronti, premete il tasto centrale."
    );
    await done;
    registerDone = null;
    state.players = PLAYER_BUTTONS.filter(id => state.players.includes(id));
    lineup();
  }

  function onRegisterInput(id) {
    if (id === "C") {
      if (state.players.length >= 2) {
        registerDone?.();
      } else {
        speak("Servono almeno due giocatori. Premete il vostro tasto colorato.");
      }
      return;
    }
    if (state.players.includes(id)) {
      speak(COLORS[id] + " è già in gioco.");
      return;
    }
    state.players.push(id);
    renderPlayers();
    const n = state.players.length;
    speak(`Giocatore ${n}: ${color(id)}.` + (n === PLAYER_BUTTONS.length ? " Siete al completo, premete il tasto centrale." : ""));
  }

  // --- Fase 3: estrazione dei giochi ---

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Estrae `count` giochi a caso, al massimo uno per gruppo di giochi simili.
  function pickGames(ids, count) {
    const picked = [], usedGroups = new Set();
    for (const id of shuffle([...ids])) {
      const group = GROUP_OF[id];
      if (group !== undefined && usedGroups.has(group)) continue;
      if (group !== undefined) usedGroups.add(group);
      picked.push(id);
      if (picked.length === count) break;
    }
    return picked;
  }

  function renderGames() {
    const names = BP.games();
    $("#narrator-content").innerHTML = `<ol class="nar-games">${state.games.map((id, i) => {
      const cls = i < state.gameIndex ? "done" : i === state.gameIndex && state.phase === "playing" ? "current" : "";
      const pts = state.lastPoints[i];
      const extra = pts ? state.players.map(p => `${COLOR_EMOJI[p]} +${pts[p]}`).join(" ") : "";
      return `<li class="${cls}"><span>${i + 1}. ${esc(names[id])}</span><span class="nar-pts">${extra}</span></li>`;
    }).join("")}</ol>${renderTotals()}`;
  }

  function renderTotals() {
    return `<div class="nar-players">${state.players.map(id =>
      `<div class="nar-player ${id.toLowerCase()} ready"><span class="nar-emoji">${COLOR_EMOJI[id]}</span><strong>${COLORS[id]}</strong><span>${state.totals[id] ?? 0} punti</span></div>`
    ).join("")}</div>`;
  }

  async function lineup() {
    state.phase = "lineup";
    const names = BP.games();
    state.games = pickGames(Object.keys(names), GAMES_PER_MATCH);
    state.gameIndex = 0;
    state.lastPoints = {};
    state.totals = Object.fromEntries(state.players.map(id => [id, 0]));
    setPhase("FASE 3 · I GIOCHI", `${GAMES_PER_MATCH} giochi estratti`);
    renderGames();
    await speakAndWaitCenter(
      `Siete in ${state.players.length}: ${listWords(state.players.map(color))}. ` +
      `Ho estratto ${GAMES_PER_MATCH} giochi: ${listWords(state.games.map(id => names[id]))}. ` +
      "Premete il tasto centrale per iniziare."
    );
    stopSpeaking();
    playMatch();
  }

  // --- Fase 4: i giochi in sequenza ---

  // Gruppi di giocatori dal migliore al peggiore; nello stesso gruppo si è a pari merito.
  function placements(detail) {
    const ids = state.players;
    const sc = detail.scores || {};
    const ranking = [...new Set((detail.ranking || []).filter(id => ids.includes(id)))];
    const groups = [];
    if (ranking.length === 4 && ids.length === 4 && TEAM_GAMES.has(detail.id)) {
      groups.push(ranking.slice(0, 2), ranking.slice(2));
    } else {
      ranking.forEach(id => groups.push([id]));
    }
    const rest = ids.filter(id => !ranking.includes(id)).sort((a, b) => (sc[b] || 0) - (sc[a] || 0));
    let prev = null;
    for (const id of rest) {
      if (prev && (sc[prev[0]] || 0) === (sc[id] || 0)) prev.push(id);
      else groups.push(prev = [id]);
    }
    return groups;
  }

  // Punti partita: il primo ne prende tanti quanti sono i giocatori, poi uno in meno per posizione.
  function awardPoints(detail) {
    const points = {};
    let ahead = 0;
    for (const group of placements(detail)) {
      for (const id of group) points[id] = state.players.length - ahead;
      ahead += group.length;
    }
    for (const id of state.players) state.totals[id] += points[id] || 0;
    return points;
  }

  function waitFinish() {
    return new Promise(r => {
      finishWaiter = r;
    });
  }

  window.addEventListener("bp:game-finished", e => {
    if (state.phase !== "playing" || !finishWaiter) return;
    const resolve = finishWaiter;
    finishWaiter = null;
    resolve(e.detail || {});
  });

  async function playMatch() {
    state.phase = "playing";
    const names = BP.games();
    for (state.gameIndex = 0; state.gameIndex < state.games.length; state.gameIndex++) {
      const i = state.gameIndex, id = state.games[i];
      setPhase(`GIOCO ${i + 1} DI ${state.games.length}`, names[id]);
      renderGames();
      await speak(`Gioco ${i + 1} di ${state.games.length}.`);   // il titolo lo dice poi l'introduzione del gioco
      const finished = waitFinish();
      setDim(true);
      BP.start(id, state.players);
      const detail = await finished;
      await waitSilence();
      setDim(false);
      state.lastPoints[i] = awardPoints(detail);
      BP.end();
      renderGames();
      if (i < state.games.length - 1) {
        await speak(`Fine di ${names[id]}. Tra poco il prossimo gioco.`);
        await sleep(1200);
      }
    }
    finalRanking();
  }

  // --- Fase 5: classifica finale, dall'ultimo al primo ---

  async function finalRanking() {
    state.phase = "final";
    setPhase("CLASSIFICA FINALE", "Dall'ultimo al primo");
    const sorted = [...state.players].sort((a, b) => state.totals[b] - state.totals[a]);
    const groups = [];
    for (const id of sorted) {
      const last = groups.at(-1);
      if (last && state.totals[last.ids[0]] === state.totals[id]) last.ids.push(id);
      else groups.push({pos: sorted.indexOf(id), ids: [id]});
    }
    // La classifica parte vuota e si riempie seguendo la voce, dall'ultimo posto al primo.
    $("#narrator-content").innerHTML = `<ol class="nar-rank" id="nar-rank-list"></ol>`;
    const revealGroup = g => {
      $("#nar-rank-list").insertAdjacentHTML("afterbegin", g.ids.map(id =>
        `<li class="${id.toLowerCase()}"><span>${g.pos + 1}° ${COLOR_EMOJI[id]} ${COLORS[id]}</span><strong>${state.totals[id]} punti</strong></li>`
      ).join(""));
    };

    await speak("La partita è finita! Ecco la classifica finale, dall'ultimo al primo.");
    await sleep(600);
    for (const g of [...groups].reverse()) {
      const who = listWords(g.ids.map(color));
      const pts = state.totals[g.ids[0]];
      const tie = g.ids.length > 1 ? ", a pari merito," : "";
      revealGroup(g);   // compare nella lista mentre la voce lo annuncia
      if (g.pos === 0) {
        await sleep(800);
        await speak(
          `E al primo posto${tie} ${g.ids.length > 1 ? "i vincitori sono" : "il vincitore è"} ${who}, con ${pts} punti! Complimenti!`
        );
        await BP.positionSound(1, state.players.length);        // applausi
      } else {
        await speak(`Al ${ORDINALS[g.pos]} posto${tie} ${who}, con ${pts} punti.`);
        await BP.positionSound(g.pos + 1, state.players.length);   // buu
      }
      await sleep(500);
    }
    await speakAndWaitCenter("Premete il tasto centrale per una nuova partita.");
    stopSpeaking();
    registerPlayers();
  }

  // --- Input ---

  window.addEventListener("bp:input", e => {
    const {button, type} = e.detail || {};
    if (type !== "down") return;
    if (state.phase === "register") {
      onRegisterInput(button);
      return;
    }
    if (button === "C" && centerWaiter) {
      const resolve = centerWaiter;
      centerWaiter = null;
      resolve();
    }
  });
})();
