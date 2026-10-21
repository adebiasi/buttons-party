(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const COLORS = {
    P1: {name:"Rosso", emoji:"🔴"}, P2:{name:"Blu",emoji:"🔵"},
    P3:{name:"Giallo",emoji:"🟡"}, P4:{name:"Verde",emoji:"🟢"}
  };
  const state = {step:"ble", connected:false, keyboardMode:false, players:[], count:4, games:[], gameIndex:0, totals:{}, seen:new Set(), transitioning:false};
  const gameEmojis = {pig:"🐷",duel:"🤠",parachute:"🪂",disturber:"📣",pot:"🪙",simon:"🎵",mosquito:"🦟",mine:"⛏️",freeze:"🚦",lesson:"📚",door:"🚪",restaurant:"🍽️",grinder:"⚙️",bomb:"💣",rope:"ex",tennis:"🎾",tapas:"🍣",rally:"🏎️",beeper:"🤬",beat:"🥁",thirsty:"🥤",tug:"🤼",bounty:"🎯",copyrhythm:"🥁",horse:"🐎"};

  const setStep = (step, title, copy, badge) => {
    state.step = step;
    $("#wizard-title").textContent = title;
    $("#wizard-copy").textContent = copy;
    $("#wizard-step").textContent = badge;
  };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function enableKeyboardFallback() {
    state.keyboardMode = true;
    state.connected = true;
    const controllerWrap = $(".controller-wrap");
    if (controllerWrap) controllerWrap.hidden = false;
    $("#wizard-ble-status").textContent = "Modalità tastiera / controller virtuale attivata.";
    $("#wizard-progress").textContent = "Tastiera attivata · pronto per configurare i giocatori";
    setTimeout(showPlayerCount, 500);
  }

  function startConnect() {
    const enabled = $("#ble-enabled"), connect = $("#ble-connect");
    if (!("bluetooth" in navigator)) {
      $("#wizard-ble-status").textContent = "Questo browser non supporta Web Bluetooth. Puoi usare la tastiera o i tasti a schermo.";
      return;
    }
    if (enabled) {
      enabled.checked = true;
      enabled.dispatchEvent(new Event("change", {bubbles:true}));
    }
    if (connect) connect.disabled = false;
    $("#wizard-connect").disabled = true;
    $("#wizard-ble-status").textContent = "Scegli il dispositivo nella finestra Bluetooth…";
    if (connect) connect.click();

    const poll = setInterval(() => {
      const status = $("#ble-status")?.textContent || "";
      $("#wizard-ble-status").textContent = status || "Connessione in corso…";
      const connectedButtons = $("#ble-connect")?.disabled && !$("#ble-disconnect")?.disabled;
      if (connectedButtons || (/collegat|conness|pronto/i.test(status) && !/non collegat|disconness/i.test(status))) {
        clearInterval(poll);
        state.connected = true;
        state.keyboardMode = false;
        $("#wizard-ble-status").textContent = "Controller riconosciuto e collegato.";
        $("#wizard-progress").textContent = "Controller collegato";
        setTimeout(showPlayerCount, 500);
      }
      if (/errore|fallit|non support/i.test(status)) {
        clearInterval(poll);
        $("#wizard-connect").disabled = false;
        $("#wizard-ble-status").textContent = "Connessione non riuscita. Puoi usare la tastiera per giocare.";
      }
    }, 400);

    setTimeout(() => {
      if (!state.connected && !state.keyboardMode) {
        clearInterval(poll);
        $("#wizard-connect").disabled = false;
        $("#wizard-ble-status").textContent = "Dispositivo non trovato. Usa il pulsante 'Usa la tastiera' per continuare.";
      }
    }, 10000);
  }

  function showPlayerCount() {
    setStep("count","Quanti giocatori partecipano?","Seleziona il numero di giocatori. Ogni giocatore deve registrare il proprio tasto e poi confermare con il tasto centrale (o Spazio / C).", "FASE 2 / 3");
    $("#wizard-content").innerHTML = `
      <label for="party-count">Numero di giocatori</label>
      <select id="party-count"><option value="2">2 giocatori</option><option value="3">3 giocatori</option><option value="4" selected>4 giocatori</option></select>
      <button id="party-count-next" class="primary-button">Continua</button>`;
    $("#party-count-next").addEventListener("click", () => { state.count = Number($("#party-count").value); beginPlayerSetup(); });
    $("#wizard-progress").textContent = `${state.keyboardMode ? "Tastiera attiva" : "Controller collegato"} · pronto per configurare i giocatori`;
  }

  function beginPlayerSetup() {
    state.players = []; state.seen = new Set();
    for (const id of ["P1","P2","P3","P4"].slice(0,state.count)) state.totals[id] = 0;
    setStep("players","Registra i giocatori","A turno, ogni giocatore prema il proprio tasto colorato (Tasti 1, 2, 3, 4 sulla tastiera). Quando il suo colore viene riconosciuto, prema il tasto centrale (Spazio / C) per confermare.", "FASE 2 / 3");
    renderPlayers();
  }

  function renderPlayers() {
    const nextId = ["P1","P2","P3","P4"].slice(0,state.count).find(id => !state.players.includes(id));
    $("#wizard-content").innerHTML = `
      <div class="party-big-message">${nextId ? `Giocatore ${state.players.length+1}: premi ${COLORS[nextId].name.toLowerCase()} (Tasto${nextId.replace("P","")})` : "Tutti i giocatori sono pronti!"}</div>
      <div class="party-players">${["P1","P2","P3","P4"].slice(0,state.count).map((id,i)=>`<div class="party-player ${state.players.includes(id)?"ready":""}"><div class="player-color">${COLORS[id].emoji}</div><strong>Giocatore ${i+1}</strong><span>${state.players.includes(id)?"✓ Confermato":nextId===id?"Premi "+COLORS[id].name+" ("+id.replace("P","")+")":"In attesa"}</span></div>`).join("")}</div>
      ${nextId?"":'<button id="party-ready" class="primary-button">▶ Tutti pronti: inizia il torneo</button>'}
      <p class="hint" id="player-feedback">Il tasto centrale (o Spazio / C) viene usato per confermare ogni giocatore.</p>`;
    if (!nextId) $("#party-ready").addEventListener("click", startTournament);
    $("#wizard-progress").textContent = `${state.players.length} / ${state.count} giocatori confermati`;
  }

  function onInput(e) {
    if (e.type !== "down" || (!state.connected && !state.keyboardMode)) return;
    if (state.step === "players") {
      const wanted = ["P1","P2","P3","P4"].slice(0,state.count).find(id=>!state.players.includes(id));
      if (!wanted) return;
      if (!state.seen.has(wanted)) {
        if (e.button === wanted) {
          state.seen.add(wanted);
          $("#player-feedback").textContent = `${COLORS[wanted].name} riconosciuto. Ora premi il tasto centrale (Spazio / C) per confermare.`;
          state.pendingPlayer = wanted;
        } else if (["P1","P2","P3","P4"].includes(e.button)) {
          $("#player-feedback").textContent = `Atteso ${COLORS[wanted].name}; hai premuto ${COLORS[e.button].name}. Riprova.`;
        }
      } else if (e.button === "C" && state.pendingPlayer === wanted) {
        state.players.push(wanted); state.pendingPlayer = null; renderPlayers();
      }
    }
  }

  function shuffle(a) { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

  function startTournament() {
    const all = window.BPArcade.games();
    state.games = shuffle(Object.keys(all)).slice(0,6).map(id=>({id,name:all[id]}));
    state.gameIndex = 0; state.transitioning = false;
    setStep("tournament","La sfida comincia!","Sono stati estratti 6 minigiochi diversi. Ogni risultato contribuirà alla classifica finale.", "FASE 3 / 3");
    $("#wizard-content").innerHTML = `<ol class="party-game-list" id="party-game-list"></ol><button id="party-begin" class="primary-button">▶ Inizia il primo gioco</button>`;
    renderGameList();
    $("#party-begin").addEventListener("click", launchCurrentGame);
  }

  function renderGameList() {
    $("#party-game-list").innerHTML = state.games.map((g,i)=>`<li class="${i===state.gameIndex?"current":i<state.gameIndex?"done":""}"><span>${i<state.gameIndex?"✓":gameEmojis[g.id]||"🎮"}</span><span>${i+1}. ${esc(g.name)}</span><span>${i<state.gameIndex?"Completato":i===state.gameIndex?"In corso":"In programma"}</span></li>`).join("");
  }

  function launchCurrentGame() {
    if (state.gameIndex >= state.games.length) return showResults();
    $("#party-begin")?.remove();
    const g = state.games[state.gameIndex];
    $("#wizard-copy").textContent = `Gioco ${state.gameIndex+1} di 6: ${g.name}. Al termine passerai automaticamente al gioco successivo.`;
    $("#wizard-content").innerHTML = `<p class="party-big-message">${gameEmojis[g.id]||"🎮"} ${esc(g.name)}</p><p class="muted">Gioco ${state.gameIndex+1} / 6</p><ol class="party-game-list">${state.games.map((x,i)=>`<li class="${i===state.gameIndex?"current":i<state.gameIndex?"done":""}">${i<state.gameIndex?"✓":gameEmojis[x.id]||"🎮"} ${i+1}.${esc(x.name)}</li>`).join("")}</ol>`;
    state.transitioning = false;
    window.BPArcade.start(g.id,state.count);
  }

  window.addEventListener("bp:game-finished", e => {
    if (state.step !== "tournament" || state.transitioning) return;
    state.transitioning = true;
    const result = e.detail?.scores || {};
    Object.keys(state.totals).forEach(id => state.totals[id] += Number(result[id] || 0));
    $("#wizard-title").textContent = `Gioco ${state.gameIndex+1} completato`;
    $("#wizard-copy").textContent = "Punteggi registrati. Il prossimo minigioco partirà tra pochi secondi.";
    $("#wizard-content").innerHTML = `<p class="party-big-message">🏁 ${esc(state.games[state.gameIndex].name)}</p><div class="party-players">${state.players.map(id=>`<div class="party-player"><strong>${COLORS[id].emoji}${COLORS[id].name}</strong><span>Questo gioco: ${Number(result[id] || 0)} punti</span><span>Totale:${state.totals[id]}</span></div>`).join("")}</div>`;
    setTimeout(() => {
      window.BPArcade.end();
      state.gameIndex++;
      if (state.gameIndex >= 6) showResults();
      else launchCurrentGame();
    }, 3500);
  });

  function showResults() {
    setStep("results","Classifica finale","La classifica è ordinata dal punteggio più basso al più alto, come richiesto.", "RISULTATI");
    const ranking = state.players.slice().sort((a,b)=>state.totals[a]-state.totals[b]);
    $("#wizard-content").innerHTML = `<ol class="party-rank">${ranking.map((id,i)=>`<li><span><span class="rank-name">${i+1}.${COLORS[id].emoji} ${COLORS[id].name}</span><br><small>${i===0?"Punteggio più basso":i===ranking.length-1?"Punteggio più alto":"Classifica"}</small></span><span class="rank-score">${state.totals[id]} pt</span></li>`).join("")}</ol><button id="party-restart" class="primary-button">↻ Nuova partita</button>`;
    $("#party-restart").addEventListener("click", () => { state.totals={}; state.players=[]; state.games=[]; state.gameIndex=0; showPlayerCount(); });
  }

  $("#wizard-connect")?.addEventListener("click", startConnect);
  $("#wizard-use-keyboard")?.addEventListener("click", enableKeyboardFallback);
  window.addEventListener("bp:input", e => onInput(e.detail));
})();