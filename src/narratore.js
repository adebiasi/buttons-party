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

  function updateInputPill() {
    const bluetoothConnected = BP.ble.isConnected();
    $("#narrator-input").textContent = bluetoothConnected ? "Controller: Bluetooth 🔵" : "Controller: tastiera ⌨️";
    $("#virtual-controller").hidden = bluetoothConnected;
  }

  updateInputPill();
  setInterval(updateInputPill, 1000);

  // --- Fase 1: connessione ---

  async function tryBluetooth() {
    if (BP.ble.isConnected()) return true;
    if (!navigator.bluetooth) return false;
    try {
      await BP.ble.connect();
      return BP.ble.isConnected();
    } catch (error) {
      console.warn("Connessione BLE non riuscita:", error);
      return false;
    }
  }

  function onFirstGesture(e) {
    if (state.phase !== "start") return;
    if (e.type === "keydown" && e.key === "Escape") return;
    state.phase = "connect";
    BP.unlockAudio();
    setPhase("FASE 1 · CONTROLLER", "Collegamento del controller");
    const welcome = speak("Benvenuti a Buttons party! Provo a collegare il controller Bluetooth.");
    // requestDevice va chiamato subito, dentro il gesto dell'utente.
    const connected = tryBluetooth();
    afterConnect(welcome, connected);
  }

  async function afterConnect(welcome, connected) {
    const ok = await connected;
    await welcome;
    updateInputPill();
    if (ok) {
      await speak("Controller collegato.");
    } else {
      $("#narrator-retry-ble").hidden = false;
      await speak(
        "Non sono riuscito a collegare il controller. Potete usare la tastiera: " +
        "i tasti uno, due, tre e quattro sono rosso, blu, giallo e verde. " +
        "La barra spaziatrice è il tasto centrale."
      );
    }
    registerPlayers();
  }

  $("#narrator-retry-ble").addEventListener("click", async () => {
    BP.unlockAudio();
    const ok = await tryBluetooth();
    updateInputPill();
    if (ok) $("#narrator-retry-ble").hidden = true;
    speak(ok ? "Controller collegato." : "Controller non collegato. Continuate con la tastiera.");
  });

  document.addEventListener("pointerdown", e => {
    if (e.target.closest("button, a, select")) return;
    onFirstGesture(e);
  });
  document.addEventListener("keydown", onFirstGesture);
  document.querySelectorAll("[data-button]").forEach(b => b.addEventListener("pointerdown", onFirstGesture));

  // Se il browser ricorda un controller già autorizzato, prova a collegarlo senza chiedere nulla.
  BP.ble.reconnectKnown().then(updateInputPill, () => {});

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
    state.games = shuffle(Object.keys(names)).slice(0, GAMES_PER_MATCH);
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
      await speak(`Gioco ${i + 1} di ${state.games.length}: ${names[id]}.`);
      const finished = waitFinish();
      BP.start(id, state.players);
      const detail = await finished;
      await waitSilence();
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
    $("#narrator-content").innerHTML = `<ol class="nar-rank">${groups.map(g => g.ids.map(id =>
      `<li class="${id.toLowerCase()}"><span>${g.pos + 1}° ${COLOR_EMOJI[id]} ${COLORS[id]}</span><strong>${state.totals[id]} punti</strong></li>`
    ).join("")).join("")}</ol>`;

    await speak("La partita è finita! Ecco la classifica finale, dall'ultimo al primo.");
    await sleep(600);
    for (const g of [...groups].reverse()) {
      const who = listWords(g.ids.map(color));
      const pts = state.totals[g.ids[0]];
      const tie = g.ids.length > 1 ? ", a pari merito," : "";
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
