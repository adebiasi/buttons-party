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
        bomb: "La bomba passa da un giocatore all'altro: premi solo quando senti il tuo colore. Se premi fuori turno o non fai in tempo, sei eliminato. Il ritmo accelera sempre di più.",
        rope: "Senti la corda battere: salta premendo il tuo tasto a tempo. Chi non salta o salta fuori tempo è eliminato. Il ritmo accelera sempre di più. Vince l'ultimo rimasto.",
        tennis: "Senti il rimbalzo della palla: quando rimbalza verso di te, premi per rispondere. Poi tocca al giocatore successivo in senso orario. Se premi prima del tuo rimbalzo resti fermo 2 secondi. Se manchi la palla perdi una vita.",
        pizza: "A turno, ascolta il percorso e ripetilo con i tasti. Le direzioni sono relative a te: indietro è il tuo tasto, avanti quello di fronte, destra e sinistra quelli ai tuoi lati. Un chilometro è una pressione. Se sbagli sei licenziato.",
        rally: "Il navigatore dà comandi come «4 destra» o «2 accelera». Premi il tasto corretto il numero di volte indicato. Le direzioni sono relative a te. Man mano i comandi arrivano più veloci. Un errore e fai incidente!",
        beeper: "Ogni giocatore ha un parlatore diverso, assegnato a voce. Tieni premuto per bippare le sue parolacce: +1 per ogni parolaccia coperta, -1 per ogni parola normale coperta. Se bippi un parlatore che non è il tuo perdi un punto. Ogni parlatore dice lo stesso numero di parolacce.",
        beat: "Ogni giocatore ha una percussione: cassa, rullante, charleston o battimani. Premi il tuo tasto a tempo quando senti la tua. Se premi nel momento sbagliato perdi un punto. Dopo tre loop la partita finisce.",
    }
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
        bomb: "Palla esplosiva",
        rope: "Saltare la corda",
        tennis: "Tennis",
        pizza: "Consegna pizza",
        rally: "Rally",
        beeper: "Il bippatore",
        beat: "Tieni il tempo",
    };
    const ANIMALS = ["cane", "gatto", "mucca", "pecora", "gallina", "cavallo", "papera", "gallo"];
    let audio = null, soundEnabled = true, game = null, timer = null, paused = false;
    let natureSource = null, natureGain = null;
    let held = new Set(), players = 4, scores = {}, toastTimer = null;
    let fallSource = null, fallGain = null;
    let ground = 0, start = 0;

    // --- Debug: espone al pannello lo stato interno (solo lettura) ---
    window.BPDebug?.attach({
        getState: () => ({
            game: game ? {id: game.id, mode: game.mode, finished: !!game.finished} : null,
            paused,
            held: [...held],
            players,
            scores: {...scores},
            soundEnabled,
            audioState: audio ? audio.state : "non creato",
            baseLatency: audio ? audio.baseLatency : null,
            outputLatency: audio ? audio.outputLatency : null,
            timerActive: timer !== null,
            natureActive: !!natureSource,
            fallActive: !!fallSource,
        }),
    });

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
                window.BPDebug?.input(event, id === "C" ? "→ avvio partita" : "ignorato (nessuna partita)");
                if (id === "C") startGame();
                return;
            }
            if (paused) {
                window.BPDebug?.input(event, id === "C" ? "→ riprendi" : "ignorato (in pausa)");
                if (id === "C") resumeGame();
                return;
            }
            if (id === "C" && game.mode === "realtime") {
                window.BPDebug?.input(event, "→ pausa");
                pauseGame();
                return;
            }
        }
        if (game && !paused) {
            const t0 = performance.now();
            try {
                game.onInput(event);
            } finally {
                window.BPDebug?.input(event, "→ gioco", performance.now() - t0);
            }
        } else {
            window.BPDebug?.input(event, game ? "ignorato (in pausa)" : "ignorato (nessuna partita)");
        }
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
        window.BPDebug?.pause(true);
        stopTimer();
        setArena("⏸ Partita in pausa", "Premi Riprendi per continuare");
        $("#pause-button").textContent = "▶ Riprendi";
        buttons.forEach(b => b.classList.remove("pressed"));
    }

    function resumeGame() {
        if (!game || !paused) return;
        paused = false;
        window.BPDebug?.pause(false);
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
        $("#pause-button").disabled = false;
        $("#game-title").textContent = GAME_NAMES[$("#game-select").value];
        $("#simon-feedback").textContent = "";
        const id = $("#game-select").value;
        game = makeGame(id);
        window.BPDebug?.gameStart(game, GAME_NAMES[id]);
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
        window.BPDebug?.gameEnd("uscita");
    }

    function finish(message, ranking = null, announce = true) {
        if (!game || game.finished) {
            window.BPDebug?.finishIgnored(message, !game);
            return;
        }
        game.finished = true;
        window.BPDebug?.gameFinish(message, ranking, announce);
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
            grinder: makeGrinder,
            bomb: makeBomb,
            rope: makeRope,
            tennis: makeTennis,
            pizza: makePizza,
            rally: makeRally,
            beeper: makeBeeper,
            beat: makeBeat
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

            later(() => {
            }, 5000);
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
                playSample("assets/sounds/proiettile-schiavato.mp3", () => {
                });
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
                    playSample("assets/sounds/proiettile-schiavato.mp3", () => {
                    });
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
                await playSampleWait("assets/sounds/splash.mp3", () => {
                });
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
                try {
                    src.stop();
                } catch (e) {
                }
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
            } catch (e) {
            }

            setTimeout(() => {
                try {
                    src.disconnect();
                    gain.disconnect();
                } catch (e) {
                }
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
            // NON fermo la mola qui: continua a suonare insieme al legno che si spezza

            phase = "ending";
            endClock = 0;

            // Chi preme in questo momento deve rilasciare.
            mustRelease = new Set(active);

            // Quando il suono del legno spezzato finisce, la mola si ferma
            // (solo se nel frattempo non è già ripartito un nuovo taglio)
            playSampleWait(WOOD_END, () => {
                noise(0.2, 0.1);
                tone(120, 0.2, "triangle", 0.1);
            }).then(() => {
                if (game === g && phase !== "wood") stopGrinder();
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

    function makeBomb() {
        const g = baseGame("bomb");

        // === File audio ===
        const DIR = "assets/sounds/bomba/";
        const TIC = DIR + "tic.mp3";                 // breve "tic"
        const TAC = DIR + "tac.mp3";                 // breve "tac"
        const JUMP = DIR + "salto.mp3";              // la bomba salta a un altro giocatore
        const EXPLOSION = DIR + "esplosione.mp3";    // esplosione
        const WRONG = DIR + "errore.mp3";            // premuto fuori turno
        const COLOR_FILES = {
            P1: DIR + "rosso.mp3",
            P2: DIR + "blu.mp3",
            P3: DIR + "giallo.mp3",
            P4: DIR + "verde.mp3"
        };

        // === Parametri ===
        const TICK_START = 650;         // intervallo tra i tic-tac all'inizio (ms)
        const TICK_END = 140;           // intervallo al massimo della velocità (ms)
        const REACTION_START = 2600;    // tempo per premere all'inizio (ms)
        const REACTION_END = 650;       // tempo per premere al massimo della velocità (ms)
        const RATE_END = 1.9;           // velocità finale del suono del salto (1 = normale)
        const RAMP_PASSES = 14;         // passaggi necessari per arrivare alla velocità massima
        const ANNOUNCE_DELAY = 220;     // pausa tra il salto e il colore (ms)
        const DOUBLE_TAP_GRACE = 250;   // chi ha appena passato la bomba non viene punito se ripreme subito (ms)
        const BOMB_VOLUME = .5;

        let phase = "intro";            // intro | live | boom | over
        let alive = [], outOrder = [], status = {};
        let holder = null, previous = null, passes = 0;
        let clock = 0, lastTick = 0, interval = null;
        let nextTickAt = 0, deadline = 0, announceAt = 0, passedAt = 0, flip = false;
        const buffers = new Map();

        const lerp = (a, b, t) => a + (b - a) * t;
        const progress = () => Math.min(1, passes / RAMP_PASSES);
        const minAlive = () => (playerIds().length > 1 ? 1 : 0);

        function stopInterval() {
            if (interval !== null) {
                clearInterval(interval);
                interval = null;
            }
        }

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

        function playTickTock() {
            const buffer = buffers.get(flip ? TAC : TIC);
            if (buffer) playBuffer(buffer, BOMB_VOLUME, 1 + progress() * .15);
            else tone(flip ? 700 : 900, .04, "square", .05);
            flip = !flip;
        }

        function playJump() {
            const rate = lerp(1, RATE_END, progress());   // il salto si velocizza col gioco
            const buffer = buffers.get(JUMP);
            if (buffer) playBuffer(buffer, .8, rate);
            else tone(500 * rate, .08 / rate, "triangle", .1);
        }

        // Annuncia il colore del giocatore che ha la bomba
        function announceHolder() {
            const buffer = buffers.get(COLOR_FILES[holder]);
            if (buffer) playBuffer(buffer, 1, 1 + progress() * .25);
            else say(COLORS[holder]);
        }

        function render() {
            renderScores(Object.fromEntries(playerIds().map(p => [p, status[p]])));
        }

        // La bomba passa a un altro giocatore ancora in gara
        function passBomb() {
            const candidates = alive.filter(p => p !== holder);
            previous = holder;
            holder = (candidates.length ? candidates : alive)[
                Math.floor(Math.random() * (candidates.length || alive.length))
                ];
            passes++;
            passedAt = clock;
            playJump();
            announceAt = clock + ANNOUNCE_DELAY;
            deadline = clock + ANNOUNCE_DELAY + lerp(REACTION_START, REACTION_END, progress());
        }

        function startRound() {
            passes = 0;
            holder = null;
            previous = null;
            phase = "live";
            $("#game-status").textContent = "ATTENTO!";
            setArena("💣 Tic… tac…", "Premi solo quando senti il tuo colore");
            nextTickAt = clock + 400;
            passBomb();
        }

        g.start = async () => {
            phase = "intro";
            clock = 0;
            alive = [...playerIds()];
            outOrder = [];
            status = Object.fromEntries(playerIds().map(p => [p, "—"]));

            $("#game-status").textContent = "PREPARATI";
            setArena("💣 Preparati…", "Ascolta le istruzioni");
            render();

            // Precarica tutto mentre la voce spiega
            const preload = Promise.all(
                [TIC, TAC, JUMP, EXPLOSION, WRONG, ...Object.values(COLOR_FILES)]
                    .map(async p => buffers.set(p, await loadSample(p)))
            );

            await sayAsync("Palla esplosiva. Premi solo quando senti il tuo colore. Se premi fuori turno o sei lento, sei eliminato!");
            await preload;
            if (game !== g) return;

            lastTick = performance.now();
            startRound();
            interval = setInterval(tick, 20);
        };

        // Il tempo di gioco avanza solo quando non è in pausa
        function tick() {
            const now = performance.now();
            const dt = Math.min(now - lastTick, 200);
            lastTick = now;

            if (paused || g.finished || phase !== "live") return;
            clock += dt;

            if (announceAt && clock >= announceAt) {
                announceAt = 0;
                announceHolder();
            }

            if (clock >= nextTickAt) {
                playTickTock();
                nextTickAt += lerp(TICK_START, TICK_END, progress());
            }

            if (clock >= deadline) explode();
        }

        function conclude(order) {
            finish("💣 " + COLORS[order[0]] + " è l'ultimo rimasto: vince!", order, false);
        }

        async function explode() {
            phase = "boom";
            const loser = holder;
            alive = alive.filter(p => p !== loser);
            outOrder.push(loser);
            status[loser] = "OUT";
            render();

            setArena("💥 BOOM!", COLORS[loser] + " è esploso!", "signal");
            await playSampleWait(EXPLOSION, () => {
                noise(.6, .25);
                tone(70, .5, "sawtooth", .2);
            });
            if (game !== g || g.finished) return;

            if (alive.length <= minAlive()) {
                stopInterval();
                const order = [...alive, ...[...outOrder].reverse()];
                if (alive.length) {
                    conclude(order);
                    say("Vince " + COLORS[alive[0]]);
                } else {
                    finish("💥 Nessun sopravvissuto!", null);
                }
                return;
            }

            // Nuovo giro: nuova bomba, velocità azzerata
            setArena("💣 Nuova bomba…", "Preparati");
            later(() => {
                if (g.finished) return;
                lastTick = performance.now();
                startRound();
            }, 1200);
        }

        async function wrongPress(id) {
            alive = alive.filter(p => p !== id);
            outOrder.push(id);
            status[id] = "OUT";
            render();
            toast("Fuori turno! " + COLORS[id] + " è eliminato");

            const sound = playSampleWait(WRONG, () => {
                tone(120, .3, "square", .12);
            });

            if (alive.length <= minAlive()) {
                phase = "over";
                stopInterval();
                const order = [...alive, ...[...outOrder].reverse()];
                if (alive.length) {
                    conclude(order);
                    await sound;
                    if (game !== g) return;
                    say("Vince " + COLORS[alive[0]]);
                } else {
                    finish("💥 Nessun sopravvissuto!", null);
                }
                return;
            }

            // Se è stato eliminato chi aveva la bomba, la bomba passa a un altro
            if (id === holder) {
                holder = alive[0];
                passBomb();
            }
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;
            if (phase !== "live") return;

            const id = e.button;
            if (!alive.includes(id)) return;

            if (id === holder) {
                // Passaggio riuscito
                passBomb();
                return;
            }

            // Chi ha appena passato la bomba può ripremere senza essere punito
            if (id === previous && clock - passedAt < DOUBLE_TAP_GRACE) return;

            wrongPress(id);
        };

        g.resume = () => {
            lastTick = performance.now();
            setArena("💣 Tic… tac…", "Premi solo quando senti il tuo colore");
        };

        g.dispose = () => {
            stopTimer();
            stopInterval();
            speechSynthesis?.cancel();
        };

        return g;
    }

    function makeRope() {
        const g = baseGame("rope");

        // === File audio ===
        const DIR = "assets/sounds/corda/";
        const BACKGROUND = DIR + "bambini.mp3";    // bambini che giocano, in loop
        const ROPE = DIR + "corda.mp3";            // la corda che batte a terra
        const JUMP = DIR + "salto.mp3";            // salto riuscito (breve)
        const TRIP = DIR + "inciampo.mp3";         // eliminato: inciampa nella corda

        // === Parametri ===
        const BACKGROUND_VOLUME = .14;
        const WARMUP = 3;               // colpi iniziali senza eliminazioni, per prendere il ritmo
        const BEAT_START = 1100;        // intervallo tra i colpi all'inizio (ms)
        const BEAT_END = 450;           // intervallo al massimo della velocità (ms)
        const WINDOW_START = 380;       // tolleranza (±ms) attorno al colpo all'inizio
        const WINDOW_END = 170;         // tolleranza (±ms) alla massima velocità
        const RAMP_BEATS = 25;          // colpi (dopo il riscaldamento) per arrivare alla massima velocità
        const RATE_END = 1.5;           // velocità finale del suono della corda (1 = normale)
        const ROPE_VOLUME = .9;

        let phase = "intro";            // intro | live | over
        let clock = 0, lastTick = 0, interval = null;
        let beatNo = 1, beatAt = 0, curWindow = WINDOW_START, soundPlayed = false;
        let jumped = new Set(), jumps = {}, alive = [], outOrder = [], status = {};
        const buffers = new Map();

        const lerp = (a, b, t) => a + (b - a) * t;
        const progress = () => Math.min(1, Math.max(0, beatNo - WARMUP) / RAMP_BEATS);
        const minAlive = () => (playerIds().length > 1 ? 1 : 0);

        function stopInterval() {
            if (interval !== null) {
                clearInterval(interval);
                interval = null;
            }
        }

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

        function playRope() {
            const rate = lerp(1, RATE_END, progress());   // la corda si velocizza col gioco
            const buffer = buffers.get(ROPE);
            if (buffer) playBuffer(buffer, ROPE_VOLUME, rate);
            else {
                noise(.1, .12);
                tone(180 * rate, .06, "triangle", .12);
            }
        }

        function render() {
            renderScores(Object.fromEntries(playerIds().map(p => [p, status[p]])));
        }

        // Prepara il prossimo colpo di corda
        function scheduleBeat(at) {
            beatAt = at;
            curWindow = lerp(WINDOW_START, WINDOW_END, progress());
            soundPlayed = false;
            jumped = new Set();

            if (beatNo <= WARMUP) {
                $("#game-status").textContent = "RISCALDAMENTO";
                setArena("🪢 Prendi il ritmo…", "Salta a tempo con la corda (" + beatNo + " / " + WARMUP + ")");
            } else {
                $("#game-status").textContent = "SALTA! · COLPO " + (beatNo - WARMUP);
                setArena("🪢 Salta!", "Premi a tempo con la corda", "signal");
            }
        }

        g.start = async () => {
            phase = "intro";
            clock = 0;
            beatNo = 1;
            alive = [...playerIds()];
            outOrder = [];
            jumps = Object.fromEntries(playerIds().map(p => [p, 0]));
            status = Object.fromEntries(playerIds().map(p => [p, 0]));

            $("#game-status").textContent = "PREPARATI";
            setArena("🪢 Preparati…", "Ascolta le istruzioni");
            render();

            // Precarica tutto mentre la voce spiega
            const preload = Promise.all(
                [BACKGROUND, ROPE, JUMP, TRIP].map(async p => buffers.set(p, await loadSample(p)))
            );

            await sayAsync("Saltare la corda. Salta premendo il tuo tasto a tempo con la corda. Chi non salta è eliminato, e si va sempre più veloci!");
            await preload;
            if (game !== g) return;

            await startNatureAmbience(BACKGROUND, BACKGROUND_VOLUME);
            if (game !== g) return;

            phase = "live";
            lastTick = performance.now();
            scheduleBeat(clock + 1300);
            interval = setInterval(tick, 20);
        };

        // Il tempo di gioco avanza solo quando non è in pausa
        function tick() {
            const now = performance.now();
            const dt = Math.min(now - lastTick, 200);
            lastTick = now;

            if (paused) {
                setNatureVolume(0);
                return;
            }
            if (g.finished || phase !== "live") return;
            clock += dt;

            if (!soundPlayed && clock >= beatAt) {
                soundPlayed = true;
                playRope();
            }
            if (clock >= beatAt + curWindow) judgeBeat();
        }

        // Chiude il colpo corrente: chi non ha saltato è eliminato
        function judgeBeat() {
            if (phase !== "live") return;

            if (beatNo > WARMUP) {
                const failed = alive.filter(p => !jumped.has(p));
                if (failed.length && eliminate(failed, "non ha saltato")) return;
            }

            beatNo++;
            scheduleBeat(beatAt + lerp(BEAT_START, BEAT_END, progress()));
        }

        // Elimina i giocatori indicati. Restituisce true se la partita è finita.
        function eliminate(list, reason) {
            list.forEach(p => {
                alive = alive.filter(a => a !== p);
                outOrder.push(p);
                status[p] = "OUT";
            });
            render();
            toast(list.map(p => COLORS[p]).join(", ") + (list.length > 1 ? " eliminati: " : " eliminato: ") + reason);

            const sound = playSampleWait(TRIP, () => {
                tone(220, .25, "sawtooth", .12);
                tone(110, .3, "sawtooth", .12, .15);
            });

            if (alive.length <= minAlive()) {
                phase = "over";
                stopInterval();
                stopNatureAmbience();
                conclude(sound);
                return true;
            }
            return false;
        }

        async function conclude(sound) {
            const order = [...alive, ...[...outOrder].reverse()];

            if (alive.length) {
                // announce = false: la voce parla dopo il suono dell'inciampo
                finish("🪢 " + COLORS[alive[0]] + " è l'ultimo a saltare: vince!", order, false);
                await sound;
                if (game !== g) return;
                say("Vince " + COLORS[alive[0]]);
            } else {
                finish("🪢 Tutti eliminati! Nessun vincitore", null, false);
            }
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;
            if (phase !== "live") return;

            const id = e.button;
            if (!alive.includes(id)) return;

            // Tempo di gioco preciso della pressione
            const t = clock + (performance.now() - lastTick);

            // Se il colpo precedente è già scaduto, chiudilo prima di valutare questa pressione
            while (phase === "live" && t >= beatAt + curWindow) judgeBeat();
            if (phase !== "live" || !alive.includes(id)) return;

            // Dentro la finestra del colpo: salto valido
            if (t >= beatAt - curWindow && t <= beatAt + curWindow) {
                if (jumped.has(id)) return;   // già saltato su questo colpo
                jumped.add(id);
                jumps[id]++;
                status[id] = jumps[id];
                render();
                playSample(JUMP, () => tone(660, .06, "sine", .06));
                return;
            }

            // Fuori finestra: salto a vuoto (durante il riscaldamento non conta)
            if (beatNo <= WARMUP) return;
            eliminate([id], "ha saltato fuori tempo");
        };

        g.resume = () => {
            // Dopo la pausa si riprende il ritmo con un nuovo colpo di preavviso
            lastTick = performance.now();
            setNatureVolume(BACKGROUND_VOLUME);
            scheduleBeat(clock + 1300);
        };

        g.dispose = () => {
            stopTimer();
            stopInterval();
            stopNatureAmbience();
            speechSynthesis?.cancel();
        };

        return g;
    }

    function makeTennis() {
        const g = baseGame("tennis");

        // === File audio ===
        const DIR = "assets/sounds/tennis/";
        const BOUNCE = DIR + "rimbalzo.mp3";      // rimbalzo della pallina (breve)
        const RACKET = DIR + "racchetta.mp3";     // colpo di racchetta (breve)
        const FAULT = DIR + "fallo.mp3";          // premuto troppo presto
        const MISSED = DIR + "mancata.mp3";       // palla mancata

        // === Parametri ===
        const LIVES = 3;                // vite per giocatore
        const FREEZE = 2000;            // blocco per chi preme troppo presto (ms)
        const FLIGHT_START = 1500;      // tempo tra colpo e rimbalzo all'inizio (ms)
        const FLIGHT_END = 450;         // tempo alla massima velocità (ms)
        const REACT_START = 1000;       // tempo per rispondere dopo il rimbalzo all'inizio (ms)
        const REACT_END = 380;          // tempo alla massima velocità (ms)
        const RAMP_HITS = 20;           // colpi per arrivare alla massima velocità
        const RATE_END = 1.4;           // velocità finale dei suoni (1 = normale)
        const GRACE = 250;              // chi ha appena colpito può ripremere senza essere punito (ms)
        const REST = 1500;              // pausa dopo una palla persa (ms)
        const PAN = {P1: -.8, P2: -.3, P3: .3, P4: .8};   // posizione stereo di ogni giocatore

        let phase = "intro";            // intro | live | rest | over
        let clock = 0, lastTick = 0, lastRender = 0, interval = null;
        let holder = null, prevHolder = null, hitAt = 0, hits = 0;
        let bounceAt = 0, deadline = 0, bounced = false, restartAt = 0, nextServer = null;
        let lives = {}, frozenUntil = {}, outOrder = [];
        const buffers = new Map();

        const lerp = (a, b, t) => a + (b - a) * t;
        const progress = () => Math.min(1, hits / RAMP_HITS);
        const flight = () => lerp(FLIGHT_START, FLIGHT_END, progress());
        const reaction = () => lerp(REACT_START, REACT_END, progress());
        const aliveList = () => playerIds().filter(p => lives[p] > 0);
        const minAlive = () => (playerIds().length > 1 ? 1 : 0);

        function stopInterval() {
            if (interval !== null) {
                clearInterval(interval);
                interval = null;
            }
        }

        // Riproduce un buffer con volume, velocità e posizione stereo
        function playBuffer(buffer, volume = 1, rate = 1, pan = 0) {
            const ctx = ensureAudio();
            const source = ctx.createBufferSource();
            const gain = ctx.createGain();
            source.buffer = buffer;
            source.playbackRate.value = rate;
            gain.gain.value = soundEnabled ? volume : 0;
            source.connect(gain);
            let out = gain;
            if (ctx.createStereoPanner) {
                const panner = ctx.createStereoPanner();
                panner.pan.value = pan;
                gain.connect(panner);
                out = panner;
            }
            out.connect(ctx.destination);
            source.start();
        }

        function playBounce(id) {
            const rate = lerp(1, RATE_END, progress());
            const buffer = buffers.get(BOUNCE);
            if (buffer) playBuffer(buffer, .9, rate, PAN[id] || 0);
            else tone(260 * rate, .07, "triangle", .14);
        }

        function playRacket(id) {
            const rate = lerp(1, RATE_END, progress());
            const buffer = buffers.get(RACKET);
            if (buffer) playBuffer(buffer, 1, rate, PAN[id] || 0);
            else {
                noise(.05, .12);
                tone(900 * rate, .05, "square", .08);
            }
        }

        function render() {
            const now = clock;
            renderScores(Object.fromEntries(playerIds().map(p => [
                p,
                lives[p] <= 0
                    ? "OUT"
                    : (frozenUntil[p] > now ? "❄ " : "") + "♥".repeat(lives[p])
            ])));
        }

        // Prossimo giocatore in gara in senso orario
        function nextAlive(id) {
            const ids = playerIds();
            const i = ids.indexOf(id);
            for (let k = 1; k <= ids.length; k++) {
                const p = ids[(i + k) % ids.length];
                if (lives[p] > 0) return p;
            }
            return id;
        }

        // Nuovo scambio: la palla rimbalza verso chi deve servire
        function serve(server) {
            phase = "live";
            holder = server;
            prevHolder = null;
            hits = 0;
            frozenUntil = {};
            bounced = false;
            bounceAt = clock + 1200 + Math.random() * 1200;
            deadline = bounceAt + reaction();
            $("#game-status").textContent = "SERVIZIO";
            setArena("🎾 Ascolta il rimbalzo…", "Premi dopo il rimbalzo, non prima");
            render();
        }

        g.start = async () => {
            phase = "intro";
            clock = 0;
            outOrder = [];
            frozenUntil = {};
            lives = Object.fromEntries(playerIds().map(p => [p, LIVES]));

            $("#game-status").textContent = "PREPARATI";
            setArena("🎾 Preparati…", "Ascolta le istruzioni");
            render();

            // Precarica tutto mentre la voce spiega
            const preload = Promise.all(
                [BOUNCE, RACKET, FAULT, MISSED].map(async p => buffers.set(p, await loadSample(p)))
            );

            await sayAsync("Tennis. Premi quando senti la palla rimbalzare verso di te. Si gioca in senso orario. Se premi troppo presto resti fermo due secondi.");
            await preload;
            if (game !== g) return;

            lastTick = performance.now();
            serve(playerIds()[0]);
            interval = setInterval(tick, 10);
        };

        // Il tempo di gioco avanza solo quando non è in pausa
        function tick() {
            const now = performance.now();
            const dt = Math.min(now - lastTick, 200);
            lastTick = now;

            if (paused || g.finished) return;
            clock += dt;

            if (phase === "live") {
                if (!bounced && clock >= bounceAt) {
                    bounced = true;
                    playBounce(holder);
                }
                if (clock >= deadline) miss();
            } else if (phase === "rest" && clock >= restartAt) {
                serve(nextServer);
            }

            if (now - lastRender > 100) {
                lastRender = now;
                render();
            }
        }

        // Colpo riuscito: la palla passa al giocatore successivo
        function hit(id, t) {
            hits++;
            playRacket(id);
            prevHolder = id;
            hitAt = t;
            holder = nextAlive(id);
            bounced = false;
            bounceAt = t + flight();
            deadline = bounceAt + reaction();
            $("#game-status").textContent = "SCAMBIO · " + hits;
            setArena("🎾 Scambio di " + hits + " colpi", "Ascolta dove rimbalza");
        }

        function penalize(id, t) {
            frozenUntil[id] = t + FREEZE;
            playSample(FAULT, () => tone(110, .25, "square", .1));
            toast("Troppo presto! " + COLORS[id] + " resta fermo 2 secondi");
            render();
        }

        // La palla non è stata respinta: il giocatore di turno perde una vita
        function miss() {
            phase = "rest";
            const loser = holder;
            lives[loser]--;
            if (lives[loser] <= 0) outOrder.push(loser);
            render();

            const sound = playSampleWait(MISSED, () => {
                tone(200, .25, "sawtooth", .1);
                tone(120, .3, "sawtooth", .1, .15);
            });
            toast(COLORS[loser] + " manca la palla!");

            if (aliveList().length <= minAlive()) {
                phase = "over";
                stopInterval();
                conclude(sound);
                return;
            }

            setArena("🎾 Palla persa!", COLORS[loser] + " perde una vita", "signal");
            nextServer = lives[loser] > 0 ? loser : nextAlive(loser);
            restartAt = clock + REST;
        }

        async function conclude(sound) {
            const alive = aliveList();
            const order = [
                ...alive.sort((a, b) => lives[b] - lives[a]),
                ...[...outOrder].reverse()
            ];

            if (alive.length) {
                // announce = false: la voce parla dopo il suono della palla mancata
                finish("🎾 " + COLORS[alive[0]] + " è l'ultimo in campo: vince!", order, false);
                await sound;
                if (game !== g) return;
                say("Vince " + COLORS[alive[0]]);
            } else {
                finish("🎾 Vite finite! Fine della partita", null, false);
            }
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;
            if (phase !== "live") return;

            const id = e.button;
            if (lives[id] <= 0) return;

            // Tempo di gioco preciso della pressione
            const t = clock + (performance.now() - lastTick);

            if (t >= deadline) {   // il tempo era già scaduto: la palla è persa
                miss();
                return;
            }
            if (frozenUntil[id] > t) return;   // fermo per la penalità

            if (id === holder) {
                if (t >= bounceAt) hit(id, t);   // dopo il rimbalzo: colpo valido
                else penalize(id, t);            // prima del rimbalzo: troppo presto
                return;
            }

            // Non è il tuo turno. Chi ha appena colpito non viene punito se ripreme subito
            if (id === prevHolder && t - hitAt < GRACE) return;
            penalize(id, t);
        };

        g.resume = () => {
            // Dopo la pausa la palla rimbalza di nuovo, con un po' di preavviso
            lastTick = performance.now();
            if (phase === "live") {
                bounced = false;
                bounceAt = clock + 1200;
                deadline = bounceAt + reaction();
            }
            setArena("🎾 Si riparte!", "Ascolta il rimbalzo");
        };

        g.dispose = () => {
            stopTimer();
            stopInterval();
            speechSynthesis?.cancel();
        };

        return g;
    }

    function makePizza() {
        const g = baseGame("pizza");

        // === File audio ===
        const DIR = "assets/sounds/pizza/";
        const INTRO = DIR + "consegna.mp3";
        const FIRED = DIR + "licenziato.mp3";
        const SCOOTER = DIR + "motorino.mp3";
        const ENGINE_LOOP = DIR + "motorino-loop.mp3";
        const BRAKE = DIR + "frenata.mp3";
        const DELIVERED = DIR + "consegnata.mp3";
        const kmFile = n => DIR + "km-" + n + ".mp3";

        // Direzioni: testo per la voce sintetica, file audio, freccia
        const DIRECTIONS = {
            avanti: {text: "avanti", file: DIR + "avanti.mp3", arrow: "↑"},
            destra: {text: "a destra", file: DIR + "destra.mp3", arrow: "→"},
            indietro: {text: "indietro", file: DIR + "indietro.mp3", arrow: "↓"},
            sinistra: {text: "a sinistra", file: DIR + "sinistra.mp3", arrow: "←"}
        };

        // Tasti in senso orario attorno al tavolo
        const ORDER = ["P1", "P2", "P3", "P4"];

        // Posizioni rispetto al giocatore seduto dietro il proprio tasto
        const OFFSET = {
            indietro: 0,
            sinistra: 1,
            avanti: 2,
            destra: 3
        };

        // Quale tasto corrisponde a una direzione, per quel giocatore
        const buttonFor = (player, dir) =>
            ORDER[(ORDER.indexOf(player) + OFFSET[dir]) % ORDER.length];

        // Legenda personalizzata per il giocatore di turno
        const legendFor = player =>
            Object.entries(DIRECTIONS)
                .map(([key, d]) => d.arrow + " " + COLORS[buttonFor(player, key)])
                .join(" · ");

        // === Parametri ===
        const LEGS_START = 2;
        const LEGS_MAX = 7;
        const KM_MAX = 4;
        const LEG_PAUSE = [350, 900];
        const TURN_PAUSE = 900;
        const MAX_ROUNDS = 15;
        const SCOOTER_VOLUME = 0.7;
        const ENGINE_VOLUME = 0.25;

        let phase = "intro";
        let alive = [];
        let outOrder = [];
        let expected = [];
        let index = 0;
        let current = null;
        let turnResolve = null;
        let engineAudio = null;

        const buffers = new Map();

        const rand = ([min, max]) =>
            min + Math.random() * (max - min);

        const gone = () => game !== g || g.finished;

        const wait = ms =>
            new Promise(resolve => setTimeout(resolve, ms));

        // Attesa che si ferma se il gioco è in pausa
        async function pausable(ms) {
            await wait(ms);
            while (paused && !gone()) {
                await wait(150);
            }
        }

        // === Motorino acceso in sottofondo ===
        let engineSource = null;
        let engineGain = null;

        async function startEngine() {
            if (engineSource || gone()) return;

            try {
                const ctx = ensureAudio();
                const buffer = await loadSample(ENGINE_LOOP);

                if (!buffer || gone() || engineSource) return;

                engineSource = ctx.createBufferSource();
                engineGain = ctx.createGain();

                engineSource.buffer = buffer;
                engineSource.loop = true;
                engineGain.gain.value = soundEnabled ? ENGINE_VOLUME : 0;

                engineSource.connect(engineGain);
                engineGain.connect(ctx.destination);

                if (ctx.state === "suspended") {
                    await ctx.resume();
                }

                if (gone()) {
                    engineSource = null;
                    engineGain = null;
                    return;
                }

                engineSource.start(0);
            } catch (err) {
                console.warn("Impossibile avviare il loop del motorino:", err);
            }
        }

        function stopEngine() {
            if (engineSource) {
                try {
                    engineSource.onended = null;
                    engineSource.stop();
                    engineSource.disconnect();
                } catch (_) {
                }

                engineSource = null;
            }

            if (engineGain) {
                try {
                    engineGain.disconnect();
                } catch (_) {
                }

                engineGain = null;
            }

            // Ferma anche il vecchio audio HTML, se ancora presente
            if (engineAudio) {
                engineAudio.pause();
                engineAudio.currentTime = 0;
                engineAudio.src = "";
                engineAudio = null;
            }
        }

        function updateEngineVolume() {
            if (engineGain) {
                engineGain.gain.value = soundEnabled ? ENGINE_VOLUME : 0;
            }
        }

        // Riproduce un buffer con volume e velocità
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

        // Registrazione se esiste, altrimenti voce sintetica
        async function voice(path, text) {
            const buffer = await loadSample(path);

            if (buffer) {
                return playSampleWait(path, () => {
                });
            }

            return sayAsync(text);
        }

        function legText(leg) {
            return leg.km +
                (leg.km === 1 ? " chilometro " : " chilometri ") +
                DIRECTIONS[leg.dir].text;
        }

        // Annuncia una tratta con i file audio, se disponibili
        async function sayLeg(leg) {
            const numberPath = kmFile(leg.km);
            const directionPath = DIRECTIONS[leg.dir].file;

            const nb = await loadSample(numberPath);
            const db = await loadSample(directionPath);

            if (nb && db) {
                await playSampleWait(numberPath, () => {
                });
                await playSampleWait(directionPath, () => {
                });
            } else {
                await sayAsync(legText(leg));
            }
        }

        // Rumore del motorino a ogni pressione corretta
        function playScooter() {
            const buffer = buffers.get(SCOOTER);

            if (buffer) {
                playBuffer(
                    buffer,
                    SCOOTER_VOLUME,
                    0.95 + Math.random() * 0.15
                );
            } else {
                tone(90 + Math.random() * 20, 0.14, "sawtooth", 0.07);
                tone(140, 0.1, "square", 0.03, 0.04);
            }
        }

        function render() {
            renderScores(
                Object.fromEntries(
                    playerIds().map(p => [
                        p,
                        alive.includes(p) ? scores[p] : "OUT"
                    ])
                )
            );
        }

        // Percorso casuale: tratte consecutive in direzioni diverse
        function makeLegs(round) {
            const count = Math.min(
                LEGS_MAX,
                LEGS_START + round - 1
            );

            const keys = Object.keys(DIRECTIONS);
            const legs = [];
            let prev = null;

            for (let i = 0; i < count; i++) {
                let dir;

                do {
                    dir = keys[
                        Math.floor(Math.random() * keys.length)
                        ];
                } while (dir === prev);

                prev = dir;

                legs.push({
                    dir,
                    km: 1 + Math.floor(Math.random() * KM_MAX)
                });
            }

            return legs;
        }

        function showInput() {
            setArena(
                "🛵 Tocca a " + COLORS[current],
                legendFor(current) + " — " + index + " / " + expected.length,
                "signal"
            );
        }

        // Annuncia il percorso
        async function announce(p, legs) {
            stopEngine(); // Motore spento mentre ascolta

            phase = "announce";

            $("#game-status").textContent = "ASCOLTA IL PERCORSO";

            setArena(
                "🍕 Tocca a " + COLORS[p],
                "Ascolta il percorso: " + legendFor(p)
            );

            if (playerIds().length > 1) {
                await sayAsync("Tocca a " + COLORS[p]);
            }

            if (gone()) return;

            await voice(INTRO, "Consegna la pizza qui vicino.");

            for (const leg of legs) {
                if (gone()) return;

                await pausable(rand(LEG_PAUSE));

                if (gone()) return;

                await sayLeg(leg);
            }
        }

        // Un turno: annuncio, poi attesa del giocatore
        async function turn(p, round) {
            const legs = makeLegs(round);

            expected = legs.flatMap(leg =>
                Array(leg.km).fill(buttonFor(p, leg.dir))
            );

            index = 0;
            current = p;

            await announce(p, legs);

            if (gone()) return false;

            await pausable(300);

            if (gone()) return false;

            phase = "input";

            $("#game-status").textContent =
                "CONSEGNA · " + COLORS[p].toUpperCase();

            showInput();
            startEngine(); // Motore acceso durante le pressioni

            return new Promise(resolve => {
                turnResolve = resolve;
            });
        }

        function endTurn(ok) {
            stopEngine();

            phase = "between";

            const resolve = turnResolve;
            turnResolve = null;

            if (resolve) resolve(ok);
        }

        async function play() {
            for (let round = 1; round <= MAX_ROUNDS; round++) {
                const failed = [];

                for (const p of [...alive]) {
                    const ok = await turn(p, round);

                    if (gone()) return;

                    if (ok) {
                        scores[p]++;
                        render();

                        playSample(DELIVERED, () => {
                            tone(660, 0.1, "sine", 0.1);
                            tone(880, 0.18, "sine", 0.1, 0.1);
                        });

                        toast("🍕 " + COLORS[p] +
                            " ha consegnato la pizza!");

                    } else {
                        failed.push(p);

                        alive = alive.filter(a => a !== p);
                        outOrder.push(p);

                        render();

                        setArena(
                            "🔥 Licenziato!",
                            COLORS[p] + " ha sbagliato strada",
                            "signal"
                        );

                        // Prima la frenata, poi "Sei licenziato!"
                        await voice(BRAKE, "Screeeech!");

                        if (gone()) return;

                        await voice(FIRED, "Sei licenziato!");

                        if (gone()) return;
                    }

                    await pausable(TURN_PAUSE);

                    if (gone()) return;
                }

                const solo = playerIds().length === 1;

                if (
                    solo
                        ? alive.length === 0
                        : alive.length <= 1
                ) {
                    conclude(failed);
                    return;
                }
            }

            // Troppi giri: pareggio
            conclude([]);
        }

        function conclude(failedNow) {
            phase = "over";

            // Spegne il motore quando termina la partita
            stopEngine();

            const order = [
                ...alive,
                ...[...outOrder].reverse()
            ];

            const solo = playerIds().length === 1;

            if (solo) {
                const p = playerIds()[0];

                finish(
                    "🍕 Licenziato dopo " +
                    scores[p] +
                    (scores[p] === 1
                        ? " consegna"
                        : " consegne"),
                    null
                );

            } else if (alive.length === 1) {
                finish(
                    "🍕 " + COLORS[alive[0]] +
                    " è l'ultimo fattorino: vince!",
                    order
                );

            } else if (alive.length === 0) {
                finish("🍕 Licenziati tutti! Pareggio", null);

            } else {
                finish(
                    "🍕 Troppe consegne! Pareggio tra " +
                    alive.map(p => COLORS[p]).join(", "),
                    null
                );
            }
        }

        g.start = async () => {
            phase = "intro";

            alive = [...playerIds()];
            outOrder = [];

            scores = Object.fromEntries(
                playerIds().map(p => [p, 0])
            );

            $("#game-status").textContent = "PREPARATI";

            setArena(
                "🍕 Preparati…",
                "Le direzioni sono relative a dove sei seduto"
            );

            render();

            // Precarica tutti i file audio
            const files = [
                INTRO,
                FIRED,
                SCOOTER,
                ENGINE_LOOP,
                BRAKE,
                DELIVERED,
                ...Object.values(DIRECTIONS).map(d => d.file),
                ...Array.from(
                    {length: KM_MAX},
                    (_, i) => kmFile(i + 1)
                )
            ];

            const preload = Promise.all(
                files.map(async path => {
                    buffers.set(path, await loadSample(path));
                })
            );

            await sayAsync(
                "Consegna pizza. Ascolta il percorso e ripetilo. " +
                "Le direzioni sono relative a te: indietro è il tuo tasto, " +
                "avanti è quello di fronte, destra e sinistra sono ai tuoi lati. " +
                "Un chilometro è una pressione. Se sbagli, sei licenziato!"
            );

            await preload;

            if (gone()) return;

            // Avvia il rumore continuo del motore
            startEngine();

            play();
        };

        g.onInput = e => {
            if (
                e.type !== "down" ||
                g.finished ||
                phase !== "input"
            ) return;

            // Il tasto Centro non è una direzione
            if (!ORDER.includes(e.button)) return;

            if (e.button === expected[index]) {
                index++;

                playScooter();

                if (index >= expected.length) {
                    endTurn(true);
                } else {
                    showInput();
                }

            } else {
                toast("Strada sbagliata!");

                // La frenata e il licenziamento vengono gestiti
                // in play(), nell'ordine corretto.
                endTurn(false);
            }
        };

        g.resume = () => {
            if (phase === "input") {
                showInput();
            } else {
                setArena("🍕 Si riparte!", "Ascolta il percorso");
            }

            updateEngineVolume();
        };

        g.dispose = () => {
            stopEngine();
            stopTimer();

            speechSynthesis?.cancel();

            if (turnResolve) {
                const resolve = turnResolve;
                turnResolve = null;
                resolve(false);
            }
        };

        return g;
    }

    function makeRally() {
        const g = baseGame("rally", "turns");

        // === File audio (con fallback sintetici) ===
        const DIR = "assets/sounds/rally/";
        const CRASH = DIR + "incidente.mp3";
        const SUCCESS = DIR + "ok.mp3";

        // Direzioni relative (come in Pizza) + accelera = proprio tasto
        const ACTIONS = {
            destra:   { text: "destra",   arrow: "→" },
            sinistra: { text: "sinistra", arrow: "←" },
            avanti:   { text: "avanti",   arrow: "↑" },
            indietro: { text: "indietro", arrow: "↓" },
            accelera: { text: "accelera", arrow: "⚡" }
        };

        // Tasti in senso orario
        const ORDER = ["P1", "P2", "P3", "P4"];

        // Offset rispetto al giocatore corrente
        const OFFSET = {
            indietro: 0,   // proprio tasto
            sinistra: 1,
            avanti:   2,
            destra:   3,
            accelera: 0    // accelera = proprio tasto
        };

        const buttonFor = (player, action) =>
            ORDER[(ORDER.indexOf(player) + OFFSET[action]) % ORDER.length];

        const legendFor = player =>
            Object.entries(ACTIONS)
                .map(([key, a]) => a.arrow + " " + COLORS[buttonFor(player, key)])
                .join(" · ");

        // === Parametri ===
        const CMDS_START = 2;          // comandi iniziali per turno
        const CMDS_MAX = 8;            // massimo comandi per turno
        const TIMES_MAX = 4;           // max ripetizioni (1-4)
        const GAP_START = 900;         // silenzio iniziale tra comandi (ms)
        const GAP_END = 220;           // silenzio minimo tra comandi (ms)
        const RAMP_ROUNDS = 10;        // round per arrivare alla velocità massima
        const TURN_PAUSE = 1000;
        const MAX_ROUNDS = 20;

        let phase = "intro";
        let alive = [];
        let outOrder = [];
        let expected = [];             // array di button id da premere
        let index = 0;
        let current = null;
        let turnResolve = null;
        let round = 0;

        const buffers = new Map();

        const gone = () => game !== g || g.finished;
        const wait = ms => new Promise(r => setTimeout(r, ms));

        async function pausable(ms) {
            await wait(ms);
            while (paused && !gone()) await wait(150);
        }

        const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
        const gap = () => lerp(GAP_START, GAP_END, (round - 1) / RAMP_ROUNDS);

        // Precarica
        async function preload() {
            const files = [CRASH, SUCCESS];
            await Promise.all(files.map(async p => buffers.set(p, await loadSample(p))));
        }

        function playBuffer(buffer, volume = 1, rate = 1) {
            if (!buffer) return;
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

        function playCrash() {
            const buffer = buffers.get(CRASH);
            if (buffer) {
                return new Promise(resolve => {
                    const ctx = ensureAudio();
                    const source = ctx.createBufferSource();
                    const gain = ctx.createGain();
                    source.buffer = buffer;
                    gain.gain.value = soundEnabled ? 0.9 : 0;
                    source.connect(gain);
                    gain.connect(ctx.destination);
                    source.onended = resolve;
                    source.start();
                });
            }
            // Fallback sintetico incidente
            noise(0.4, 0.2);
            tone(80, 0.5, "sawtooth", 0.18);
            tone(40, 0.6, "sawtooth", 0.12, 0.15);
            return wait(700);
        }

        function playSuccess() {
            const buffer = buffers.get(SUCCESS);
            if (buffer) playBuffer(buffer, 0.7);
            else {
                tone(660, 0.1, "sine", 0.1);
                tone(880, 0.15, "sine", 0.1, 0.1);
            }
        }

        function render() {
            renderScores(
                Object.fromEntries(
                    playerIds().map(p => [
                        p,
                        alive.includes(p) ? (scores[p] || 0) : "OUT"
                    ])
                )
            );
        }

        // Genera una lista di comandi per il turno
        function makeCommands(count) {
            const keys = Object.keys(ACTIONS);
            const cmds = [];
            let prev = null;
            for (let i = 0; i < count; i++) {
                let action;
                do {
                    action = keys[Math.floor(Math.random() * keys.length)];
                } while (action === prev && keys.length > 1);
                prev = action;
                const times = 1 + Math.floor(Math.random() * TIMES_MAX);
                cmds.push({ action, times });
            }
            return cmds;
        }

        // Annuncia un singolo comando a voce
        async function sayCommand(cmd) {
            const text = cmd.times + " " + ACTIONS[cmd.action].text;
            await sayAsync(text, 2500);
        }

        function showInput() {
            const remaining = expected.length - index;
            setArena(
                "🏎️ Tocca a " + COLORS[current],
                legendFor(current) + " — " + index + " / " + expected.length + " (restano " + remaining + ")",
                "signal"
            );
        }

        // Un turno completo per un giocatore
        async function turn(p) {
            const cmdCount = Math.min(CMDS_MAX, CMDS_START + Math.floor((round - 1) / 2));
            const cmds = makeCommands(cmdCount);

            // Espandi in sequenza di tasti da premere
            expected = cmds.flatMap(cmd =>
                Array(cmd.times).fill(buttonFor(p, cmd.action))
            );
            index = 0;
            current = p;

            phase = "announce";
            $("#game-status").textContent = "ASCOLTA I COMANDI";
            setArena(
                "🏎️ Navigatore → " + COLORS[p],
                legendFor(p)
            );

            if (playerIds().length > 1) {
                await sayAsync("Tocca a " + COLORS[p]);
                if (gone()) return false;
            }

            // Annuncia i comandi con gap che si riduce
            for (let i = 0; i < cmds.length; i++) {
                if (gone()) return false;
                await pausable(i === 0 ? 400 : gap());
                if (gone()) return false;
                await sayCommand(cmds[i]);
            }

            if (gone()) return false;
            await pausable(350);

            phase = "input";
            $("#game-status").textContent = "GUIDA · " + COLORS[p].toUpperCase();
            showInput();

            return new Promise(resolve => {
                turnResolve = resolve;
            });
        }

        function endTurn(ok) {
            phase = "between";
            const resolve = turnResolve;
            turnResolve = null;
            if (resolve) resolve(ok);
        }

        async function play() {
            for (round = 1; round <= MAX_ROUNDS; round++) {
                for (const p of [...alive]) {
                    const ok = await turn(p);
                    if (gone()) return;

                    if (ok) {
                        scores[p] = (scores[p] || 0) + 1;
                        render();
                        playSuccess();
                        toast("🏎️ " + COLORS[p] + " ha completato il tratto!");
                    } else {
                        alive = alive.filter(a => a !== p);
                        outOrder.push(p);
                        render();

                        setArena(
                            "💥 INCIDENTE!",
                            COLORS[p] + " ha sbagliato comando",
                            "signal"
                        );

                        await playCrash();
                        if (gone()) return;
                        say("Incidente di " + COLORS[p]);
                    }

                    await pausable(TURN_PAUSE);
                    if (gone()) return;
                }

                const solo = playerIds().length === 1;
                if (solo ? alive.length === 0 : alive.length <= 1) {
                    conclude();
                    return;
                }
            }
            conclude();
        }

        function conclude() {
            phase = "over";
            const order = [...alive, ...[...outOrder].reverse()];
            const solo = playerIds().length === 1;

            if (solo) {
                const p = playerIds()[0];
                finish(
                    "🏎️ Fine gara dopo " + (scores[p] || 0) +
                    ((scores[p] || 0) === 1 ? " tratto" : " tratti"),
                    null
                );
            } else if (alive.length === 1) {
                finish(
                    "🏎️ " + COLORS[alive[0]] + " è l'ultimo in gara: vince!",
                    order
                );
            } else if (alive.length === 0) {
                finish("🏎️ Tutti fuori strada! Pareggio", null);
            } else {
                finish(
                    "🏎️ Troppi giri! Pareggio tra " +
                    alive.map(p => COLORS[p]).join(", "),
                    null
                );
            }
        }

        g.start = async () => {
            phase = "intro";
            alive = [...playerIds()];
            outOrder = [];
            scores = Object.fromEntries(playerIds().map(p => [p, 0]));
            round = 0;

            $("#game-status").textContent = "PREPARATI";
            setArena(
                "🏎️ Preparati…",
                "Le direzioni sono relative a dove sei seduto"
            );
            render();

            await preload();
            if (gone()) return;

            await sayAsync(
                "Rally! Il navigatore dà comandi come 3 destra o 2 accelera. " +
                "Premi il tasto corretto il numero di volte. " +
                "Le direzioni sono relative a te. Man mano i comandi arrivano più veloci. " +
                "Un errore e fai incidente!"
            );
            if (gone()) return;

            play();
        };

        g.onInput = e => {
            if (e.type !== "down" || g.finished || phase !== "input") return;
            if (!ORDER.includes(e.button)) return; // solo tasti giocatore

            if (e.button === expected[index]) {
                index++;
                tone(400 + index * 30, 0.05, "sine", 0.05);

                if (index >= expected.length) {
                    endTurn(true);
                } else {
                    showInput();
                }
            } else {
                toast("Comando sbagliato!");
                endTurn(false);
            }
        };

        g.resume = () => {
            if (phase === "input") {
                showInput();
            } else {
                setArena("🏎️ Si riparte!", "Ascolta i comandi");
            }
        };

        g.dispose = () => {
            stopTimer();
            speechSynthesis?.cancel();
            if (turnResolve) {
                const resolve = turnResolve;
                turnResolve = null;
                resolve(false);
            }
        };

        return g;
    }

    function makeBeeper() {
        const g = baseGame("beeper");

        // === Parametri ===
        const BAD_PER_SPEAKER = 6;        // parolacce che ogni parlatore dice in tutta la partita (intercalari compresi)
        const DECOYS = [2, 4];            // frasi senza parolacce per parlatore (min, max)
        const SENTENCE_GAP = [500, 1400]; // pausa casuale tra una frase e l'altra (ms)
        const BAD_GRACE = 180;            // tolleranza dopo la fine della parolaccia (tempo di rilascio) (ms)
        const BAD_COVER = .3;             // quota minima della parolaccia da coprire
        const BAD_MIN = 100;              // ...ma almeno questi ms
        const NORMAL_COVER = .6;          // quota di una parte normale coperta che fa perdere un punto
        const NORMAL_MAX = 350;           // ...o al massimo questi ms
        const EST_MARGIN = 150;           // margine (ms) quando i tempi sono stimati e non misurati
        const BEEP_VOLUME = .22;
        const BEEP_FREQ = {P1: 1000, P2: 1250, P3: 800, P4: 1500};
        const WRONG_MIN = 150;            // ms di bip sopra un altro parlatore per prendere la penitenza

        // === Parlatori ===
        // lang: voce straniera che legge testo italiano (usata solo se il dispositivo la ha)
        // vi: indice della voce italiana da preferire
        const PERSONAS = [
            {key: "uomo",     name: "l'uomo",                 pitch: .7,  rate: .98,  lang: null,    vi: 1},
            {key: "spagnolo", name: "il parlatore spagnolo", pitch: 1,   rate: .95,  lang: "es",    vi: 0},
            {key: "tedesco",  name: "il parlatore tedesco",   pitch: .9,  rate: .95,  lang: "de",    vi: 0},
            {key: "francese", name: "il parlatore francese",  pitch: 1.1, rate: 1,    lang: "fr",    vi: 0},
        ];

        // === Vocabolario ===
        const BAD = [
            {s: "stronzo", p: "stronzi", a: "uno"},
            {s: "cretino", p: "cretini", a: "un"},
            {s: "idiota", p: "idioti", a: "un"},
            {s: "imbecille", p: "imbecilli", a: "un"},
            {s: "deficiente", p: "deficienti", a: "un"},
            {s: "fesso", p: "fessi", a: "un"},
            {s: "scemo", p: "scemi", a: "uno"},
            {s: "cafone", p: "cafoni", a: "un"}
        ];
        const LISTS = {
            name: ["Marco", "Giulia", "Luca", "Anna", "Paolo", "Sara", "Franco", "Elena"],
            food: ["una pizza", "un gelato", "del pane", "dei biscotti", "una torta", "un panino", "della pasta"],
            where: ["al mercato", "al parco", "in piazza", "al cinema", "in biblioteca", "in giardino", "al mare"],
            nice: ["gentile", "simpatico", "bravissimo", "generoso", "tranquillo", "puntuale", "pazientissimo"],
            weather: ["bello", "nuvoloso", "perfetto", "fresco", "soleggiato"],
            day: ["domani", "stasera", "dopodomani"],
            // intercalari normali: possono stare all'inizio o alla fine della frase
            pre: ["allora", "senti", "ecco", "boh", "cioè", "beh", "dai", "mah", "insomma",
                "ascolta bene", "dico solo che", "sinceramente", "ripeto", "ma scusa"],
            post: ["eh", "ecco", "vero", "capito", "dai", "davvero", "credimi", "te lo giuro",
                "lo dico sul serio", "e non scherzo"]
        };

        // intercalari-parolaccia (il "~" unisce due parole in un solo pezzo)
        const INTER_BAD = ["cazzo", "merda", "porca~miseria"];

        // frasi con cui il parlatore assegna la propria voce al giocatore
        const ASSIGN = [
            "{c}, ti occupi della mia voce?",
            "{c}, la mia voce è tua!",
            "{c}, bippami bene!",
            "{c}, tocca a te coprire me!",
            "{c}, sono io il tuo parlatore."
        ];

        // {b} insulto singolare, {ub} con articolo, {B} insulto plurale
        const ZERO = [
            "oggi {name} ha mangiato {food} {where}",
            "{day} andiamo tutti {where}",
            "secondo me {name} è davvero {nice}",
            "il tempo oggi è {weather}",
            "ci tengo a precisare che {name} è {nice}",
            "{name} mi ha portato {food} ed è stato {nice}",
            "ho appena visto {name} {where} con {name}"
        ];
        const ONE = [
            "sei {b}",
            "{b}",
            "ci tengo a precisare che sei {ub}",
            "{name} è proprio {ub}",
            "non comportarti da {b}",
            "che {b} che sei",
            "ieri {name} è stato {ub} {where}",
            "{name} mi ha portato {food} ma è comunque {ub}",
            "{day} dirò a {name} che è {ub}"
        ];
        const TWO = [
            "sei {b} e pure {b}",
            "{name} è {b} ma anche tu sei {b}",
            "{day} dirò che siete {B} e soprattutto {B}",
            "siete {B} e soprattutto {B}",
            "sei {ub} e anche {ub}",
            "non sei solo {b}, sei anche {b}"
        ];
        const THREE = [
            "{B}, {B} e ancora {B}",
            "sei {b}, {b} e pure {b}"
        ];
        const TEMPLATES = [
            ...ONE.map(tpl => ({tpl, w: 5})),
            ...TWO.map(tpl => ({tpl, w: 3})),
            ...THREE.map(tpl => ({tpl, w: 1}))
        ].map(t => ({...t, bad: (t.tpl.match(/\{(b|ub|B)\}/g) || []).length}));

        let phase = "intro";             // intro | assign | live | over
        let voices = [], itVoices = [];
        let speakers = [];               // [{id, persona}]
        let script = [];
        let waiter = null;
        let open = {}, done = {};        // tasti premuti: inizio aperto e intervalli chiusi
        const beeps = {};
        const kept = [];                 // evita che il browser elimini le frasi prima della fine

        const gone = () => game !== g || g.finished;
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        const rand = ([min, max]) => min + Math.random() * (max - min);
        const randInt = ([min, max]) => min + Math.floor(Math.random() * (max - min + 1));
        const pick = list => list[Math.floor(Math.random() * list.length)];
        const norm = lang => (lang || "").replace("_", "-").toLowerCase();

        function shuffle(list) {
            const a = [...list];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        // Attesa che si ferma se il gioco è in pausa (e rilascia i bip)
        async function pausable(ms) {
            await wait(ms);
            if (paused) closeAll();
            while (paused && !gone()) await wait(150);
        }

        // === Bip dei giocatori ===
        function beepOn(id) {
            if (beeps[id]) return;
            const ctx = ensureAudio();
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = BEEP_FREQ[id] || 1000;
            gain.gain.value = soundEnabled ? BEEP_VOLUME : 0;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            beeps[id] = {osc, gain};
        }

        function beepOff(id) {
            const b = beeps[id];
            if (!b) return;
            beeps[id] = null;
            try { b.osc.stop(); } catch (e) {}
            b.osc.disconnect();
            b.gain.disconnect();
        }

        function pressStart(id) {
            if (open[id] != null) return;
            open[id] = performance.now();
            beepOn(id);
        }

        function pressEnd(id) {
            if (open[id] == null) return;
            (done[id] = done[id] || []).push([open[id], performance.now()]);
            open[id] = null;
            beepOff(id);
        }

        function closeAll() {
            playerIds().forEach(pressEnd);
        }

        function openHeld() {
            [...held].filter(id => playerIds().includes(id)).forEach(pressStart);
        }

        // Millisecondi di bip del giocatore dentro l'intervallo [a, b]
        function overlap(id, a, b) {
            const now = performance.now();
            const list = (done[id] || []).filter(([, e]) => e > now - 20000);
            done[id] = list;
            let total = 0;
            for (const [s, e] of list) total += Math.max(0, Math.min(e, b) - Math.max(s, a));
            if (open[id] != null) total += Math.max(0, Math.min(now, b) - Math.max(open[id], a));
            return total;
        }

        // === Voci ===
        function loadVoices() {
            return new Promise(resolve => {
                if (!("speechSynthesis" in window)) return resolve([]);
                const v = speechSynthesis.getVoices();
                if (v.length) return resolve(v);
                const t = setTimeout(() => resolve(speechSynthesis.getVoices()), 1500);
                speechSynthesis.addEventListener("voiceschanged", () => {
                    clearTimeout(t);
                    resolve(speechSynthesis.getVoices());
                }, {once: true});
            });
        }

        const findVoice = prefix => voices.find(v => norm(v.lang).startsWith(prefix));

        function pickPersonas(n) {
            const available = PERSONAS.filter(p => !p.lang || findVoice(p.lang));
            return shuffle(available).slice(0, n).map(p => ({
                ...p,
                voice: p.lang
                    ? findVoice(p.lang)
                    : (itVoices.length ? itVoices[p.vi % itVoices.length] : null)
            }));
        }

        function makeUtterance(text, persona) {
            const u = new SpeechSynthesisUtterance(text);
            if (persona && persona.voice) {
                u.voice = persona.voice;
                u.lang = persona.voice.lang;
            } else {
                u.lang = "it-IT";
            }
            u.pitch = persona ? persona.pitch : 1;
            u.rate = persona ? persona.rate : 1.05;
            u.volume = soundEnabled ? 1 : 0;
            return u;
        }

        // Pronuncia un testo con la voce del parlatore (usata nell'assegnazione)
        function speak(text, persona) {
            return new Promise(resolve => {
                const t0 = performance.now();
                const u = makeUtterance(text, persona);

                let start = null, finished = false, safety = null;
                const end = () => {
                    if (finished) return;
                    finished = true;
                    clearTimeout(safety);
                    const i = kept.indexOf(u);
                    if (i >= 0) kept.splice(i, 1);
                    resolve({start: start ?? t0, end: performance.now()});
                };
                safety = setTimeout(end, 20000);
                u.onstart = () => {
                    start = performance.now();
                    clearTimeout(safety);
                    safety = setTimeout(end, 20000);
                };
                u.onend = end;
                u.onerror = end;
                kept.push(u);
                speechSynthesis.speak(u);
            });
        }

        // Legge la frase intera e raccoglie gli istanti di inizio di ogni parola, se la voce li fornisce
        function speakTimed(text, persona) {
            return new Promise(resolve => {
                const t0 = performance.now();
                const u = makeUtterance(text, persona);

                const bounds = new Map();   // charIndex -> istante
                let start = null, finished = false, safety = null;
                const end = () => {
                    if (finished) return;
                    finished = true;
                    clearTimeout(safety);
                    const i = kept.indexOf(u);
                    if (i >= 0) kept.splice(i, 1);
                    resolve({start: start ?? t0, end: performance.now(), bounds});
                };
                safety = setTimeout(end, 20000);
                u.onstart = () => {
                    start = performance.now();
                    clearTimeout(safety);
                    safety = setTimeout(end, 20000);
                };
                u.onboundary = ev => {
                    if (ev.name === undefined || ev.name === "word") bounds.set(ev.charIndex, performance.now());
                };
                u.onend = end;
                u.onerror = end;
                kept.push(u);
                speechSynthesis.speak(u);
            });
        }

        // === Generazione delle frasi ===
        function fill(tpl) {
            const bad = shuffle(BAD);
            let i = 0;
            return tpl.replace(/\{(\w+)\}/g, (m, key) => {
                if (key === "b") return "*" + bad[i++ % bad.length].s;
                if (key === "ub") {
                    const w = bad[i++ % bad.length];
                    return w.a + " *" + w.s;
                }
                if (key === "B") return "*" + bad[i++ % bad.length].p;
                return pick(LISTS[key]);
            });
        }

        // Frase sempre diversa dalle precedenti, con intercalari opzionali all'inizio e alla fine.
        // badBudget = quante parolacce-intercalare si possono ancora aggiungere.
        // Restituisce {text, extra}, dove extra è il numero di parolacce-intercalare usate.
        function uniqueSentence(tpl, used, badBudget = 0) {
            let s = "", extra = 0;
            for (let k = 0; k < 25; k++) {
                s = fill(tpl);
                extra = 0;

                // inizio
                if (tpl !== "{b}" && Math.random() < .4) {
                    if (extra < badBudget && Math.random() < .4) {
                        s = "*" + pick(INTER_BAD) + ", " + s;
                        extra++;
                    } else {
                        s = pick(LISTS.pre) + " " + s;
                    }
                }
                // fine
                if (Math.random() < .35) {
                    if (extra < badBudget && Math.random() < .4) {
                        s = s + ", *" + pick(INTER_BAD);
                        extra++;
                    } else {
                        s = s + ", " + pick(LISTS.post);
                    }
                }
                if (!used.has(s)) break;
            }
            used.add(s);
            return {text: s, extra};
        }

        function weightedPick(options) {
            let r = Math.random() * options.reduce((sum, o) => sum + o.w, 0);
            for (const o of options) {
                r -= o.w;
                if (r <= 0) return o;
            }
            return options[0];
        }

        // Ogni parlatore dice esattamente BAD_PER_SPEAKER parolacce (intercalari compresi)
        function buildScript(n) {
            const used = new Set();
            const all = [];
            for (let sp = 0; sp < n; sp++) {
                let remaining = BAD_PER_SPEAKER;
                while (remaining > 0) {
                    const t = weightedPick(TEMPLATES.filter(x => x.bad <= remaining));
                    const {text, extra} = uniqueSentence(t.tpl, used, remaining - t.bad);
                    all.push({speaker: sp, text});
                    remaining -= t.bad + extra;
                }
                const decoys = randInt(DECOYS);
                for (let d = 0; d < decoys; d++) {
                    // trabocchetti: solo intercalari normali (budget 0)
                    all.push({speaker: sp, text: uniqueSentence(pick(ZERO), used, 0).text});
                }
            }
            return shuffle(all);
        }

        // Prepara la frase intera e le posizioni (in caratteri) di parolacce e parti normali
        function prepare(sentence) {
            let full = "";
            const segs = [];
            let cur = null;
            for (const tok of sentence.split(" ")) {
                const bad = tok.startsWith("*");
                const raw = bad ? tok.slice(1).replace(/~/g, " ") : tok;
                const word = raw.replace(/[.,!?;]+$/, "");
                if (full) full += " ";
                const from = full.length;
                full += raw;
                const to = from + word.length;
                if (bad) {
                    cur = null;
                    segs.push({text: word, bad: true, from, to});
                } else if (cur) {
                    cur.to = to;
                } else {
                    cur = {text: raw, bad: false, from, to};
                    segs.push(cur);
                }
            }
            return {text: full, segs};
        }

        // === Punteggio ===
        // Calcola inizio e fine di un pezzo: misurati se la voce dà i confini, altrimenti stimati
        function timesFor(seg, res, full) {
            const total = Math.max(1, full.length);
            const dur = Math.max(1, res.end - res.start);
            const prop = c => res.start + dur * c / total;

            if (res.bounds.has(seg.from)) {
                // tempi misurati: la fine è l'inizio della parola successiva
                let next = null;
                for (const k of res.bounds.keys()) {
                    if (k >= seg.to && (next === null || k < next)) next = k;
                }
                return {
                    start: res.bounds.get(seg.from),
                    end: next !== null ? res.bounds.get(next) : res.end,
                    margin: 40
                };
            }
            // tempi stimati in proporzione ai caratteri
            return {start: prop(seg.from), end: prop(seg.to), margin: EST_MARGIN};
        }

        // Restituisce true se ha assegnato o tolto un punto
        function judge(seg, id, t) {
            const freq = BEEP_FREQ[id] || 1000;
            let changed = false;

            if (seg.bad) {
                const a = t.start - t.margin, b = t.end + t.margin;
                const dur = Math.max(1, b - a);
                const need = Math.min(Math.max(BAD_MIN, dur * BAD_COVER), dur * .8);
                if (overlap(id, a, b + BAD_GRACE) >= need) {
                    scores[id]++;
                    tone(freq * 1.5, .08, "triangle", .1);
                    tone(freq * 2, .1, "triangle", .1, .09);
                    changed = true;
                }
            } else {
                // parti normali: si restringe l'intervallo per non punire gli errori di stima
                const a = t.start + t.margin, b = t.end - t.margin;
                const dur = b - a;
                if (dur > 80) {
                    const need = Math.min(NORMAL_MAX, dur * NORMAL_COVER);
                    if (overlap(id, a, b) >= need) {
                        scores[id]--;
                        tone(110, .25, "square", .1);
                        changed = true;
                    }
                }
            }
            renderScores();
            return changed;
        }

        function waitPress(id, ms) {
            return new Promise(resolve => {
                const t = setTimeout(() => { waiter = null; resolve(); }, ms);
                waiter = {id, done: () => { clearTimeout(t); waiter = null; resolve(); }};
            });
        }

        // Penitenza: chi bippa la frase di un parlatore non suo perde un punto per frase.
// Restituisce true se almeno un giocatore è stato penalizzato.
        function judgeWrong(ownerId, res) {
            let changed = false;
            for (const id of playerIds()) {
                if (id === ownerId) continue;
                if (overlap(id, res.start, res.end) >= WRONG_MIN) {
                    scores[id]--;
                    tone(110, .3, "square", .1);
                    toast("Parlatore sbagliato! " + COLORS[id] + " perde un punto");
                    changed = true;
                }
            }
            renderScores();
            return changed;
        }

        // === Svolgimento ===
        async function play() {
            for (const s of script) {
                const sp = speakers[s.speaker];
                const {text, segs} = prepare(s.text);

                // una sola lettura continua: nessun silenzio tra le parole
                const res = await speakTimed(text, sp.persona);
                if (gone()) return;

                await wait(BAD_GRACE);   // tempo per rilasciare l'ultimo tasto
                if (gone()) return;

                // giudizio dei pezzi in ordine, con una pausa per sentire ogni segnale
                for (const seg of segs) {
                    if (judge(seg, sp.id, timesFor(seg, res, text))) await wait(220);
                    if (gone()) return;
                }

                // giudizio dei pezzi in ordine, con una pausa per sentire ogni segnale
                for (const seg of segs) {
                    if (judge(seg, sp.id, timesFor(seg, res, text))) await wait(220);
                    if (gone()) return;
                }

                // penitenza per chi ha bippato un parlatore non suo
                if (judgeWrong(sp.id, res)) await wait(250);
                if (gone()) return;

                await pausable(rand(SENTENCE_GAP));
                if (gone()) return;

            }
            conclude();
        }

        function conclude() {
            phase = "over";
            closeAll();
            const order = playerIds().sort((a, b) => scores[b] - scores[a]);
            const tie = order.length > 1 && scores[order[0]] === scores[order[1]];
            renderScores();
            finish(
                tie
                    ? "🔇 Pareggio!"
                    : "🔇 " + COLORS[order[0]] + " vince con " + scores[order[0]] + " punti!",
                tie ? null : order
            );
        }

        g.start = async () => {
            phase = "intro";
            open = {};
            done = {};
            waiter = null;
            scores = Object.fromEntries(playerIds().map(p => [p, 0]));

            $("#game-status").textContent = "ASSEGNAZIONE";
            setArena("🎙 Assegno le voci…", "Premi il tuo tasto per provare il bip");
            renderScores();

            if (!("speechSynthesis" in window)) {
                finish("Questo browser non ha la sintesi vocale: gioco non disponibile", null, false);
                return;
            }

            voices = await loadVoices();
            console.log("Bippatore, voci disponibili:", voices.map(v => v.name));
            itVoices = voices.filter(v => norm(v.lang).startsWith("it"));
            const personas = pickPersonas(playerIds().length);
            speakers = playerIds().map((id, i) => ({id, persona: personas[i]}));
            console.log("Bippatore, voci assegnate:",
                speakers.map(s => s.id + " = " + s.persona.key + (s.persona.voice ? " (" + s.persona.voice.name + ")" : " (voce predefinita)")));

            // Intro brevissima
            await sayAsync("Il bippatore. Ora assegno le voci, e tu provi il bip.");
            if (gone()) return;

            // Assegnazione: è il parlatore stesso a chiamare il giocatore
            phase = "assign";
            const phrases = shuffle(ASSIGN);
            for (let i = 0; i < speakers.length; i++) {
                const sp = speakers[i];
                const text = phrases[i % phrases.length].replace("{c}", COLORS[sp.id]);
                await speak(text, sp.persona);
                if (gone()) return;
                await waitPress(sp.id, 5000);
                if (gone()) return;
                await wait(300);
            }

            await sayAsync("Si comincia!");
            if (gone()) return;

            // Azzera le pressioni fatte durante la prova
            closeAll();
            done = {};
            openHeld();

            script = buildScript(speakers.length);
            phase = "live";
            $("#game-status").textContent = "IN ASCOLTO";
            setArena("🎙 Ascolta e bippa!", "Premi il tuo tasto quando il tuo parlatore dice una parolaccia");
            play();
        };

        g.onInput = e => {
            const id = e.button;
            if (!playerIds().includes(id) || g.finished) return;

            if (e.type === "down") {
                if (waiter && waiter.id === id) waiter.done();
                pressStart(id);
            } else if (e.type === "up") {
                pressEnd(id);
            }
        };

        g.resume = () => {
            openHeld();   // durante la pausa gli eventi "up" non arrivano: riparto dai tasti realmente premuti
            setArena("🎙 Si riparte!", "Ascolta e bippa");
        };

        g.dispose = () => {
            stopTimer();
            closeAll();
            speechSynthesis?.cancel();
        };

        return g;
    }

    function makeBeat() {
        const g = baseGame("beat");

        const DIR = "assets/sounds/batteria/";
        const KITS = {
            P1: {name: "la cassa", type: "kick", file: DIR + "kick.mp3"},
            P2: {name: "il rullante", type: "snare", file: DIR + "snare.mp3"},
            P3: {name: "il charleston", type: "hat", file: DIR + "hat.mp3"},
            P4: {name: "il battimani", type: "clap", file: DIR + "clap.mp3"}
        };
        const CLICK = DIR + "click.mp3";

        // === PARAMETRI ===
        const BPM = 60;          // Ritmo lento
        const LOOPS = 5;         // Cinque giri con punteggio
        const COUNT_STEPS = 16;  // Conteggio iniziale: quattro battiti
        const HITS = 2;          // Pochi colpi per strumento
        const TOL = 180;         // Tolleranza: +/- 180 ms
        const LOOKAHEAD = .15;
        const MASTER = .9;

        const STEP_SEC = 60 / BPM / 4;
        const STEPS = 8;         // Pattern corto

        let phase = "intro";
        let pattern = {};
        let events = {};
        let plan = [], pos = 0, nextTime = 0;
        let endPerf = 0, scoringStart = null;
        let currentLoop = 0, snapshot = {};
        let interval = null, noiseBuf = null;
        const buffers = new Map();

        const gone = () => game !== g || g.finished;
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        const legend = () =>
            playerIds().map(p =>
                COLORS[p] + " " + KITS[p].name.replace(/^(il|la) /, "")
            ).join(" · ");

        function shuffle(list) {
            const a = [...list];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        function stopInterval() {
            if (interval !== null) {
                clearInterval(interval);
                interval = null;
            }
        }

        // === CREA UN PATTERN CORTO ===
        function pickSteps(candidates, count, fixed = []) {
            const chosen = [...fixed];

            for (const c of shuffle(
                candidates.filter(c => !fixed.includes(c))
            )) {
                if (chosen.length >= fixed.length + count) break;
                if (chosen.every(x => Math.abs(x - c) > 1)) {
                    chosen.push(c);
                }
            }

            return chosen.sort((a, b) => a - b);
        }

        function buildPattern() {
            const rules = {
                kick:  () => [0, 4],
                snare: () => [2, 6],
                hat:   () => pickSteps([0, 2, 4, 6], HITS),
                clap:  () => pickSteps([1, 3, 5, 7], HITS)
            };

            pattern = {};
            playerIds().forEach(p => {
                pattern[p] = rules[KITS[p].type]();
            });
        }

        // === SUONI ===
        function getNoise(ctx) {
            if (!noiseBuf) {
                noiseBuf = ctx.createBuffer(
                    1, ctx.sampleRate, ctx.sampleRate
                );
                const data = noiseBuf.getChannelData(0);

                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
            }
            return noiseBuf;
        }

        function noiseHit(ctx, when, type, freq, q, vol, dur, out) {
            const src = ctx.createBufferSource();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            src.buffer = getNoise(ctx);
            filter.type = type;
            filter.frequency.value = freq;
            filter.Q.value = q;

            gain.gain.setValueAtTime(vol, when);
            gain.gain.exponentialRampToValueAtTime(.001, when + dur);

            src.connect(filter);
            filter.connect(gain);
            gain.connect(out);
            src.start(when, Math.random() * .5, dur + .02);
        }

        function synth(ctx, type, when, out) {
            if (type === "kick") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.frequency.setValueAtTime(160, when);
                osc.frequency.exponentialRampToValueAtTime(45, when + .12);
                gain.gain.setValueAtTime(1, when);
                gain.gain.exponentialRampToValueAtTime(.001, when + .3);

                osc.connect(gain);
                gain.connect(out);
                osc.start(when);
                osc.stop(when + .32);

            } else if (type === "snare") {
                noiseHit(ctx, when, "bandpass", 1800, .8, .55, .18, out);

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = "triangle";
                osc.frequency.value = 190;
                gain.gain.setValueAtTime(.35, when);
                gain.gain.exponentialRampToValueAtTime(.001, when + .1);

                osc.connect(gain);
                gain.connect(out);
                osc.start(when);
                osc.stop(when + .12);

            } else if (type === "hat") {
                noiseHit(ctx, when, "highpass", 7000, .7, .3, .06, out);

            } else if (type === "clap") {
                [0, .012, .024].forEach(k =>
                    noiseHit(ctx, when + k, "bandpass", 1400, 1, .4, .05, out)
                );
                noiseHit(ctx, when + .036, "bandpass", 1400, 1, .35, .12, out);

            } else {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = "square";
                osc.frequency.value = 1500;
                gain.gain.setValueAtTime(.2, when);
                gain.gain.exponentialRampToValueAtTime(.001, when + .04);

                osc.connect(gain);
                gain.connect(out);
                osc.start(when);
                osc.stop(when + .06);
            }
        }

        function playDrum(type, file, when) {
            const ctx = ensureAudio();
            const out = ctx.createGain();

            out.gain.value = soundEnabled ? MASTER : 0;
            out.connect(ctx.destination);

            const buffer = buffers.get(file);

            if (buffer) {
                const src = ctx.createBufferSource();
                src.buffer = buffer;
                src.connect(out);
                src.start(when);
            } else {
                synth(ctx, type, when, out);
            }
        }

        function render() {
            renderScores();
        }

        // === PREPARA CONTEGGIO, PROVA E PARTITA ===
        function buildPlan(fromLoop) {
            const items = [];

            // Conteggio iniziale senza punteggio
            for (let i = 0; i < COUNT_STEPS; i++) {
                items.push({
                    click: i % 4 === 0,
                    s: -1,
                    loop: fromLoop
                });
            }

            // Un giro di prova, solo all'inizio
            if (fromLoop === 0) {
                for (let s = 0; s < STEPS; s++) {
                    items.push({
                        click: false,
                        s,
                        loop: -1,
                        practice: true
                    });
                }
            }

            // Giri ufficiali con punteggio
            for (let l = fromLoop; l < LOOPS; l++) {
                for (let s = 0; s < STEPS; s++) {
                    items.push({
                        click: false,
                        s,
                        loop: l
                    });
                }
            }

            return items;
        }

        function startPlan(fromLoop) {
            const ctx = ensureAudio();

            plan = buildPlan(fromLoop);
            pos = 0;
            nextTime = ctx.currentTime + .25;
            scoringStart = null;

            events = Object.fromEntries(
                playerIds().map(p => [p, []])
            );

            $("#game-status").textContent = "CONTEGGIO";
            setArena("🥁 Quattro tempi…", legend());
        }

        // === RIPRODUZIONE DEI COLPI ===
        function scheduleItem(item, when, ctx) {

            // Giro di prova: suona senza registrare eventi o punti
            if (item.practice) {
                if (item.s === 0) {
                    phase = "practice";
                    $("#game-status").textContent = "PROVA SENZA PUNTEGGIO";
                    setArena("🥁 Giro di prova", legend(), "signal");
                }

                playerIds().forEach(p => {
                    if (pattern[p].includes(item.s)) {
                        playDrum(KITS[p].type, KITS[p].file, when);
                    }
                });

                return;
            }

            const lat = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
            const perf = performance.now() +
                (when - ctx.currentTime + lat) * 1000;

            if (item.s < 0) {
                if (item.click) playDrum("click", CLICK, when);
                return;
            }

            if (item.s === 0) {
                phase = "live";
                currentLoop = item.loop;
                snapshot = {...scores};

                $("#game-status").textContent =
                    "LOOP " + (item.loop + 1) + " / " + LOOPS;

                setArena(
                    "🥁 Loop " + (item.loop + 1) + " / " + LOOPS,
                    legend(),
                    "signal"
                );
            }

            if (scoringStart === null) scoringStart = perf;

            playerIds().forEach(p => {
                if (pattern[p].includes(item.s)) {
                    playDrum(KITS[p].type, KITS[p].file, when);
                    events[p].push({t: perf, claimed: false});
                }
            });
        }

        // === CICLO PRINCIPALE ===
        function tick() {
            if (
                paused ||
                g.finished ||
                (phase !== "live" && phase !== "practice")
            ) {
                return;
            }

            const ctx = ensureAudio();

            while (
                pos < plan.length &&
                nextTime < ctx.currentTime + LOOKAHEAD
                ) {
                scheduleItem(plan[pos], nextTime, ctx);

                if (pos === plan.length - 1) {
                    endPerf = performance.now() +
                        (nextTime - ctx.currentTime) * 1000 +
                        STEP_SEC * 1000 + TOL + 500;
                }

                pos++;
                nextTime += STEP_SEC;
            }

            const now = performance.now();

            playerIds().forEach(p => {
                events[p] = events[p].filter(ev => ev.t > now - 1000);
            });

            if (pos >= plan.length && now > endPerf) {
                conclude();
            }
        }

        function conclude() {
            phase = "over";
            stopInterval();

            const order = playerIds().sort(
                (a, b) => scores[b] - scores[a]
            );

            const tie = order.length > 1 &&
                scores[order[0]] === scores[order[1]];

            render();

            finish(
                tie
                    ? "🥁 Pareggio!"
                    : "🥁 " + COLORS[order[0]] +
                    " vince con " + scores[order[0]] + " punti!",
                tie ? null : order
            );
        }

        // === AVVIO ===
        g.start = async () => {
            phase = "intro";
            scores = Object.fromEntries(
                playerIds().map(p => [p, 0])
            );
            snapshot = {...scores};
            currentLoop = 0;

            $("#game-status").textContent = "PREPARATI";
            setArena("🥁 Preparati…", legend());
            render();
            buildPattern();

            const files = [
                CLICK,
                ...Object.values(KITS).map(k => k.file)
            ];

            const preload = Promise.all(
                files.map(async f => buffers.set(f, await loadSample(f)))
            );

            await sayAsync(
                "Tieni il tempo. Prima faremo un giro di prova senza punteggio. " +
                "Poi inizierà la partita. Premi il tuo tasto quando senti " +
                "la tua percussione."
            );

            await preload;
            if (gone()) return;

            // Presentazione dei suoni
            for (const p of playerIds()) {
                await sayAsync(COLORS[p] + ", " + KITS[p].name + ".");
                if (gone()) return;

                const ctx = ensureAudio();

                playDrum(KITS[p].type, KITS[p].file, ctx.currentTime + .05);
                playDrum(
                    KITS[p].type,
                    KITS[p].file,
                    ctx.currentTime + .5
                );

                await wait(900);
                if (gone()) return;
            }

            await sayAsync(
                "Quattro tempi, poi un giro di prova senza punti. " +
                "Ascolta il ritmo e preparati!"
            );

            if (gone()) return;

            startPlan(0);
            phase = "live";
            interval = setInterval(tick, 25);
        };

        // === PRESSIONE DEI TASTI ===
        g.onInput = e => {
            if (
                e.type !== "down" ||
                !playerIds().includes(e.button) ||
                g.finished
            ) {
                return;
            }

            const id = e.button;

            // Durante la presentazione puoi provare il tuo suono
            if (phase === "intro") {
                playDrum(
                    KITS[id].type,
                    KITS[id].file,
                    ensureAudio().currentTime
                );
                return;
            }

            // Nessun punto durante la prova
            if (phase !== "live") return;

            const t = performance.now();

            if (scoringStart === null || t < scoringStart - TOL) return;
            if (pos >= plan.length && t > endPerf - 400) return;

            let best = null;

            for (const ev of events[id]) {
                if (ev.claimed) continue;

                const d = Math.abs(t - ev.t);

                if (
                    d <= TOL &&
                    (best === null || d < Math.abs(t - best.t))
                ) {
                    best = ev;
                }
            }

            if (best) {
                best.claimed = true;
                scores[id]++;
                tone(1300, .04, "sine", .05);
            } else {
                scores[id]--;
                tone(100, .2, "square", .1);
                toast("Fuori tempo! " + COLORS[id] + " perde un punto");
            }

            render();
        };

        // === RIPRESA ===
        g.resume = () => {
            if (phase !== "live") return;

            scores = {...snapshot};
            render();
            startPlan(currentLoop);
            phase = "live";
        };

        g.dispose = () => {
            stopTimer();
            stopInterval();
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