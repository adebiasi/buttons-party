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
        simon: "Ascolta la sequenza e ripetila usando tutti e cinque i tasti. A turno, un errore elimina."
    };
    const GAME_NAMES = {
        pig: "Cattura il maiale",
        duel: "Duello",
        parachute: "Paracadutisti",
        disturber: "Disturbatore",
        pot: "Piglia tutto",
        simon: "Simon a 5 tasti"
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

    function finish(message, ranking = null) {
        if (!game || game.finished) return;
        game.finished = true;
        stopTimer();
        stopFallSound(); // Ferma il suono della caduta

        setArena(message, "Premi ✕ Esci per tornare al menu", "signal");
        $("#game-status").textContent = "FINE PARTITA";
        if (ranking) {
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
            simon: makeSimon
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
        let ready = new Set(), eligible = new Set(), round = 1, started = false, goAt = 0, wins = {};
        const total = 5;
        g.start = () => {
            wins = Object.fromEntries(playerIds().map(p => [p, 0]));
            round = 1;
            beginRound();
        };

        function beginRound() {
            if (g.finished) return;
            ready.clear();
            eligible = new Set(playerIds());
            started = false;
            g.duelWinner = undefined;
            setArena("Round " + round + " / " + total, "Premi il tuo tasto per prepararti");
            $("#game-status").textContent = "DUELLO";
            renderScores(wins);
            say("Round " + round + ". Prepararsi");
        }

        function signal() {
            if (g.finished) return;
            started = true;
            goAt = performance.now();

            setArena("🔥 VIA!", "Premi il tuo tasto!", "signal");

            playSample("assets/sounds/inizio-duello.mp3", () => {
                tone(880, .28, "square", .18);
            });

            later(() => {}, 5000);
        }


        function resolve(id) {
            if (g.finished) return;

            // Il vincitore ha già sparato: gli altri sentono
            // il proiettile che passa.
            if (g.duelWinner !== undefined) {
                playSample("assets/sounds/proiettile-schiavato.mp3", () => {});
                return;
            }

            g.duelWinner = id;

            // Suono dello sparo del primo giocatore
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
            if (!started) {
                if (!ready.has(id)) {
                    ready.add(id);
                    tone(500, .08);
                    toast(COLORS[id] + " pronto");
                }
                if (ready.size === players) {
                    setArena("Non muoverti…", "Aspetta il segnale");
                    later(() => {
                        if (g.finished) return;
                        signal();
                    }, 3000 + Math.random() * 5000);
                }
                return;
            }
            if (!eligible.has(id)) {
                if (g.duelWinner !== undefined && id !== g.duelWinner) {
                    playSample("assets/sounds/proiettile-schiavato.mp3", () => {});
                }
                return;
            }
            eligible.delete(id);
            if (performance.now() < goAt + 15) {
                tone(100, .3, "square");
                toast("Falsa partenza: " + COLORS[id]);
                if (eligible.size === 0) {
                    later(beginRound, 900);
                }
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
        let start = 0, ground = 0, safe = 0, opened = {}, results = {};


        g.start = async () => {
            opened = {};
            results = {};

            $("#game-status").textContent = "CADUTA LIBERA";
            setArena("🪂 In caduta…", "Apri il paracadute prima dell'impatto");
            say("Caduta libera. Senti il suono e scegli quando aprire.");

            const duration = await startFallSound("assets/sounds/caduta.mp3");

            // Se manca l'audio, usa comunque una caduta di 25-40 secondi.
            ground = duration ?? (25000 + Math.random() * 15000);

            // IMPORTANTE: inizializza il tempo dopo il caricamento dell'audio.
            start = performance.now();

            safe = ground * (0.35 + Math.random() * 0.25);

            tick();
        };


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

                if (missed) {
                    playSample("assets/sounds/splash.mp3", () => {});
                }

                const order = playerIds().sort((a, b) => rank(results, a, b));
                finish("💥 Impatto! " + COLORS[order[0]] + " in testa", order);
                return;
            }

            later(tick, 200);
        }

        function rank(r, a, b) {
            const x = r[a] || {valid: false, time: ground + 1};
            const y = r[b] || {valid: false, time: ground + 1};

            if (x.valid !== y.valid) return x.valid ? -1 : 1;
            if (x.valid) return y.time - x.time;

            return y.time - x.time;
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || opened[e.button] || g.finished) return;

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
        };

        return g;
    }

    function makeDisturber() {
        const g = baseGame("disturber");
        let target = "MARTA", active = false, ended = false, start = 0, points = {}, tolerance = 250;
        g.start = () => {
            start = performance.now();
            points = Object.fromEntries(playerIds().map(p => [p, 0]));
            $("#game-status").textContent = "ASCOLTA IL BERSAGLIO";
            say("Premi quando senti Marta");
            setArena("🗣 Brusio…", "Premi quando senti MARTA");
            schedule();
        };

        function schedule() {
            if (g.finished) return;
            if (performance.now() - start > 60000) {
                const order = playerIds().sort((a, b) => points[b] - points[a]);
                finish("Tempo scaduto! Vince " + COLORS[order[0]], order);
                return;
            }
            active = false;
            setArena("🗣 Voci in sottofondo…", "Cerca la voce di " + target);
            tone(180, .15, "sawtooth", .025);
            later(() => {
                const isTarget = Math.random() < .38;
                active = isTarget;
                setArena(isTarget ? "📣 MARTA!" : "🗣 Un'altra voce", isTarget ? "ORA! Premi il tuo tasto" : "Non premere", isTarget ? "signal" : "");
                tone(isTarget ? 660 : 300, .22, "triangle", .07);
                if (isTarget) later(() => {
                    active = false;
                    schedule();
                }, 750); else later(schedule, 500);
            }, 800 + Math.random() * 1300);
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;
            points[e.button] += active ? 1 : -1;
            scores[e.button] = points[e.button];
            renderScores();
            if (active) {
                tone(850, .08, "triangle", .07);
                toast("+1 punto");
            } else {
                tone(100, .2, "square", .07);
                toast("Fuori bersaglio: -1");
            }
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

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
        window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {
        }));
    }
    updateSetup();
})();