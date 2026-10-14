(() => {
    "use strict";
    const $ = (s) => document.querySelector(s);
    const buttons = [...document.querySelectorAll("[data-button]")];
    const COLORS = {P1: "Rosso", P2: "Blu", P3: "Giallo", P4: "Verde", C: "Centro"};
    const PLAYER_BUTTONS = ["P1", "P2", "P3", "P4"];
    const KEY_MAP = {"1": "P1", "2": "P2", "3": "P3", "4": "P4", " ": "C", "Enter": "C"};
    const DESCRIPTIONS = {
        pig: "Ascolta i versi: premi quando senti il maiale, non gli altri animali.",
        duel: "Conferma con il tuo tasto, poi premi appena senti il segnale. Anticipare significa falsa partenza.",
        parachute: "Apri il paracadute il più tardi possibile, ma prima dell'impatto. L'esito è rivelato alla fine.",
        disturber: "Premi quando senti il parlante bersaglio. I suoni sono sintetici in questa versione provvisoria.",
        pot: "Il piatto cresce: incassa quando vuoi, ma se aspetti troppo rischi di perdere tutto.",
        simon: "Ascolta la sequenza e ripetila usando tutti e cinque i tasti. A turno, un errore elimina.",
        mosquito: "Una zanzara vola intorno a te: premi quando il ronzio è fortissimo, cioè quando è vicina. Se premi troppo presto perdi un punto.",
        mine: "Ascolta il canarino: se smette di cantare per più di 10 secondi è morto. Allora premi entro 2 secondi. Se premi prima scappi, se premi dopo è troppo tardi. Vince l'ultimo a uscire in tempo.",
        freeze: "Premi il più possibile mentre senti uno, due, tre. Appena senti «stai là!» fermati: chi preme è squalificato. Vince chi arriva per primo al numero di passi stabilito.",
   restaurant: "Il ristoratore annuncia i piatti: prenota premendo per primo quelli buoni. Se prenoti un piatto immangiabile, paghi la penitenza e perdi un punto.",
    grinder: "Tieni premuto per spingere il legno contro la mola. Quando il suono finisce, lascia subito il tasto o perdi la mano! Vince chi tiene premuto più a lungo in totale.",
};
    const GAME_NAMES = {
        pig: "Cattura il maiale",
        duel: "Duello",
        parachute: "Paracadutisti",
        disturber: "Disturbatore",
        pot: "Piglia tutto",
        simon: "Simon a 5 tasti",
mosquito: "Prendi la zanzara",
mine: "In miniera",
freeze: "Uno, due, tre, stai là!",
  restaurant: "Ristorante",
   grinder: "Mola a disco",
   };
    const ANIMALS = ["cane", "gatto", "mucca", "pecora", "gallina", "cavallo", "papera", "gallo"];
    let audio = null, soundEnabled = true, game = null, timer = null, paused = false;
    let natureSource = null, natureGain = null;
    let held = new Set(), players = 4, scores = {}, toastTimer = null;
    let fallSource = null, fallGain = null;
    let ground = 0, start = 0;

    function ensureAudio() {
        if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === "suspended") audio.resume();
        return audio;
    }


    const sampleCache = new Map();

    async function loadSample(path) {
        console.log("Caricamento sample:", path);
        if (!sampleCache.has(path)) {
            const promise = (async () => {
                try {
                    const response = await fetch(path);

                    if (!response.ok) {
                        throw new Error(`Sample non trovato: ${path}`);
                    }

                    const data = await response.arrayBuffer();
                    const ctx = ensureAudio();

                    return await ctx.decodeAudioData(data);
                } catch (error) {
                    console.warn("Uso il suono sintetico:", path, error);
                    return null;
                }
            })();

            sampleCache.set(path, promise);
        }
        console.log("Caricamento sample completato:", path);
        return sampleCache.get(path);
    }

    async function playSample(path, fallback) {
        console.log("Riproduzione sample:", path);
        const buffer = await loadSample(path);

        if (buffer) {
            try {
                const ctx = ensureAudio();
                const source = ctx.createBufferSource();

                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();

                return;
            } catch (error) {
                console.warn("Impossibile riprodurre il sample:", path);
            }
        }

        // Il file manca o non è riproducibile:
        // mantieni il comportamento audio originale.
        fallback();
    }

    function stopFallSound() {
        if (fallSource) {
            try {
                fallSource.stop();
            } catch (e) {
                // La sorgente poteva essere già fermata
            }
            fallSource.disconnect();
            fallSource = null;
        }

        if (fallGain) {
            fallGain.disconnect();
            fallGain = null;
        }
    }


    async function startFallSound(path = "assets/sounds/arrivo.mp3") {
        stopFallSound();

        const buffer = await loadSample(path);

        if (!buffer) {
            console.warn("Suono di caduta non disponibile:", path);
            return null;
        }

        const ctx = ensureAudio();

        // Durata della caduta: da 10 a 18 secondi
        const durationMs = 10000 + Math.random() * 8000;
        const durationSeconds = durationMs / 1000;

        fallSource = ctx.createBufferSource();
        fallGain = ctx.createGain();

        fallSource.buffer = buffer;

        // Rallenta la traccia in base alla sua durata originale.
        // Esempio: audio di 1 secondo e caduta di 10 secondi = rate 0.1.
        fallSource.playbackRate.value = buffer.duration / durationSeconds;

        // Mantiene il suono per tutta la caduta.
        fallSource.loop = true;
        fallGain.gain.value = soundEnabled ? 0.16 : 0;

        fallSource.connect(fallGain);
        fallGain.connect(ctx.destination);

        fallSource.start();

        // Restituisce la durata al gioco: non crea un secondo timer.
        return durationMs;
    }

    function tone(freq = 440, duration = .12, wave = "sine", volume = .12, delay = 0) {
        if (!soundEnabled) return;
        const a = ensureAudio(), osc = a.createOscillator(), gain = a.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, a.currentTime + delay);
        gain.gain.setValueAtTime(.0001, a.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(Math.max(.001, volume), a.currentTime + delay + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, a.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(a.destination);
        osc.start(a.currentTime + delay);
        osc.stop(a.currentTime + delay + duration + .02);
    }

    async function startNatureAmbience(path = "assets/sounds/background-cattura-maiale.mp3", volume = 0.08) {
        stopNatureAmbience();

        const buffer = await loadSample(path);

        if (!buffer) {
            console.warn("Sottofondo natura non disponibile:", path);
            return;
        }

        const ctx = ensureAudio();
        natureSource = ctx.createBufferSource();
        natureGain = ctx.createGain();

        natureSource.buffer = buffer;
        natureSource.loop = true;
        natureGain.gain.value = soundEnabled ? volume : 0;

        natureSource.connect(natureGain);
        natureGain.connect(ctx.destination);
        natureSource.start();
    }

    function stopNatureAmbience() {
        if (natureSource) {
            try {
                natureSource.stop();
            } catch (e) {
                // La sorgente poteva essere già stata interrotta
            }
            natureSource.disconnect();
            natureSource = null;
        }

        if (natureGain) {
            natureGain.disconnect();
            natureGain = null;
        }
    }

    function setNatureVolume(volume) {
        if (natureGain) {
            natureGain.gain.value = soundEnabled ? volume : 0;
        }
    }

    function noise(duration = .2, volume = .08) {
        if (!soundEnabled) return;
        const a = ensureAudio(), size = Math.floor(a.sampleRate * duration),
            buffer = a.createBuffer(1, size, a.sampleRate), data = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
        const src = a.createBufferSource(), gain = a.createGain();
        src.buffer = buffer;
        gain.gain.value = volume;
        src.connect(gain);
        gain.connect(a.destination);
        src.start();
    }

    function beepButton(id) {
        const freqs = {P1: 330, P2: 392, P3: 494, P4: 262, C: 587};
        tone(freqs[id] || 440, .07, "sine", .045);
    }

    function say(text) {
        if (!("speechSynthesis" in window)) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "it-IT";
        u.rate = 1.05;
        u.volume = soundEnabled ? .8 : 0;
        speechSynthesis.speak(u);
    }

// Come say(), ma restituisce una Promise che si risolve a fine frase
function sayAsync(text, maxMs = 8000) {
    return new Promise(resolve => {
        if (!("speechSynthesis" in window)) return resolve();
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "it-IT";
        u.rate = 1.05;
        u.volume = soundEnabled ? .8 : 0;
        let done = false;
        const end = () => {
            if (done) return;
            done = true;
            clearTimeout(safety);
            resolve();
        };
        // Sicurezza: su alcuni browser onend non scatta sempre
        const safety = setTimeout(end, maxMs);
        u.onend = end;
        u.onerror = end;
        speechSynthesis.speak(u);
    });
}

// Come playSample(), ma si risolve quando il suono è finito
async function playSampleWait(path, fallback) {
    const buffer = await loadSample(path);
    if (buffer) {
        try {
            const ctx = ensureAudio();
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            return new Promise(resolve => {
                source.onended = resolve;
                source.start();
            });
        } catch (error) {
            console.warn("Impossibile riprodurre il sample:", path);
        }
    }
    fallback();
    return new Promise(resolve => setTimeout(resolve, 600));
}

    function toast(message) {
        const el = $("#toast");
        el.textContent = message;
        el.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
    }

    function setArena(message, info = "", style = "") {
        $("#arena-message").textContent = message;
        $("#live-info").textContent = info;
        $("#arena").className = "arena" + (style ? " " + style : "");
    }

    function stopTimer() {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function later(fn, ms) {
        stopTimer();
        timer = setTimeout(() => {
            timer = null;
            if (!paused && game) fn();
        }, ms);
    }

    function playerIds() {
        return PLAYER_BUTTONS.slice(0, players);
    }

    function renderScores(extra = {}) {
        const ids = playerIds();
        $("#scores").innerHTML = ids.map(id => `<div class="score-card ${id.toLowerCase()}"><div class="score-name">${COLORS[id]}</div><div class="score-value">${extra[id] ?? scores[id] ?? 0}</div></div>`).join("");
    }

    function updateSetup() {
        $("#game-description").textContent = DESCRIPTIONS[$("#game-select").value];
    }

    function emit(id, type, source = "touch") {
        const event = {button: id, type, timestamp: performance.now(), source};
        if (type === "down") {
            if (held.has(id)) return;
            held.add(id);
            beepButton(id);
            buttons.find(b => b.dataset.button === id)?.classList.add("pressed");
        } else {
            held.delete(id);
            buttons.find(b => b.dataset.button === id)?.classList.remove("pressed");
        }
        if (type === "down") {
            if (!game) {
                if (id === "C") startGame();
                return;
            }
            if (paused) {
                if (id === "C") resumeGame();
                return;
            }
            if (id === "C" && game.mode === "realtime") {
                pauseGame();
                return;
            }
        }
        if (game && !paused) game.onInput(event);
    }


const bleEnabled = $("#ble-enabled");
const bleConnect = $("#ble-connect");
const bleDisconnect = $("#ble-disconnect");
const bleStatus = $("#ble-status");

const bleController = new window.ArcadeBLEController({
  onInput: (id, type) => {
    // Riutilizza il sistema di input già presente nei giochi.
    emit(id, type, "controller");
  },

  onStatus: message => {
    bleStatus.textContent = message;
  }
});

bleController.setEnabled(false);
bleConnect.disabled = true;
bleDisconnect.disabled = true;

bleEnabled.addEventListener("change", () => {
  bleController.setEnabled(bleEnabled.checked);

  bleConnect.disabled =
    !bleEnabled.checked || bleController.device !== null;

  bleDisconnect.disabled =
    !bleController.device;
});

bleConnect.addEventListener("click", async () => {
  try {
    await bleController.connect();
    bleConnect.disabled = true;
    bleDisconnect.disabled = false;
  } catch (error) {
    toast("Connessione BLE non riuscita: " + error.message);
  }
});

bleDisconnect.addEventListener("click", () => {
  bleController.disconnect();
  bleConnect.disabled = !bleEnabled.checked;
  bleDisconnect.disabled = true;
});


    buttons.forEach(b => {
        const id = b.dataset.button;
        b.addEventListener("pointerdown", e => {
            e.preventDefault();
            ensureAudio();
            emit(id, "down", "touch");
        });
        const up = e => {
            e.preventDefault();
            emit(id, "up", "touch");
        };
        b.addEventListener("pointerup", up);
        b.addEventListener("pointercancel", up);
        b.addEventListener("lostpointercapture", up);
        b.addEventListener("contextmenu", e => e.preventDefault());
    });
    document.addEventListener("keydown", e => {
        if (e.repeat) return;
        const id = KEY_MAP[e.key];
        if (!id) return;
        if (e.key === " " || e.key === "Enter") e.preventDefault();
        ensureAudio();
        emit(id, "down", "keyboard");
    });
    document.addEventListener("keyup", e => {
        const id = KEY_MAP[e.key];
        if (id) emit(id, "up", "keyboard");
    });
    window.addEventListener("blur", () => {
        for (const id of [...held]) emit(id, "up", "keyboard");
    });
    $("#game-select").addEventListener("change", updateSetup);
    $("#player-count").addEventListener("change", e => {
        players = Number(e.target.value);
    });
    $("#sound-toggle").addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        $("#sound-toggle").textContent = soundEnabled ? "🔊 Audio attivo" : "🔇 Audio disattivato";
        $("#sound-toggle").setAttribute("aria-pressed", String(soundEnabled));

        if (!soundEnabled && "speechSynthesis" in window) {
            speechSynthesis.cancel();
        } else {
            ensureAudio();
        }

        setNatureVolume(0.08);
    });
    $("#start-button").addEventListener("click", () => {
        ensureAudio();
        startGame();
    });
    $("#random-button").addEventListener("click", () => {
        const keys = Object.keys(GAME_NAMES);
        $("#game-select").value = keys[Math.floor(Math.random() * keys.length)];
        updateSetup();
        toast("Gioco scelto: " + GAME_NAMES[$("#game-select").value]);
    });
    $("#pause-button").addEventListener("click", () => paused ? resumeGame() : pauseGame());
    $("#exit-button").addEventListener("click", endGame);

    function pauseGame() {
        if (!game || paused || game.finished) return;
        paused = true;
        stopTimer();
        setArena("⏸ Partita in pausa", "Premi Riprendi per continuare");
        $("#pause-button").textContent = "▶ Riprendi";
        buttons.forEach(b => b.classList.remove("pressed"));
    }

    function resumeGame() {
        if (!game || !paused) return;
        paused = false;
        $("#pause-button").textContent = "Ⅱ Pausa";
        game.resume?.();
        if (!game.resume) setArena("Si riparte!");
    }

    function startGame() {
        stopTimer();
        paused = false;
        players = Number($("#player-count").value);
        scores = Object.fromEntries(playerIds().map(id => [id, 0]));
        $("#setup-panel").hidden = true;
        $("#game-panel").hidden = false;
        $("#pause-button").textContent = "Ⅱ Pausa";
        $("#game-title").textContent = GAME_NAMES[$("#game-select").value];
        $("#simon-feedback").textContent = "";
        const id = $("#game-select").value;
        game = makeGame(id);
        game.setup();
        game.start();
        renderScores();
    }

    function endGame() {
        stopTimer();
        stopFallSound();

        if (game?.dispose) game.dispose();
        game = null;
        paused = false;
        held.clear();
        $("#game-panel").hidden = true;
        $("#setup-panel").hidden = false;
        $("#pause-button").textContent = "Ⅱ Pausa";
        setArena("Premi Inizia");
    }
function finish(message, ranking = null, announce = true) {
    if (!game || game.finished) return;
    game.finished = true;
    stopTimer();
    stopFallSound();

    setArena(message, "Premi ✕ Esci per tornare al menu", "signal");
    $("#game-status").textContent = "FINE PARTITA";
    if (ranking && announce) {
        const winner = ranking[0];
        if (winner) say("Vince " + COLORS[winner]);
    }
    $("#pause-button").disabled = true;
}

    function baseGame(id, mode = "realtime") {
        return {
            id, mode, finished: false, setup() {
            }, start() {
            }, onInput() {
            }, onTick() {
            }, result() {
                return []
            }, dispose() {
                stopTimer();
            }, resume() {
                setArena("Partita ripresa");
            }
        };
    }

    function makeGame(id) {
        return ({
            pig: makePig,
            duel: makeDuel,
            parachute: makeParachute,
            disturber: makeDisturber,
            pot: makePot,
            simon: makeSimon,
                    mosquito: makeMosquito,
mine: makeMine,
freeze: makeFreeze,
restaurant: makeRestaurant,
grinder: makeGrinder

        })[id]();
    }

    function makePig() {
        const g = baseGame("pig");
        let count = 0, max = 0, current = "", active = false, blocked = {}, duration = 90000, started = 0,
            claimed = false, previous = "";
        g.start = () => {
            started = performance.now();
            $("#game-status").textContent = "ASCOLTA BENE";
            setArena("🐾 In ascolto…", "Premi solo quando senti il maiale");

            startNatureAmbience("assets/sounds/background-cattura-maiale.mp3", 0.08);

            next();
        };

        function next() {
            if (g.finished) return;
            if (performance.now() - started >= duration) {
                finish("Tempo scaduto!", winner());
                return;
            }
            active = false;
            claimed = false;
            current = "";
            setArena("Ascolta…", "Prossimo verso in arrivo");
            later(() => {
                console.log("Prossimo verso");
                if (g.finished) return;
                count++;
                let pig = count >= 8
                    ? Math.random() < .5
                    : Math.random() < .24;
                let choices = ANIMALS.filter(a => a !== previous && ((pig && a === "maiale") || (!pig && a !== "maiale")));
                console.log("Candidati: " + choices.join(", ") + (pig ? " (maiale)" : ""))
                current = pig ? "maiale" : choices[Math.floor(Math.random() * choices.length)];
                console.log("Verso: " + current);
                if (!pig) previous = current; else previous = "";
                active = true;
                setArena("🔊 " + (current === "maiale" ? "OINK!" : "Verso: " + current), current === "maiale" ? "È LUI! PREMI!" : "Non è il maiale! NON premere", current === "maiale" ? "signal" : "");
                animalSound(current);
                later(() => {
                    active = false;
                    next();
                }, current === "maiale" ? 1500 : 850);
            }, 1200 + Math.random() * 1300);
        }

        function animalSound(a) {
            playSample(`assets/sounds/${a}.mp3`, () => {
            });
        }

        function winner() {
            return playerIds().sort((a, b) => scores[b] - scores[a]);
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;

            const id = e.button;

            if (blocked[id] > performance.now()) return;

            if (active && current === "maiale") {
                if (claimed) return;

                claimed = true;
                scores[id]++;
                renderScores();

                playSample("assets/sounds/punto.mp3", () => {
                    tone(880, .14, "sine", .1);
                });

                toast(COLORS[id] + " cattura il maiale!");

                if (scores[id] >= 10) {
                    finish("🐷 " + COLORS[id] + " vince!", winner());
                    return;
                }
            } else {
                scores[id]--;
                renderScores();
                blocked[id] = performance.now() + 1000;

                playSample("assets/sounds/penalita.mp3", () => {
                    tone(110, .22, "square", .08);
                });

                toast("Errore! " + COLORS[id] + " perde un punto");
            }
        };

        g.dispose = () => {
            stopTimer();
            stopNatureAmbience();
        };

        return g;
    }

function makeDuel() {
    const g = baseGame("duel");
    const FALSE_START_SOUND = "assets/sounds/falsa-partenza.mp3";
    let ready = new Set(), eligible = new Set(), round = 1, started = false, waiting = false, goAt = 0, wins = {};
    const total = 5;

    g.start = () => {
        wins = Object.fromEntries(playerIds().map(p => [p, 0]));
        round = 1;
        loadSample(FALSE_START_SOUND); // precarica
        beginRound();
    };

    function beginRound() {
        if (g.finished) return;
        ready.clear();
        eligible = new Set(playerIds());
        started = false;
        waiting = false;
        g.duelWinner = undefined;
        setArena("Round " + round + " / " + total, "Premi il tuo tasto per prepararti");
        $("#game-status").textContent = "DUELLO";
        renderScores(wins);
        say("Round " + round + ". Prepararsi");
    }

    function signal() {
        if (g.finished) return;
        waiting = false;
        started = true;
        goAt = performance.now();

        setArena("🔥 VIA!", "Premi il tuo tasto!", "signal");

        playSample("assets/sounds/inizio-duello.mp3", () => {
            tone(880, .28, "square", .18);
        });

        later(() => {}, 5000);
    }

    // Falsa partenza: -1 punto, suono, escluso dal round
    function falseStart(id) {
        eligible.delete(id);
        wins[id]--;
        renderScores(wins);

        playSample(FALSE_START_SOUND, () => tone(100, .3, "square", .12));
        toast("Falsa partenza: " + COLORS[id] + " perde un punto");

        // Se sono tutti fuori, il round non ha senso: si ripete
        if (eligible.size === 0) {
            setArena("Tutti hanno anticipato!", "Il round si ripete");
            later(beginRound, 1500);
        }
    }

    function resolve(id) {
        if (g.finished) return;

        if (g.duelWinner !== undefined) {
            playSample("assets/sounds/proiettile-schiavato.mp3", () => {});
            return;
        }

        g.duelWinner = id;

        playSample("assets/sounds/pistola-sparo.mp3", () => {
            tone(180, .18, "sawtooth", .15);
        });

        wins[id]++;
        renderScores(wins);
        setArena("🏆 " + COLORS[id] + " vince il round!", "Punteggio round: " + wins[id]);

        round++;

        if (round <= total) {
            later(beginRound, 1400);
        } else {
            later(() => {
                const order = playerIds().sort((a, b) => wins[b] - wins[a]);
                finish("Partita terminata — " + COLORS[order[0]] + " vince!", order);
            }, 1500);
        }
    }

    g.onInput = e => {
        if (e.type !== "down") return;
        if (e.button === "C") return;
        const id = e.button;
        if (!playerIds().includes(id) || g.finished) return;

        // Fase di preparazione: ognuno conferma il proprio tasto
        if (!started && !waiting) {
            if (!ready.has(id)) {
                ready.add(id);
                tone(500, .08);
                toast(COLORS[id] + " pronto");
            }
            if (ready.size === players) {
                waiting = true;
                setArena("Non muoverti…", "Aspetta il segnale");
                later(() => {
                    if (g.finished) return;
                    signal();
                }, 3000 + Math.random() * 5000);
            }
            return;
        }

        // Attesa del segnale: premere adesso è una falsa partenza
        if (waiting) {
            if (eligible.has(id)) falseStart(id);
            return;
        }

        // Segnale già dato
        if (!eligible.has(id)) {
            if (g.duelWinner !== undefined && id !== g.duelWinner) {
                playSample("assets/sounds/proiettile-schiavato.mp3", () => {});
            }
            return;
        }
        eligible.delete(id);
        if (performance.now() < goAt + 15) {
            // tempo di reazione impossibile: trattato come anticipo
            eligible.add(id);
            falseStart(id);
            return;
        }
        resolve(id);
    };

    g.resume = () => {
        setArena("Duello ripreso", "Continua a giocare");
    };
    return g;
}
function makeParachute() {
    const g = baseGame("parachute");
    let start = 0, ground = 0, safe = 0, opened = {}, results = {}, running = false;

    g.start = async () => {
        opened = {};
        results = {};
        running = false;

        $("#game-status").textContent = "PREPARATI";
        setArena("🪂 Preparati…", "Ascolta le istruzioni");

        // Precarica i suoni mentre la voce parla
        loadSample("assets/sounds/caduta.mp3");
        loadSample("assets/sounds/splash.mp3");
        loadSample("assets/sounds/paracadute.mp3");

        // 1. La voce spiega il gioco e il gioco aspetta che finisca
        await sayAsync("Caduta libera. Senti il suono e scegli quando aprire.");
        if (game !== g) return; // uscito durante la spiegazione

        // 2. Ora parte la caduta
        $("#game-status").textContent = "CADUTA LIBERA";
        setArena("🪂 In caduta…", "Apri il paracadute prima dell'impatto");

        const duration = await startFallSound("assets/sounds/caduta.mp3");
        if (game !== g) {
            stopFallSound();
            return;
        }

        // Se manca l'audio, usa comunque una caduta di 25-40 secondi.
        ground = duration ?? (25000 + Math.random() * 15000);
        start = performance.now();
        safe = ground * (0.35 + Math.random() * 0.25);
        running = true;

        tick();
    };

    async function announceWinner(missed, order) {
        // 3. Prima lo splash, poi la voce
        if (missed) {
            await playSampleWait("assets/sounds/splash.mp3", () => {});
        }
        if (game !== g) return; // uscito nel frattempo
        say("Vince " + COLORS[order[0]]);
    }

    function tick() {
        if (g.finished) return;

        const elapsed = performance.now() - start;
        const remain = Math.max(0, ground - elapsed);

        setArena(
            "🪂 " + (remain / 1000).toFixed(1) + " s",
            "Il suono si avvicina… apri al momento giusto"
        );

        if (elapsed >= ground) {
            const missed = playerIds().some(p => !opened[p]);

            playerIds().forEach(p => {
                if (!opened[p]) {
                    results[p] = {valid: false, time: ground + 1};
                }
            });

            const order = playerIds().sort((a, b) => rank(results, a, b));

            // announce = false: la voce la gestisce announceWinner dopo lo splash
            finish("💥 Impatto! " + COLORS[order[0]] + " in testa", order, false);
            announceWinner(missed, order);
            return;
        }

        later(tick, 200);
    }

    function rank(r, a, b) {
        const x = r[a] || {valid: false, time: ground + 1};
        const y = r[b] || {valid: false, time: ground + 1};

        if (x.valid !== y.valid) return x.valid ? -1 : 1;
        return y.time - x.time;
    }

    g.onInput = e => {
        // Durante la spiegazione vocale i tasti non fanno nulla
        if (!running || e.type !== "down" || !playerIds().includes(e.button) || opened[e.button] || g.finished) return;

        const t = performance.now() - start;

        opened[e.button] = true;
        results[e.button] = {valid: t >= safe && t < ground, time: t};

        playSample("assets/sounds/paracadute.mp3", () => {
            tone(450, .16, "triangle", .09);
        });

        toast(COLORS[e.button] + " ha aperto il paracadute");

        renderScores(Object.fromEntries(
            playerIds().map(p => [p, opened[p] ? (results[p].valid ? "APERT." : "PRESTO") : "—"])
        ));
    };

    g.dispose = () => {
        stopTimer();
        stopFallSound();
        speechSynthesis?.cancel(); // ferma la voce se esci durante la spiegazione
    };

    return g;
}

function makeDisturber() {
    const g = baseGame("disturber");

    // === File audio: modifica nomi e quantità come preferisci ===
    const BACKGROUND = "assets/sounds/disturbatore/background-voci.mp3";
    const TARGET_VOICES = [   // la voce da riconoscere (Marta)
        "assets/sounds/disturbatore/marta-1.mp3",
        //"assets/sounds/disturbatore/marta-2.mp3",
        //"assets/sounds/disturbatore/marta-3.mp3",
        //"assets/sounds/disturbatore/marta-4.mp3"
    ];
    const OTHER_VOICES = [    // le altre voci (da non premere)
        "assets/sounds/disturbatore/altra-1.mp3",
        "assets/sounds/disturbatore/altra-2.mp3",
        "assets/sounds/disturbatore/altra-3.mp3",
        "assets/sounds/disturbatore/altra-4.mp3",
        "assets/sounds/disturbatore/altra-5.mp3"
    ];
    const HIT_SOUND = "assets/sounds/disturbatore/centrato.mp3";
    const MISS_SOUND = "assets/sounds/disturbatore/sbagliato.mp3";

    let target = "MARTA", active = false, start = 0, points = {};
    let lastTarget = null, lastOther = null;

    // Sceglie un file a caso evitando di ripetere subito l'ultimo
    function pickRandom(list, last) {
        if (list.length === 1) return list[0];
        let choice;
        do {
            choice = list[Math.floor(Math.random() * list.length)];
        } while (choice === last);
        return choice;
    }

    g.start = () => {
        start = performance.now();
        points = Object.fromEntries(playerIds().map(p => [p, 0]));

        // Precarica tutto, così la prima riproduzione non ritarda
        [...TARGET_VOICES, ...OTHER_VOICES, HIT_SOUND, MISS_SOUND].forEach(loadSample);

        $("#game-status").textContent = "ASCOLTA IL BERSAGLIO";
        say("Premi quando senti Marta");
        setArena("🗣 Brusio…", "Premi quando senti MARTA");

        // Sottofondo di voci sempre attivo per tutta la partita
        startNatureAmbience(BACKGROUND, 0.12);

        schedule();
    };

    function endGame() {
        const order = playerIds().sort((a, b) => points[b] - points[a]);
        stopNatureAmbience();
        finish("Tempo scaduto! Vince " + COLORS[order[0]], order);
    }

    function schedule() {
        if (g.finished) return;
        if (performance.now() - start > 60000) {
            endGame();
            return;
        }

        active = false;
        setArena("🗣 Voci in sottofondo…", "Cerca la voce di " + target);

        later(() => {
            if (g.finished) return;
            const isTarget = Math.random() < .38;
            active = isTarget;

            setArena(
                isTarget ? "📣 " + target + "!" : "🗣 Un'altra voce",
                isTarget ? "ORA! Premi il tuo tasto" : "Non premere",
                isTarget ? "signal" : ""
            );

            if (isTarget) {
                lastTarget = pickRandom(TARGET_VOICES, lastTarget);
                playSample(lastTarget, () => tone(660, .22, "triangle", .07));
                later(() => {
                    active = false;
                    schedule();
                }, 750);
            } else {
                lastOther = pickRandom(OTHER_VOICES, lastOther);
                playSample(lastOther, () => tone(300, .22, "triangle", .07));
                later(schedule, 500);
            }
        }, 800 + Math.random() * 1300);
    }

    g.onInput = e => {
        if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;

        points[e.button] += active ? 1 : -1;
        scores[e.button] = points[e.button];
        renderScores();

        if (active) {
            playSample(HIT_SOUND, () => tone(850, .08, "triangle", .07));
            toast("+1 punto");
        } else {
            playSample(MISS_SOUND, () => tone(100, .2, "square", .07));
            toast("Fuori bersaglio: -1");
        }
    };

    g.dispose = () => {
        stopTimer();
        stopNatureAmbience();   // ferma il sottofondo uscendo dal gioco
    };

    return g;
}

    function makePot() {
        const g = baseGame("pot");
        let pot = 0, limit = 0, cashed = {}, start = 0, rate = 700;
        g.start = () => {
            pot = 0;
            limit = 15 + Math.floor(Math.random() * 16);
            cashed = {};
            start = performance.now();
            scores = Object.fromEntries(playerIds().map(p => [p, 0]));
            $("#game-status").textContent = "QUANTO RISCHIERAI?";
            setArena("🪙 0 gettoni", "Incassa quando vuoi… ma non aspettare troppo");
            renderScores();
            tick();
        };

        function tick() {
            if (g.finished) return;
            pot++;
            tone(500, .035, "sine", .025);
            if (pot > limit) {
                const order = playerIds().sort((a, b) => scores[b] - scores[a]);
                finish("💥 Limite superato! Vince " + COLORS[order[0]], order);
                return;
            }
            setArena("🪙 " + pot + " gettoni", "Il limite segreto è nascosto…");
            rate = Math.max(260, rate - 3);
            later(tick, rate);
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || cashed[e.button] || g.finished) return;
            cashed[e.button] = true;
            scores[e.button] = pot;
            renderScores();
            tone(720, .12, "sine", .1);
            toast(COLORS[e.button] + " incassa " + pot + " gettoni!");
            if (playerIds().every(p => cashed[p])) {
                const order = playerIds().sort((a, b) => scores[b] - scores[a]);
                finish("Piatto incassato!", order);
            }
        };
        return g;
    }

    function makeSimon() {
        const g = baseGame("simon", "turns");
        let sequence = [], turn = 0, round = 0, index = 0, showing = false, alive = [], maxRounds = 12;
        const tones = {P1: 330, P2: 392, P3: 494, P4: 262, C: 587};
        g.start = () => {
            sequence = [];
            turn = 0;
            round = 0;
            alive = playerIds();
            $("#game-status").textContent = "A TURNI";
            nextRound();
        };

        function nextRound() {
            if (g.finished) return;
            if (alive.length <= 1 || round >= maxRounds) {
                const order = [...alive, ...playerIds().filter(p => !alive.includes(p))];
                finish(alive.length ? "🏆 Vince " + COLORS[alive[0]] : "Simon terminato", order);
                return;
            }
            round++;
            sequence.push(Object.keys(tones)[Math.floor(Math.random() * 5)]);
            turn = turn % alive.length;
            index = 0;
            showing = true;
            $("#game-status").textContent = "ROUND " + round + " · " + COLORS[alive[turn]].toUpperCase();
            setArena("🎵 Ascolta la sequenza", "Turno di " + COLORS[alive[turn]]);
            playSequence(0);
        }

        function playSequence(i) {
            if (g.finished) return;
            if (i >= sequence.length) {
                showing = false;
                index = 0;
                setArena("Tocca a " + COLORS[alive[turn]], "Ripeti " + sequence.length + " tasti");
                return;
            }
            const id = sequence[i];
            tone(tones[id], .24, "sine", .12);
            buttons.find(b => b.dataset.button === id)?.classList.add("pressed");
            later(() => {
                buttons.find(b => b.dataset.button === id)?.classList.remove("pressed");
                later(() => playSequence(i + 1), 180);
            }, 320);
        }

        g.onInput = e => {
            if (e.type !== "down" || !alive.includes(alive[turn]) || showing || g.finished) return;
            const id = e.button;
            if (sequence[index] === id) {
                index++;
                if (index === sequence.length) {
                    scores[alive[turn]] = (scores[alive[turn]] || 0) + 1;
                    renderScores();
                    $("#simon-feedback").textContent = "Corretto!";
                    tone(780, .1);
                    turn = (turn + 1) % alive.length;
                    later(nextRound, 700);
                }
            } else {
                const out = alive[turn];
                alive = alive.filter(p => p !== out);
                $("#simon-feedback").textContent = COLORS[out] + " eliminato";
                noise(.25, .05);
                if (alive.length <= 1) later(nextRound, 800); else {
                    turn = turn % alive.length;
                    later(nextRound, 800);
                }
            }
        };
        return g;
    }

function makeMosquito() {
    const g = baseGame("mosquito");

    // === File audio ===
    const BUZZ = "assets/sounds/zanzara/ronzio.mp3";       // ronzio a volume costante, in loop
    const CATCH_SOUND = "assets/sounds/zanzara/presa.mp3"; // zanzara catturata
    const MISS_SOUND = "assets/sounds/zanzara/mancata.mp3"; // premuto troppo presto

    // === Parametri di gioco ===
    const THRESHOLD = 0.7;     // livello (0-1) oltre il quale si può catturare
    const MAX_GAIN = 0.6;      // volume massimo reale del ronzio
    const WIN_POINTS = 3;      // punti per vincere
    const DURATION = 90000;    // durata massima partita (ms)
    const HIDE_TIME = 1500;    // dopo una cattura la zanzara si allontana per un po'

    let level = 0, target = 0, nextChange = 0;
    let started = 0, graceUntil = 0, hideUntil = 0;
    let blocked = {}, interval = null;
    let src = null, gain = null;

    async function startBuzz() {
        const buffer = await loadSample(BUZZ);
        if (game !== g) return false; // uscito nel frattempo

        const ctx = ensureAudio();
        gain = ctx.createGain();
        gain.gain.value = 0;

        if (buffer) {
            src = ctx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;
        } else {
            // Fallback sintetico se il file manca
            src = ctx.createOscillator();
            src.type = "sawtooth";
            src.frequency.value = 380;
        }

        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
        return true;
    }

    function stopBuzz() {
        if (src) {
            try { src.stop(); } catch (e) {}
            src.disconnect();
            src = null;
        }
        if (gain) {
            gain.disconnect();
            gain = null;
        }
    }

    // Sceglie il prossimo livello: spesso lontana, ogni tanto vicinissima
    function pickTarget() {
        return Math.random() < .4
            ? .75 + Math.random() * .25   // vicina (sopra soglia)
            : Math.random() * .5;         // lontana
    }

    function tick() {
        if (!gain) return;

        // In pausa o a fine partita: silenzio
        if (paused || g.finished) {
            gain.gain.value = 0;
            return;
        }

        const now = performance.now();

        if (now - started >= DURATION) {
            endByTime();
            return;
        }

        if (now < hideUntil) {
            target = .05;               // zanzara scappata
        } else if (now >= nextChange) {
            target = pickTarget();
            nextChange = now + 500 + Math.random() * 1500;
        }

        // Movimento morbido verso il livello obiettivo
        level += (target - level) * .12;

        // Curva quadratica: la differenza vicino/lontano si sente di più
        const volume = soundEnabled ? MAX_GAIN * level * level : 0;
        gain.gain.setTargetAtTime(volume, ensureAudio().currentTime, .03);
    }

    function ranking() {
        return playerIds().sort((a, b) => scores[b] - scores[a]);
    }

    function endByTime() {
        const order = ranking();
        stopBuzz();
        stopInterval();
        finish("Tempo scaduto! Vince " + COLORS[order[0]], order);
    }

    function stopInterval() {
        if (interval !== null) {
            clearInterval(interval);
            interval = null;
        }
    }

    g.start = async () => {
        blocked = {};
        level = 0;
        target = 0;
        nextChange = 0;
        hideUntil = 0;
        graceUntil = 0;

        // Precarica i suoni
        [BUZZ, CATCH_SOUND, MISS_SOUND].forEach(loadSample);

        $("#game-status").textContent = "ASCOLTA IL RONZIO";
        setArena("🦟 Ascolta…", "Premi quando il ronzio è fortissimo");
        say("Prendi la zanzara");

        const ok = await startBuzz();
        if (!ok) return;

        started = performance.now();
        interval = setInterval(tick, 50);
    };

    g.onInput = e => {
        if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;

        const id = e.button;
        const now = performance.now();

        if (blocked[id] > now) return;

        // Poco dopo una cattura: chi arriva tardi non viene punito
        if (now < graceUntil) return;

        if (level >= THRESHOLD && now >= hideUntil) {
            // Catturata!
            scores[id]++;
            renderScores();

            playSample(CATCH_SOUND, () => tone(880, .14, "sine", .1));
            toast(COLORS[id] + " prende la zanzara!");

            // La zanzara scappa
            level = .05;
            hideUntil = now + HIDE_TIME;
            graceUntil = now + 400;

            if (scores[id] >= WIN_POINTS) {
                stopBuzz();
                stopInterval();
                finish("🦟 " + COLORS[id] + " vince!", ranking());
            }
        } else {
            // Troppo presto: la zanzara era lontana
            scores[id]--;
            renderScores();
            blocked[id] = now + 1000;

            playSample(MISS_SOUND, () => tone(110, .22, "square", .08));
            toast("Troppo presto! " + COLORS[id] + " perde un punto");
        }
    };

    g.resume = () => {
        setArena("🦟 Ascolta…", "Premi quando il ronzio è fortissimo");
    };

    g.dispose = () => {
        stopTimer();
        stopInterval();
        stopBuzz();
    };

    return g;
}

function makeMine() {
    const g = baseGame("mine");

    // === File audio ===
    const BACKGROUND = "assets/sounds/miniera/picconi.mp3";   // picconi, in loop
    const CANARY_SONGS = [                                    // canti del canarino (a caso)
        "assets/sounds/miniera/canarino-1.mp3",
        "assets/sounds/miniera/canarino-2.mp3",
        "assets/sounds/miniera/canarino-3.mp3",
        "assets/sounds/miniera/canarino-4.mp3"
    ];
    const STEPS_SOUND = "assets/sounds/miniera/passi.mp3";    // passi che corrono e si allontanano
    const PAIN_SOUND = "assets/sounds/miniera/grido.mp3";     // grido di dolore

    // === Parametri ===
    const BACKGROUND_VOLUME = 0.12;
    const MIN_GAP = 1000;          // pausa minima tra due canti (ms)
    const MAX_GAP = 9000;          // pausa massima (sotto i 10 s)
    const DEAD_SILENCE = 10000;    // silenzio oltre il quale il canarino è morto
    const REACTION_WINDOW = 2000;  // tempo per uscire dopo la morte
    const MIN_SONGS = 2;           // canti minimi prima che possa morire
    const MAX_SONGS = 8;           // al più tardi muore dopo questo canto
    const DEATH_CHANCE = .2;       // probabilità di morte dopo ogni canto

    let phase = "intro";           // intro | alive | window | over
    let clock = 0, lastTick = 0, interval = null;
    let nextSongAt = 0, songs = 0, canaryDead = false, deadMark = 0, windowEnd = 0;
    let lastSong = null;
    let status = {}, pressTime = {}, fleeTime = {}, fled = new Set();
    const buffers = new Map();

    function pickRandom(list, last) {
        if (list.length === 1) return list[0];
        let choice;
        do {
            choice = list[Math.floor(Math.random() * list.length)];
        } while (choice === last);
        return choice;
    }

    function stopInterval() {
        if (interval !== null) {
            clearInterval(interval);
            interval = null;
        }
    }

    // Riproduce un canto e restituisce la sua durata in ms
    function singCanary() {
        lastSong = pickRandom(CANARY_SONGS, lastSong);
        const buffer = buffers.get(lastSong);
        if (buffer) {
            const ctx = ensureAudio();
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start();
            return buffer.duration * 1000;
        }
        // Fallback sintetico se il file manca
        tone(1800, .12, "sine", .06);
        tone(2200, .12, "sine", .06, .18);
        return 450;
    }

    g.start = async () => {
        phase = "intro";
        clock = 0;
        songs = 0;
        canaryDead = false;
        lastSong = null;
        status = Object.fromEntries(playerIds().map(p => [p, "—"]));
        pressTime = {};
        fleeTime = {};
        fled = new Set();

        $("#game-status").textContent = "PREPARATI";
        setArena("⛏ Preparati…", "Ascolta le istruzioni");
        renderScores(status);

        // Precarica tutti i suoni mentre la voce parla
        const preload = Promise.all([
            ...CANARY_SONGS.map(async p => buffers.set(p, await loadSample(p))),
            loadSample(BACKGROUND),
            loadSample(STEPS_SOUND),
            loadSample(PAIN_SOUND)
        ]);

        await sayAsync("In miniera. Se il canarino smette di cantare, esci entro due secondi. Ma non scappare troppo presto!");
        await preload;
        if (game !== g) return;

        await startNatureAmbience(BACKGROUND, BACKGROUND_VOLUME);
        if (game !== g) return;

        $("#game-status").textContent = "IN MINIERA";
        setArena("⛏ In ascolto…", "Il canarino canta ancora?");

        phase = "alive";
        lastTick = performance.now();
        nextSongAt = 1500 + Math.random() * 1500;
        interval = setInterval(tick, 50);
    };

    // Il tempo di gioco avanza solo quando non è in pausa
    function tick() {
        const now = performance.now();
        const dt = now - lastTick;
        lastTick = now;

        if (paused) {
            setNatureVolume(0);
            return;
        }
        if (g.finished || phase === "over") return;

        clock += dt;

        if (phase === "alive") {
            if (!canaryDead && clock >= nextSongAt) {
                const duration = singCanary();
                songs++;
                const songEnd = clock + duration;

                if (songs >= MAX_SONGS || (songs >= MIN_SONGS && Math.random() < DEATH_CHANCE)) {
                    // Questo è l'ultimo canto: poi silenzio
                    canaryDead = true;
                    deadMark = songEnd + DEAD_SILENCE;
                } else {
                    nextSongAt = songEnd + MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
                }
            } else if (canaryDead && clock >= deadMark) {
                // 10 secondi di silenzio: il canarino è morto, parte la finestra
                phase = "window";
                windowEnd = deadMark + REACTION_WINDOW;
            }
        } else if (phase === "window" && clock >= windowEnd) {
            resolve();
        }
    }

    async function resolve() {
        if (phase === "over") return;
        phase = "over";
        stopInterval();
        stopNatureAmbience();

        const ids = playerIds();

        // 1. Usciti nella finestra: vince chi è uscito per ultimo
        const safe = ids
            .filter(p => pressTime[p] !== undefined)
            .sort((a, b) => pressTime[b] - pressTime[a]);

        // 2. Fuggiti troppo presto: salvi, ma perdono contro chi ha aspettato.
        //    Tra loro è meglio chi è scappato più tardi.
        const early = ids
            .filter(p => fled.has(p))
            .sort((a, b) => fleeTime[b] - fleeTime[a]);

        // 3. Chi non ha premuto entro 2 secondi: morto
        const late = ids.filter(p => !fled.has(p) && pressTime[p] === undefined);

        late.forEach(p => status[p] = "TARDI");
        renderScores(status);

        const order = [...safe, ...early, ...late];

        // announce = false: la voce parla dopo il grido
        if (order.length === late.length) {
            // nessuno salvo (né nella finestra né fuggendo)
            finish("💀 Nessuno si è salvato!", null, false);
        } else if (safe.length) {
            finish("⛏ " + COLORS[order[0]] + " è l'ultimo a uscire: vince!", order, false);
        } else {
            // nessuno ha aspettato: vince chi è fuggito più tardi
            finish("🏃 " + COLORS[order[0]] + " è fuggito per ultimo: vince!", order, false);
        }

        // Prima il grido di dolore, poi la voce
        if (late.length) {
            await playSampleWait(PAIN_SOUND, () => {
                tone(300, .35, "sawtooth", .12);
                tone(180, .4, "sawtooth", .1, .15);
            });
        }
        if (game !== g) return;
        if (order.length > late.length) say("Vince " + COLORS[order[0]]);
    }

    g.onInput = e => {
        if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;
        if (phase !== "alive" && phase !== "window") return;

        const id = e.button;
        if (fled.has(id) || pressTime[id] !== undefined) return;

        // Tempo di gioco preciso della pressione
        const t = clock + (performance.now() - lastTick);

        if (phase === "alive") {
            // Troppo presto: il canarino non è ancora morto, il giocatore scappa
            fled.add(id);
            fleeTime[id] = t;
            status[id] = "FUGGITO";
            renderScores(status);

            playSample(STEPS_SOUND, () => {
                for (let i = 0; i < 6; i++) {
                    tone(160 - i * 12, .05, "square", .06 - i * .008, i * .13);
                }
            });
            toast(COLORS[id] + " scappa troppo presto!");

            // Se scappano tutti, non serve aspettare la morte del canarino
            if (fled.size === playerIds().length) resolve();
            return;
        }

        // Finestra di 2 secondi aperta
        if (t > windowEnd) return;   // troppo tardi: lo gestisce tick()

        pressTime[id] = t;
        status[id] = "SALVO";
        renderScores(status);
        tone(720, .1, "sine", .1);
        toast(COLORS[id] + " è uscito in tempo");

        // Se tutti quelli rimasti sono usciti, si chiude subito
        const remaining = playerIds().filter(p => !fled.has(p));
        if (remaining.every(p => pressTime[p] !== undefined)) resolve();
    };

    g.resume = () => {
        setNatureVolume(BACKGROUND_VOLUME);
        setArena("⛏ In ascolto…", "Il canarino canta ancora?");
    };

    g.dispose = () => {
        stopTimer();
        stopInterval();
        stopNatureAmbience();
        speechSynthesis?.cancel();
    };

    return g;
}

function makeFreeze() {
    const g = baseGame("freeze");

    // === File audio ===
    const DIR = "assets/sounds/unoduetre/";
    const WORDS = [DIR + "uno.mp3", DIR + "due.mp3", DIR + "tre.mp3", DIR + "stai-la.mp3"];
    const LABELS = ["UNO…", "DUE…", "TRE…", "STAI LÀ!"];
    const STEP_SOUND = DIR + "passi.mp3";          // un breve suono di passi
    const DQ_SOUND = DIR + "squalificato.mp3";     // squalifica
    const FALLBACK_FREQ = [330, 392, 494, 150];    // toni sintetici se manca un file

    // === Parametri ===
    const TARGET = 30;              // passi necessari per vincere
    const WORD_GAP = [250, 1600];   // pausa casuale tra una parola e l'altra (ms)
    const BLOCK_GAP = [1500, 4000]; // pausa casuale dopo "stai là!", prima di ricominciare (ms)
    const GRACE = 250;              // dopo l'inizio di "stai là!" il tempo di reazione è tollerato (ms)
    const MIN_VOL = 0.08;           // volume dei passi al primo passo
    const MAX_VOL = 1.0;            // volume dei passi al traguardo
    const PITCH = {P1: 1.0, P2: 0.88, P3: 1.12, P4: 0.78}; // passi diversi per giocatore

    let phase = "intro";            // intro | run
    let step = 0, frozen = false, freezeStart = 0;
    let counts = {}, dq = new Set();
    const buffers = new Map();

    const rand = ([min, max]) => min + Math.random() * (max - min);

    // Riproduce un buffer con volume e velocità, rispettando il pulsante audio
    function playBuffer(buffer, volume = 1, rate = 1) {
        const ctx = ensureAudio();
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        source.playbackRate.value = rate;
        gain.gain.value = soundEnabled ? volume : 0;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
    }

    // Riproduce una parola e restituisce la sua durata in ms
    function playWord(i) {
        const buffer = buffers.get(WORDS[i]);
        if (buffer) {
            playBuffer(buffer, 1);
            return buffer.duration * 1000;
        }
        tone(FALLBACK_FREQ[i], i === 3 ? .5 : .3, i === 3 ? "sawtooth" : "triangle", .12);
        return i === 3 ? 600 : 400;
    }

    // Un passo del giocatore: il volume cresce con i passi fatti
    function playStepSound(id) {
        const progress = Math.min(1, counts[id] / TARGET);
        const volume = MIN_VOL + (MAX_VOL - MIN_VOL) * progress;
        const buffer = buffers.get(STEP_SOUND);
        if (buffer) {
            playBuffer(buffer, volume, PITCH[id] || 1);
        } else {
            tone(140 * (PITCH[id] || 1), .05, "square", volume * .12);
        }
    }

    // Suono di squalifica: restituisce una Promise che si risolve a fine suono
    function playDq() {
        const buffer = buffers.get(DQ_SOUND);
        if (buffer) {
            return new Promise(resolve => {
                const ctx = ensureAudio();
                const source = ctx.createBufferSource();
                const gain = ctx.createGain();
                source.buffer = buffer;
                gain.gain.value = soundEnabled ? 1 : 0;
                source.connect(gain);
                gain.connect(ctx.destination);
                source.onended = resolve;
                source.start();
            });
        }
        tone(300, .3, "sawtooth", .12);
        tone(150, .4, "sawtooth", .12, .25);
        return new Promise(resolve => setTimeout(resolve, 700));
    }

    function display() {
        renderScores(Object.fromEntries(
            playerIds().map(p => [p, dq.has(p) ? "OUT" : counts[p]])
        ));
    }

    function ranking() {
        return playerIds().sort((a, b) =>
            (dq.has(a) - dq.has(b)) || (counts[b] - counts[a])
        );
    }

    g.start = async () => {
        phase = "intro";
        step = 0;
        frozen = false;
        counts = Object.fromEntries(playerIds().map(p => [p, 0]));
        dq = new Set();

        $("#game-status").textContent = "PREPARATI";
        setArena("🚦 Preparati…", "Ascolta le istruzioni");
        display();

        // Precarica tutto mentre la voce spiega
        const preload = Promise.all(
            [...WORDS, STEP_SOUND, DQ_SOUND].map(async p => buffers.set(p, await loadSample(p)))
        );

        await sayAsync("Uno, due, tre, stai là! Premi il più possibile, ma quando senti stai là, fermati!");
        await preload;
        if (game !== g) return;

        $("#game-status").textContent = "UNO, DUE, TRE…";
        setArena("🚦 Si parte!", "Premi il tuo tasto più veloce che puoi");
        phase = "run";
        if (!paused) later(playStep, 800);
    };

    function playStep() {
        if (g.finished) return;

        if (step === 0) frozen = false;   // riparte la corsa

        const duration = playWord(step);

        if (step === 3) {
            // STAI LÀ! Da qui chi preme (dopo la tolleranza) è fuori
            frozen = true;
            freezeStart = performance.now();
            $("#game-status").textContent = "FERMI!";
            setArena("🛑 STAI LÀ!", "Fermi! Chi preme è squalificato", "signal");
            step = 0;
            later(playStep, duration + rand(BLOCK_GAP));
        } else {
            $("#game-status").textContent = "CORRI!";
            setArena("🏃 " + LABELS[step], "Premi il tuo tasto! Obiettivo: " + TARGET + " passi");
            step++;
            later(playStep, duration + rand(WORD_GAP));
        }
    }

    async function disqualify(id) {
        dq.add(id);
        display();
        toast("Squalificato: " + COLORS[id]);
        const dqSound = playDq();

        const active = playerIds().filter(p => !dq.has(p));

        if (active.length === 0) {
            finish("🛑 Squalificati tutti! Nessun vincitore", null, false);
            await dqSound;
            return;
        }

        if (playerIds().length > 1 && active.length === 1) {
            // Resta un solo giocatore in gara: vince
            const order = ranking();
            finish("🏆 " + COLORS[active[0]] + " è l'ultimo in gara: vince!", order, false);
            await dqSound;
            if (game !== g) return;
            say("Vince " + COLORS[active[0]]);
        }
    }

    g.onInput = e => {
        if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;
        if (phase !== "run") return;

        const id = e.button;
        if (dq.has(id)) return;

        // Dopo "stai là!" (superata la tolleranza) premere è vietato
        if (frozen && performance.now() >= freezeStart + GRACE) {
            disqualify(id);
            return;
        }

        counts[id]++;
        playStepSound(id);
        display();

        if (counts[id] >= TARGET) {
            finish("🏁 " + COLORS[id] + " vince con " + counts[id] + " passi!", ranking());
        }
    };

    g.resume = () => {
        if (frozen) freezeStart = performance.now();   // nuova tolleranza dopo la pausa
        setArena("🚦 Si riparte!", "Aspetta che ricominci…");
        if (phase === "run") later(playStep, 800);
    };

    g.dispose = () => {
        stopTimer();
        speechSynthesis?.cancel();
    };

    return g;
}

function makeRestaurant() {
    const g = baseGame("restaurant");

    // === File audio ===
    const DIR = "assets/sounds/ristorante/";
    // name = testo letto dalla voce sintetica se manca il file; file = registrazione del ristoratore
    const EDIBLE = [
        {name: "Lasagne al forno", file: DIR + "lasagne.mp3"},
        {name: "Pizza margherita", file: DIR + "pizza.mp3"},
        {name: "Tiramisù", file: DIR + "tiramisu.mp3"},
        {name: "Spaghetti al pomodoro", file: DIR + "spaghetti-pomodoro.mp3"},
        {name: "Cotoletta con patatine", file: DIR + "cotoletta.mp3"},
        {name: "Gelato al cioccolato", file: DIR + "gelato-cioccolato.mp3"}
    ];
    const INEDIBLE = [
        {name: "Riso alla cacca", file: DIR + "riso-cacca.mp3"},
        {name: "Involtini di vomito", file: DIR + "involtini-vomito.mp3"},
        {name: "Zuppa di calzini sporchi", file: DIR + "zuppa-calzini.mp3"},
        {name: "Spaghetti ai capelli", file: DIR + "spaghetti-capelli.mp3"},
        {name: "Bistecca di scarpa", file: DIR + "bistecca-scarpa.mp3"},
        {name: "Gelato al moccio", file: DIR + "gelato-moccio.mp3"}
    ];
    const CLAIM_SOUND = DIR + "prenotato.mp3";    // piatto buono aggiudicato
    const PENALTY_SOUND = DIR + "bleah.mp3";      // penitenza: schifo / conati

    // === Parametri ===
    const WIN_POINTS = 5;            // punti per vincere
    const MAX_DISHES = 18;           // piatti serviti al massimo
    const INEDIBLE_CHANCE = .4;      // probabilità di un piatto immangiabile
    const GAP = [1200, 2800];        // pausa casuale tra un piatto e l'altro (ms)
    const CLAIM_AFTER = 1800;        // tempo per prenotare dopo la fine della frase (ms)
    const PENALTY_BLOCK = 2000;      // blocco del giocatore penalizzato (ms)
    const EARLY_BLOCK = 1000;        // blocco se si preme quando non c'è nessun piatto (ms)

    let served = 0, open = false, claimed = false, current = null, last = null;
    let blocked = {};
    const buffers = new Map();

    const rand = ([min, max]) => min + Math.random() * (max - min);

    function pickDish() {
        const list = Math.random() < INEDIBLE_CHANCE ? INEDIBLE : EDIBLE;
        let dish;
        do {
            dish = list[Math.floor(Math.random() * list.length)];
        } while (dish === last && list.length > 1);
        return dish;
    }

    // Annuncia il piatto e restituisce la durata in ms
    function announce(dish) {
        const buffer = buffers.get(dish.file);
        if (buffer) {
            const ctx = ensureAudio();
            const source = ctx.createBufferSource();
            const gain = ctx.createGain();
            source.buffer = buffer;
            gain.gain.value = soundEnabled ? 1 : 0;
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start();
            return buffer.duration * 1000;
        }
        // Fallback: voce sintetica
        say(dish.name);
        return 500 + dish.name.length * 75;
    }

    function ranking() {
        return playerIds().sort((a, b) => scores[b] - scores[a]);
    }

    g.start = async () => {
        served = 0;
        open = false;
        claimed = false;
        current = null;
        last = null;
        blocked = {};
        scores = Object.fromEntries(playerIds().map(p => [p, 0]));

        $("#game-status").textContent = "BENVENUTI";
        setArena("🍽 Benvenuti al ristorante…", "Ascolta le istruzioni");
        renderScores();

        // Precarica tutto mentre la voce spiega
        const preload = Promise.all(
            [...EDIBLE, ...INEDIBLE].map(async d => buffers.set(d.file, await loadSample(d.file)))
                .concat([loadSample(CLAIM_SOUND), loadSample(PENALTY_SOUND)])
        );

        await sayAsync("Benvenuti al ristorante! Prenota i piatti buoni premendo per primo. Ma attenzione ai piatti immangiabili!");
        await preload;
        if (game !== g) return;

        nextDish();
    };

    function nextDish() {
        if (g.finished) return;

        if (served >= MAX_DISHES) {
            endByDishes();
            return;
        }

        open = false;
        current = null;
        $("#game-status").textContent = "IL MENÙ";
        setArena("👨‍🍳 Il ristoratore pensa…", "Aspetta il prossimo piatto");
        later(serve, rand(GAP));
    }

    function serve() {
        if (g.finished) return;

        current = pickDish();
        last = current;
        claimed = false;
        served++;
        open = true;

        $("#game-status").textContent = "PIATTO " + served + " / " + MAX_DISHES;
        setArena("🔊 Ascolta il piatto…", "Prenota solo se è buono!");

        const duration = announce(current);
        later(closeDish, duration + CLAIM_AFTER);
    }

    // Chiude il piatto e ne rivela il nome
    function closeDish() {
        if (g.finished) return;
        open = false;

        const dish = current;
        const edible = EDIBLE.includes(dish);
        let info;
        if (edible) info = claimed ? "Prenotato!" : "Nessuno l'ha prenotato";
        else info = "Immangiabile";

        setArena((edible ? "😋 " : "🤢 ") + dish.name, info, edible ? "" : "signal");
        later(nextDish, 1400);
    }

    function endByDishes() {
        const order = ranking();
        const tie = order.length > 1 && scores[order[0]] === scores[order[1]];
        finish(
            tie ? "Menù finito! Pareggio" : "🍽 Menù finito! Vince " + COLORS[order[0]],
            tie ? null : order
        );
    }

    g.onInput = e => {
        if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;
        if (!game || (!open && !current && served === 0)) return;   // durante la spiegazione

        const id = e.button;
        const now = performance.now();
        if (blocked[id] > now) return;

        // Nessun piatto in corso: premere a vuoto blocca il giocatore
        if (!open) {
            blocked[id] = now + EARLY_BLOCK;
            toast(COLORS[id] + " ha premuto a vuoto!");
            return;
        }

        const edible = EDIBLE.includes(current);

        if (edible) {
            if (claimed) return;   // piatto già prenotato: chi arriva dopo non viene punito
            claimed = true;
            scores[id]++;
            renderScores();
            playSample(CLAIM_SOUND, () => tone(880, .14, "sine", .1));
            toast(COLORS[id] + " prenota: " + current.name + "!");

            if (scores[id] >= WIN_POINTS) {
                finish("🍽 " + COLORS[id] + " vince!", ranking());
                return;
            }
            // Piatto assegnato: si passa subito a rivelare e al prossimo
            later(closeDish, 500);
        } else {
            // Penitenza
            scores[id]--;
            renderScores();
            blocked[id] = now + PENALTY_BLOCK;
            playSample(PENALTY_SOUND, () => {
                tone(200, .3, "sawtooth", .1);
                tone(120, .4, "sawtooth", .1, .2);
            });
            toast("🤢 Penitenza! " + COLORS[id] + " ha prenotato un piatto immangiabile");
        }
    };

    g.resume = () => {
        open = false;
        setArena("🍽 Si riparte!", "Aspetta il prossimo piatto");
        later(nextDish, 800);
    };

    g.dispose = () => {
        stopTimer();
        speechSynthesis?.cancel();
    };

    return g;
}

function makeGrinder() {
    const g = baseGame("grinder");

    // === File audio ===
    const DIR = "assets/sounds/mola/";
    const GRINDER = DIR + "mola.mp3";
    const WOOD_END = DIR + "legno-finito.mp3";
    const SCREAM = DIR + "grido.mp3";

    // === Parametri ===
    const WOODS = 5;
    const WOOD_LENGTH = [4000, 8000];
    const REACTION = 700;
    const GRINDER_VOLUME = 0.5;

    // Velocità di taglio per giocatore aggiuntivo
    const CUT_SPEED_PER_PLAYER = 0.65;

    // Incremento del tono audio per giocatore aggiuntivo
    const GRINDER_RATE_PER_PLAYER = 0.16;

    // Limite massimo della velocità audio
    const GRINDER_MAX_RATE = 1.8;

    // Transizione graduale del tono (secondi)
    const GRINDER_RAMP = 0.08;

    let phase = "intro";
    let woodNo = 1;
    let progress = 0;
    let woodLength = 0;
    let endClock = 0;

    let lastTick = 0;
    let lastRender = 0;
    let interval = null;

    let pressing = new Set();
    let mustRelease = new Set();

    let total = {};
    let out = new Set();
    let outOrder = [];

    let grinderSrc = null;
    let grinderGain = null;
    let grinderPlayers = 0;

    const buffers = new Map();

    const rand = ([min, max]) =>
        min + Math.random() * (max - min);

    const activePressing = () =>
        [...pressing].filter(p => !out.has(p));

    // === Interrompe il timer ===
    function stopInterval() {
        if (interval !== null) {
            clearInterval(interval);
            interval = null;
        }
    }

    // === Calcola la velocità della mola ===
    function grinderRate(playerCount) {
        return Math.min(
            GRINDER_MAX_RATE,
            1 + Math.max(0, playerCount - 1) *
                GRINDER_RATE_PER_PLAYER
        );
    }

    // === Suono della mola ===
    function startGrinder(playerCount) {
        if (playerCount <= 0) return;

        const ctx = ensureAudio();

        // Se la mola è già attiva, aggiorna gradualmente
        // il tono in base al numero di giocatori.
        if (grinderSrc) {
            if (playerCount !== grinderPlayers) {
                grinderPlayers = playerCount;

                const rate = grinderRate(playerCount);

                grinderSrc.playbackRate.setTargetAtTime(
                    rate,
                    ctx.currentTime,
                    GRINDER_RAMP
                );
            }

            // Aggiorna il volume se l'audio è stato abilitato
            // o disabilitato durante la partita.
            if (grinderGain) {
                grinderGain.gain.setTargetAtTime(
                    soundEnabled ? GRINDER_VOLUME : 0,
                    ctx.currentTime,
                    0.02
                );
            }

            return;
        }

        grinderPlayers = playerCount;

        grinderGain = ctx.createGain();
        grinderGain.gain.value =
            soundEnabled ? GRINDER_VOLUME : 0;

        const buffer = buffers.get(GRINDER);

        grinderSrc = ctx.createBufferSource();

        grinderSrc.playbackRate.value =
            grinderRate(playerCount);

        let outputNode = grinderSrc;

        if (buffer) {
            // Audio reale della mola
            grinderSrc.buffer = buffer;
            grinderSrc.loop = true;

            // Parte da un punto casuale del campione
            const offset = Math.random() * buffer.duration;

            grinderSrc.connect(grinderGain);
            grinderGain.connect(ctx.destination);

            grinderSrc.start(0, offset);
        } else {
            // Fallback sintetico: rumore filtrato
            const noiseBuffer = ctx.createBuffer(
                1,
                ctx.sampleRate,
                ctx.sampleRate
            );

            const data = noiseBuffer.getChannelData(0);

            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            grinderSrc.buffer = noiseBuffer;
            grinderSrc.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = 2500;
            filter.Q.value = 0.8;

            grinderSrc.connect(filter);
            outputNode = filter;

            outputNode.connect(grinderGain);
            grinderGain.connect(ctx.destination);

            grinderSrc.start();
        }
    }

    // === Ferma la mola ===
    function stopGrinder() {
        if (!grinderSrc) return;

        const src = grinderSrc;
        const gain = grinderGain;

        grinderSrc = null;
        grinderGain = null;
        grinderPlayers = 0;

        try {
            const ctx = ensureAudio();

            gain.gain.setTargetAtTime(
                0,
                ctx.currentTime,
                0.02
            );

            src.stop(ctx.currentTime + 0.1);
        } catch (e) {}

        setTimeout(() => {
            try {
                src.disconnect();
                gain.disconnect();
            } catch (e) {}
        }, 250);
    }

    // === Classifica in tempo reale ===
    function render() {
        renderScores(
            Object.fromEntries(
                playerIds().map(p => [
                    p,
                    out.has(p)
                        ? "OUT"
                        : (total[p] / 1000).toFixed(1) + "s"
                ])
            )
        );
    }

    // === Prepara un nuovo legno ===
    function newWood() {
        progress = 0;
        woodLength = rand(WOOD_LENGTH);
        phase = "wood";

        $("#game-status").textContent =
            "LEGNO " + woodNo + " / " + WOODS;

        setArena(
            "🪵 Legno pronto",
            "Tieni premuto per spingerlo contro la mola"
        );
    }

    // === Avvio della partita ===
    g.start = async () => {
        stopInterval();
        stopGrinder();

        phase = "intro";
        woodNo = 1;
        progress = 0;
        woodLength = 0;
        endClock = 0;

        pressing = new Set();
        mustRelease = new Set();
        out = new Set();
        outOrder = [];

        total = Object.fromEntries(
            playerIds().map(p => [p, 0])
        );

        $("#game-status").textContent = "PREPARATI";

        setArena(
            "🪚 Preparati…",
            "Ascolta le istruzioni"
        );

        render();

        // Precarica i suoni mentre parla la voce
        const preload = Promise.all(
            [GRINDER, WOOD_END, SCREAM].map(async p => {
                buffers.set(p, await loadSample(p));
            })
        );

        await sayAsync(
            "Mola a disco. Tieni premuto per spingere il legno. " +
            "Quando il suono finisce, lascia subito il tasto, " +
            "o perdi la mano!"
        );

        await preload;

        if (game !== g || g.finished) return;

        lastTick = performance.now();

        newWood();

        interval = setInterval(tick, 50);
    };

    // === Ciclo di gioco ===
    function tick() {
        const now = performance.now();

        const dt = Math.min(now - lastTick, 200);
        lastTick = now;

        if (g.finished) return;

        if (paused) {
            stopGrinder();
            return;
        }

        if (phase === "wood") {
            const active = activePressing();

            if (active.length > 0) {
                // Più giocatori premono, più il taglio accelera.
                const cutSpeed =
                    1 + (active.length - 1) *
                    CUT_SPEED_PER_PLAYER;

                progress += dt * cutSpeed;

                // Ogni giocatore accumula il tempo reale
                // per cui mantiene premuto il proprio tasto.
                active.forEach(p => {
                    total[p] += dt;
                });

                // La mola si adatta al numero di giocatori.
                startGrinder(active.length);

                if (progress >= woodLength) {
                    endWood(active);
                }
            } else {
                stopGrinder();
            }
        } else if (phase === "ending") {
            endClock += dt;

            if (endClock >= REACTION) {
                judge();
            }
        }

        if (now - lastRender > 100) {
            lastRender = now;
            render();
        }
    }

    // === Il legno è stato tagliato ===
    function endWood(active) {
        stopGrinder();

        phase = "ending";
        endClock = 0;

        // Chi preme in questo momento deve rilasciare.
        mustRelease = new Set(active);

        playSample(WOOD_END, () => {
            noise(0.2, 0.1);
            tone(120, 0.2, "triangle", 0.1);
        });

        setArena(
            "🪵 Legno finito!",
            "Lascia il tasto!",
            "signal"
        );
    }

    // === Verifica chi ha lasciato il tasto in tempo ===
    async function judge() {
        phase = "judging";

        const caught = [...mustRelease].filter(
            p => pressing.has(p)
        );

        mustRelease.clear();

        if (caught.length > 0) {
            caught.forEach(p => {
                out.add(p);
                outOrder.push(p);
                pressing.delete(p);
            });

            render();

            setArena(
                "🩸 AAAAH!",
                caught.map(p => COLORS[p]).join(", ") +
                    (
                        caught.length > 1
                            ? " hanno perso la mano!"
                            : " ha perso la mano!"
                    ),
                "signal"
            );

            await playSampleWait(SCREAM, () => {
                tone(900, 0.5, "sawtooth", 0.12);
                tone(1300, 0.4, "sawtooth", 0.12, 0.15);
            });

            if (game !== g || g.finished) return;
        }

        woodNo++;

        const alive = playerIds().filter(
            p => !out.has(p)
        );

        if (
            woodNo > WOODS ||
            (playerIds().length > 1 && alive.length <= 1)
        ) {
            conclude(alive);
            return;
        }

        newWood();
    }

    // === Fine partita e classifica ===
    function conclude(alive) {
        stopInterval();
        stopGrinder();
        render();

        const survivors = [...alive].sort(
            (a, b) => total[b] - total[a]
        );

        const order = [
            ...survivors,
            ...[...outOrder].reverse()
        ];

        if (!alive.length) {
            finish(
                "🩸 Nessuno ha più la mano! Nessun vincitore",
                null
            );
        } else if (
            playerIds().length > 1 &&
            alive.length === 1
        ) {
            finish(
                "🪚 " + COLORS[alive[0]] +
                " è l'ultimo con tutte le dita: vince!",
                order
            );
        } else if (
            survivors.length > 1 &&
            Math.abs(
                total[survivors[0]] -
                total[survivors[1]]
            ) < 50
        ) {
            finish("🪚 Legni finiti! Pareggio", null);
        } else {
            finish(
                "🪚 " + COLORS[survivors[0]] +
                " vince con " +
                (total[survivors[0]] / 1000).toFixed(1) +
                " s!",
                order
            );
        }
    }

    // === Input dei giocatori ===
    g.onInput = e => {
        if (!playerIds().includes(e.button) || g.finished) {
            return;
        }

        const id = e.button;

        if (out.has(id)) return;

        if (e.type === "down") {
            pressing.add(id);
        } else if (e.type === "up") {
            pressing.delete(id);
            mustRelease.delete(id);
        }
    };

    // === Ripresa dopo la pausa ===
    g.resume = () => {
        // Ricostruisce lo stato dei tasti realmente premuti.
        pressing = new Set(
            [...held].filter(
                id => playerIds().includes(id) && !out.has(id)
            )
        );

        mustRelease = new Set(
            [...mustRelease].filter(
                id => pressing.has(id)
            )
        );

        lastTick = performance.now();

        setArena(
            "🪚 Si riparte!",
            phase === "ending"
                ? "Lascia il tasto!"
                : "Tieni premuto per spingere il legno"
        );
    };

    // === Pulizia ===
    g.dispose = () => {
        stopTimer();
        stopInterval();
        stopGrinder();

        speechSynthesis?.cancel();
    };

    return g;
}


    if ("serviceWorker" in navigator && location.protocol !== "file:") {
        window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {
        }));
    }
    updateSetup();
})();