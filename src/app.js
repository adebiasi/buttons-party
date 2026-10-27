(() => {
    "use strict";
    const $ = (s) => document.querySelector(s);
    const buttons = [...document.querySelectorAll("[data-button]")];
    const COLORS = {P1: "Rosso", P2: "Blu", P3: "Giallo", P4: "Verde", C: "Centro"};
    const PLAYER_BUTTONS = ["P1", "P2", "P3", "P4"];
    const KEY_MAP = {"1": "P1", "2": "P2", "3": "P3", "4": "P4", " ": "C", "Enter": "C"};
    const DESCRIPTIONS = {
        typewriter: "Premi il tuo tasto più veloce che puoi: ogni pressione fa il rumore di un tasto di macchina da scrivere e vale un punto. Quando senti il campanello di fine riga fermati: ogni pressione durante il campanello toglie un punto, anche sotto zero. Quando il suono finisce riparti subito. Dopo cinque righe il gioco finisce. Vince chi ha più punti.",
        tug: "Premi il tuo tasto più veloce che puoi per tirare la corda dalla tua parte. In due: al meglio di tre round. In tre: tre sfide uno contro uno. In quattro: due squadre, le pressioni dei compagni si sommano.",
        bounty: "Il narratore dice chi è il ricercato, poi dà il via, e alla fine di ogni round dice chi ha vinto. Tutti premono: se arrivi prima tu prendi un punto e il ricercato ne perde uno. Se il ricercato è più veloce, si salva e prende un punto. Se premi prima del via perdi un punto.",
        copyrhythm: "Un giocatore crea un ritmo di 8 battute premendo il suo tasto. Gli altri lo copiano tutti insieme seguendo la base. Poi cambia il creatore. Si fa un giro completo.",
        horse: "Cavallino: premi per galoppare e passare al prossimo, doppio tocco per saltare un giocatore, tieni premuto per invertire il verso. Il tempo per agire diminuisce continuamente. Si giocano tre round.",
        thirsty: "Quante birre riesci a bere? Per ogni birra: premi per stappare, tieni premuto per bere, premi per buttare il bicchiere, tieni premuto per il rutto. Se lasci il tasto il suono riparte da dove eri. Conta solo la sequenza completa. In due: turni singoli. In tre: tre sfide uno contro uno. In quattro: due squadre, uno stappa e butta, l'altro beve e rutta.",
        pig: "Ascolta i versi: premi quando senti il maiale, non gli altri animali. Vince chi ne cattura cinque.",
        duel: "Aspetta il segnale e premi appena lo senti. Anticipare significa falsa partenza. Il narratore dice chi vince ogni round.",
        parachute: "Apri il paracadute il più tardi possibile, ma prima dell'impatto. L'esito è rivelato alla fine. Si giocano tre round.",
        disturber: "Premi il più possibile mentre parla Topo Gigio: ogni pressione è un punto. Quando non parla, ogni pressione toglie un punto. Ogni giocatore ha un suono diverso.",        pot: "Il piatto cresce: incassa quando vuoi, ma se aspetti troppo rischi di perdere tutto. Si giocano tre round.",
        simon: "Simon a catena: il primo sceglie una nota, poi in senso orario ognuno ripete tutta la sequenza e ne aggiunge una. Hai 3 secondi tra una nota e l'altra. Chi sbaglia è eliminato. Il tasto centrale mette in pausa.",
        mosquito: "Una zanzara vola intorno a te: premi quando il ronzio è fortissimo, cioè quando è vicina. Se premi troppo presto perdi un punto. Si giocano tre round.",
        mine: "Ascolta il canarino: se smette di cantare per più di 10 secondi è morto. Allora premi entro 2 secondi. Se premi prima scappi, se premi dopo è troppo tardi. Vince l'ultimo a uscire in tempo. Si giocano tre round.",
        freeze: "Premi il più possibile mentre senti uno, due, tre. Appena senti «stai là!» fermati: chi preme è squalificato. Vince chi arriva per primo al numero di passi stabilito.",
        lesson: "Il prof di inglese spiega: finché parla (e il gesso scrive) premi il più possibile, e sentirai il tuo suono sempre più forte. Quando si ferma, fermati anche tu: chi preme viene scoperto e sospeso. Vince chi arriva per primo al numero di pressioni stabilito, o l'ultimo rimasto in classe.",
        door: "Qualcuno bussa o suona il campanello. Se è una persona che vuoi vedere, premi il più in fretta possibile per aprire; se non la vuoi, non aprire! Il primo che preme apre la porta. Ogni partita cambia il modo di bussare di ogni persona: all'inizio vengono presentate. Apri alla persona giusta e prendi un punto, apri a quella sbagliata e lo perdi.",
        restaurant: "Il ristoratore annuncia i piatti: prenota premendo per primo quelli buoni. Se prenoti un piatto immangiabile, paghi la penitenza e perdi un punto.",
        grinder: "Tieni premuto per spingere il legno contro la mola. Quando il suono finisce, lascia subito il tasto o perdi la mano! Vince chi tiene premuto più a lungo in totale.",
        bomb: "La bomba passa da un giocatore all'altro: premi solo quando senti il tuo colore. Se premi fuori turno o non fai in tempo, sei eliminato. Il ritmo accelera sempre di più, soprattutto quando restano in due. Si giocano tre round.",
        rope: "La corda batte a terra a ritmo regolare: premi il tuo tasto nello stesso istante del colpo. I primi tre colpi sono di prova. Chi non salta o salta fuori tempo è eliminato. Il ritmo accelera. Vince l'ultimo rimasto. Si giocano tre round.",        tennis: "Senti il rimbalzo della palla: quando rimbalza verso di te, premi per rispondere. Poi tocca al giocatore successivo in senso orario. Se premi prima del tuo rimbalzo resti fermo 2 secondi. Se manchi la palla sei eliminato. Si giocano tre round.",
        tapas: "A turno, ascolta il percorso e ripetilo con i tasti. Aspetta di aver sentito tutte le istruzioni prima di eseguirle. Le direzioni sono relative a te. Un chilometro è una pressione. Se sbagli sei licenziato.",
        rally: "Quando tocca a te la macchina parte: il navigatore dice comandi come «3 destra» o «2 accelera» e tu premi subito, senza aspettare. I comandi arrivano sempre più veloci e ravvicinati. Un errore o un ritardo e fai incidente. Vince chi completa più comandi.",
        beeper: "Ogni giocatore ha un parlatore diverso, assegnato a voce. Tieni premuto per bippare tutta la parolaccia: più la copri, più punti prendi (fino a 3). Più tieni premuto su parole normali, più punti perdi (1,5 al secondo). Se bippi un parlatore che non è il tuo perdi punti allo stesso modo. Ogni parlatore dice lo stesso numero di parolacce.",
        beat: "Ogni giocatore ha una percussione: cassa, rullante, charleston o battimani. Premi il tuo tasto a tempo quando senti la tua. Se premi nel momento sbagliato perdi un punto. Dopo tre loop la partita finisce.",
    }
    const GAME_NAMES = {
        pig: "Cattura il maiale",
        duel: "Duello",
        parachute: "Paracadutisti",
        disturber: "Disturbatore",
        pot: "Piglia tutto",
        simon: "Simon",
        mosquito: "Prendi la zanzara",
        mine: "In miniera",
        freeze: "Uno, due, tre, stai là!",
        lesson: "A lezione",
        door: "Chi bussa alla porta",
        restaurant: "Ristorante",
        grinder: "Mola a disco",
        bomb: "Palla esplosiva",
        rope: "Saltare la corda",
        tennis: "Tennis",
        typewriter: "Macchina da scrivere",
        tapas: "Consegna tapas",
        rally: "Rally",
        beeper: "Il bippatore",
        beat: "Tieni il tempo",
        thirsty: "Assetato",
        tug: "Tiro alla fune",
        bounty: "Taglia",
        copyrhythm: "Copia il ritmo",
        horse: "Cavallino",
    };
    const ANIMALS = ["cane", "gatto", "mucca", "pecora", "gallina", "cavallo", "papera", "gallo"];

    let pausedTotal = 0, pausedSince = 0;

    let audio = null, soundEnabled = true, game = null, timer = null, paused = false;
    let natureSource = null, natureGain = null, natureVolume = 0.08;
    let held = new Set(), players = 4, scores = {}, toastTimer = null;
    // Tasti scelti dai giocatori (es. ["P2","P3"]); null = i primi `players` tasti.
    let activeButtons = null;
    // Se false, il tasto centrale senza partita in corso non avvia un gioco (usato da narratore.html).
    let menuStartEnabled = true;
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
        if (!audio) {
            audio = new (window.AudioContext || window.webkitAudioContext)();
            setTimeout(preloadAll, 0);              // precarica tutti i file al primo gesto
        }
        if (audio.state === "suspended") audio.resume();
        return audio;
    }

// Latenza di uscita: ms tra start() e il suono realmente udibile
    function latencyMs() {
        const a = ensureAudio();
        return ((a.outputLatency || 0) + (a.baseLatency || 0)) * 1000;
    }

// Tempo di gioco che NON conta la pausa
    const activeNow = () =>
        performance.now() - pausedTotal - (paused ? performance.now() - pausedSince : 0);

// Durata udibile (ignora il silenzio in coda al file)
    const audibleCache = new WeakMap();

    function audibleDurationMs(buffer, thr = .01) {
        if (audibleCache.has(buffer)) return audibleCache.get(buffer);
        const d = buffer.getChannelData(0);
        let i = d.length - 1;
        while (i > 0 && Math.abs(d[i]) < thr) i--;
        const ms = (i / buffer.sampleRate) * 1000;
        audibleCache.set(buffer, ms);
        return ms;
    }

// Fine percepita del suono (ms): l'ultimo punto in cui il volume (finestre da 10 ms) supera una quota del picco.
// Ignora le code lunghe e debolissime che fanno sembrare il suono più lungo di quanto si senta.
    const perceivedCache = new WeakMap();

    function perceivedDurationMs(buffer, rel = .15) {
        if (perceivedCache.has(buffer)) return perceivedCache.get(buffer);
        const d = buffer.getChannelData(0), win = Math.max(1, Math.round(buffer.sampleRate * .01));
        const rms = [];
        let peak = 0;
        for (let i = 0; i + win <= d.length; i += win) {
            let sum = 0;
            for (let j = i; j < i + win; j++) sum += d[j] * d[j];
            const v = Math.sqrt(sum / win);
            rms.push(v);
            if (v > peak) peak = v;
        }
        let k = rms.length - 1;
        while (k > 0 && rms[k] < peak * rel) k--;
        const ms = (k + 1) * 10;
        perceivedCache.set(buffer, ms);
        return ms;
    }

    /**
     * HELPER UNICO. Riproduce un file e restituisce i tempi reali:
     *   audibleAt : istante (performance.now) in cui il suono si SENTE (latenza compensata)
     *   endsAt    : istante in cui finisce la parte udibile
     *   ended     : Promise che si risolve a fine suono
     * Se il file manca usa `fallback()` e stima la durata con `fallbackMs`.
     */
    async function playTimed(path, {volume = 1, rate = 1, pan = 0, fallback = null, fallbackMs = 600} = {}) {
        const buffer = await loadSample(path);
        if (!buffer) {
            fallback?.();
            const now = performance.now();
            return {
                audibleAt: now, endsAt: now + fallbackMs, duration: fallbackMs, synthetic: true,
                ended: new Promise(r => setTimeout(r, fallbackMs))
            };
        }
        const ctx = ensureAudio();
        const src = ctx.createBufferSource(), gain = ctx.createGain();
        src.buffer = buffer;
        src.playbackRate.value = rate;
        gain.gain.value = soundEnabled ? volume : 0;
        src.connect(gain);
        let out = gain;
        if (pan && ctx.createStereoPanner) {
            const p = ctx.createStereoPanner();
            p.pan.value = pan;
            gain.connect(p);
            out = p;
        }
        out.connect(ctx.destination);
        const when = ctx.currentTime + .02;
        const ended = new Promise(r => {
            src.onended = r;
        });
        src.start(when);
        const audibleAt = performance.now() + (when - ctx.currentTime) * 1000 + latencyMs();
        const duration = audibleDurationMs(buffer) / rate;
        return {audibleAt, endsAt: audibleAt + duration, duration, source: src, ended};
    }

// Le due vecchie funzioni diventano semplici wrapper (ora rispettano anche il tasto audio)
    async function playSample(path, fallback) {
        await playTimed(path, {fallback});
    }

    async function playSampleWait(path, fallback) {
        const t = await playTimed(path, {fallback, fallbackMs: 600});
        return t.ended;
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

    const DIR_ = d => n => `assets/sounds/${d}/${n}.mp3`;
    const ALL_SOUNDS = [
        ...["background-cattura-maiale", "punto", "penalita", "maiale", ...ANIMALS].map(DIR_("maiale")),
        ...["falsa-partenza", "inizio-duello", "proiettile-schiavato", "pistola-sparo"].map(DIR_("duello")),
        "assets/sounds/caduta.mp3", "assets/sounds/splash.mp3", "assets/sounds/paracadute.mp3",
        ...["background-voci", ...[1, 2, 3, 4, 5, 6].map(n => "topo-gigio-" + n),
            ...[1, 2, 3, 4].map(n => "colpo-" + n), ...[1, 2, 3, 4].map(n => "errore-" + n)].map(DIR_("disturbatore")),
        ...["gettone", "incasso"].map(DIR_("pot")),
        ...["ronzio", "presa", "mancata"].map(DIR_("zanzara")),
        ...["picconi", "canarino-1", "canarino-2", "canarino-3", "canarino-4", "passi", "grido"].map(DIR_("miniera")),
        ...["uno-due-tre", "stai-la", "passi", "squalificato"].map(DIR_("unoduetre")),
        ...["gesso", "sospeso", "patatine", "lattina", "cannuccia", "caramella"].map(DIR_("lezione")),
        ...["porta-apre", ...[1, 2, 3, 4, 5, 6].map(n => "bussare-" + n), ...[1, 2, 3, 4, 5, 6].map(n => "campanello-" + n),
            ...["partner", "amici", "corriere", "caldaia", "pizza", "nonna", "vigile", "testimoni", "venditore", "ex", "vicino", "giudiziario"].map(k => "persona-" + k)].map(DIR_("porta")),
        ...["lasagne", "pizza", "tiramisu", "spaghetti-pomodoro", "cotoletta", "gelato-cioccolato",
            "riso-cacca", "involtini-vomito", "zuppa-calzini", "spaghetti-capelli", "bistecca-scarpa", "gelato-moccio",
            "background-ristorante", "prenotato", "bleah"].map(DIR_("ristorante")),
        ...["mola", "legno-finito", "grido"].map(DIR_("mola")),
        ...["tic", "tac", "salto", "esplosione", "errore", "rosso", "blu", "giallo", "verde"].map(DIR_("bomba")),
        ...["bambini", "corda", "salto", "inciampo"].map(DIR_("corda")),
        ...["rimbalzo", "racchetta", "fallo", "mancata"].map(DIR_("tennis")),
        ...["consegna", "licenziato", "motorino", "motorino-loop", "frenata", "consegnata",
            "avanti", "destra", "indietro", "sinistra", "km-1", "km-2", "km-3", "km-4"].map(DIR_("tapas")),
        ...["incidente", "ok", "accelera"].map(DIR_("rally")),
        ...["stappa", "bevi", "finita", "bicchiere-rotto", "rutto"].map(DIR_("assetato")),
        ...["tifo", "sforzo-a", "sforzo-b", "partenza"].map(DIR_("fune")),
        ...["sparo", "ricercato-corsa", "inizio-premi", "tardi", "ricercato-tardi"].map(DIR_("taglia")),
        ...["kick", "snare", "hat", "clap", "click"].map(DIR_("batteria")),
        ...["galoppo", "salto", "cambio-verso", "via"].map(DIR_("cavallino")),
        ...["rosso", "blu", "giallo", "verde"].map(DIR_("simon")),
        ...["applausi", "buu"].map(DIR_("classifica")),
    ];

    async function preloadAll() {
        const queue = [...new Set(ALL_SOUNDS)];
        const worker = async () => {
            while (queue.length) await loadSample(queue.shift());
        };
        await Promise.all([worker(), worker(), worker(), worker()]);   // 4 alla volta
        window.BPDebug?.log("audio", "ok", "precaricati " + ALL_SOUNDS.length + " file");
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

// makeFallback(ctx) -> AudioBuffer: sottofondo sintetico se il file manca
    async function startNatureAmbience(path = "assets/sounds/background-cattura-maiale.mp3", volume = 0.08, makeFallback = null) {
        stopNatureAmbience();
        natureVolume = volume;

        let buffer = await loadSample(path);

        if (!buffer && makeFallback) {
            try {
                buffer = makeFallback(ensureAudio());
            } catch (e) {
                console.warn("Sottofondo sintetico non riuscito:", e);
            }
        }

        if (!buffer) {
            console.warn("Sottofondo natura non disponibile:", path);
            return;
        }

        const ctx = ensureAudio();
        natureSource = ctx.createBufferSource();
        natureGain = ctx.createGain();

        natureSource.buffer = buffer;
        natureSource.loop = true;
        natureGain.gain.value = soundEnabled && !paused ? volume : 0;

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
        natureVolume = volume;
        if (natureGain) {
            natureGain.gain.value = soundEnabled && !paused ? volume : 0;
        }
    }

// Brusio di sala sintetico: mormorio (rumore filtrato che ondeggia) + tintinnii di posate.
// Ogni onda ha un numero intero di cicli nel buffer, così il loop non ha scatti.
    function makeCrowdBuffer(ctx) {
        const sr = ctx.sampleRate, len = Math.floor(sr * 8);
        const buffer = ctx.createBuffer(1, len, sr), d = buffer.getChannelData(0);
        const TAU = Math.PI * 2;
        let lp = 0, lp2 = 0;
        for (let i = 0; i < len; i++) {
            lp += ((Math.random() * 2 - 1) - lp) * .12;
            lp2 += (lp - lp2) * .25;
            const t = i / len;
            const env = .55 + .2 * Math.sin(TAU * 3 * t) + .15 * Math.sin(TAU * 5 * t + 1) + .1 * Math.sin(TAU * 7 * t + 2);
            d[i] = (lp - lp2) * 3.6 * env;
        }
        for (let k = 0; k < 16; k++) {
            const at = Math.floor(Math.random() * len), f = 2400 + Math.random() * 1900,
                amp = .12 + Math.random() * .16;
            for (let j = 0; j < sr * .14; j++) {
                d[(at + j) % len] += Math.sin(TAU * f * j / sr) * Math.exp(-j / (sr * .03)) * amp;
            }
        }
        for (let i = 0; i < len; i++) d[i] = Math.max(-1, Math.min(1, d[i]));
        return buffer;
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

    // === Suoni della classifica finale: applausi per il primo, buu per gli altri ===
    function synthApplause() {
        if (!soundEnabled) return;
        const a = ensureAudio(), dur = 2.4, size = Math.floor(a.sampleRate * dur);
        const buffer = a.createBuffer(1, size, a.sampleRate), d = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) {
            const t = i / a.sampleRate;
            const env = Math.min(1, t * 6) * Math.min(1, (dur - t) * 1.5);
            d[i] = (Math.random() * 2 - 1) * env * (Math.random() < .002 ? 1 : .35);   // fruscio + battiti singoli
        }
        const src = a.createBufferSource(), band = a.createBiquadFilter(), gain = a.createGain();
        src.buffer = buffer;
        band.type = "bandpass";
        band.frequency.value = 2200;
        band.Q.value = .6;
        gain.gain.value = .5;
        src.connect(band);
        band.connect(gain);
        gain.connect(a.destination);
        src.start();
    }

    function synthBoo(position = 2, total = 4) {
        if (!soundEnabled) return;
        const a = ensureAudio(), now = a.currentTime;
        const base = 200 - (position - 2) * 25;                  // più si è in fondo, più il buu è grave
        const osc = a.createOscillator(), lfo = a.createOscillator(), lfoGain = a.createGain();
        const low = a.createBiquadFilter(), gain = a.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * .7, now + 1.1);
        lfo.frequency.value = 5;
        lfoGain.gain.value = 6;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        low.type = "lowpass";
        low.frequency.value = 500;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(.22, now + .15);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);
        osc.connect(low);
        low.connect(gain);
        gain.connect(a.destination);
        osc.start(now);
        lfo.start(now);
        osc.stop(now + 1.25);
        lfo.stop(now + 1.25);
    }

    // Suono di fine posizione: 1 = applausi, le altre = buu (più grave in fondo). Restituisce una Promise a fine suono.
    async function positionSound(position, total = 4) {
        const first = position === 1;
        const t = await playTimed(
            first ? "assets/sounds/classifica/applausi.mp3" : "assets/sounds/classifica/buu.mp3",
            {
                volume: first ? .9 : .7,
                rate: first ? 1 : (position >= total ? .85 : 1),
                fallback: () => first ? synthApplause() : synthBoo(position, total),
                fallbackMs: first ? 2400 : 1300
            });
        return t.ended;
    }

    function beepButton(id) {
        const freqs = {P1: 330, P2: 392, P3: 494, P4: 262, C: 587};
        tone(freqs[id] || 440, .07, "sine", .045);
    }


// Voce preferita del narratore
    const NARRATOR_VOICE_NAME = "Google italiano";
    const NARRATOR_LANG = "it-IT";
    const NARRATOR_RATE = 1.0;
    const NARRATOR_PITCH = 0.7;

    let cachedNarratorVoice = null;

    function getNarratorVoice() {
        if (cachedNarratorVoice) return cachedNarratorVoice;

        const voices = speechSynthesis.getVoices();
        // Cerca prima per nome esatto
        let voice = voices.find(v => v.name === NARRATOR_VOICE_NAME);
        // Fallback: qualsiasi voce it-IT
        if (!voice) {
            voice = voices.find(v => (v.lang || "").toLowerCase().startsWith("it"));
        }
        // Ultimo fallback: la prima voce disponibile
        if (!voice && voices.length) voice = voices[0];

        cachedNarratorVoice = voice || null;
        return cachedNarratorVoice;
    }

// Precarica le voci (su alcuni browser arrivano in ritardo)
    if ("speechSynthesis" in window) {
        speechSynthesis.getVoices(); // trigger
        speechSynthesis.addEventListener("voiceschanged", () => {
            cachedNarratorVoice = null; // forza il ri-scan
            getNarratorVoice();
        });
    }

    function say(text) {
        if (!("speechSynthesis" in window)) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const voice = getNarratorVoice();
        if (voice) {
            u.voice = voice;
            u.lang = voice.lang || NARRATOR_LANG;
        } else {
            u.lang = NARRATOR_LANG;
        }
        u.rate = NARRATOR_RATE;
        u.pitch = NARRATOR_PITCH;
        u.volume = soundEnabled ? .8 : 0;
        speechSynthesis.speak(u);
    }

    const spokenKeep = new Set();

// Come sayAsync ma con velocità scelta e senza cancellare in anticipo (usata dal Rally)
    function sayRate(text, rate = 1, maxMs = 4000) {
        return new Promise(resolve => {
            if (!("speechSynthesis" in window)) return resolve();
            const u = new SpeechSynthesisUtterance(text);
            const voice = getNarratorVoice();
            if (voice) {
                u.voice = voice;
                u.lang = voice.lang || NARRATOR_LANG;
            } else u.lang = NARRATOR_LANG;
            u.rate = rate;
            u.pitch = NARRATOR_PITCH;
            u.volume = soundEnabled ? .8 : 0;
            let done = false;
            const end = () => {
                if (done) return;
                done = true;
                clearTimeout(safety);
                spokenKeep.delete(u);
                resolve();
            };
            const safety = setTimeout(end, maxMs);
            u.onend = end;
            u.onerror = end;
            spokenKeep.add(u);
            speechSynthesis.speak(u);
        });
    }

// Voce giapponese condivisa (Consegna tapas): legge testo italiano
    const JA_VOICE_PREFER = ["Google 日本語"];
    let jaVoice = null;

    function getJaVoice() {
        if (jaVoice) return jaVoice;
        const voices = speechSynthesis.getVoices();
        const found = JA_VOICE_PREFER.map(n => voices.find(v => v.name === n)).find(Boolean)
            || voices.find(v => (v.lang || "").toLowerCase().startsWith("ja"));
        if (found) jaVoice = found;                 // non memorizzare "null": le voci possono arrivare dopo
        return found || null;
    }

    function sayJa(text, rate = 1.0, pitch = 1.1) {
        if (!("speechSynthesis" in window)) return Promise.resolve();
        return new Promise(resolve => {
            const u = new SpeechSynthesisUtterance(text);
            const v = getJaVoice();
            if (v) {
                u.voice = v;
                u.lang = v.lang;
            } else u.lang = "it-IT";
            u.rate = rate;
            u.pitch = pitch;
            u.volume = soundEnabled ? 1 : 0;
            let done = false;
            const end = () => {
                if (done) return;
                done = true;
                clearTimeout(safety);
                spokenKeep.delete(u);
                resolve();
            };
            const safety = setTimeout(end, 8000);
            u.onend = end;
            u.onerror = end;
            spokenKeep.add(u);
            speechSynthesis.speak(u);
        });
    }

    // Voce spagnola condivisa (Consegna tapas): legge testo italiano
    const ES_VOICE_PREFER = ["Google español"];
    let esVoice = null;

    function getEsVoice() {
        if (esVoice) return esVoice;
        const voices = speechSynthesis.getVoices();
        const found = ES_VOICE_PREFER.map(n => voices.find(v => v.name === n)).find(Boolean)
            || voices.find(v => (v.lang || "").toLowerCase().startsWith("es"));
        if (found) esVoice = found;                 // non memorizzare "null": le voci possono arrivare dopo
        return found || null;
    }

    function sayEs(text, rate = 1.0, pitch = 1.1) {
        if (!("speechSynthesis" in window)) return Promise.resolve();
        return new Promise(resolve => {
            const u = new SpeechSynthesisUtterance(text);
            const v = getEsVoice();
            if (v) {
                u.voice = v;
                u.lang = v.lang;
            } else u.lang = "it-IT";
            u.rate = rate;
            u.pitch = pitch;
            u.volume = soundEnabled ? 1 : 0;
            let done = false;
            const end = () => {
                if (done) return;
                done = true;
                clearTimeout(safety);
                spokenKeep.delete(u);
                resolve();
            };
            const safety = setTimeout(end, 8000);
            u.onend = end;
            u.onerror = end;
            spokenKeep.add(u);
            speechSynthesis.speak(u);
        });
    }

    function sayAsync(text, maxMs) {
        const limit = maxMs ?? Math.max(8000, 4000 + String(text).length * 130);
        return new Promise(resolve => {
            if (!("speechSynthesis" in window)) return resolve();
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            const voice = getNarratorVoice();
            if (voice) {
                u.voice = voice;
                u.lang = voice.lang || NARRATOR_LANG;
            } else {
                u.lang = NARRATOR_LANG;
            }
            u.rate = NARRATOR_RATE;
            u.pitch = NARRATOR_PITCH;
            u.volume = soundEnabled ? .8 : 0;

            let done = false;
            const end = () => {
                if (done) return;
                done = true;
                clearTimeout(safety);
                spokenKeep.delete(u);
                resolve();
            };
            const safety = setTimeout(end, limit);
            u.onend = end;
            u.onerror = end;
            spokenKeep.add(u);
            speechSynthesis.speak(u);
        });
    }

// Descrizione iniziale di un gioco. Premendo Pausa (o il tasto centrale) mentre parla,
// la descrizione viene interrotta e si passa direttamente al gioco.
    let introSkip = null;

    function sayIntro(text) {
        return new Promise(resolve => {
            let finished = false;
            const done = () => {
                if (finished) return;
                finished = true;
                if (introSkip === skip) introSkip = null;
                resolve();
            };
            const skip = () => {
                window.BPDebug?.log("partita", "info", "descrizione saltata con il tasto pausa");
                speechSynthesis?.cancel();
                done();
            };
            introSkip = skip;
            sayAsync(text).then(done);
        });
    }

// Narra un testo di introduzione e aspetta che finisca (e che finisca anche l'eventuale pausa).
// Restituisce false se nel frattempo si è usciti dal gioco.
    async function narrate(g, text) {
        if (g.match && g.match.round > 1) return game === g && !g.finished;   // dal 2° round niente spiegazione
        await sayIntro(text);
        while (paused && game === g) await new Promise(r => setTimeout(r, 150));
        return game === g && !g.finished;
    }


// Come sayIntro, ma solo al primo round (usata dai giochi a più round)
    function introOnce(g, text) {
        return g.match && g.match.round > 1 ? Promise.resolve() : sayIntro(text);
    }

// Annuncia il vincitore a voce, ma solo nei giochi a round singolo
// (in quelli a più round ci pensano la fine round e la classifica finale)
    function sayWin(g, name) {
        if (game !== g || g.match) return;
        say("Vince " + name);
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

// Timer principale dei giochi. Resiste alla pausa: il tempo che restava viene
// memorizzato e il callback riparte alla ripresa (prima la catena si spezzava).
    let laterInfo = null, pendingLater = null;

    function stopTimer() {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        laterInfo = null;
        pendingLater = null;
    }

    function later(fn, ms) {
        stopTimer();
        if (paused) {              // armato mentre il gioco è in pausa: parte alla ripresa
            pendingLater = {fn, ms};
            return;
        }
        laterInfo = {fn, due: performance.now() + ms};
        timer = setTimeout(() => {
            timer = null;
            laterInfo = null;
            if (!game) return;
            if (paused) {
                pendingLater = {fn, ms: 0};
                return;
            }
            fn();
        }, ms);
    }

    function playerIds() {
        return activeButtons ? [...activeButtons] : PLAYER_BUTTONS.slice(0, players);
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
        window.dispatchEvent(new CustomEvent("bp:input", {detail: event}));
        if (type === "down") {
            if (held.has(id)) return;
            held.add(id);
            if (!game?.silentButtons) beepButton(id);
            buttons.find(b => b.dataset.button === id)?.classList.add("pressed");
        } else {
            held.delete(id);
            buttons.find(b => b.dataset.button === id)?.classList.remove("pressed");
        }
        if (type === "down") {
            if (!game) {
                window.BPDebug?.input(event, id === "C" ? "→ avvio partita" : "ignorato (nessuna partita)");
                if (id === "C" && menuStartEnabled) startGame();
                return;
            }
            if (paused) {
                window.BPDebug?.input(event, id === "C" ? "→ riprendi" : "ignorato (in pausa)");
                if (id === "C") resumeGame();
                return;
            }
            if (id === "C" && introSkip) {
                window.BPDebug?.input(event, "→ salta la descrizione");
                introSkip();
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
            b.setPointerCapture?.(e.pointerId);     // NUOVO
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
        if (introSkip) {          // durante la descrizione Pausa = salta la descrizione
            introSkip();
            return;
        }
        paused = true;
        pausedSince = performance.now();
        window.BPDebug?.pause(true);
        const remaining = laterInfo
            ? {fn: laterInfo.fn, ms: Math.max(0, laterInfo.due - performance.now())}
            : null;
        stopTimer();
        pendingLater = remaining;
        game.pause?.();
        if (natureGain) natureGain.gain.value = 0;   // sottofondo muto in pausa
        setArena("⏸ Partita in pausa", "Premi Riprendi per continuare");
        $("#pause-button").textContent = "▶ Riprendi";
        buttons.forEach(b => b.classList.remove("pressed"));
        sayRate("Gioco in pausa.", 1, 3000);
    }

    // La ripresa è preceduta dal conto alla rovescia del narratore: nel frattempo il gioco resta fermo
    let resuming = false;

    async function resumeGame() {
        if (!game || !paused || resuming) return;
        resuming = true;
        const current = game;
        setArena("▶ Riprendo il gioco…", "3, 2, 1");
        await sayRate("Riprendo il gioco in 3, 2, 1.", 1, 7000);
        resuming = false;
        if (game !== current || !paused) return;     // uscito dal gioco nel frattempo
        pausedTotal += performance.now() - pausedSince;
        paused = false;
        window.BPDebug?.pause(false);
        $("#pause-button").textContent = "Ⅱ Pausa";
        if (natureGain) natureGain.gain.value = soundEnabled ? natureVolume : 0;
        const resumed = pendingLater;
        pendingLater = null;
        if (resumed) later(resumed.fn, resumed.ms);   // riprende da dove era
        game.resume?.();
        if (!game.resume) setArena("Si riparte!");
    }

    function startGame() {
        stopTimer();
        pausedTotal = 0;
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
        game.match = MULTI_ROUNDS[id] ? {round: 1, total: MULTI_ROUNDS[id], wins: {}, points: {}} : null;
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
        resuming = false;
        held.clear();
        $("#game-panel").hidden = true;
        $("#setup-panel").hidden = false;
        $("#pause-button").textContent = "Ⅱ Pausa";
        setArena("Premi Inizia");
        introSkip = null;
        window.BPDebug?.gameEnd("uscita");
    }

    // Giochi a più round: quanti round si giocano
    const MULTI_ROUNDS = {horse: 3, parachute: 3, mosquito: 3, pot: 3, mine: 3, bomb: 3, rope: 3, tennis: 3};

    function recordRound(m, ranking, pointAdjustments = {}) {
        if (ranking && ranking.length) {
            const n = playerIds().length;
            m.wins[ranking[0]] = (m.wins[ranking[0]] || 0) + 1;
            ranking.forEach((p, i) => {
                m.points[p] = (m.points[p] || 0) + (n - i);
            });
        }
        for (const [player, adjustment] of Object.entries(pointAdjustments)) {
            m.points[player] = (m.points[player] || 0) + adjustment;
        }
        return ranking?.[0] || null;
    }

    // Classifica finale dopo l'ultimo round: più round vinti, poi più punti piazzamento
    function matchResult(m) {
        const sorted = playerIds().sort((a, b) =>
            (m.wins[b] || 0) - (m.wins[a] || 0) || (m.points[b] || 0) - (m.points[a] || 0));
        const [a, b] = sorted;
        if (!(m.wins[a] > 0)) return {ranking: null, message: "Nessun vincitore"};
        if (b && (m.wins[a] || 0) === (m.wins[b] || 0) && (m.points[a] || 0) === (m.points[b] || 0)) {
            return {ranking: null, message: "Pareggio"};
        }
        return {ranking: sorted, message: "🏆 " + COLORS[a] + " vince con " + m.wins[a] + " round su " + m.total + "!"};
    }

    // Fine di un round che non è l'ultimo: il narratore dice chi ha vinto e parte il round dopo
    async function advanceRound(message, ranking, pointAdjustments) {
        const old = game, m = old.match;
        const winner = recordRound(m, ranking, pointAdjustments);
        const delay = old.endDelay ?? 900;      // lascia finire i suoni di fine round
        const wait = ms => new Promise(r => setTimeout(r, ms));

        old.finished = true;
        stopTimer();
        stopFallSound();
        old.dispose?.();
        const holder = {
            id: old.id, mode: "turn", finished: true, match: m, silentButtons: true,
            onInput() {
            }, dispose() {
                stopTimer();
            }
        };
        game = holder;
        window.dispatchEvent(new CustomEvent("bp:round-finished", {
            detail: {id: old.id, round: m.round, total: m.total, winner}
        }));
        setArena(message, "Round " + m.round + " di " + m.total + " concluso", "signal");
        $("#game-status").textContent = "FINE ROUND " + m.round;

        await wait(delay);
        if (game !== holder) return;
        const next = m.round + 1;
        await sayAsync((winner ? "Round " + m.round + ": punto a " + COLORS[winner] + "." : "Round " + m.round + ": nessun vincitore.")
            + " Si parte con il round " + next + ".", 9000);
        if (game !== holder) return;

        m.round = next;
        scores = Object.fromEntries(playerIds().map(p => [p, 0]));
        const ng = makeGame(old.id);
        ng.match = m;
        game = ng;
        $("#game-status").textContent = "ROUND " + m.round + " DI " + m.total;
        window.BPDebug?.log("partita", "info", "round " + m.round + " di " + m.total);
        ng.setup();
        ng.start();
        renderScores();
    }

    function finish(message, ranking = null, announce = true, pointAdjustments = {}) {
        if (!game || game.finished) {
            window.BPDebug?.finishIgnored(message, !game);
            return;
        }
        const m = game.match;
        if (m) {
            if (m.round < m.total) {
                advanceRound(message, ranking, pointAdjustments);
                return;
            }
            // Ultimo round: la classifica finale conta tutti i round
            recordRound(m, ranking, pointAdjustments);
            const result = matchResult(m);
            message = result.message;
            ranking = result.ranking;
            scores = Object.fromEntries(playerIds().map(p => [p, m.wins[p] || 0]));
            renderScores();
            const gg = game;
            setTimeout(() => {
                if (game === gg) say(ranking ? "Vince " + COLORS[ranking[0]] : result.message);
            }, game.endDelay ?? 600);
            announce = false;
        }
        game.finished = true;
        window.dispatchEvent(new CustomEvent("bp:game-finished", {
            detail: {id: game.id, scores: {...scores}, ranking: ranking ? [...ranking] : null, message}
        }));
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
            lesson: makeLesson,
            door: makeDoor,
            restaurant: makeRestaurant,
            grinder: makeGrinder,
            bomb: makeBomb,
            rope: makeRope,
            tennis: makeTennis,
            tapas: makeTapas,
            rally: makeRally,
            beeper: makeBeeper,
            beat: makeBeat,
            thirsty: makeThirsty,
            tug: makeTug,
            bounty: makeBounty,
            copyrhythm: makeCopyRhythm,
            horse: makeHorse,
            typewriter: makeTypewriter
        })[id]();
    }

    function makePig() {
        const g = baseGame("pig");
        let count = 0, max = 0, current = "", active = false, blocked = {}, duration = 90000, started = 0,
            claimed = false, previous = "", ready = false;
        g.start = async () => {
            ready = false;
            $("#game-status").textContent = "ASCOLTA BENE";
            setArena("🐾 In ascolto…", "Premi solo quando senti il maiale");

            if (!await narrate(g, "Cattura il maiale. Ascolta i versi degli animali e premi solo quando senti il maiale. " +
                "Se premi per un altro animale perdi un punto. Vince chi arriva a cinque punti.")) return;

            ready = true;
            started = performance.now();
            startNatureAmbience("assets/sounds/maiale/background-cattura-maiale.mp3", 0.08);

            next();
        };

        // I versi si fanno sempre più ravvicinati: il ritmo passa dai valori "inizio" a quelli "fine" in RAMP_MS.
        const RAMP_MS = 60000;
        const lerp = (a, b, p) => a + (b - a) * p;
        const progress = () => Math.min(1, (performance.now() - started) / RAMP_MS);

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
            const p = progress();
            const thinkMs = lerp(1200, 700, p);                                  // dopo la fine del verso si può ancora rispondere
            const waitMs = lerp(1000, 300, p) + Math.random() * lerp(800, 400, p); // pausa prima del verso successivo
            later(async () => {
                if (g.finished) return;
                count++;
                let pig = count >= 8 ? Math.random() < .5 : Math.random() < .24;
                let choices = ANIMALS.filter(a => a !== previous);
                current = pig ? "maiale" : choices[Math.floor(Math.random() * choices.length)];
                previous = pig ? "" : current;
                active = true;
                setArena("🔊 " + (pig ? "OINK!" : "Verso: " + current), pig ? "È LUI! PREMI!" : "Non è il maiale! NON premere", pig ? "signal" : "");

                const t = await playTimed(`assets/sounds/maiale/${current}.mp3`, {fallbackMs: 700});
                if (game !== g || g.finished) return;
                // Finestra uguale per tutti gli animali: fine del verso + tempo per pensare.
                // La durata non rivela più se è il maiale.
                later(() => { active = false; next(); }, Math.max(0, t.endsAt - performance.now()) + thinkMs);
            }, waitMs);
        }


        function winner() {
            return playerIds().sort((a, b) => scores[b] - scores[a]);
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || g.finished || !ready) return;

            const id = e.button;

            if (blocked[id] > performance.now()) return;

            if (active && current === "maiale") {
                if (claimed) return;

                claimed = true;
                scores[id]++;
                renderScores();

                playSample("assets/sounds/maiale/punto.mp3", () => {
                    tone(880, .14, "sine", .1);
                });

                toast(COLORS[id] + " cattura il maiale!");

                if (scores[id] >= 5) {
                    finish("🐷 " + COLORS[id] + " vince!", winner());
                    return;
                }
            } else {
                scores[id]--;
                renderScores();
                blocked[id] = performance.now() + 1000;

                playSample("assets/sounds/maiale/penalita.mp3", () => {
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
        const FALSE_START_SOUND = "assets/sounds/duello/falsa-partenza.mp3";
        let eligible = new Set(), round = 1, started = false, waiting = false, goAt = 0, wins = {};
        const total = 5;
        let introDone = false;

        g.start = async () => {
            introDone = false;
            wins = Object.fromEntries(playerIds().map(p => [p, 0]));
            round = 1;
            $("#game-status").textContent = "DUELLO";
            setArena("🤠 Duello", "Ascolta le istruzioni");
            renderScores(wins);
            if (!await narrate(g, "Duello. In ogni round aspetta il segnale, poi premi il tuo tasto il più in fretta possibile. " +
                "Se premi prima, è falsa partenza e perdi un punto. Alla fine di ogni round ti dico chi ha vinto. " +
                "Si giocano cinque round.")) return;
            introDone = true;
            beginRound();
        };

        function beginRound() {
            if (g.finished) return;
            eligible = new Set(playerIds());
            started = false;
            waiting = false;
            g.duelWinner = undefined;
            setArena("Round " + round + " / " + total, "Ascolta…");
            $("#game-status").textContent = "DUELLO";
            renderScores(wins);
            // Il narratore annuncia il round, poi parte l'attesa del segnale (senza conferme dei giocatori)
            sayAsync("Round " + round + ".", 4000).then(() => {
                if (game !== g || g.finished) return;
                waiting = true;
                setArena("Non muoverti…", "Aspetta il segnale");
                later(() => {
                    if (g.finished) return;
                    signal();
                }, 3000 + Math.random() * 5000);
            });
        }

        function signal() {
            if (g.finished) return;
            waiting = false;
            started = true;
            goAt = performance.now() + latencyMs();      // istante in cui il segnale si sente davvero

            setArena("🔥 VIA!", "Premi il tuo tasto!", "signal");

            playSample("assets/sounds/duello/inizio-duello.mp3", () => {
                tone(880, .28, "square", .18);
            });

            later(() => {
                if (g.finished || g.duelWinner !== undefined) return;
                g.duelWinner = null;                      // chiude il round: chi preme ora non vince
                setArena("Nessuno ha risposto", "Il round si ripete");
                say("Nessuno ha risposto. Il round si ripete.");
                later(beginRound, 2800);
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
                say("Tutti hanno anticipato. Il round si ripete.");
                later(beginRound, 2800);
            }
        }

        function resolve(id) {
            if (g.finished) return;

            if (g.duelWinner !== undefined) {
                playSample("assets/sounds/duello/proiettile-schiavato.mp3", () => {
                });
                return;
            }

            g.duelWinner = id;

            playSample("assets/sounds/duello/pistola-sparo.mp3", () => {
                tone(180, .18, "sawtooth", .15);
            });

            wins[id]++;
            renderScores(wins);
            setArena("🏆 " + COLORS[id] + " vince il round!", "Punteggio round: " + wins[id]);

            round++;
            say(COLORS[id] + " vince il round.");       // il narratore dice chi ha vinto

            if (round <= total) {
                later(beginRound, 2600);
            } else {
                later(() => {
                    const order = playerIds().sort((a, b) => wins[b] - wins[a]);
                    finish("Partita terminata — " + COLORS[order[0]] + " vince!", order);
                }, 2600);
            }
        }

        g.onInput = e => {
            if (e.type !== "down") return;
            if (e.button === "C") return;
            const id = e.button;
            if (!playerIds().includes(id) || g.finished || !introDone) return;

            // Mentre il narratore annuncia il round i tasti non fanno nulla
            if (!started && !waiting) return;

            // Attesa del segnale: premere adesso è una falsa partenza
            if (waiting) {
                if (eligible.has(id)) falseStart(id);
                return;
            }

            // Segnale già dato
            if (!eligible.has(id)) {
                if (g.duelWinner !== undefined && id !== g.duelWinner) {
                    playSample("assets/sounds/duello/proiettile-schiavato.mp3", () => {
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
        g.endDelay = 2500;     // lascia finire lo splash
        const EARLY_PENALTY = -1;
        const DEATH_PENALTY = -3;
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
            await introOnce(g, "Caduta libera. Senti il suono e scegli quando aprire. Si giocano tre round.");
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
            start = activeNow();
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
            sayWin(g, COLORS[order[0]]);
        }

        function tick() {
            if (g.finished) return;

            const elapsed = activeNow() - start;
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
                const pointAdjustments = Object.fromEntries(playerIds().flatMap(p => {
                    if (!opened[p]) return [[p, DEATH_PENALTY]];
                    if (!results[p].valid) return [[p, EARLY_PENALTY]];
                    return [];
                }));

                // announce = false: la voce la gestisce announceWinner dopo lo splash
                finish("💥 Impatto! " + COLORS[order[0]] + " in testa", order, false, pointAdjustments);
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

            const t = activeNow() - start;
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

        g.pause = () => {
            if (fallGain) fallGain.gain.value = 0;
        };
        g.resume = () => {
            if (fallGain) fallGain.gain.value = soundEnabled ? 0.16 : 0;
            setArena("🪂 Si riparte!", "Apri al momento giusto");
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
        const DIR = "assets/sounds/disturbatore/";
        const BACKGROUND = DIR + "background-voci.mp3";
        const TARGET_NAME = "Topo Gigio";
        const TARGET_VOICES = [1, 2, 3].map(n => DIR + "topo-gigio-" + n + ".mp3");
        const HIT_SOUNDS = {P1: DIR + "colpo-1.mp3", P2: DIR + "colpo-2.mp3", P3: DIR + "colpo-3.mp3", P4: DIR + "colpo-4.mp3"};
        const MISS_SOUNDS = {P1: DIR + "errore-1.mp3", P2: DIR + "errore-1.mp3", P3: DIR + "errore-1.mp3", P4: DIR + "errore-1.mp3"};
        // Se il file manca: un tono diverso per giocatore
        const HIT_TONE = {P1: 660, P2: 520, P3: 830, P4: 1040};
        const MISS_TONE = {P1: 110, P2: 90, P3: 135, P4: 160};

        const TARGET_GRACE = 350;     // tolleranza dopo la fine della voce (ms)
        const DURATION = 60000;
        let active = false, start = 0, points = {}, ready = false, lastTarget = null;
        const MAX_SOUNDS_PER_PLAYER = 2;   // al massimo due suoni (colpo/errore) in contemporanea per giocatore
        let playing = {};                  // giocatore -> sorgenti audio ancora in riproduzione

        // Riproduce il suono del giocatore; se ce ne sono già due in corso, interrompe il più vecchio
        async function playLimited(id, path, fallback) {
            const list = playing[id] = playing[id] || [];
            while (list.length >= MAX_SOUNDS_PER_PLAYER) {
                const old = list.shift();
                try { old.stop(); } catch (e) {}
            }
            const t = await playTimed(path, {fallback});
            if (!t.source) return;
            list.push(t.source);
            t.ended.then(() => {
                const i = list.indexOf(t.source);
                if (i >= 0) list.splice(i, 1);
            });
            while (list.length > MAX_SOUNDS_PER_PLAYER) {   // più pressioni ravvicinate mentre il file si caricava
                const old = list.shift();
                try { old.stop(); } catch (e) {}
            }
        }

        function pickRandom(list, last) {
            if (list.length === 1) return list[0];
            let c;
            do { c = list[Math.floor(Math.random() * list.length)]; } while (c === last);
            return c;
        }

        g.start = async () => {
            ready = false;
            playing = {};
            points = Object.fromEntries(playerIds().map(p => [p, 0]));
            $("#game-status").textContent = "ASCOLTA " + TARGET_NAME.toUpperCase();
            setArena("🗣 Brusio…", "Premi quando senti " + TARGET_NAME);

            if (!await narrate(g, "Disturbatore. In sottofondo c'è un brusio di voci. Quando parla " + TARGET_NAME +
                ", premi il più possibile: ogni pressione è un punto. Se premi quando " + TARGET_NAME +
                " non parla, perdi un punto. Ogni giocatore ha il suo suono. Vince chi disturba di più.")) return;

            ready = true;
            start = activeNow();
            startNatureAmbience(BACKGROUND, 0.12);
            schedule();
        };

        function conclude() {
            const order = playerIds().sort((a, b) => points[b] - points[a]);
            stopNatureAmbience();
            finish("Tempo scaduto! Vince " + COLORS[order[0]], order);
        }

        function schedule() {
            if (g.finished) return;
            if (activeNow() - start > DURATION) { conclude(); return; }
            active = false;
            setArena("🗣 Voci in sottofondo…", "Aspetta " + TARGET_NAME);

            later(async () => {
                if (g.finished) return;
                lastTarget = pickRandom(TARGET_VOICES, lastTarget);
                active = true;
                setArena("📣 " + TARGET_NAME + "!", "ORA! Premi il più possibile", "signal");
                const t = await playTimed(lastTarget, {fallback: () => tone(660, .22, "triangle", .07), fallbackMs: 1200});
                await Promise.race([t.ended, new Promise(r => setTimeout(r, 8000))]);
                if (game !== g || g.finished) return;
                later(() => { active = false; schedule(); }, TARGET_GRACE);
            }, 1200 + Math.random() * 2500);
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || g.finished || !ready) return;
            const id = e.button;
            points[id] += active ? 1 : -1;
            scores[id] = points[id];
            renderScores();
            if (active) {
                playLimited(id, HIT_SOUNDS[id], () => tone(HIT_TONE[id], .09, "triangle", .07));
            } else {
                playLimited(id, MISS_SOUNDS[id], () => tone(MISS_TONE[id], .09, "square", .07));
                toast("Fuori bersaglio: " + COLORS[id] + " −1");
            }
        };

        g.dispose = () => { stopTimer(); stopNatureAmbience(); };
        return g;
    }

    function makeTypewriter() {
        // "Macchina da scrivere": ogni pressione batte un tasto (+1). Ogni X pressioni totali suona il fine riga:
        // chi preme mentre suona perde un punto per ogni pressione (anche sotto zero). Dopo Y fine riga il gioco finisce.
        const g = baseGame("typewriter");
        g.silentButtons = true;   // i suoni dei tasti li gestisce il gioco

        // === File audio (facoltativi: se mancano si usano suoni sintetici) ===
        const DIR = "assets/sounds/macchina-da-scrivere/";
        const KEY_SOUNDS = [1, 2, 3, 4].map(n => DIR + "tasto-" + n + ".mp3");   // uno a caso a ogni pressione
        const LINE_SOUND = DIR + "cambio-riga.mp3";                              // campanello di fine riga
        const LAST_LINE_SOUND = DIR + "cambio-riga-finale.mp3";                  // ultimo fine riga: chiude il gioco
        const PENALTY_SOUND = DIR + "penitenza.mp3";                             // si preme durante il fine riga

        // === Parametri ===
        const PRESSES_PER_PLAYER = 15;    // pressioni totali per riga = 15 x numero di giocatori
        const LINES = 5;                  // dopo questo numero di fine riga il gioco finisce
        const MAX_KEY_SOUNDS = 3;         // al massimo tre suoni di tasto contemporanei per giocatore

        let ready = false, bell = false, row = 0, count = 0, perRow = 0, lastKey = -1, points = {}, playing = {};

        async function keySound(id, path = null, fallback = null) {
            let n = 0;
            if (!path) {
                do { n = Math.floor(Math.random() * KEY_SOUNDS.length); } while (n === lastKey && KEY_SOUNDS.length > 1);
                lastKey = n;
            }
            const list = playing[id] = playing[id] || [];
            while (list.length >= MAX_KEY_SOUNDS) {
                try { list.shift().stop(); } catch (e) {}
            }
            const t = await playTimed(path || KEY_SOUNDS[n], {
                fallback: fallback || (() => tone(1500 + Math.random() * 900, .03, "square", .05)), fallbackMs: 60
            });
            if (!t.source) return;
            list.push(t.source);
            t.ended.then(() => {
                const i = list.indexOf(t.source);
                if (i >= 0) list.splice(i, 1);
            });
        }

        const show = () => setArena("⌨️ Riga " + (row + 1) + " di " + LINES, count + " / " + perRow + " tasti");

        g.start = async () => {
            ready = false; bell = false; row = 0; count = 0; lastKey = -1; playing = {};
            perRow = PRESSES_PER_PLAYER * playerIds().length;
            points = Object.fromEntries(playerIds().map(p => [p, 0]));
            scores = {...points};
            [...KEY_SOUNDS, LINE_SOUND, LAST_LINE_SOUND, PENALTY_SOUND].forEach(loadSample);
            $("#game-status").textContent = "SCRIVETE!";
            setArena("⌨️ Macchina da scrivere", "Premi il tuo tasto più veloce che puoi");
            renderScores();
            if (!await narrate(g, "Macchina da scrivere. Premi il tuo tasto più veloce che puoi: ogni pressione batte un tasto e vale un punto. " +
                "Quando senti il campanello di fine riga, fermàti: ogni pressione durante il campanello toglie un punto. " +
                "Quando il suono finisce, riparti subito. Dopo " + LINES + " righe il gioco finisce. Vince chi ha più punti.")) return;
            ready = true;
            show();
        };

        async function lineChange() {
            bell = true;
            const last = row === LINES - 1;
            setArena("🔔 Fine riga!", "Fermi! Chi preme perde punti", "signal");
            const t = await playTimed(last ? LAST_LINE_SOUND : LINE_SOUND, {
                fallback: () => {
                    tone(1568, .5, "triangle", .12);
                    if (last) { tone(1175, .5, "triangle", .1, .25); tone(784, .9, "triangle", .1, .5); }
                },
                fallbackMs: last ? 1500 : 800
            });
            await t.ended;
            if (game !== g || g.finished) return;
            while (paused && game === g) await new Promise(r => setTimeout(r, 150));
            if (game !== g || g.finished) return;
            if (last) {
                const order = playerIds().sort((a, b) => points[b] - points[a]);
                finish("Fine del foglio! Vince " + COLORS[order[0]], order);
                return;
            }
            bell = false;
            row++;
            count = 0;
            show();
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || g.finished || !ready) return;
            const id = e.button;
            if (bell) {
                points[id] -= 1;
                scores[id] = points[id];
                renderScores();
                keySound(id, PENALTY_SOUND, () => tone(140, .18, "sawtooth", .08));   // suono di penitenza
                toast("Durante il fine riga: " + COLORS[id] + " −1");
                return;
            }
            points[id] += 1;
            scores[id] = points[id];
            renderScores();
            keySound(id);
            count++;
            if (count >= perRow) {
                setArena("🔔 Fine riga!", "Fermi! Chi preme perde punti", "signal");
                lineChange();
            } else {
                show();
            }
        };

        g.dispose = () => stopTimer();
        return g;
    }

    function makePot() {
        const g = baseGame("pot");
        // Il ritmo dei gettoni accelera di continuo (anche dopo ogni incasso, perché non riparte da capo).
        const RATE_START = 700;      // ms tra un gettone e l'altro all'inizio
        const RATE_MIN = 220;        // velocità massima (ms tra un gettone e l'altro)
        const RATE_STEP = 8;         // ogni gettone toglie questi ms all'intervallo
        const ROUNDS = 3;            // numero di round: i punti di ogni round si sommano
        let pot = 0, limit = 0, cashed = {}, start = 0, rate = RATE_START, ready = false, round = 1;

        // Suoni (file facoltativi: se mancano si usano suoni sintetici)
        const COIN_SOUND = "assets/sounds/pot/gettone.mp3";   // arriva un gettone nel piatto
        const CASH_SOUND = "assets/sounds/pot/incasso.mp3";   // un giocatore incassa
        const coinSound = () => playSample(COIN_SOUND, () => {
            tone(1568, .05, "triangle", .06);
            tone(2093, .1, "triangle", .05, .05);
        });
        const cashSound = () => playSample(CASH_SOUND, () => {
            tone(988, .08, "triangle", .1);
            tone(1319, .08, "triangle", .1, .08);
            tone(1976, .3, "triangle", .12, .16);
        });

        // Limite segreto del piatto: viene estratto di nuovo dopo ogni incasso
        const newLimit = () => 15 + Math.floor(Math.random() * 16);

        g.start = async () => {
            ready = false;
            pot = 0;
            limit = newLimit();
            cashed = {};
            rate = RATE_START;
            round = 1;
            scores = Object.fromEntries(playerIds().map(p => [p, 0]));
            [COIN_SOUND, CASH_SOUND].forEach(loadSample);
            $("#game-status").textContent = "ROUND 1 DI " + ROUNDS;
            setArena("🪙 0 gettoni", "Incassa quando vuoi… ma non aspettare troppo");
            renderScores();
            if (!await narrate(g, "Piglia tutto. Il piatto si riempie di gettoni, uno dopo l'altro. " +
                "Premi per incassare quelli che ci sono. Ma se aspetti troppo il piatto esplode, e chi non ha incassato perde tutto. Si giocano tre round e i punti si sommano.")) return;
            ready = true;
            start = performance.now();
            tick();
        };

        function tick() {
            if (g.finished) return;
            pot++;
            coinSound();
            if (pot > limit) {
                endRound("Il piatto esplode! Chi non ha incassato perde tutto.");
                return;
            }
            setArena("🪙 " + pot + " gettoni", "Il limite segreto è nascosto…");
            rate = Math.max(RATE_MIN, rate - RATE_STEP);
            later(tick, rate);
        }

        // Fine di un round: dopo l'ultimo il gioco finisce, altrimenti si riparte da zero (il ritmo continua ad accelerare)
        function endRound(message) {
            ready = false;
            stopTimer();
            if (round >= ROUNDS) {
                const order = playerIds().sort((a, b) => scores[b] - scores[a]);
                const tie = scores[order[0]] === scores[order[1]];
                finish(tie ? "Fine dei tre round! Pareggio" : "🪙 Fine dei tre round! Vince " + COLORS[order[0]], tie ? null : order);
                return;
            }
            nextRound(message);
        }

        async function nextRound(message) {
            const done = round;
            setArena("🪙 " + message, "Fine del round " + done + " di " + ROUNDS);
            await sayAsync(message + " Fine del round " + done + ". " + (done === ROUNDS - 1 ? "Ultimo round!" : "Si ricomincia!"));
            while (paused && game === g) await new Promise(r => setTimeout(r, 150));
            if (game !== g || g.finished) return;
            round++;
            pot = 0;
            limit = newLimit();
            cashed = {};
            $("#game-status").textContent = "ROUND " + round + " DI " + ROUNDS;
            setArena("🪙 0 gettoni", "Round " + round + " di " + ROUNDS);
            ready = true;
            tick();
        }

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || cashed[e.button] || g.finished || !ready) return;
            cashed[e.button] = true;
            scores[e.button] += pot;   // i punti dei round si sommano
            renderScores();
            cashSound();
            toast(COLORS[e.button] + " incassa " + pot + " gettoni!");
            if (playerIds().every(p => cashed[p])) {
                endRound("Tutti hanno incassato.");
                return;
            }
            // Il piatto si svuota: chi non ha ancora incassato riparte da zero
            pot = 0;
            limit = newLimit();
            setArena("🪙 0 gettoni", COLORS[e.button] + " ha incassato: il piatto riparte da zero");
        };
        return g;
    }

    function makeSimon() {
        // Simon a catena: il primo giocatore sceglie una nota; in senso orario ognuno ripete tutta la
        // sequenza e ne aggiunge una in fondo. Chi sbaglia o è troppo lento è eliminato.
        // Modalità "realtime": il tasto centrale mette in pausa e non fa mai parte della sequenza.
        const g = baseGame("simon");
        const NOTES = ["P1", "P2", "P3", "P4"];
        const tones = {P1: 330, P2: 392, P3: 494, P4: 262};
        const STEP_LIMIT = 3000;   // tempo massimo tra una pressione e l'altra (ms)
        const MAX_LENGTH = 30;     // oltre questa lunghezza i superstiti pareggiano

        let seq = [], alive = [], eliminated = [], turn = 0, idx = 0, phase = "intro";   // intro | announce | repeat | add | between | over
        const cur = () => alive[turn];
        const dbg = (lvl, msg) => window.BPDebug?.log("partita", lvl, msg);
        const colorName = id => ({P1: "rosso", P2: "blu", P3: "giallo", P4: "verde"})[id];

        g.silentButtons = true;   // niente beep del tasto sopra la voce

        const SIMON_DIR = "assets/sounds/simon/";
        const COLOR_RATE = {P1: 1, P2: 1.26, P3: 1.5, P4: 2};          // do · mi · sol · do' (velocità del file)
        const COLOR_PITCH = {P1: .7, P2: .95, P3: 1.25, P4: 1.6};      // se manca il file: voce sintetica

        // Voce dei colori: una voce italiana DIVERSA da quella del narratore (se non c'è, stessa voce ma molto più acuta)
        const FEMALE_HINTS = /alice|elsa|federica|paola|isabella|google italiano|female|donna/i;
        let colorVoice;

        function getColorVoice() {
            if (colorVoice !== undefined) return colorVoice;
            const narrator = getNarratorVoice();
            const italian = speechSynthesis.getVoices().filter(v => (v.lang || "").toLowerCase().startsWith("it") && v !== narrator);
            const found = italian.find(v => FEMALE_HINTS.test(v.name)) || italian[0] || null;
            if (found || speechSynthesis.getVoices().length) colorVoice = found;   // se le voci non sono ancora arrivate, riprova
            return found;
        }

        function sayShort(text, pitch) {
            if (!soundEnabled || !("speechSynthesis" in window)) return;
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            const v = getColorVoice();
            if (v) {
                u.voice = v;
                u.lang = v.lang;
                u.pitch = pitch;
            } else {                       // nessuna altra voce: stessa del narratore ma molto più acuta
                const n = getNarratorVoice();
                if (n) { u.voice = n; u.lang = n.lang; } else u.lang = "it-IT";
                u.pitch = Math.min(2, pitch + .5);
            }
            u.rate = 1.15; u.volume = 1;
            speechSynthesis.speak(u);
        }

        function playColor(id) {
            sayShort(colorName(id), COLOR_PITCH[id]);
            return Promise.resolve();
        }

        function showScores() {
            renderScores(Object.fromEntries(playerIds().map(p => [p, alive.includes(p) ? (scores[p] || 0) : "OUT"])));
        }

        function flash(id) {
            const el = buttons.find(b => b.dataset.button === id);
            el?.classList.add("pressed");
            setTimeout(() => el?.classList.remove("pressed"), 220);
        }

        g.start = async () => {
            seq = [];
            alive = [...playerIds()];
            eliminated = [];
            turn = 0;
            idx = 0;
            phase = "intro";
            scores = Object.fromEntries(alive.map(p => [p, 0]));
            $("#game-status").textContent = "SIMON A CATENA";
            setArena("🎵 Simon", "Ascolta le istruzioni");
            $("#simon-feedback").textContent = "";
            showScores();

            window.BPDebug?.watch(() => ({
                fase: phase,
                tocca: cur() ? COLORS[cur()] : "—",
                sequenza: seq.map(colorName).join(" "),
                posizione: idx + "/" + seq.length,
                inGioco: alive.map(p => COLORS[p]),
                eliminati: eliminated.map(p => COLORS[p])
            }));

            if (!await narrate(g, "Simon a catena. Il primo giocatore sceglie una nota. Poi, in senso orario, ognuno deve ripetere tutta la sequenza " +
                "e aggiungere una nota nuova in fondo. Hai tre secondi tra una nota e l'altra. Chi sbaglia è eliminato, " +
                "e la sequenza giusta viene riascoltata una volta. Vince l'ultimo rimasto. Il tasto centrale mette in pausa.")) return;
            startTurn();
        };

        function startTurn() {
            if (g.finished) return;
            const p = cur();
            idx = 0;
            phase = "announce";
            $("#game-status").textContent = "TURNO DI " + COLORS[p].toUpperCase();
            setArena("🎵 Tocca a " + COLORS[p], seq.length ? "Ripeti le " + seq.length + " note e aggiungine una" : "Scegli la prima nota");
            dbg("info", "▶ tocca a " + COLORS[p] + " (sequenza di " + seq.length + ")");
            sayAsync("Tocca a " + COLORS[p]).then(() => {
                if (game === g && !g.finished && phase === "announce") later(begin, 300);
            });
        }

        function begin() {
            if (g.finished) return;
            phase = seq.length ? "repeat" : "add";
            tone(880, .08, "square", .08);
            showTurn();
            later(timeUp, STEP_LIMIT);
        }

        function showTurn() {
            const p = cur();
            if (phase === "repeat") setArena("🎵 " + COLORS[p] + ": ripeti", "Nota " + (idx + 1) + " di " + seq.length + " (3 s per nota)");
            else setArena("🎵 " + COLORS[p] + ": aggiungi una nota", "Scegline una nuova (3 s)");
        }

        function timeUp() {
            if (g.finished || (phase !== "repeat" && phase !== "add")) return;
            eliminate("tempo scaduto");
        }

        g.onInput = e => {
            if (e.type !== "down" || g.finished) return;
            if (phase !== "repeat" && phase !== "add") return;
            const id = e.button;
            if (!NOTES.includes(id)) return;

            if (phase === "repeat") {
                if (seq[idx] !== id) {
                    eliminate("nota sbagliata (era " + colorName(seq[idx]) + ")");
                    return;
                }
                playColor(id);
                $("#simon-feedback").textContent = COLORS[cur()] + " · nota " + (idx + 1) + " corretta";
                idx++;
                if (idx === seq.length) phase = "add";
                showTurn();
                later(timeUp, STEP_LIMIT);
            } else {
                seq.push(id);
                scores[cur()] = (scores[cur()] || 0) + 1;
                phase = "between";
                $("#simon-feedback").textContent = COLORS[cur()] + " aggiunge " + colorName(id);
                playColor(id);
                dbg("ok", "✅ " + COLORS[cur()] + " aggiunge " + colorName(id) + " → sequenza: " + seq.map(colorName).join(" "));
                showScores();
                stopTimer();
                if (seq.length >= MAX_LENGTH) {
                    later(conclude, 800);
                    return;
                }
                turn = (turn + 1) % alive.length;
                later(startTurn, 900);
            }
        };

        function eliminate(why) {
            const p = cur();
            stopTimer();
            phase = "between";
            alive.splice(turn, 1);
            eliminated.push(p);
            noise(.25, .05);
            tone(130, .4, "sawtooth", .12);
            $("#simon-feedback").textContent = COLORS[p] + " eliminato";
            toast(COLORS[p] + " eliminato: " + why);
            dbg("info", "❌ " + COLORS[p] + " eliminato: " + why);
            showScores();
            if (alive.length <= 1) {
                later(conclude, 1000);
                return;
            }
            turn = turn % alive.length;
            if (seq.length) later(() => replay(startTurn), 1200);
            else later(startTurn, 1200);
        }

        // Dopo un errore la sequenza giusta viene riprodotta una volta, così il prossimo la sente
        function replay(done) {
            if (g.finished) return;
            let i = 0;
            setArena("🎵 Ascolta la sequenza giusta", seq.length + (seq.length === 1 ? " nota" : " note"));
            const step = () => {
                if (g.finished) return;
                if (i >= seq.length) {
                    later(done, 600);
                    return;
                }
                const id = seq[i++];
                playColor(id);
                flash(id);
                later(step, 750);
            };
            later(step, 500);
        }

        function conclude() {
            if (g.finished) return;
            phase = "over";
            if (alive.length === 1) {
                finish("🏆 Vince " + COLORS[alive[0]] + " con " + (scores[alive[0]] || 0) + " note", [alive[0], ...eliminated.slice().reverse()]);
            } else {
                finish("🎵 Pareggio: la sequenza ha raggiunto " + MAX_LENGTH + " note", null);
            }
        }

        g.resume = () => {
            if (phase === "repeat" || phase === "add") showTurn();
            else setArena("🎵 Si riparte!", "Tra poco tocca a " + (cur() ? COLORS[cur()] : "…"));
        };

        g.dispose = () => {
            stopTimer();
            speechSynthesis?.cancel();
        };
        return g;
    }



    function makeMosquito() {
        const g = baseGame("mosquito");

        // === File audio ===
        const BUZZ = "assets/sounds/zanzara/ronzio.mp3";
        const FLY_BUZZ = "assets/sounds/zanzara/mosca.mp3";
        const BEE_BUZZ = "assets/sounds/zanzara/ape.mp3";
        const CATCH_SOUND = "assets/sounds/zanzara/presa.mp3";
        const MISS_SOUND = "assets/sounds/zanzara/mancata.mp3";

        // === Parametri comuni ===
        const THRESHOLD = 0.7;
        const MAX_GAIN = 0.6;
        const WIN_POINTS = 2;
        const DURATION = 45000;       // durata massima di un round (ms)
        const HIDE_TIME = 1500;

        // === Parametri mosca ===
        const FLY_SPEED = 3.2;
        const FLY_BOUNDARY = 5;
        const FLY_TURN_MIN = 400;
        const FLY_TURN_MAX = 1600;

        // === Parametri ape ===
        const BEE_SPEED = 1.5;
        const BEE_BOUNDARY = 3;        // l'ape resta più vicina: più occasioni di prenderla
        const BEE_TURN_MIN = 700;
        const BEE_TURN_MAX = 1800;

        let insect = "mosquito";

        let level = 0;
        let target = 0;
        let nextChange = 0;

        let started = 0;
        let graceUntil = 0;
        let hideUntil = 0;

        let blocked = {};
        let interval = null;

        let src = null;
        let gain = null;

        // === Posizione e direzione mosca ===
        let flyX = 3;
        let flyY = 2;
        let flyAngle = 0;
        let flyNextTurn = 0;
        let lastFlyTick = 0;

        // === Posizione e direzione ape ===
        let beeX = 2;
        let beeY = 2;
        let beeAngle = 0;
        let beeNextTurn = 0;
        let lastBeeTick = 0;

        // === Audio ===
        async function startBuzz(file) {
            const buffer = await loadSample(file);

            if (game !== g) return false;

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
                } catch (e) {}

                src.disconnect();
                src = null;
            }

            if (gain) {
                gain.disconnect();
                gain = null;
            }
        }

        // === Zanzara: comportamento originale ===
        function pickTarget() {
            return Math.random() < 0.4
                ? 0.75 + Math.random() * 0.25
                : Math.random() * 0.5;
        }

        // === Movimento mosca ===
        function resetFly(now) {
            const a = Math.random() * Math.PI * 2;
            const r = 1.5 + Math.random() * 1.5;

            flyX = Math.cos(a) * r;
            flyY = Math.sin(a) * r;
            flyAngle = Math.random() * Math.PI * 2;

            flyNextTurn = now + 400 + Math.random() * 600;
            lastFlyTick = now;
        }

        function moveFly(now) {
            const dt = Math.min(
                Math.max((now - lastFlyTick) / 1000, 0),
                0.1
            );

            lastFlyTick = now;

            if (now >= flyNextTurn) {
                const turn =
                    (Math.PI / 4 + Math.random() * Math.PI / 2) *
                    (Math.random() < 0.5 ? -1 : 1);

                flyAngle += turn;

                flyNextTurn = now +
                    FLY_TURN_MIN +
                    Math.random() * (FLY_TURN_MAX - FLY_TURN_MIN);
            }

            flyX += Math.cos(flyAngle) * FLY_SPEED * dt;
            flyY += Math.sin(flyAngle) * FLY_SPEED * dt;

            if (Math.abs(flyX) > FLY_BOUNDARY) {
                flyAngle = Math.PI - flyAngle;
                flyX = Math.max(
                    -FLY_BOUNDARY,
                    Math.min(FLY_BOUNDARY, flyX)
                );
                flyNextTurn = now + 300 + Math.random() * 500;
            }

            if (Math.abs(flyY) > FLY_BOUNDARY) {
                flyAngle = -flyAngle;
                flyY = Math.max(
                    -FLY_BOUNDARY,
                    Math.min(FLY_BOUNDARY, flyY)
                );
                flyNextTurn = now + 300 + Math.random() * 500;
            }

            return Math.hypot(flyX, flyY);
        }

        function flyVolume(distance) {
            const proximity = Math.max(
                0,
                Math.min(1, 1 - distance / FLY_BOUNDARY)
            );

            return Math.pow(proximity, 1.2);
        }

        // === Movimento ape: lento e regolare ===
        function resetBee(now) {
            const a = Math.random() * Math.PI * 2;

            // L'ape parte più vicina al giocatore
            const r = 0.5 + Math.random() * 1.2;

            beeX = Math.cos(a) * r;
            beeY = Math.sin(a) * r;
            beeAngle = Math.random() * Math.PI * 2;

            beeNextTurn = now +
                BEE_TURN_MIN +
                Math.random() * (BEE_TURN_MAX - BEE_TURN_MIN);

            lastBeeTick = now;
        }

        function moveBee(now) {
            const dt = Math.min(
                Math.max((now - lastBeeTick) / 1000, 0),
                0.1
            );

            lastBeeTick = now;

            if (now >= beeNextTurn) {
                // Curve ampie e dolci, niente sterzate brusche
                const turn = (Math.random() - 0.5) * (Math.PI / 3);
                beeAngle += turn;
                // Una volta su due, se si è allontanata, l'ape torna verso il centro (dove il ronzio è fortissimo)
                if (Math.hypot(beeX, beeY) > 1.5 && Math.random() < 0.5) {
                    beeAngle = Math.atan2(-beeY, -beeX) + (Math.random() - 0.5) * (Math.PI / 2);
                }

                beeNextTurn = now +
                    BEE_TURN_MIN +
                    Math.random() * (BEE_TURN_MAX - BEE_TURN_MIN);
            }

            beeX += Math.cos(beeAngle) * BEE_SPEED * dt;
            beeY += Math.sin(beeAngle) * BEE_SPEED * dt;

            if (Math.abs(beeX) > BEE_BOUNDARY) {
                beeAngle = Math.PI - beeAngle;
                beeX = Math.max(
                    -BEE_BOUNDARY,
                    Math.min(BEE_BOUNDARY, beeX)
                );
                beeNextTurn = now + 500;
            }

            if (Math.abs(beeY) > BEE_BOUNDARY) {
                beeAngle = -beeAngle;
                beeY = Math.max(
                    -BEE_BOUNDARY,
                    Math.min(BEE_BOUNDARY, beeY)
                );
                beeNextTurn = now + 500;
            }

            return Math.hypot(beeX, beeY);
        }

        function beeVolume(distance) {
            const proximity = Math.max(
                0,
                Math.min(1, 1 - distance / BEE_BOUNDARY)
            );

            return proximity;   // curva lineare: il ronzio forte arriva da più lontano
        }

        // === Tick del gioco ===
        function tick() {
            if (!gain) return;

            if (paused || g.finished) {
                gain.gain.value = 0;
                return;
            }

            const now = performance.now();

            if (activeNow() - started >= DURATION) {
                endByTime();
                return;
            }

            if (now < hideUntil) {
                target = insect === "mosquito" ? 0.05 : 0.01;
            } else if (insect === "fly") {
                target = flyVolume(moveFly(now));
            } else if (insect === "bee") {
                target = beeVolume(moveBee(now));
            } else if (now >= nextChange) {
                target = pickTarget();
                nextChange = now + 500 + Math.random() * 1500;
            }

            const smoothing = insect === "fly" ? 0.18 : 0.12;
            level += (target - level) * smoothing;

            // Volume generale della mosca +50%.
            // Zanzara e ape mantengono il volume standard.
            const insectGain = (insect === "fly") || (insect === "bee") ? 2.5 : 1;

            const volume = soundEnabled
                ? Math.min(1, MAX_GAIN * insectGain * level * level)
                : 0;

            gain.gain.setTargetAtTime(
                volume,
                ensureAudio().currentTime,
                0.03
            );
        }

        function ranking() {
            return playerIds().sort(
                (a, b) => scores[b] - scores[a]
            );
        }

        function endByTime() {
            const order = ranking();

            stopBuzz();
            stopInterval();

            const tie =
                order.length > 1 &&
                scores[order[0]] === scores[order[1]];

            finish(
                tie
                    ? "Tempo scaduto! Pareggio"
                    : "Tempo scaduto! Vince " + COLORS[order[0]],
                tie ? null : order
            );
        }

        function stopInterval() {
            if (interval !== null) {
                clearInterval(interval);
                interval = null;
            }
        }

        // === Avvio round ===
        g.start = async () => {
            stopInterval();
            stopBuzz();

            blocked = {};
            level = 0;
            target = 0;
            nextChange = 0;
            hideUntil = 0;
            graceUntil = 0;
            started = 0;

            // Scelta casuale: un insetto per round
            const choices = ["mosquito", "fly", "bee"];
            insect = choices[Math.floor(Math.random() * choices.length)];

            const buzzFile = {
                mosquito: BUZZ,
                fly: FLY_BUZZ,
                bee: BEE_BUZZ
            }[insect];

            [BUZZ, FLY_BUZZ, BEE_BUZZ, CATCH_SOUND, MISS_SOUND]
                .forEach(loadSample);

            const icon = insect === "bee"
                ? "🐝"
                : insect === "fly"
                    ? "🪰"
                    : "🦟";

            const insectName = insect === "bee"
                ? "l'ape"
                : insect === "fly"
                    ? "la mosca"
                    : "la zanzara";

            $("#game-status").textContent = "ASCOLTA IL RONZIO";

            setArena(
                icon + " Ascolta…",
                "Premi quando il ronzio è fortissimo"
            );

            let intro;

            if (insect === "bee") {
                intro =
                    "Cattura l'ape. Vola lentamente e cambia direzione in modo graduale. " +
                    "Ascolta il ronzio e premi quando è fortissimo, perché è vicina. " +
                    "Se premi troppo presto perdi un punto. Vince chi ne prende due.";
            } else if (insect === "fly") {
                intro =
                    "Cattura la mosca. Vola in linea retta e cambia bruscamente direzione. " +
                    "Ascolta il ronzio e premi quando è fortissimo, perché è vicina. " +
                    "Se premi troppo presto perdi un punto. Vince chi ne prende due.";
            } else {
                intro =
                    "Prendi la zanzara. Una zanzara vola intorno a te: premi quando " +
                    "il ronzio è fortissimo, perché vuol dire che è vicina. " +
                    "Se premi troppo presto perdi un punto. Vince chi ne prende due.";
            }

            if (!await narrate(g, intro + " Si giocano tre round.")) return;
            if (game !== g || g.finished) return;

            const ok = await startBuzz(buzzFile);
            if (!ok) return;

            const now = performance.now();

            if (insect === "fly") resetFly(now);
            if (insect === "bee") resetBee(now);

            started = activeNow();
            interval = setInterval(tick, 50);
        };

        // === Input giocatore ===
        g.onInput = e => {
            if (
                e.type !== "down" ||
                !playerIds().includes(e.button) ||
                g.finished
            ) return;

            const id = e.button;
            const now = performance.now();

            if (!started || blocked[id] > now) return;
            if (now < graceUntil) return;

            const insectName = insect === "bee"
                ? "l'ape"
                : insect === "fly"
                    ? "la mosca"
                    : "la zanzara";

            if (level >= THRESHOLD && now >= hideUntil) {
                scores[id]++;
                renderScores();

                playSample(
                    CATCH_SOUND,
                    () => tone(880, 0.14, "sine", 0.1)
                );

                toast(COLORS[id] + " prende " + insectName + "!");

                if (scores[id] < WIN_POINTS) {
                    say(COLORS[id] + " prende " + insectName + "!");
                }

                level = 0;
                target = 0;
                hideUntil = now + HIDE_TIME;
                graceUntil = now + 400;

                if (scores[id] >= WIN_POINTS) {
                    stopBuzz();
                    stopInterval();

                    const icon = insect === "bee"
                        ? "🐝 "
                        : insect === "fly"
                            ? "🪰 "
                            : "🦟 ";

                    finish(
                        icon + COLORS[id] + " vince!",
                        ranking()
                    );
                }
            } else {
                scores[id]--;
                renderScores();

                blocked[id] = now + 1000;

                playSample(
                    MISS_SOUND,
                    () => tone(110, 0.22, "square", 0.08)
                );

                toast(
                    "Troppo presto! " +
                    COLORS[id] + " perde un punto"
                );
            }
        };

        g.resume = () => {
            const icon = insect === "bee"
                ? "🐝"
                : insect === "fly"
                    ? "🪰"
                    : "🦟";

            setArena(
                icon + " Ascolta…",
                "Premi quando il ronzio è fortissimo"
            );
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
        g.endDelay = 2500;     // lascia finire il grido
        const EARLY_PENALTY = -1;
        const DEATH_PENALTY = -3;

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
        const MIN_GAP = 500;           // pausa minima tra due canti (ms)
        const MAX_GAP = 4000;          // pausa massima (molto sotto i 10 s di silenzio)
        const DEAD_SILENCE = 10000;    // silenzio oltre il quale il canarino è morto
        const REACTION_WINDOW = 2000;  // tempo per uscire dopo la morte
        const MIN_SONGS = 5;           // canti minimi prima che possa morire
        const MAX_SONGS = 14;          // al più tardi muore dopo questo canto
        const DEATH_CHANCE = .2;       // probabilità di morte dopo ogni canto

        let songGain = null;
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
                songGain = ctx.createGain();
                songGain.gain.value = soundEnabled ? 1 : 0;
                source.buffer = buffer;
                source.connect(songGain);
                songGain.connect(ctx.destination);
                source.start();
                return audibleDurationMs(buffer) + latencyMs();    // ignora il silenzio in coda al file
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

            await introOnce(g, "In miniera. Se il canarino smette di cantare, esci entro due secondi. Ma non scappare troppo presto! Si giocano tre round.");
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
            const pointAdjustments = Object.fromEntries([
                ...early.map(p => [p, EARLY_PENALTY]),
                ...late.map(p => [p, DEATH_PENALTY])
            ]);

            // announce = false: la voce parla dopo il grido
            if (order.length === late.length) {
                // nessuno salvo (né nella finestra né fuggendo)
                finish("💀 Nessuno si è salvato!", null, false, pointAdjustments);
            } else if (safe.length) {
                finish("⛏ " + COLORS[order[0]] + " è l'ultimo a uscire: vince!", order, false, pointAdjustments);
            } else {
                // nessuno ha aspettato: vince chi è fuggito più tardi
                finish("🏃 " + COLORS[order[0]] + " è fuggito per ultimo: vince!", order, false, pointAdjustments);
            }

            // Prima il grido di dolore, poi la voce
            if (late.length) {
                await playSampleWait(PAIN_SOUND, () => {
                    tone(300, .35, "sawtooth", .12);
                    tone(180, .4, "sawtooth", .1, .15);
                });
            }
            if (game !== g) return;
            if (order.length > late.length) sayWin(g, COLORS[order[0]]);
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

        g.pause = () => { if (songGain) songGain.gain.value = 0; };
        return g;
    }

    function makeFreeze() {
        const g = baseGame("freeze");

        // === File audio ===
        const DIR = "assets/sounds/unoduetre/";
        const PHRASE_TEXT = "Uno, due, tre, stai là!";    // letta dalla voce se il file manca
        const STEP_SOUND = DIR + "passi.mp3";          // un breve suono di passi
        const UNO = DIR + "uno-due-tre.mp3";   // solo "uno, due, tre": accelera
        const DQ_SOUND = DIR + "squalificato.mp3";     // squalifica
        const STAI = DIR + "stai-la.mp3";      // solo "stai là!"

        // === Parametri ===
        const PRE_STAI = [0, 300];             // pausa casuale tra "tre" e "stai là" (ms)
        const TARGET = 30;              // passi necessari per vincere
        const RATE_START = [0.8, 1.05]; // velocità a inizio frase (casuale in questo intervallo)
        const RATE_END = [1.6, 2.4];    // velocità a fine frase: la frase accelera mentre viene riprodotta
        const VOICE_RATE = [1.0, 1.9];  // con la voce sintetica non si può accelerare a metà frase: velocità casuale per frase
        const VOICE_GRACE = 450;        // tolleranza extra: la voce sintetica parte con un po' di ritardo
        const BLOCK_GAP = [1500, 4000]; // pausa casuale dopo "stai là!", prima di ricominciare (ms)
        const GRACE = 0;              // dopo la fine di "tre" il tempo di reazione è tollerato (ms)
        const LATENCY_COMP = 0;       // 0 = nessuna compensazione della latenza audio (più severo), 1 = completa
        const MIN_VOL = 0.08;           // volume dei passi al primo passo
        const MAX_VOL = 1.0;            // volume dei passi al traguardo
        const PITCH = {P1: 1.0, P2: 0.88, P3: 1.12, P4: 0.78}; // passi diversi per giocatore

        let phase = "intro";            // intro | run
        let frozen = false, freezeStart = 0, voicePhrase = false, phraseId = 0, current = null, current2 = null;
        let counts = {}, dq = new Set();
        const buffers = new Map();

        const rand = ([min, max]) => min + Math.random() * (max - min);
        const dbg = (msg) => window.BPDebug?.log("partita", "info", msg);

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

        // Interrompe la frase in corso (pausa, uscita, nuova frase)
        function stopPhrase() {
            phraseId++;
            if (current) {
                try {
                    current.stop();
                } catch (e) { /* già finita */
                }
                current = null;
            }
            if (current2) {
                try {
                    current2.stop();
                } catch (e) {
                }
                current2 = null;
            }
            speechSynthesis?.cancel();
        }

        function startFreeze(at = performance.now()) {
            if (game !== g || g.finished) return;
            frozen = true;
            freezeStart = at;
            $("#game-status").textContent = "FERMI!";
            setArena("🛑 STAI LÀ!", "Fermi! Chi preme è squalificato", "signal");
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
            frozen = false;
            counts = Object.fromEntries(playerIds().map(p => [p, 0]));
            dq = new Set();

            $("#game-status").textContent = "PREPARATI";
            setArena("🚦 Preparati…", "Ascolta le istruzioni");
            display();

            // Precarica tutto mentre la voce spiega
            const preload = Promise.all(
                [UNO, STAI, STEP_SOUND, DQ_SOUND].map(async p => buffers.set(p, await loadSample(p)))
            );

            await sayIntro("Uno, due, tre, stai là! Premi il più possibile, ma quando senti stai là, fermàti!");
            await preload;
            if (game !== g) return;

            $("#game-status").textContent = "UNO, DUE, TRE…";
            setArena("🚦 Si parte!", "Premi il tuo tasto più veloce che puoi");
            phase = "run";
            if (!paused) later(playStep, 800);
        };

        // Una frase intera "uno, due, tre, stai là!": la velocità cresce mentre viene riprodotta,
        // così è difficile prevedere quando finisce. "Stai là" inizia a STAI_LA_FROM della frase.
        function playStep() {
            if (g.finished) return;
            stopPhrase();
            frozen = false;                   // riparte la corsa
            const id = phraseId;
            $("#game-status").textContent = "CORRI!";
            setArena("🏃 Corri!", "Premi il tuo tasto! Obiettivo: " + TARGET + " passi");

            const bUno = buffers.get(UNO), bStai = buffers.get(STAI);
            if (bUno && bStai) {
                voicePhrase = false;
                const r0 = rand(RATE_START), r1 = rand(RATE_END);
                const total = bUno.duration / ((r0 + r1) / 2) * 1000;        // durata reale di "uno due tre"
                const gap = rand(PRE_STAI);
                const ctx = ensureAudio(), t = ctx.currentTime + .05;

                const s1 = ctx.createBufferSource(), g1 = ctx.createGain();
                s1.buffer = bUno;
                s1.playbackRate.setValueAtTime(r0, t);
                s1.playbackRate.linearRampToValueAtTime(r1, t + total / 1000);
                g1.gain.value = soundEnabled ? 1 : 0;
                s1.connect(g1); g1.connect(ctx.destination);
                s1.start(t);
                current = s1;

                // "stai là" sul clock audio: parte esattamente quando finisce "tre" + pausa
                const tStai = t + total / 1000 + gap / 1000;
                const s2 = ctx.createBufferSource(), g2 = ctx.createGain();
                s2.buffer = bStai;
                g2.gain.value = soundEnabled ? 1 : 0;
                s2.connect(g2); g2.connect(ctx.destination);
                s2.start(tStai);
                current2 = s2;

                // Si deve fermare appena FINISCE "tre" (parte udibile, senza il silenzio in coda al file):
                // non si aspetta più "stai là"
                // Istante esatto in cui la registrazione, che accelera in modo lineare, arriva alla fine percepita di "tre"
                const P = perceivedDurationMs(bUno) / 1000, T = total / 1000, a = (r1 - r0) / (2 * T);
                const tTre = Math.abs(a) < 1e-9 ? P / r0 : (-r0 + Math.sqrt(r0 * r0 + 4 * a * P)) / (2 * a);
                const treMs = Math.min(T, tTre) * 1000;
                const untilTre = (t + treMs / 1000 - ctx.currentTime) * 1000;
                const freezeAt = performance.now() + untilTre + LATENCY_COMP * latencyMs();   // fine di "tre"
                const afterTre = gap + bStai.duration * 1000 + rand(BLOCK_GAP);
                dbg(`uno-due-tre ${(treMs / 1000).toFixed(2)}s (${r0.toFixed(2)}×→${r1.toFixed(2)}×), stop alla fine di "tre", "stai là" dopo ${Math.round(gap)} ms`);
                later(() => {
                    if (id !== phraseId) return;
                    startFreeze(freezeAt);
                    later(playStep, afterTre);
                }, untilTre);
            } else if ("speechSynthesis" in window && soundEnabled) {
                // File mancante: la voce dice tutta la frase, a velocità casuale
                voicePhrase = true;
                const u = new SpeechSynthesisUtterance(PHRASE_TEXT);
                u.lang = "it-IT";
                u.rate = rand(VOICE_RATE);
                u.volume = 1;
                const staiAt = PHRASE_TEXT.toLowerCase().indexOf("stai");
                let froze = false, ended = false, safety = null;
                const freezeNow = () => {
                    if (froze || id !== phraseId) return;
                    froze = true;
                    startFreeze();
                };
                const finishPhrase = () => {
                    if (ended || id !== phraseId || game !== g) return;
                    ended = true;
                    clearTimeout(safety);
                    spokenKeep.delete(u);
                    freezeNow();                 // se la voce non dà i confini delle parole: si congela alla fine
                    later(playStep, rand(BLOCK_GAP));
                };
                u.onboundary = ev => {
                    if (ev.charIndex >= staiAt) freezeNow();
                };
                u.onend = finishPhrase;
                u.onerror = finishPhrase;
                safety = setTimeout(finishPhrase, 12000);
                spokenKeep.add(u);
                dbg(`frase letta dalla voce a velocità ${u.rate.toFixed(2)}×`);
                speechSynthesis.speak(u);
            } else {
                voicePhrase = false;
                tone(330, .25, "triangle", .12);
                tone(392, .25, "triangle", .12, .4);
                tone(494, .25, "triangle", .12, .8);
                later(() => {
                    if (id !== phraseId) return;
                    startFreeze();
                    tone(150, .5, "sawtooth", .12);
                    later(playStep, 600 + rand(BLOCK_GAP));
                }, 1200);
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
            if (frozen && performance.now() >= freezeStart + GRACE + (voicePhrase ? VOICE_GRACE : 0)) {
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

        g.pause = () => stopPhrase();   // la frase in corso si interrompe, alla ripresa ne parte una nuova

        g.resume = () => {
            frozen = false;
            setArena("🚦 Si riparte!", "Aspetta che ricominci…");
            if (phase === "run") later(playStep, 800);
        };

        g.dispose = () => {
            stopTimer();
            stopPhrase();
        };

        return g;
    }

    function makeLesson() {
        // "A lezione": come "Uno, due, tre, stai là!", ma il segnale è la voce di un prof di inglese.
        // Mentre il prof spiega (e il gesso scrive) si preme il più possibile; quando si ferma a sorpresa
        // chi preme viene scoperto e sospeso.
        const g = baseGame("lesson");

        // === File audio (facoltativi: se mancano si usano suoni sintetici) ===
        const DIR = "assets/sounds/lezione/";
        const CHALK = DIR + "gesso.mp3";            // gessetto sulla lavagna, in loop mentre il prof parla
        const DQ_SOUND = DIR + "sospeso.mp3";       // suono di esclusione
        const LOOP_FILES = {                        // un suono in loop per giocatore, acceso mentre preme
            P1: DIR + "patatine.mp3",
            P2: DIR + "lattina.mp3",
            P3: DIR + "cannuccia.mp3",
            P4: DIR + "caramella.mp3"
        };
        const SYNTH_FREQ = {P1: 4500, P2: 7000, P3: 2500, P4: 3500};   // timbro del suono sintetico di ripiego
        const PAN = {P1: -.6, P2: -.2, P3: .2, P4: .6};

        // === Voce del professore: voce Google inglese ===
        const TEACHER_VOICES = ["Google UK English Male", "Google UK English Female", "Google US English"];
        const TEACHER_RATE = .95;
        const TEACHER_PITCH = .9;

        // === Parametri ===
        const TARGET = 40;                // pressioni necessarie per vincere
        const TALK_MS = [2500, 7000];     // quanto parla il prof prima di fermarsi (a caso, anche a metà frase)
        const FREEZE_MS = [1800, 3800];   // quanto resta in silenzio
        const FREEZE_GRACE = 400;         // tolleranza dopo lo stop (tempo di reazione)
        const DQ_BATCH = 350;             // chi viene scoperto entro questo tempo è annunciato insieme
        const RESUME_GAP = 500;           // pausa prima che il prof riprenda a parlare
        const PRESS_HOLD = 260;           // il suono di un giocatore resta acceso per questo tempo dopo l'ultima pressione
        const MIN_VOL = .08;              // volume del suono del giocatore alla prima pressione
        const MAX_VOL = 1;                // volume al traguardo
        const CHALK_VOLUME = .35;

        // === Lezioni (il prof legge tutto con la voce inglese, traduzioni comprese) ===
        const LESSONS = [
            "The pen is on the table significa la penna è sul tavolo, mentre the book is under the chair significa il libro è sotto la sedia.",
            "Today we study the verb to be. I am significa io sono, you are significa tu sei, he is significa lui è.",
            "The cat is sleeping on the sofa significa il gatto dorme sul divano, mentre the dog is not happy significa il cane non è contento.",
            "Please open your books at page twenty significa per favore aprite i libri a pagina venti, and do not look at the window.",
            "My brother has a red bicycle significa mio fratello ha una bicicletta rossa, but it is very old significa ma è molto vecchia.",
            "Where is the teacher? The teacher is behind you significa il professore è dietro di te.",
            "I like pizza significa mi piace la pizza, mentre I do not like homework significa non mi piacciono i compiti.",
            "The weather is nice today significa oggi il tempo è bello, so we go to the park significa quindi andiamo al parco.",
            "Remember, the past of go is went significa il passato di andare è went, not goed, please.",
            "What time is it? It is half past ten significa sono le dieci e mezza, and the lesson is very long significa e la lezione è molto lunga.",
            "She always drinks tea in the morning significa lei beve sempre il tè la mattina, mentre he drinks coffee significa lui beve il caffè.",
            "Listen carefully. The apple is red significa la mela è rossa, and the banana is yellow significa e la banana è gialla.",
            "Never talk during the test significa non parlate mai durante il compito, and never eat chips in class significa e non mangiate mai patatine in classe.",
            "The window is open significa la finestra è aperta, so please close it significa quindi per favore chiùdila."
        ];

        // Frasi di sospensione: {n} = nomi dei giocatori scoperti
        const DQ_ONE = [
            "{n}, sei sospeso!",
            "{n}, fuori dalla classe!",
            "{n}, ti ho visto! Vai dal preside!",
            "{n}, ti ho scoperto! Fuori!",
            "{n}, nota sul registro e fuori dalla classe!"
        ];
        const DQ_MANY = [
            "{n}, siete sospesi!",
            "{n}, fuori dalla classe!",
            "{n}, vi ho visti! Andate dal preside!",
            "{n}, vi ho scoperti! Fuori!"
        ];

        let phase = "intro";              // intro | run
        let mode = "wait";                // wait (nessuno preme) | talk (si preme) | freeze (vietato premere)
        let counts = {}, dq = new Set(), lastPress = {}, pending = new Set();
        let freezeStart = 0, freezeDone = false, resumeQueued = false, announcing = 0;
        let talkId = 0, cutTimer = null, guardTimer = null, safetyTimer = null, pendingTimer = null, loopTimer = null;
        let lessonPool = [], chalk = null, loops = {};
        const buffers = new Map();

        const rand = ([min, max]) => min + Math.random() * (max - min);
        const dbg = msg => window.BPDebug?.log("lezione", "info", msg);
        const norm = lang => (lang || "").replace("_", "-").toLowerCase();

        // --- Voce del prof ---
        function getTeacherVoice() {
            if (!("speechSynthesis" in window)) return null;
            const voices = speechSynthesis.getVoices();
            for (const name of TEACHER_VOICES) {
                const v = voices.find(x => x.name === name);
                if (v) return v;
            }
            return voices.find(v => norm(v.lang) === "en-gb") ||
                voices.find(v => norm(v.lang) === "en-us") ||
                voices.find(v => norm(v.lang).startsWith("en")) || null;
        }

        function teacherUtterance(text) {
            const u = new SpeechSynthesisUtterance(text);
            const v = getTeacherVoice();
            if (v) {
                u.voice = v;
                u.lang = v.lang;
            } else u.lang = "en-GB";
            u.rate = TEACHER_RATE;
            u.pitch = TEACHER_PITCH;
            u.volume = soundEnabled ? 1 : 0;
            return u;
        }

        // Il prof dice una frase intera (usata per le sospensioni)
        function sayTeacher(text) {
            return new Promise(resolve => {
                if (!("speechSynthesis" in window)) return resolve();
                const u = teacherUtterance(text);
                let done = false;
                const end = () => {
                    if (done) return;
                    done = true;
                    clearTimeout(safety);
                    spokenKeep.delete(u);
                    resolve();
                };
                const safety = setTimeout(end, 8000);
                u.onend = end;
                u.onerror = end;
                spokenKeep.add(u);
                speechSynthesis.speak(u);
            });
        }

        function nextLesson() {
            if (!lessonPool.length) lessonPool = [...LESSONS].sort(() => Math.random() - .5);
            return lessonPool.pop();
        }

        function joinNames(ids) {
            const n = ids.map(p => COLORS[p]);
            return n.length > 1 ? n.slice(0, -1).join(", ") + " e " + n[n.length - 1] : n[0];
        }

        function dqPhrase(ids) {
            const list = ids.length > 1 ? DQ_MANY : DQ_ONE;
            return list[Math.floor(Math.random() * list.length)].replace("{n}", joinNames(ids));
        }

        // --- Suoni sintetici di ripiego: rumore a scoppi (gesso, patatine, lattina...) ---
        function makeScratch(ctx, seconds, burstsPerSec, burstMs) {
            const sr = ctx.sampleRate, len = Math.floor(sr * seconds);
            const buffer = ctx.createBuffer(1, len, sr), d = buffer.getChannelData(0);
            const bursts = Math.floor(seconds * burstsPerSec);
            for (let k = 0; k < bursts; k++) {
                const at = Math.floor(Math.random() * len);
                const n = Math.floor(sr * burstMs / 1000 * (.4 + Math.random() * .6));
                const amp = .3 + Math.random() * .7;
                for (let j = 0; j < n; j++) d[(at + j) % len] += (Math.random() * 2 - 1) * amp * (1 - j / n);
            }
            for (let i = 0; i < len; i++) d[i] = Math.max(-1, Math.min(1, d[i]));
            return buffer;
        }

        // --- Gesso: in loop solo mentre il prof parla ---
        function startChalk() {
            stopChalk();
            const ctx = ensureAudio();
            const buffer = buffers.get(CHALK);
            const gain = ctx.createGain();
            gain.gain.value = 0;
            const src = ctx.createBufferSource();
            let filter = null;
            if (buffer) {
                src.buffer = buffer;
                src.connect(gain);
            } else {
                src.buffer = makeScratch(ctx, 2, 10, 90);
                filter = ctx.createBiquadFilter();
                filter.type = "bandpass";
                filter.frequency.value = 3200;
                filter.Q.value = 1;
                src.connect(filter);
                filter.connect(gain);
            }
            src.loop = true;
            gain.connect(ctx.destination);
            src.start(0, buffer ? Math.random() * buffer.duration : 0);
            gain.gain.setTargetAtTime(soundEnabled ? CHALK_VOLUME : 0, ctx.currentTime, .02);
            chalk = {src, gain, filter};
        }

        function stopChalk() {
            if (!chalk) return;
            const c = chalk;
            chalk = null;
            try {
                const ctx = ensureAudio();
                c.gain.gain.setTargetAtTime(0, ctx.currentTime, .01);
                c.src.stop(ctx.currentTime + .08);
            } catch (e) {
            }
            setTimeout(() => {
                try {
                    c.src.disconnect();
                    c.gain.disconnect();
                    c.filter?.disconnect();
                } catch (e) {
                }
            }, 250);
        }

        // --- Suoni dei giocatori: un loop a testa, acceso solo mentre premono, sempre più forte ---
        const volumeFor = id => MIN_VOL + (MAX_VOL - MIN_VOL) * Math.min(1, (counts[id] || 0) / TARGET);

        function startLoops() {
            stopLoops();
            const ctx = ensureAudio();
            for (const id of playerIds()) {
                const buffer = buffers.get(LOOP_FILES[id]);
                const gain = ctx.createGain();
                gain.gain.value = 0;
                const src = ctx.createBufferSource();
                let filter = null;
                if (buffer) {
                    src.buffer = buffer;
                    src.connect(gain);
                } else {
                    src.buffer = makeScratch(ctx, 1, 35, 30);
                    filter = ctx.createBiquadFilter();
                    filter.type = "bandpass";
                    filter.frequency.value = SYNTH_FREQ[id] || 4000;
                    filter.Q.value = .7;
                    src.connect(filter);
                    filter.connect(gain);
                }
                src.loop = true;
                let out = gain;
                if (ctx.createStereoPanner) {
                    const panner = ctx.createStereoPanner();
                    panner.pan.value = PAN[id] || 0;
                    gain.connect(panner);
                    out = panner;
                }
                out.connect(ctx.destination);
                src.start(0, buffer ? Math.random() * buffer.duration : 0);
                loops[id] = {src, gain, out, filter, synth: !buffer};
            }
        }

        function stopLoops() {
            for (const id of Object.keys(loops)) {
                const l = loops[id];
                try {
                    l.src.stop();
                } catch (e) {
                }
                l.src.disconnect();
                l.filter?.disconnect();
                l.gain.disconnect();
                if (l.out !== l.gain) l.out.disconnect();
            }
            loops = {};
        }

        function updateLoops() {
            if (!audio) return;
            const now = performance.now();
            for (const id of Object.keys(loops)) {
                const l = loops[id];
                const on = soundEnabled && !paused && !g.finished && mode !== "wait" && !dq.has(id) &&
                    now - (lastPress[id] || 0) < PRESS_HOLD;
                const vol = volumeFor(id) * (l.synth ? .5 : 1);
                l.gain.gain.setTargetAtTime(on ? vol : 0, audio.currentTime, .03);
            }
        }

        // Suono di esclusione: Promise che si risolve a fine suono
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
            renderScores(Object.fromEntries(playerIds().map(p => [p, dq.has(p) ? "OUT" : counts[p]])));
        }

        function ranking() {
            return playerIds().sort((a, b) => (dq.has(a) - dq.has(b)) || (counts[b] - counts[a]));
        }

        // --- Ciclo: il prof parla → si ferma a sorpresa → silenzio → riprende ---
        function clearTalkTimers() {
            clearTimeout(cutTimer);
            clearTimeout(guardTimer);
            clearTimeout(safetyTimer);
            cutTimer = guardTimer = safetyTimer = null;
        }

        function stopTalk() {
            talkId++;
            clearTalkTimers();
            speechSynthesis?.cancel();
            stopChalk();
        }

        function stopAll() {
            stopTalk();
            stopLoops();
            clearInterval(loopTimer);
            loopTimer = null;
        }

        function startTalk() {
            resumeQueued = false;
            if (game !== g || g.finished || paused) return;
            stopTalk();
            const id = ++talkId;
            mode = "talk";
            freezeDone = false;
            $("#game-status").textContent = "IL PROF SPIEGA";
            setArena("📖 Il prof spiega…", "Premi il più possibile! Obiettivo: " + TARGET);
            startChalk();

            let over = false;
            const stop = () => {
                if (over || id !== talkId) return;
                over = true;
                beginFreeze();
            };
            const armCut = () => {
                if (!over && id === talkId && cutTimer === null) cutTimer = setTimeout(stop, rand(TALK_MS));
            };

            if ("speechSynthesis" in window) {
                const u = teacherUtterance(nextLesson());
                u.onstart = armCut;
                u.onend = stop;     // la frase è finita prima dello stop casuale
                u.onerror = stop;
                spokenKeep.add(u);
                speechSynthesis.speak(u);
                guardTimer = setTimeout(armCut, 1500);    // se la voce non parte, il ciclo va avanti lo stesso
                safetyTimer = setTimeout(stop, 25000);
            } else {
                armCut();
            }
        }

        function beginFreeze() {
            if (game !== g || g.finished) return;
            clearTalkTimers();
            speechSynthesis?.cancel();      // il prof si interrompe di colpo, anche a metà frase
            stopChalk();
            mode = "freeze";
            freezeStart = performance.now();
            freezeDone = false;
            $("#game-status").textContent = "SILENZIO!";
            setArena("🤫 Il prof si è girato!", "Fermi! Chi preme viene scoperto", "signal");
            const ms = rand(FREEZE_MS);
            dbg("prof zitto per " + Math.round(ms) + " ms");
            later(() => {
                freezeDone = true;
                resumeCheck();
            }, ms);
        }

        // Il prof riprende solo quando il silenzio è finito e le sospensioni sono state annunciate
        function resumeCheck() {
            if (game !== g || g.finished || paused || mode !== "freeze" || !freezeDone ||
                announcing > 0 || pendingTimer !== null || resumeQueued) return;
            resumeQueued = true;
            later(startTalk, RESUME_GAP);
        }

        // Un giocatore ha premuto durante il silenzio
        function caught(id) {
            dq.add(id);
            pending.add(id);
            display();
            updateLoops();
            toast("Scoperto: " + COLORS[id]);
            if (pendingTimer === null) pendingTimer = setTimeout(() => flushBatch(false), DQ_BATCH);
        }

        // Annuncia insieme chi è stato scoperto quasi nello stesso momento
        function flushBatch(silent) {
            pendingTimer = null;
            const ids = [...pending];
            pending.clear();
            if (!ids.length) return;

            const alive = playerIds().filter(p => !dq.has(p));
            let winner = null, over = false;
            if (!alive.length) {
                over = true;
                finish("🛑 Sospesi tutti! Nessun vincitore", null, false);
            } else if (playerIds().length > 1 && alive.length === 1) {
                over = true;
                winner = alive[0];
                finish("🏆 " + COLORS[winner] + " è l'ultimo in classe: vince!", ranking(), false);
            }
            if (over) stopAll();
            if (silent) {
                resumeCheck();
                return;
            }

            announcing++;
            (async () => {
                await playDq();                       // prima il suono di esclusione…
                if (game === g) await sayTeacher(dqPhrase(ids));   // …poi la voce del prof
                announcing--;
                if (game !== g) return;
                if (winner) say("Vince " + COLORS[winner]);
                else resumeCheck();
            })();
        }

        g.start = async () => {
            phase = "intro";
            mode = "wait";
            counts = Object.fromEntries(playerIds().map(p => [p, 0]));
            dq = new Set();
            pending = new Set();
            lastPress = {};
            lessonPool = [];
            announcing = 0;
            resumeQueued = false;

            $("#game-status").textContent = "PREPARATI";
            setArena("📚 Preparati…", "Ascolta le istruzioni");
            display();
            if ("speechSynthesis" in window) speechSynthesis.getVoices();

            const preload = Promise.all(
                [CHALK, DQ_SOUND, ...playerIds().map(p => LOOP_FILES[p])]
                    .map(async p => buffers.set(p, await loadSample(p)))
            );

            await sayIntro("A lezione. Il professore spiega inglese: mentre parla, premi il più possibile il tuo tasto. " +
                "Quando si ferma, fermàti anche tu: se ti scopre sei sospeso. Vince chi arriva per primo a " + TARGET +
                " pressioni, o l'ultimo rimasto in classe.");
            await preload;
            if (game !== g) return;

            phase = "run";
            startLoops();
            loopTimer = setInterval(updateLoops, 60);
            setArena("📚 Si comincia!", "Aspetta che il prof inizi a spiegare");
            if (!paused) later(startTalk, 800);
        };

        g.onInput = e => {
            if (e.type !== "down" || !playerIds().includes(e.button) || g.finished) return;
            if (phase !== "run" || mode === "wait") return;
            const id = e.button;
            if (dq.has(id)) return;

            // Il prof è zitto (superata la tolleranza): premere è vietato
            if (mode === "freeze" && performance.now() >= freezeStart + FREEZE_GRACE) {
                caught(id);
                return;
            }

            counts[id]++;
            lastPress[id] = performance.now();
            updateLoops();
            display();

            if (counts[id] >= TARGET) {
                stopAll();
                finish("📚 " + COLORS[id] + " vince con " + counts[id] + " pressioni!", ranking());
            }
        };

        g.pause = () => {
            if (pendingTimer !== null) {
                clearTimeout(pendingTimer);
                flushBatch(true);
            }
            stopTalk();
            mode = "wait";
            freezeDone = false;
            resumeQueued = false;
            updateLoops();
        };

        g.resume = () => {
            setArena("📚 Si riparte!", "Aspetta che il prof riprenda a spiegare");
            if (phase === "run" && !g.finished) later(startTalk, 800);
        };

        g.dispose = () => {
            stopTimer();
            clearTimeout(pendingTimer);
            pendingTimer = null;
            stopAll();
        };

        return g;
    }

    function makeDoor() {
        // "Chi bussa alla porta": qualcuno bussa o suona il campanello. Se è una persona gradita si preme
        // il prima possibile per aprire; se non lo è, non bisogna aprire. Ogni partita associa a caso
        // i suoni di campanelli e bussate alle persone, che vengono presentate all'inizio.
        const g = baseGame("door");

        // === File audio (facoltativi: se mancano si usano suoni sintetici) ===
        const DIR = "assets/sounds/porta/";
        const DOOR_OPEN = DIR + "porta-apre.mp3";                     // la porta che si apre
        const personFile = p => DIR + "persona-" + p.key + ".mp3";    // voce/suono dedicato di ogni persona
        // Pool di modi di bussare e suonare: ogni partita li assegna a caso alle persone
        const SLOTS = [
            ...[1, 2, 3, 4, 5, 6].map(n => ({file: DIR + "bussare-" + n + ".mp3", kind: "knock", variant: n})),
            ...[1, 2, 3, 4, 5, 6].map(n => ({file: DIR + "campanello-" + n + ".mp3", kind: "bell", variant: n}))
        ];

        // === Persone (chi è gradito e chi no si capisce dalla descrizione) ===
        const WELCOME = [
            {key: "partner", who: "il tuo partner", intro: "Il tuo partner, che torna a casa."},
            {key: "amici", who: "i tuoi amici", intro: "I tuoi amici, con le pizze e le birre."},
            {key: "corriere", who: "il corriere", intro: "Il corriere, con il tuo pacco."},
            {key: "caldaia", who: "il tecnico della caldaia", intro: "Il tecnico della caldaia."},
            {key: "pizza", who: "il fattorino della pizza", intro: "Il fattorino con la tua pizza."},
            {key: "nonna", who: "la nonna", intro: "La nonna, con una torta fatta in casa."}
        ];
        const UNWELCOME = [
            {key: "vigile", who: "il vigile", intro: "Il vigile, che vuole portarti la multa."},
            {key: "testimoni", who: "i testimoni di Geova", intro: "I testimoni di Geova."},
            {key: "venditore", who: "il venditore di aspirapolvere", intro: "Il venditore di aspirapolvere."},
            {key: "ex", who: "il tuo ex", intro: "Il tuo ex, che vuole parlare."},
            {key: "vicino", who: "il vicino che si lamenta", intro: "Il vicino, che si lamenta del rumore."},
            {key: "giudiziario", who: "l'ufficiale giudiziario", intro: "L'ufficiale giudiziario, con un pignoramento."}
        ];

        // === Parametri ===
        const ROUNDS = 12;
        const PER_SIDE = 3;               // persone gradite e sgradite in ogni partita
        // Il ritmo accelera: i valori passano da "inizio" a "fine" nei primi RAMP_ROUNDS round.
        const RAMP_ROUNDS = 8;
        const GAP_START = [1500, 3500], GAP_END = [500, 1500];   // attesa casuale prima che qualcuno bussi (ms)
        const MIN_WINDOW_START = 1500, MIN_WINDOW_END = 900;     // tempo minimo per aprire dall'inizio del suono (ms)
        const REACT_AFTER_START = 1000, REACT_AFTER_END = 600;   // tempo extra dopo la fine del suono (ms)
        const REVEAL_PAUSE_START = 1200, REVEAL_PAUSE_END = 600; // pausa dopo la rivelazione, prima del round successivo (ms)
        const NOBODY_PAUSE_START = 1800, NOBODY_PAUSE_END = 900; // pausa se nessuno ha aperto (ms)
        const POINTS_OPEN = 1;            // apri a una persona gradita
        const PENALTY_OPEN = 1;           // apri a una persona sgradita
        const PENALTY_EARLY = 1;          // premi quando nessuno ha bussato

        let phase = "intro";              // intro | gap | open | reveal | over
        let crowd = [], current = null, round = 0, serial = 0, fouls = new Set(), recent = [];

        const rand = ([min, max]) => min + Math.random() * (max - min);
        const lerp = (a, b, p) => a + (b - a) * p;
        const progress = () => Math.min(1, Math.max(0, round - 1) / RAMP_ROUNDS);
        const pick = list => list[Math.floor(Math.random() * list.length)];
        const shuffle = list => [...list].sort(() => Math.random() - .5);
        const wait = ms => new Promise(r => setTimeout(r, ms));
        const dbg = (lvl, msg) => window.BPDebug?.log("porta", lvl, msg);

        // --- Suoni sintetici di ripiego ---
        function synthMs(slot) {
            return slot.kind === "knock" ? (2 + (slot.variant % 3)) * 220 + 150 : 1300;
        }

        function synthSlot(slot) {
            if (slot.kind === "knock") {
                const n = 2 + (slot.variant % 3), base = 140 + slot.variant * 22;
                for (let i = 0; i < n; i++) {
                    noise(.06, .12);
                    tone(base, .08, "triangle", .14, i * .22);
                }
            } else {
                const f = 520 + slot.variant * 70;
                tone(f, .5, "sine", .12);
                tone(f * .8, .7, "sine", .12, .45);
            }
        }

        const playSlot = slot => playTimed(slot.file, {fallback: () => synthSlot(slot), fallbackMs: synthMs(slot)});
        const playDoor = () => playTimed(DOOR_OPEN, {
            fallback: () => {
                tone(180, .35, "sawtooth", .06);
                tone(240, .45, "sawtooth", .06, .2);
            }, fallbackMs: 800
        });
        const playPerson = p => playTimed(personFile(p), {fallbackMs: 0});

        // --- Prepara le persone di questa partita e associa i suoni a caso ---
        function buildCrowd() {
            const people = [...shuffle(WELCOME).slice(0, PER_SIDE).map(p => ({...p, desired: true})),
                ...shuffle(UNWELCOME).slice(0, PER_SIDE).map(p => ({...p, desired: false}))];
            const slots = shuffle(SLOTS);
            people.forEach((p, i) => p.slot = slots[i]);
            return shuffle(people);
        }

        g.start = async () => {
            phase = "intro";
            round = 0;
            recent = [];
            current = null;
            crowd = buildCrowd();
            scores = Object.fromEntries(playerIds().map(p => [p, 0]));
            $("#game-status").textContent = "PREPARATI";
            setArena("🚪 Chi bussa alla porta", "Ascolta chi potrebbe presentarsi");
            renderScores();

            crowd.forEach(p => dbg("info", (p.desired ? "✅ gradito: " : "⛔ sgradito: ") + p.who + " → " +
                p.slot.kind + " " + p.slot.variant));
            window.BPDebug?.watch(() => ({
                round: round + "/" + ROUNDS,
                fase: phase,
                alla_porta: current ? current.who + (current.desired ? " (gradito)" : " (sgradito)") : "—",
                suono: current ? current.slot.kind + " " + current.slot.variant : "—",
                punti: {...scores}
            }));

            // Precarica tutti i suoni mentre parla la voce
            const preload = Promise.all([DOOR_OPEN, ...crowd.map(personFile), ...crowd.map(p => p.slot.file)].map(loadSample));

            // Introduzione: regole e presentazione delle persone.
            // Pausa/tasto centrale saltano solo la voce del narratore: i suoni di chi vuole entrare
            // (voce della persona, bussata o campanello) si sentono sempre, così si imparano.
            let skipped = false;
            const skip = () => {
                skipped = true;
                speechSynthesis?.cancel();     // interrompe la frase in corso, i suoni continuano
            };
            introSkip = skip;
            const narrate = async text => {
                if (!skipped && game === g) await sayAsync(text);
            };
            try {
                await narrate("Chi bussa alla porta. Qualcuno bussa o suona il campanello. Se è una persona che vuoi vedere, " +
                    "premi il più in fretta possibile per aprire. Ma se non la vuoi, non aprire! Il primo che preme apre la porta. " +
                    "Ascolta chi potrebbe presentarsi, e come si annuncia.");
                for (const p of crowd) {
                    console.log("Presenting person:", p);
                    if (game !== g) break;
                    console.log("Narrating intro for person:", p);
                    await sayAsync(p.intro);
                    console.log("Finished narrating intro for person:", p);
                    if (game !== g) break;
                    // console.log("Playing person:", p);
                    // const v = await playPerson(p);
                    // console.log("Finished playing person:", p);
                    // await v.ended;
                    console.log("Finished waiting for person to end:", p);
                    await sayAsync(p.slot.kind === "knock" ? "Bussa così." : "Suona il campanello così.");
                    console.log("Finished narrating slot for person:", p);
                    if (game !== g) break;
                    console.log("Playing slot for person:", p);
                    const s = await playSlot(p.slot);
                    console.log("Finished playing slot for person:", p);
                    await s.ended;
                    console.log("Finished waiting for slot to end for person:", p);
                    await wait(skipped ? 500 : 300);
                }
                await narrate("Si comincia!");
            } finally {
                if (introSkip === skip) introSkip = null;
            }
            await preload;
            if (game !== g) return;
            while (paused && game === g) await wait(150);
            nextRound();
        };

        function pickPerson() {
            let wantDesired = Math.random() < .5;
            const last2 = recent.slice(-2);
            if (last2.length === 2 && last2[0] === last2[1] && last2[0] === wantDesired) wantDesired = !wantDesired;
            const list = crowd.filter(p => p.desired === wantDesired && p !== current);
            recent.push(wantDesired);
            return pick(list.length ? list : crowd.filter(p => p.desired === wantDesired));
        }

        function nextRound() {
            if (game !== g || g.finished) return;
            round++;
            if (round > ROUNDS) {
                round = ROUNDS;
                conclude();
                return;
            }
            serial++;
            current = pickPerson();
            fouls = new Set();
            phase = "gap";
            $("#game-status").textContent = "ROUND " + round + " DI " + ROUNDS;
            setArena("🚪 Round " + round + " di " + ROUNDS, "Silenzio… qualcuno sta arrivando");
            const p = progress();
            later(knock, rand([lerp(GAP_START[0], GAP_END[0], p), lerp(GAP_START[1], GAP_END[1], p)]));
        }

        // Qualcuno bussa o suona: si può aprire da subito
        async function knock() {
            if (game !== g || g.finished) return;
            const mine = serial;
            phase = "open";
            setArena("🔔 Qualcuno è alla porta!", "Apri… se vuoi");
            const t = await playSlot(current.slot);
            if (game !== g || g.finished || phase !== "open" || mine !== serial) return;   // già aperto nel frattempo
            const now = performance.now();
            const p = progress();
            const closeAt = Math.max(t.endsAt, t.audibleAt + lerp(MIN_WINDOW_START, MIN_WINDOW_END, p)) +
                lerp(REACT_AFTER_START, REACT_AFTER_END, p);
            later(timeout, Math.max(300, closeAt - now));
        }

        // Nessuno ha aperto
        function timeout() {
            if (phase !== "open") return;
            phase = "reveal";
            const msg = current.desired
                ? "Nessuno ha aperto: " + current.who + " se ne va"
                : "Bravi! Nessuno ha aperto a " + current.who;
            dbg("info", "⚪ " + msg);
            setArena("🚪 " + msg, "Round " + round + " di " + ROUNDS);
            later(nextRound, lerp(NOBODY_PAUSE_START, NOBODY_PAUSE_END, progress()));
        }

        // Il primo che preme apre la porta
        async function open(id) {
            if (phase !== "open") return;
            phase = "reveal";
            stopTimer();
            const p = current;
            let msg;
            if (p.desired) {
                scores[id] += POINTS_OPEN;
                msg = COLORS[id] + " apre a " + p.who + "! +" + POINTS_OPEN;
            } else {
                scores[id] -= PENALTY_OPEN;
                msg = COLORS[id] + " ha aperto a " + p.who + "! −" + PENALTY_OPEN;
            }
            dbg(p.desired ? "ok" : "info", (p.desired ? "🚪✅ " : "🚪⛔ ") + msg);
            renderScores();
            setArena("🚪 " + msg, "Round " + round + " di " + ROUNDS);
            toast(msg);

            const door = await playDoor();                // subito il suono della porta che si apre
            await door.ended;
            if (game !== g || g.finished) return;
            const v = await playPerson(p);                // poi si scopre chi era
            await v.ended;
            if (game !== g || g.finished) return;
            later(nextRound, lerp(REVEAL_PAUSE_START, REVEAL_PAUSE_END, progress()));
        }

        g.onInput = e => {
            if (e.type !== "down" || g.finished || !playerIds().includes(e.button)) return;
            const id = e.button;
            if (phase === "gap") {
                // Nessuno ha ancora bussato
                if (fouls.has(id)) return;
                fouls.add(id);
                scores[id] -= PENALTY_EARLY;
                renderScores();
                tone(100, .3, "square", .12);
                toast("Non ha bussato nessuno! " + COLORS[id] + " −" + PENALTY_EARLY);
                dbg("info", "❌ " + COLORS[id] + " ha premuto senza che nessuno bussasse");
            } else if (phase === "open") {
                open(id);
            }
        };

        function conclude() {
            if (g.finished) return;
            phase = "over";
            const ranked = [...playerIds()].sort((a, b) => scores[b] - scores[a]);
            const [a, b] = ranked;
            if (ranked.length > 1 && scores[a] === scores[b]) finish("🚪 Pareggio con " + scores[a] + " punti!", null);
            else finish("🚪 " + COLORS[a] + " vince con " + scores[a] + " punti!", ranked);
        }

        g.resume = () => {
            if (phase === "open") setArena("🔔 Qualcuno è alla porta!", "Apri… se vuoi");
            else setArena("🚪 Si riparte!", "Round " + round + " di " + ROUNDS);
        };

        g.dispose = () => {
            stopTimer();
            speechSynthesis?.cancel();
        };

        return g;
    }

    function makeRestaurant() {

        // === Voce dedicata del ristoratore ===
        const RESTAURANT_VOICE_PREFER = [
            "Google 日本語"
            // "Microsoft Elsa Online (Natural) - Italian (Italy)",
            // "Microsoft Isabella Online (Natural) - Italian (Italy)",
            // "Microsoft GiuseppeMultilingual Online (Natural) - Italian (Italy)",
            // "Google italiano 2",
            // "Google italiano"
        ];
        const RESTAURANT_RATE = 1.05;
        const RESTAURANT_PITCH = 1.15;   // un po' più acuta/vivace rispetto al narratore

        let restaurantVoice = null;

        const isJa = v => /^(ja|jpn)/i.test((v.lang || "").replace(/_/g, "-"))
            || /japan|日本|ja-jp/i.test(v.name);

        function getRestaurantVoice() {
            if (restaurantVoice) return restaurantVoice;
            const voices = speechSynthesis.getVoices();

            console.log("Available voices:", voices.map(v => ({name: v.name, lang: v.lang, localService: v.localService})));

            for (const name of RESTAURANT_VOICE_PREFER) {
                const found = voices.find(v => v.name === name);
                if (found) {
                    restaurantVoice = found;
                    return found;
                }
            }
            restaurantVoice = voices.find(v =>
                (v.lang || "").replace(/_/g, "-").toLowerCase() === "ja-jp" &&
                v.localService
            ) || null;
            if (restaurantVoice) return restaurantVoice;

            // giapponese locale (offline)
            restaurantVoice = voices.find(v => isJa(v) && v.localService) || null;
            if (restaurantVoice) return restaurantVoice;

            // qualsiasi giapponese (anche di rete)
            restaurantVoice = voices.find(isJa) || null;
            if (restaurantVoice) return restaurantVoice;

            // Fallback: qualsiasi voce italiana diversa da quella del narratore
            const itVoices = voices.filter(v => (v.lang || "").toLowerCase().startsWith("it"));
            restaurantVoice = itVoices.find(v => v.name !== NARRATOR_VOICE_NAME) || itVoices[0] || null;
            return restaurantVoice;
        }

        function sayRestaurant(text) {
            return new Promise(resolve => {
                if (!("speechSynthesis" in window)) {
                    resolve();
                    return;
                }
                const u = new SpeechSynthesisUtterance(text);
                const voice = getRestaurantVoice();
                if (voice) {
                    u.voice = voice;
                    u.lang = voice.lang || "it-IT";
                } else {
                    u.lang = "it-IT";
                }
                u.rate = RESTAURANT_RATE;
                u.pitch = RESTAURANT_PITCH;
                u.volume = soundEnabled ? 1 : 0;

                let done = false;
                const end = () => {
                    if (done) return;
                    done = true;
                    clearTimeout(safety);
                    resolve();
                };
                const safety = setTimeout(end, 6000);
                u.onend = end;
                u.onerror = end;
                speechSynthesis.speak(u);
            });
        }

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
            {name: "Gelato al cioccolato", file: DIR + "gelato-cioccolato.mp3"},
            {name: "Risotto ai funghi", file: DIR + "risotto-funghi.mp3"},
            {name: "Tagliatelle al ragù", file: DIR + "tagliatelle-ragu.mp3"},
            {name: "Parmigiana di melanzane", file: DIR + "parmigiana.mp3"},
            {name: "Fritto misto di pesce", file: DIR + "fritto-misto.mp3"},
            {name: "Panna cotta ai frutti di bosco", file: DIR + "panna-cotta.mp3"},
            {name: "Polpette al sugo", file: DIR + "polpette-sugo.mp3"}
        ];
        const INEDIBLE = [
            {name: "Riso alla cacca", file: DIR + "riso-cacca.mp3"},
            {name: "Involtini di vomito", file: DIR + "involtini-vomito.mp3"},
            {name: "Zuppa di calzini sporchi", file: DIR + "zuppa-calzini.mp3"},
            {name: "Spaghetti ai capelli", file: DIR + "spaghetti-capelli.mp3"},
            {name: "Bistecca di scarpa", file: DIR + "bistecca-scarpa.mp3"},
            {name: "Gelato al moccio", file: DIR + "gelato-moccio.mp3"},
            {name: "Pizza ai vermi", file: DIR + "pizza-vermi.mp3"},
            {name: "Lasagne di pannolini", file: DIR + "lasagne-pannolini.mp3"},
            {name: "Frittata di scarafaggi", file: DIR + "frittata-scarafaggi.mp3"},
            {name: "Torta di fango", file: DIR + "torta-fango.mp3"},
            {name: "Insalata di calzini", file: DIR + "insalata-calzini.mp3"},
            {name: "Cotoletta di spazzolino", file: DIR + "cotoletta-spazzolino.mp3"}
        ];
        const BACKGROUND = DIR + "background-ristorante.mp3";   // gente che mangia, in loop (se manca: sottofondo sintetico)
        const BACKGROUND_VOLUME = .1;
        const CLAIM_SOUND = DIR + "prenotato.mp3";    // piatto buono aggiudicato
        const PENALTY_SOUND = DIR + "bleah.mp3";      // penitenza: schifo / conati

        // === Parametri ===
        const WIN_POINTS = 5;            // punti per vincere
        const MAX_DISHES = 24;           // piatti serviti al massimo
        const INEDIBLE_CHANCE = .6;      // probabilità di un piatto immangiabile
        // Il ritmo accelera: i valori passano da "inizio" a "fine" nei primi RAMP_DISHES piatti serviti.
        const RAMP_DISHES = 14;
        const GAP_START = [1200, 2800], GAP_END = [400, 1000];   // pausa casuale tra un piatto e l'altro (ms)
        const CLAIM_AFTER_START = 2200, CLAIM_AFTER_END = 1200;  // tempo per prenotare dopo la fine della frase (ms)
        const REVEAL_START = 1400, REVEAL_END = 700;             // pausa dopo la rivelazione del piatto (ms)
        const PENALTY_BLOCK = 2000;      // blocco del giocatore penalizzato (ms)
        const EARLY_BLOCK = 1000;        // blocco se si preme quando non c'è nessun piatto (ms)

        let served = 0, open = false, claimed = false, current = null, last = null;
        let blocked = {};
        const buffers = new Map();

        const rand = ([min, max]) => min + Math.random() * (max - min);
        const lerp = (a, b, p) => a + (b - a) * p;
        const progress = () => Math.min(1, served / RAMP_DISHES);

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

            // Fallback: voce dedicata del ristoratore
            sayRestaurant(dish.name);
            return 550 + dish.name.length * 70;
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

            await sayIntro("Benvenuti al ristorante! Prenota i piatti buoni premendo per primo. Ma attenzione ai piatti immangiabili!");
            await preload;
            if (game !== g) return;

            startNatureAmbience(BACKGROUND, BACKGROUND_VOLUME, makeCrowdBuffer);
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
            const p = progress();
            later(serve, rand([lerp(GAP_START[0], GAP_END[0], p), lerp(GAP_START[1], GAP_END[1], p)]));
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
            later(closeDish, duration + lerp(CLAIM_AFTER_START, CLAIM_AFTER_END, progress()));
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
            later(nextDish, lerp(REVEAL_START, REVEAL_END, progress()));
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
            stopNatureAmbience();
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
        const REACTION = 0;             // tempo concesso dopo la fine udibile del suono (ms)
        const LATENCY_COMP = 0;         // 0 = nessuna compensazione della latenza audio (più severo), 1 = completa
        const GRINDER_VOLUME = 0.5;

        // Velocità di taglio per giocatore aggiuntivo
        const CUT_SPEED_PER_PLAYER = 0.65;

        // Incremento del tono audio per giocatore aggiuntivo
        const GRINDER_RATE_PER_PLAYER = 0.16;

        // Limite massimo della velocità audio
        const GRINDER_MAX_RATE = 1.8;

        // Transizione graduale del tono (secondi)
        const GRINDER_RAMP = 0.08;

        let woodSoundDone = false;

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
        let fouled = new Set();   // chi preme (o ripreme) nella fase "legno finito"

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
            fouled = new Set();
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

            await sayIntro(
                "Mola a disco. Tieni premuto per spingere il legno. " +
                "Quando il suono finisce, lascia subito il tasto, " +
                "o perdi la mano!"
            );

            await preload;

            if (game !== g || g.finished) return;

            lastTick = performance.now();

            newWood();

            interval = setInterval(tick, 25);
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
                if (woodSoundDone) {
                    endClock += dt;
                    if (endClock >= REACTION) judge();
                }
            }

            if (now - lastRender > 100) {
                lastRender = now;
                render();
            }
        }

// === Il legno è stato tagliato ===
        function endWood(active) {
            phase = "ending";
            endClock = 0;
            woodSoundDone = false;
            mustRelease = new Set(active);
            fouled = new Set();

            // Il segnale è la FINE del suono: la mola continua finché legno-finito.mp3 non termina,
            // solo da lì parte il tempo di reazione
            // Il segnale è la fine UDIBILE del suono (senza il silenzio in coda al file, latenza compresa)
            playTimed(WOOD_END, {
                fallback: () => {
                    noise(0.2, 0.1);
                    tone(120, 0.2, "triangle", 0.1);
                }
            }).then(async t => {
                // fine percepita del suono = inizio + durata percepita (con la compensazione di latenza scelta)
                let endAt = t.endsAt;
                if (!t.synthetic) {
                    const buf = await loadSample(WOOD_END);
                    endAt = t.audibleAt - (1 - LATENCY_COMP) * latencyMs() + perceivedDurationMs(buf);
                }
                await new Promise(r => setTimeout(r, Math.max(0, endAt - performance.now())));
            }).then(() => {
                if (game !== g || g.finished) return;
                stopGrinder();
                endClock = 0;
                woodSoundDone = true;
                if (REACTION <= 0 && !paused) judge();     // niente attesa del prossimo tick
            });

            setArena("🪵 Legno finito!", "Lascia il tasto quando il suono finisce!", "signal");
        }

        // === Verifica chi ha lasciato il tasto in tempo ===
        async function judge() {
            phase = "judging";

            // Perde chi sta ancora premendo, chi ha premuto di nuovo durante
            // la fase "legno finito" (anche se nel frattempo ha rilasciato)
            const caught = playerIds().filter(
                p => !out.has(p) && (pressing.has(p) || fouled.has(p))
            );

            mustRelease.clear();
            fouled.clear();

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
                // Legno finito: chi preme (ancora) perde, anche se aveva già lasciato il tasto
                if (phase === "ending") fouled.add(id);
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
        g.endDelay = 1500;

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
        // Quando restano in due si accelera ancora, passaggio dopo passaggio, finché qualcuno sbaglia
        const TICK_FINAL = 70, REACTION_FINAL = 380, RATE_FINAL = 2.6, ENDGAME_PASSES = 16;
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
        const endgame = () => alive.length <= 2 ? Math.min(1, Math.max(0, passes - RAMP_PASSES) / ENDGAME_PASSES) : 0;
        const tickGap = () => lerp(lerp(TICK_START, TICK_END, progress()), TICK_FINAL, endgame());
        const reactionTime = () => lerp(lerp(REACTION_START, REACTION_END, progress()), REACTION_FINAL, endgame());
        const jumpRate = () => lerp(lerp(1, RATE_END, progress()), RATE_FINAL, endgame());
        const colorRate = () => 1 + progress() * .25 + endgame() * .2;
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
            const rate = jumpRate();   // il salto si velocizza col gioco
            const buffer = buffers.get(JUMP);
            if (buffer) playBuffer(buffer, .8, rate);
            else tone(500 * rate, .08 / rate, "triangle", .1);
        }

        // Annuncia il colore del giocatore che ha la bomba
        function announceHolder() {
            const buffer = buffers.get(COLOR_FILES[holder]);
            if (buffer) playBuffer(buffer, 1, colorRate());
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
            const cb = buffers.get(COLOR_FILES[holder]);
            const colorMs = cb ? audibleDurationMs(cb) / colorRate() : 800;   // 800 ms stimati per la voce
            deadline = clock + ANNOUNCE_DELAY + colorMs + reactionTime();
        }

        function startRound() {
            if (alive.length > 2) passes = 0;     // con due soli giocatori la velocità non si azzera più
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
            passes = 0;
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

            await introOnce(g, "Palla esplosiva. Premi solo quando senti il tuo colore. Se premi fuori turno o sei lento, sei eliminato! Si giocano tre round.");
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
                nextTickAt += tickGap();
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
                    sayWin(g, COLORS[alive[0]]);
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
                    sayWin(g, COLORS[alive[0]]);
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
        g.endDelay = 1500;     // lascia finire il suono dell'inciampo

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

            await introOnce(g, "Saltare la corda. La corda batte a terra a ritmo regolare: premi il tuo tasto nello stesso istante del colpo, a tempo con il suono. " +
                "I primi tre colpi sono di prova. Chi non salta o salta fuori tempo è eliminato, e si va sempre più veloci! Si giocano tre round.");
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
                sayWin(g, COLORS[alive[0]]);
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
            const t = clock + (performance.now() - lastTick) - latencyMs();

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
        g.endDelay = 1200;

        // === File audio ===
        const DIR = "assets/sounds/tennis/";
        const BOUNCE = DIR + "rimbalzo.mp3";      // rimbalzo della pallina (breve)
        const RACKET = DIR + "racchetta.mp3";     // colpo di racchetta (breve)
        const FAULT = DIR + "fallo.mp3";          // premuto troppo presto
        const MISSED = DIR + "mancata.mp3";       // palla mancata

        // === Parametri ===
        const LIVES = 1;                // niente vite: chi manca la palla è eliminato dal round
        const FREEZE = 2000;            // blocco per chi preme troppo presto (ms)
        const FLIGHT_START = 1500;      // tempo tra colpo e rimbalzo all'inizio (ms)
        const FLIGHT_END = 450;         // tempo alla massima velocità (ms)
        const REACT_START = 1000;       // tempo per rispondere dopo il rimbalzo all'inizio (ms)
        const REACT_END = 380;          // tempo alla massima velocità (ms)
        const RAMP_HITS = 20;           // colpi per arrivare alla massima velocità
        const RATE_END = 1.4;           // velocità finale dei suoni (1 = normale)
        const GRACE = 0;              // chi ha appena colpito può ripremere senza essere punito (ms)
        const REST = 1500;              // pausa dopo una palla persa (ms)
        const SERVE_WAIT = 5000;        // se chi serve non preme, la palla parte da sola dopo questo tempo (ms)
        const PAN = {P1: -.8, P2: -.3, P3: .3, P4: .8};   // posizione stereo di ogni giocatore

        let phase = "intro";            // intro | live | rest | over
        let clock = 0, lastTick = 0, lastRender = 0, interval = null;
        let holder = null, prevHolder = null, hitAt = 0, hits = 0;
        let bounceAt = 0, deadline = 0, bounced = false, restartAt = 0, nextServer = null;
        let lives = {}, frozenUntil = {}, outOrder = [];
        let serving = false, autoServeAt = 0;   // true finché chi serve non lancia la palla
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
                    : (frozenUntil[p] > now ? "❄ " : "") + "🎾"
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
            // Il servizio parte quando chi serve preme (o da solo dopo SERVE_WAIT)
            serving = true;
            autoServeAt = clock + SERVE_WAIT;
            bounced = true;
            bounceAt = Infinity;
            deadline = Infinity;
            $("#game-status").textContent = "SERVIZIO";
            setArena("🎾 Serve " + COLORS[server], COLORS[server] + ": premi per servire");
            render();
        }

        // Chi serve preme UNA sola volta: il servizio è già il suo colpo e la palla passa al giocatore successivo
        function launch(t) {
            serving = false;
            playRacket(holder);
            prevHolder = holder;
            hitAt = t;
            holder = nextAlive(holder);
            bounced = false;
            bounceAt = t + flight();
            deadline = bounceAt + reaction();
            $("#game-status").textContent = "SCAMBIO";
            setArena("🎾 Ascolta il rimbalzo…", "Premi dopo il rimbalzo, non prima");
        }

        g.start = async () => {
            phase = "intro";
            clock = 0;
            outOrder = [];
            frozenUntil = {};
            serving = false;
            lives = Object.fromEntries(playerIds().map(p => [p, LIVES]));

            $("#game-status").textContent = "PREPARATI";
            setArena("🎾 Preparati…", "Ascolta le istruzioni");
            render();

            // Precarica tutto mentre la voce spiega
            const preload = Promise.all(
                [BOUNCE, RACKET, FAULT, MISSED].map(async p => buffers.set(p, await loadSample(p)))
            );

            await introOnce(g, "Tennis. Premi quando senti la palla rimbalzare verso di te. Si gioca in senso orario: " +
                playerIds().map(p => COLORS[p]).join(", ") + ". Chi serve preme il suo tasto una volta per servire. Se premi troppo presto resti fermo due secondi. " +
                "Se manchi la palla sei eliminato dal round, io ti dico chi è stato eliminato e chi serve. Si giocano tre round.");
            await preload;
            if (game !== g) return;

            lastTick = performance.now();
            interval = setInterval(tick, 10);
            announceThenServe("Inizia " + COLORS[playerIds()[0]] + ".", playerIds()[0]);
        };

        // Il tempo di gioco avanza solo quando non è in pausa
        function tick() {
            const now = performance.now();
            const dt = Math.min(now - lastTick, 200);
            lastTick = now;

            if (paused || g.finished) return;
            clock += dt;

            if (phase === "live") {
                if (serving && clock >= autoServeAt) launch(clock);
                if (!bounced && clock >= bounceAt) {
                    bounced = true;
                    playBounce(holder);
                }
                if (clock >= deadline) miss();
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

        async function announceThenServe(text, server) {
            phase = "announce";
            $("#game-status").textContent = "ATTENZIONE";
            setArena("🎾 " + text, "Ascolta chi inizia");
            await sayAsync(text);
            while (paused && game === g) await new Promise(r => setTimeout(r, 150));
            if (game !== g || g.finished) return;
            serve(server);
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

            setArena("🎾 Palla persa!", COLORS[loser] + " è eliminato", "signal");
            nextServer = nextAlive(loser);
            const text = COLORS[loser] + " è eliminato. Inizia " + COLORS[nextServer] + ".";
            const server = nextServer;
            sound.then(() => announceThenServe(text, server));
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
                sayWin(g, COLORS[alive[0]]);
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
            const t = clock + (performance.now() - lastTick) - latencyMs();

            if (t >= deadline) {   // il tempo era già scaduto: la palla è persa
                miss();
                return;
            }
            if (frozenUntil[id] > t) return;   // fermo per la penalità

            if (id === holder) {
                if (serving) launch(t);          // chi serve preme: la palla parte
                else if (t >= bounceAt) hit(id, t);   // dopo il rimbalzo: colpo valido
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
            if (phase === "live" && !serving) {
                bounced = false;
                bounceAt = clock + 1200;
                deadline = bounceAt + reaction();
            }
            setArena("🎾 Si riparte!", serving ? "Chi serve preme per lanciare la palla" : "Ascolta il rimbalzo");
        };

        g.dispose = () => {
            stopTimer();
            stopInterval();
            speechSynthesis?.cancel();
        };

        return g;
    }

    function makeTapas() {
        const g = baseGame("tapas");

        // === File audio ===
        const DIR = "assets/sounds/tapas/";
        const INTRO = DIR + "consegna.mp3";
        const FIRED = DIR + "licenziato.mp3";
        const SCOOTER = DIR + "motorino.mp3";
        const ENGINE_LOOP = DIR + "motorino-loop.mp3";
        const BRAKE = DIR + "frenata.mp3";
        const DELIVERED = DIR + "consegnata.mp3";
        const kmFile = n => DIR + "km-" + n + ".mp3";
        const FORCE_ES = true;   // true: voce spagnola anche se ci sono i file italiani

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



        function legText(leg) {
            return leg.km +
                (leg.km === 1 ? " chilometro " : " chilometri ") +
                DIRECTIONS[leg.dir].text;
        }

        async function voice(path, text) {
            if (!FORCE_ES && await loadSample(path)) return playSampleWait(path, () => {});
            return sayEs(text);
        }

        async function sayLeg(leg) {
            const n = kmFile(leg.km), d = DIRECTIONS[leg.dir].file;
            if (!FORCE_ES && await loadSample(n) && await loadSample(d)) {
                await playSampleWait(n, () => {});
                await playSampleWait(d, () => {});
            } else {
                await sayEs(legText(leg));
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
                "🍣 Tocca a " + COLORS[p],
                "Ascolta il percorso: " + legendFor(p)
            );

            if (playerIds().length > 1) {
                await sayAsync("Tocca a " + COLORS[p]);
            }

            if (gone()) return;

            await voice(INTRO, "Consegna le tapas qui vicino.");

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
                            " ha consegnato le tapas!");

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
                "🍣 Preparati…",
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

            await sayIntro(
                "Consegna tapas. Ascolta il percorso e ripètilo. " +
                "Aspetta di aver sentito tutte le istruzioni prima di eseguirle. " +
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

        const DIR = "assets/sounds/rally/";
        const CRASH = DIR + "incidente.mp3";
        const REV = DIR + "accelera.mp3";
        const OK = DIR + "ok.mp3";          // suono di ogni pressione giusta

        const ACTIONS = {
            destra: {text: "destra", arrow: "→"},
            sinistra: {text: "sinistra", arrow: "←"},
            avanti: {text: "avanti", arrow: "↑"},
            indietro: {text: "indietro", arrow: "↓"},
        };
        const ORDER = ["P1", "P2", "P3", "P4"];
        const OFFSET = {indietro: 0, sinistra: 1, avanti: 2, destra: 3};
        const buttonFor = (player, action) => ORDER[(ORDER.indexOf(player) + OFFSET[action]) % ORDER.length];
        const legendFor = player => Object.entries(ACTIONS)
            .map(([key, a]) => a.arrow + " " + COLORS[buttonFor(player, key)]).join(" · ");

        // === Parametri ===
        const TIMES_MAX = 4;            // ripetizioni massime di un comando
        const VOICE_RATE = [1.0, 1.9];  // velocità della voce (inizio → massimo)
        const GAP = [700, 40];          // pausa tra un comando e il successivo (ms)
        const STEP_LIMIT = [4500, 1800];// tempo massimo per la pressione attesa (ms)
        const RAMP = 25;                // comandi per arrivare alla velocità massima
        const MAX_CMDS = 60;            // traguardo di sicurezza
        const TURN_PAUSE = 1200;

        let phase = "intro", current = null, queue = [], cmdNo = 0, done = 0, presses = 0;
        let clock = 0, lastTick = 0, lastProgress = 0, interval = null, turnResolve = null, reason = "";
        let results = {}, pressTotals = {};

        const gone = () => game !== g || g.finished;
        const wait = ms => new Promise(r => setTimeout(r, ms));
        async function pausable(ms) { await wait(ms); while (paused && !gone()) await wait(150); }
        const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
        const prog = () => cmdNo / RAMP;

        function stopInterval() { if (interval !== null) { clearInterval(interval); interval = null; } }

        const playCrash = () => playSampleWait(CRASH, () => {
            noise(0.4, 0.2);
            tone(80, 0.5, "sawtooth", 0.18);
            tone(40, 0.6, "sawtooth", 0.12, 0.15);
        });

        function playRev() {
            playSample(REV, () => {
                if (!soundEnabled) return;
                const ctx = ensureAudio(), t = ctx.currentTime;
                const osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(70, t);
                osc.frequency.exponentialRampToValueAtTime(280, t + .38);
                gain.gain.setValueAtTime(.0001, t);
                gain.gain.exponentialRampToValueAtTime(.16, t + .05);
                gain.gain.exponentialRampToValueAtTime(.0001, t + .45);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + .5);
                noise(.25, .04);
            });
        }

        // Pressione giusta: suono "ok" che sale leggermente di tono col procedere dei comandi
        function playOk() {
            const rate = 1 + Math.min(presses, 30) * 0.012;
            playTimed(OK, {
                rate, volume: .8,
                fallback: () => tone(400 + Math.min(presses, 30) * 15, 0.08, "sine", 0.1)
            });
        }

        function render() {
            renderScores(Object.fromEntries(playerIds().map(p => [p, results[p] ?? "—"])));
        }

        function showDrive() {
            setArena("🏎️ " + COLORS[current] + ": guida!",
                legendFor(current) + " — comandi completati: " + done, "signal");
        }

        // Tempo di gioco: avanza solo se non è in pausa. Se la pressione attesa tarda troppo: incidente.
        function tick() {
            const now = performance.now();
            const dt = Math.min(now - lastTick, 200);
            lastTick = now;
            if (paused || g.finished || phase !== "drive") return;
            clock += dt;
            const head = queue[0];
            if (head && head.at !== null &&
                clock - Math.max(lastProgress, head.at) > lerp(STEP_LIMIT[0], STEP_LIMIT[1], prog())) {
                crash("troppo lento");
            }
        }

        function crash(why) {
            if (phase !== "drive") return;
            phase = "crash";
            reason = why;
            stopInterval();
            speechSynthesis?.cancel();
            const resolve = turnResolve;
            turnResolve = null;
            if (resolve) resolve();
        }

        async function turn(p) {
            current = p; queue = []; cmdNo = 0; done = 0; presses = 0;
            clock = 0; lastProgress = 0; reason = "";
            phase = "announce";
            $("#game-status").textContent = "TOCCA A " + COLORS[p].toUpperCase();
            setArena("🏎️ Tocca a " + COLORS[p], legendFor(p));

            if (playerIds().length > 1) {
                await sayAsync("Tocca a " + COLORS[p] + ".");
                if (gone()) return;
            }
            playRev();
            await pausable(700);
            if (gone()) return;

            phase = "drive";
            $("#game-status").textContent = "GUIDA · " + COLORS[p].toUpperCase();
            showDrive();
            lastTick = performance.now();
            interval = setInterval(tick, 50);
            const ended = new Promise(r => { turnResolve = r; });

            const keys = Object.keys(ACTIONS);
            let prev = null;
            while (phase === "drive" && !gone() && cmdNo < MAX_CMDS) {
                cmdNo++;
                const maxT = Math.min(TIMES_MAX, 1 + Math.ceil(cmdNo / 3));   // all'inizio comandi corti
                let action;
                do { action = keys[Math.floor(Math.random() * keys.length)]; } while (action === prev);
                prev = action;
                const cmd = {action, times: 1 + Math.floor(Math.random() * maxT)};
                cmd.left = cmd.times;
                for (let i = 0; i < cmd.times; i++) queue.push({btn: buttonFor(p, action), action, cmd, at: null});

                // Si può premere già mentre il comando viene detto
                await sayRate(cmd.times + " " + ACTIONS[action].text, lerp(VOICE_RATE[0], VOICE_RATE[1], prog()));
                if (phase !== "drive" || gone()) break;
                queue.forEach(q => { if (q.cmd === cmd) q.at = clock; });     // il tempo per reagire parte da qui
                await pausable(lerp(GAP[0], GAP[1], prog()));
            }
            if (phase === "drive" && !gone()) crash("traguardo raggiunto");
            await ended;
            stopInterval();
        }

        async function play() {
            for (const p of playerIds()) {
                await turn(p);
                if (gone()) return;
                results[p] = done;
                pressTotals[p] = presses;
                scores[p] = done;
                render();

                const finishLine = reason === "traguardo raggiunto";
                setArena(finishLine ? "🏁 TRAGUARDO!" : "💥 INCIDENTE!",
                    COLORS[p] + ": " + reason + " · " + done + (done === 1 ? " comando" : " comandi"), "signal");
                if (!finishLine) await playCrash();
                if (gone()) return;
                await sayAsync(COLORS[p] + " ha completato " + done + (done === 1 ? " comando." : " comandi."));
                if (gone()) return;
                await pausable(TURN_PAUSE);
                if (gone()) return;
            }
            conclude();
        }

        function conclude() {
            phase = "over";
            const ids = playerIds();
            if (ids.length === 1) {
                finish("🏎️ Fine corsa: " + results[ids[0]] + " comandi", null);
                return;
            }
            const order = [...ids].sort((a, b) => results[b] - results[a] || pressTotals[b] - pressTotals[a]);
            const [a, b] = order;
            const tie = results[a] === results[b] && pressTotals[a] === pressTotals[b];
            finish(tie ? "🏎️ Pareggio!" : "🏎️ " + COLORS[a] + " vince con " + results[a] + " comandi!", tie ? null : order);
        }

        g.start = async () => {
            phase = "intro";
            results = {}; pressTotals = {};
            scores = Object.fromEntries(playerIds().map(p => [p, 0]));
            $("#game-status").textContent = "PREPARATI";
            setArena("🏎️ Preparati…", "Le direzioni sono relative a dove sei seduto");
            render();

            await sayIntro("Rally! Quando tocca a te, la macchina parte. Il navigatore dà comandi come 3 destra o 2 accelera: " +
                "premi subito il tasto giusto, senza aspettare la fine. I comandi diventano sempre più veloci e ravvicinati. " +
                "Le direzioni sono relative a te. Un errore o un ritardo e fai incidente. Vince chi completa più comandi.");
            if (gone()) return;
            play();
        };

        g.onInput = e => {
            if (e.type !== "down" || g.finished || phase !== "drive") return;
            if (!ORDER.includes(e.button)) return;

            const exp = queue[0];
            if (!exp) { crash("ha premuto senza comando"); return; }
            if (e.button !== exp.btn) { crash("comando sbagliato"); return; }

            queue.shift();
            presses++;
            lastProgress = clock;
            if (exp.action === "accelera") playRev();
            else playOk();

            if (--exp.cmd.left === 0) {
                done++;
                showDrive();
            }
        };

        g.resume = () => {
            lastTick = performance.now();
            if (phase === "drive") showDrive();
            else setArena("🏎️ Si riparte!", "Ascolta i comandi");
        };

        g.dispose = () => {
            stopTimer();
            stopInterval();
            speechSynthesis?.cancel();
            if (turnResolve) { const r = turnResolve; turnResolve = null; r(); }
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
        const BAD_POINTS = 3;             // punti per una parolaccia coperta per intero (in proporzione alla parte coperta)
        const NORMAL_PEN_PER_SEC = 1.5;   // punti persi per ogni secondo di bip su parole normali
        const WRONG_PEN_PER_SEC = 1.5;    // punti persi per ogni secondo di bip su un parlatore non tuo
        const EST_MARGIN = 150;           // margine (ms) quando i tempi sono stimati e non misurati
        const BEEP_VOLUME = .22;
        const BEEP_FREQ = {P1: 1000, P2: 1250, P3: 800, P4: 1500};
        const WRONG_MIN = 150;            // ms di bip sopra un altro parlatore per prendere la penitenza



        // === Parlatori ===
        // lang: voce straniera che legge testo italiano (usata solo se il dispositivo la ha)
        // vi: indice della voce italiana da preferire
        const PERSONAS = [
            {key: "uomo", name: "l'uomo", pitch: .7, rate: .98, lang: null, vi: 1},
            {key: "spagnolo", name: "il parlatore spagnolo", pitch: 1, rate: .95, lang: "es", vi: 0},
            {key: "tedesco", name: "il parlatore tedesco", pitch: .9, rate: .95, lang: "de", vi: 0},
            {key: "francese", name: "il parlatore francese", pitch: 1.1, rate: 1, lang: "fr", vi: 0},
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
        // Diagnostica per il pannello di debug (non influisce sul gioco)
        const dbg = (lvl, msg, data) => window.BPDebug?.log("bippatore", lvl, msg, data);
        let liveInfo = {};
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
            try {
                b.osc.stop();
            } catch (e) {
            }
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
        function speakTimed(text, persona, onWord = null) {
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
                    if (ev.name === undefined || ev.name === "word") {
                        bounds.set(ev.charIndex, performance.now());
                        if (onWord) onWord(ev.charIndex);
                    }
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

        const round1 = x => Math.round(x * 10) / 10;

        // Restituisce true se ha assegnato o tolto punti
        function judge(seg, id, t, afterBad) {
            const freq = BEEP_FREQ[id] || 1000;
            let changed = false;

            if (seg.bad) {
                // Più della parolaccia copri, più punti prendi (fino a BAD_POINTS)
                const word = Math.max(1, t.end - t.start);
                const cov = overlap(id, t.start - t.margin, t.end + t.margin + BAD_GRACE);
                const REACT_TOL = 200;
                const need = Math.max(80, word - REACT_TOL);
                const frac = Math.min(1, cov / need);
                const pts = round1(frac * BAD_POINTS);
                if (pts > 0) {
                    scores[id] = round1((scores[id] || 0) + pts);
                    tone(freq * 1.5, .08, "triangle", .1);
                    tone(freq * 2, .1, "triangle", .1, .09);
                    changed = true;
                    dbg("ok", `✅ ${COLORS[id]} +${pts} su «${seg.text}»: coperto ${Math.round(frac * 100)}% (bip ${Math.round(cov)} ms su ${Math.round(word)})`);
                } else {
                    dbg("info", `⚪ ${COLORS[id]} non ha coperto «${seg.text}»: nessun punto`);
                }
            } else {
                // Parti normali: più a lungo tieni premuto, più punti perdi. Si restringe l'intervallo per non punire gli errori di stima.
                const a = t.start + t.margin + (afterBad ? BAD_GRACE : 0), b = t.end - t.margin;
                if (b - a > 80) {
                    const cov = Math.min(overlap(id, a, b), b - a);
                    const pen = round1(cov / 1000 * NORMAL_PEN_PER_SEC);
                    if (pen >= 0.1) {
                        scores[id] = round1((scores[id] || 0) - pen);
                        tone(110, .25, "square", .1);
                        changed = true;
                        dbg("info", `❌ ${COLORS[id]} −${pen}: bip di ${Math.round(cov)} ms sulla parte normale «${seg.text}»`);
                    }
                }
            }
            renderScores();
            return changed;
        }

        function waitPress(id, ms) {
            return new Promise(resolve => {
                const t = setTimeout(() => {
                    waiter = null;
                    resolve();
                }, ms);
                waiter = {
                    id, done: () => {
                        clearTimeout(t);
                        waiter = null;
                        resolve();
                    }
                };
            });
        }

        // Penitenza: chi bippa la frase di un parlatore non suo perde un punto per frase.
// Restituisce true se almeno un giocatore è stato penalizzato.
        function judgeWrong(ownerId, res) {
            let changed = false;
            for (const id of playerIds()) {
                if (id === ownerId) continue;
                const cov = Math.min(overlap(id, res.start, res.end), res.end - res.start);
                if (cov >= WRONG_MIN) {
                    const pen = round1(cov / 1000 * WRONG_PEN_PER_SEC);
                    scores[id] = round1((scores[id] || 0) - pen);
                    tone(110, .3, "square", .1);
                    dbg("info", `❌ ${COLORS[id]} −${pen}: ha bippato ${Math.round(cov)} ms durante la frase di ${COLORS[ownerId]}`);
                    toast("Parlatore sbagliato! " + COLORS[id] + " perde " + pen + " punti");
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

                // --- Debug: cosa deve fare ogni giocatore in questa frase ---
                dbg("info", `🎙 Parla ${COLORS[sp.id]} (${sp.persona.key}): «${text}»`);
                dbg("info", `   Deve bippare SOLO ${COLORS[sp.id]}, tenendo premuto sulle parolacce (fino a +${BAD_POINTS} l'una, in proporzione a quanto le copre). Tutti gli altri NON devono bippare: −${WRONG_PEN_PER_SEC} al secondo.`);
                liveInfo = {
                    parlante: COLORS[sp.id] + " (" + sp.persona.key + ")",
                    frase: text,
                    parola: null,
                    azione: "ascolta"
                };
                const bySegStart = new Map(segs.map(sg => [sg.from, sg]));

                // una sola lettura continua: nessun silenzio tra le parole
                const res = await speakTimed(text, sp.persona, charIndex => {
                    const sg = bySegStart.get(charIndex);
                    if (!sg) return;
                    liveInfo.parola = sg.text;
                    liveInfo.azione = sg.bad ? "PREMI ORA (fino a +" + BAD_POINTS + ")" : "NON premere (−1 se bippi)";
                    dbg(sg.bad ? "ok" : "info", sg.bad
                        ? `🟢 ORA «${sg.text}» → ${COLORS[sp.id]} deve TENERE PREMUTO per tutta la parola (fino a +${BAD_POINTS})`
                        : `🔴 «${sg.text}» è normale → NON premere (−${NORMAL_PEN_PER_SEC} al secondo)`);
                });
                if (gone()) return;
                liveInfo.azione = "giudizio";

                // --- Debug: finestre temporali (in ms dall'inizio della frase) ---
                const measured = segs.some(sg => res.bounds.has(sg.from));
                dbg("info", `   Tempi ${measured ? "misurati dalla voce" : "STIMATI (la voce non fornisce i confini delle parole)"} · frase lunga ${Math.round(res.end - res.start)} ms`);
                for (const sg of segs) {
                    const t = timesFor(sg, res, text);
                    const rel = x => Math.max(0, Math.round(x - res.start));
                    if (sg.bad) {
                        dbg("info", `   🟢 «${sg.text}»: tieni premuto da ${rel(t.start - t.margin)} a ${rel(t.end + t.margin + BAD_GRACE)} ms · parola da ${rel(t.start)} a ${rel(t.end)} ms · punti = copertura × ${BAD_POINTS}`);
                    } else {
                        const a = t.start + t.margin, b = t.end - t.margin;
                        if (b - a > 80) {
                            dbg("info", `   🔴 «${sg.text}»: NON bippare tra ${rel(a)} e ${rel(b)} ms · ogni secondo di bip = −${NORMAL_PEN_PER_SEC}`);
                        } else {
                            dbg("info", `   ⚪ «${sg.text}»: parte troppo breve, non penalizza`);
                        }
                    }
                }

                await wait(BAD_GRACE);   // tempo per rilasciare l'ultimo tasto
                if (gone()) return;

                // giudizio dei pezzi in ordine, con una pausa per sentire ogni segnale
                for (let i = 0; i < segs.length; i++) {
                    const seg = segs[i];
                    if (judge(seg, sp.id, timesFor(seg, res, text), i > 0 && segs[i - 1].bad)) await wait(220);
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

            // Stato mostrato nella scheda Live del pannello di debug
            window.BPDebug?.watch(() => ({
                fase: phase,
                parlatori: speakers.map(s => s.id + " = " + s.persona.key),
                ...liveInfo,
                staBippando: playerIds().filter(id => open[id] != null),
                punti: {...scores}
            }));

            $("#game-status").textContent = "ASSEGNAZIONE";
            setArena("🎙 Assegno le voci…", "Ascolta: il tuo parlatore ti chiamerà e sentirai il tuo bip");
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
            await sayIntro("Il bippatore. Ora assegno le voci: ogni parlatore chiama il suo giocatore.");
            if (gone()) return;

            // Assegnazione: è il parlatore stesso a chiamare il giocatore
            phase = "assign";
            const phrases = shuffle(ASSIGN);
            for (let i = 0; i < speakers.length; i++) {
                const sp = speakers[i];
                const text = phrases[i % phrases.length].replace("{c}", COLORS[sp.id]);
                await speak(text, sp.persona);
                if (gone()) return;
                // Nessun bip di prova: basta sentire la voce
                setArena("🎙 " + COLORS[sp.id] + ", questo è il tuo parlatore", "Il tuo parlatore ti ha chiamato");
                await wait(700);
                if (gone()) return;
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

    function makeThirsty() {
        const g = baseGame("thirsty");

        // === File audio (facoltativi: se mancano si usano suoni sintetici) ===
        const DIR = "assets/sounds/assetato/";
        const UNCAP = DIR + "stappa.mp3";              // la birra viene stappata
        const DRINK = DIR + "bevi.mp3";                // la bevuta: dura quanto il file
        const DONE = DIR + "finita.mp3";               // la birra è finita
        const BREAK = DIR + "bicchiere-rotto.mp3";     // il bicchiere vuoto si rompe
        const BURP = DIR + "rutto.mp3";                // il rutto: dura quanto il file

        // === Parametri ===
        const TURN_SECONDS = {2: 30, 3: 20, 4: 30};    // durata di un turno, in base al numero di giocatori
        const DRINK_FALLBACK_MS = 3000;   // durata della bevuta se manca il file
        const BURP_FALLBACK_MS = 1500;    // durata del rutto se manca il file

        // Sequenza di una birra: stappa (tocco) → bevi (tieni premuto) → butta il bicchiere (tocco) → rutto (tieni premuto).
        // La birra vale un punto solo quando tutta la sequenza è completa.
        // 2 giocatori: ognuno gioca da solo. 3: tre sfide uno contro uno (chi vince prende 2 punti).
        // 4: due squadre; nel turno della squadra uno stappa e butta, l'altro beve e rutta.
        let turns = [], turn = 0, phase = "intro";   // intro | announce | cap | drink | empty | burp | between | over
        let turnLeft = 0, prog = 0, need = 0, beers = 0, holding = false, wasHolding = false, lastTick = 0,
            lastShow = 0;
        let turnBeers = [], points = {}, totalBeers = {}, holdTotal = {}, teams = [];
        const sounds = {drink: null, burp: null};                 // AudioBuffer dei file, se presenti
        let interval = null, holdSource = null, holdGain = null, glugTimer = null;
        const dbg = (lvl, msg) => window.BPDebug?.log("assetato", lvl, msg);
        const names = ids => ids.map(p => COLORS[p]).join(" e ");
        const needFor = kind => sounds[kind]
            ? sounds[kind].duration * 1000
            : (kind === "drink" ? DRINK_FALLBACK_MS : BURP_FALLBACK_MS);
        const cur = () => turns[turn];
        // Chi deve premere in questa fase: in squadra uno stappa e butta, l'altro beve e rutta
        const actor = (ph = phase) => {
            const t = cur();
            if (!t) return null;
            if (t.actors.length === 2) return (ph === "cap" || ph === "empty") ? t.actors[0] : t.actors[1];
            return t.actors[0];
        };

        // --- suoni ---
        const uncapSound = () => playSample(UNCAP, () => {
            noise(.14, .1);
            tone(1900, .03, "square", .08);
            tone(900, .06, "triangle", .08, .03);
        });
        const doneSound = () => playSample(DONE, () => {
            tone(660, .1, "triangle", .1);
            tone(880, .22, "triangle", .1, .1);
        });
        const breakSound = () => playSample(BREAK, () => {
            noise(.4, .2);
            [2400, 3100, 1800, 3600].forEach((f, i) => tone(f, .08, "triangle", .08, i * .04));
        });
        const pointSound = () => {
            tone(1046, .1, "triangle", .1);
            tone(1318, .18, "triangle", .1, .1);
        };
        const glug = () => tone(150 + Math.random() * 90, .13, "sine", .14);
        const burpTone = () => tone(55 + Math.random() * 25, .16, "sawtooth", .16);

        // Riproduce il file (bevuta o rutto) a partire da offsetMs: se si interrompe, riparte da lì
        function startHoldSound(kind, offsetMs) {
            stopHoldSound();
            const buffer = sounds[kind];
            if (buffer) {
                if (offsetMs >= buffer.duration * 1000) return;
                const ctx = ensureAudio();
                holdSource = ctx.createBufferSource();
                holdGain = ctx.createGain();
                holdSource.buffer = buffer;
                holdGain.gain.value = soundEnabled ? .9 : 0;
                holdSource.connect(holdGain);
                holdGain.connect(ctx.destination);
                holdSource.start(0, Math.max(0, offsetMs) / 1000);
            } else if (kind === "drink") {
                glug();
                glugTimer = setInterval(glug, 240);
            } else {
                burpTone();
                glugTimer = setInterval(burpTone, 160);
            }
        }

        function stopHoldSound() {
            if (holdSource) {
                try {
                    holdSource.stop();
                } catch (e) { /* già fermo */
                }
                holdSource.disconnect();
                holdSource = null;
            }
            if (holdGain) {
                holdGain.disconnect();
                holdGain = null;
            }
            if (glugTimer) {
                clearInterval(glugTimer);
                glugTimer = null;
            }
        }

        function stopInterval() {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        }

        // --- schermo ---
        function refreshScores() {
            const n = playerIds().length;
            const extra = {};
            for (const p of playerIds()) {
                if (n === 3) extra[p] = (points[p] || 0) + "★ " + (totalBeers[p] || 0) + "🍺";
                else extra[p] = scores[p] || 0;
            }
            renderScores(extra);
        }

        function show() {
            lastShow = performance.now();
            const t = cur();
            const secs = Math.max(0, Math.ceil(turnLeft / 1000));
            const who = COLORS[actor()];
            const head = names(t.actors) + " · " + beers + " 🍺 · " + secs + "s";
            const bar = (prog / 1000).toFixed(1) + " / " + (need / 1000).toFixed(1) + " s";
            if (phase === "cap") setArena("🍺 " + who + ": STAPPA!", "Premi per stappare la birra · " + head);
            else if (phase === "drink") setArena(holding ? "🍻 " + who + ": BEVI!" : "🍺 " + who + ": tieni premuto per bere", bar + " · " + head, holding ? "signal" : "");
            else if (phase === "empty") setArena("🥃 " + who + ": butta il bicchiere!", "Premi per buttare il bicchiere · " + head);
            else if (phase === "burp") setArena(holding ? "😮‍💨 " + who + ": RUTTO!" : "😮‍💨 " + who + ": tieni premuto per il rutto", bar + " · " + head, holding ? "signal" : "");
        }

        // --- svolgimento ---
        g.start = async () => {
            const ids = [...playerIds()];
            const n = ids.length;
            turn = 0;
            phase = "intro";
            turnBeers = [];
            points = Object.fromEntries(ids.map(p => [p, 0]));
            totalBeers = Object.fromEntries(ids.map(p => [p, 0]));
            holdTotal = Object.fromEntries(ids.map(p => [p, 0]));
            scores = Object.fromEntries(ids.map(p => [p, 0]));
            teams = [];
            if (n === 4) {
                const sh = [...ids].sort(() => Math.random() - .5);      // squadre sorteggiate
                teams = [[sh[0], sh[1]], [sh[2], sh[3]]];
                turns = teams.map((actors, i) => ({actors, team: i}));
            } else if (n === 3) {
                const pairs = [[ids[0], ids[1]], [ids[1], ids[2]], [ids[2], ids[0]]];
                turns = pairs.flatMap((pair, m) => pair.map(p => ({actors: [p], match: m, pair})));
            } else {
                turns = ids.map(p => ({actors: [p]}));
            }
            [UNCAP, DONE, BREAK].forEach(loadSample);
            // durata di bevuta e rutto = durata dei rispettivi file
            const preload = Promise.all([
                loadSample(DRINK).then(b => {
                    sounds.drink = b;
                }),
                loadSample(BURP).then(b => {
                    sounds.burp = b;
                })
            ]);
            $("#game-status").textContent = "ASSETATO";
            setArena("🍺 Assetato", "Ascolta le istruzioni");
            refreshScores();

            window.BPDebug?.watch(() => ({
                modalita: n === 4 ? "squadre" : n === 3 ? "tre sfide 1 contro 1" : "singolo",
                squadre: teams.map(t => names(t)),
                turno: cur() ? names(cur().actors) + " (" + (turn + 1) + "/" + turns.length + ")" : "—",
                tocca: cur() ? COLORS[actor()] : "—",
                fase: phase,
                birreTurno: beers,
                punti: {...points},
                progresso_s: +(prog / 1000).toFixed(2),
                durataFase_s: +(need / 1000).toFixed(2),
                tempoRimasto_s: +(turnLeft / 1000).toFixed(1),
                staPremendo: holding,
                fileBevuta: sounds.drink ? "sì" : "no (3 s)",
                fileRutto: sounds.burp ? "sì" : "no (1,5 s)"
            }));

            const secs = TURN_SECONDS[n] || 30;
            const modeText = n === 4
                ? "In quattro si gioca a squadre. Nel turno della squadra, uno stappa e butta il bicchiere, l'altro beve e fa il rutto. Le squadre sono " +
                teams.map(t => names(t)).join(" contro ") + ". "
                : n === 3
                    ? "In tre si fanno tre sfide uno contro uno: " + [[0, 1], [1, 2], [2, 0]].map(([x, y]) => COLORS[ids[x]] + " contro " + COLORS[ids[y]]).join(", ") +
                    ". Chi vince una sfida prende due punti. "
                    : "A turno, ogni giocatore gioca da solo. ";
            if (!await narrate(g, "Assetato. Quante birre riesci a bere? Ogni turno dura " + secs + " secondi. " + modeText +
                "Premi per stappare la birra, poi tieni premuto per berla. Quando è finita, premi per buttare il bicchiere, " +
                "poi tieni premuto per fare il rutto. Se lasci il tasto, il suono si ferma e quando premi di nuovo riparte da dove eri arrivato. " +
                "La birra vale un punto solo se completi tutta la sequenza.")) return;
            await preload;
            if (game !== g) return;
            startTurn();
        };

        function startTurn() {
            if (g.finished) return;
            const t = cur();
            phase = "announce";
            prog = 0;
            beers = 0;
            holding = false;
            $("#game-status").textContent = "TURNO: " + names(t.actors).toUpperCase();
            let text;
            if (t.actors.length === 2) text = "Tocca alla squadra " + names(t.actors) + ". " + COLORS[t.actors[0]] + " stappa e butta il bicchiere, " + COLORS[t.actors[1]] + " beve e fa il rutto.";
            else if (t.pair && turn % 2 === 0) text = "Sfida: " + names(t.pair).replace(" e ", " contro ") + ". Tocca a " + COLORS[t.actors[0]];
            else text = "Tocca a " + COLORS[t.actors[0]];
            setArena("🍺 " + (t.actors.length === 2 ? "Squadra " : "Tocca a ") + names(t.actors), t.actors.length === 2
                ? COLORS[t.actors[0]] + " stappa e butta · " + COLORS[t.actors[1]] + " beve e rutta" : "Preparati…");
            refreshScores();
            dbg("info", "▶ " + text);
            if (turns.length > 1) {
                sayAsync(text).then(() => {
                    if (game === g && !g.finished && phase === "announce") later(begin, 500);
                });
            } else later(begin, 800);
        }

        function begin() {
            if (g.finished) return;
            tone(880, .12, "square", .1);
            phase = "cap";
            prog = 0;
            turnLeft = (TURN_SECONDS[playerIds().length] || 30) * 1000;
            lastTick = performance.now();
            stopInterval();
            interval = setInterval(tick, 30);
            show();
        }

        function tick() {
            const now = performance.now();
            const dt = Math.min(200, now - lastTick);
            lastTick = now;
            if (paused || g.finished) return;
            if (phase !== "cap" && phase !== "drink" && phase !== "empty" && phase !== "burp") return;
            turnLeft -= dt;
            if (holding && (phase === "drink" || phase === "burp")) {
                prog += dt;
                holdTotal[actor()] += dt;
                if (prog >= need) completeStage();
            }
            if (turnLeft <= 0) {
                endTurn();
                return;
            }
            if (now - lastShow > 100) show();
        }

        // Fine della bevuta o del rutto
        function completeStage() {
            holding = false;
            stopHoldSound();
            if (phase === "drink") {
                phase = "empty";
                doneSound();
                dbg("info", "🍺 " + COLORS[actor("drink")] + " ha finito di bere: ora si butta il bicchiere");
            } else {
                beers++;
                for (const p of cur().actors) {
                    totalBeers[p] = (totalBeers[p] || 0) + 1;
                    scores[p] = playerIds().length === 4 ? beers : totalBeers[p];
                }
                refreshScores();
                phase = "cap";
                prog = 0;
                pointSound();
                toast("🍺 " + names(cur().actors) + ": birra n° " + beers + " completa!");
                dbg("ok", "✅ " + names(cur().actors) + " completa la birra n° " + beers + " (" + Math.round(turnLeft / 1000) + " s rimasti)");
            }
            show();
        }

        function endTurn() {
            stopInterval();
            stopHoldSound();
            const incomplete = phase === "drink" || phase === "empty" || phase === "burp";
            holding = false;
            phase = "between";
            turnBeers[turn] = beers;
            tone(220, .35, "sawtooth", .12);
            let extra = "";
            // 3 giocatori: a fine sfida (secondo turno della coppia) si assegnano i punti
            if (playerIds().length === 3 && turn % 2 === 1) {
                const [x, y] = cur().pair;
                const bx = turnBeers[turn - 1], by = turnBeers[turn];
                if (bx === by) {
                    points[x] += 1;
                    points[y] += 1;
                    extra = " Sfida pari: 1 punto a testa.";
                } else {
                    const w = bx > by ? x : y;
                    points[w] += 2;
                    extra = " Sfida a " + COLORS[w] + ": 2 punti.";
                }
                dbg("info", "🏁 sfida " + COLORS[x] + " " + bx + " - " + by + " " + COLORS[y] + extra);
                refreshScores();
            }
            setArena("⏱ Tempo!", names(cur().actors) + ": " + beers + (beers === 1 ? " birra" : " birre") +
                (incomplete ? " (l'ultima non era completa)" : "") + extra);
            dbg("info", "■ fine turno di " + names(cur().actors) + ": " + beers + " birre" + (incomplete ? " (+ una incompleta)" : ""));
            turn++;
            later(turn >= turns.length ? conclude : startTurn, 2400);
        }

        function conclude() {
            if (g.finished) return;
            phase = "over";
            const ids = playerIds();
            refreshScores();
            if (ids.length === 4) {
                const tot = teams.map((t, i) => ({
                    t,
                    beers: turnBeers[i] || 0,
                    hold: t.reduce((a, p) => a + holdTotal[p], 0)
                }));
                const [x, y] = tot;
                if (x.beers === y.beers && Math.abs(x.hold - y.hold) < 50) {
                    finish("🍺 Pareggio: " + x.beers + " birre a testa!", null);
                    return;
                }
                const [w, l] = x.beers > y.beers || (x.beers === y.beers && x.hold > y.hold) ? [x, y] : [y, x];
                finish("🍺 Vince la squadra " + names(w.t) + " con " + w.beers + (w.beers === 1 ? " birra" : " birre") + " contro " + l.beers + "!", [...w.t, ...l.t], false);
                say("Vince la squadra " + names(w.t));
                return;
            }
            const ranked = [...ids].sort((a, b) => ids.length === 3
                ? points[b] - points[a] || totalBeers[b] - totalBeers[a] || holdTotal[b] - holdTotal[a]
                : totalBeers[b] - totalBeers[a] || holdTotal[b] - holdTotal[a]);
            const [a, b] = ranked;
            const key = p => ids.length === 3 ? points[p] + "/" + totalBeers[p] : totalBeers[p];
            const tie = key(a) === key(b) && Math.abs(holdTotal[a] - holdTotal[b]) < 50;
            finish(tie
                    ? "🍺 Pareggio!"
                    : ids.length === 3
                        ? "🍺 " + COLORS[a] + " vince con " + points[a] + " punti e " + totalBeers[a] + " birre!"
                        : "🍺 " + COLORS[a] + " vince con " + totalBeers[a] + (totalBeers[a] === 1 ? " birra!" : " birre!"),
                tie ? null : ranked);
        }

        g.onInput = e => {
            if (g.finished || !playerIds().includes(e.button)) return;
            if (phase !== "cap" && phase !== "drink" && phase !== "empty" && phase !== "burp") return;
            if (e.button !== actor()) return;     // in squadra ogni fase ha il suo giocatore
            const who = COLORS[e.button];

            if (e.type === "down") {
                if (phase === "cap") {
                    uncapSound();
                    phase = "drink";
                    prog = 0;
                    need = needFor("drink");
                    holding = false;
                    dbg("info", "🍾 " + who + " stappa (la bevuta dura " + (need / 1000).toFixed(1) + " s)");
                } else if (phase === "drink" || phase === "burp") {
                    holding = true;
                    startHoldSound(phase, prog);
                    dbg("info", "   " + who + (phase === "drink" ? " beve" : " fa il rutto") + " (da " + (prog / 1000).toFixed(1) + " s)");
                } else if (phase === "empty") {
                    breakSound();
                    phase = "burp";
                    prog = 0;
                    need = needFor("burp");
                    holding = false;
                    dbg("info", "💥 bicchiere buttato: ora " + COLORS[actor("burp")] + " tiene premuto per il rutto (" + (need / 1000).toFixed(1) + " s)");
                }
                show();
            } else if (e.type === "up" && holding && (phase === "drink" || phase === "burp")) {
                holding = false;
                stopHoldSound();
                dbg("info", "   " + who + " ha smesso a " + (prog / 1000).toFixed(1) + " / " + (need / 1000).toFixed(1) + " s");
                show();
            }
        };

        g.pause = () => {
            wasHolding = holding;
            holding = false;
            stopHoldSound();
        };

        g.resume = () => {
            lastTick = performance.now();
            // durante la pausa i rilasci non arrivano: si riprende solo se il tasto è ancora premuto
            if (wasHolding && (phase === "drink" || phase === "burp") && held.has(actor())) {
                holding = true;
                startHoldSound(phase, prog);
            }
            wasHolding = false;
            if (phase === "cap" || phase === "drink" || phase === "empty" || phase === "burp") show();
            else setArena("🍺 Si riparte!", "Tra poco tocca a " + (cur() ? names(cur().actors) : "…"));
        };

        g.dispose = () => {
            stopTimer();
            stopInterval();
            stopHoldSound();
            speechSynthesis?.cancel();
        };

        return g;
    }

    function makeTug() {
        const g = baseGame("tug");

        // === Parametri ===
        const LIMIT = 20;              // vantaggio di pressioni con cui si vince subito il round
        const ROUND_SECONDS = 12;      // durata massima di un round
        const EXTRA_SECONDS = 4;       // tempo aggiunto se alla fine è pari
        const PRE_GO = [900, 2200];    // attesa casuale dopo "Pronti" prima del via (ms)
        const BAR = 21;                // larghezza della corda mostrata

        // === File audio (facoltativi: se mancano si usano suoni sintetici) ===
        const DIR = "assets/sounds/fune/";
        const CHEER = DIR + "tifo.mp3";                                   // tifo di sottofondo, in loop
        const START_SOUND = DIR + "partenza.mp3";                         // via della gara (fischio / sparo / campana)
        const EFFORT_FILES = {A: DIR + "sforzo-a.mp3", B: DIR + "sforzo-b.mp3"};   // sforzo di tirare, uno per squadra, in loop
        const CHEER_VOLUME = .14;
        const EFFORT_VOLUME = .45;
        const EFFORT_SYNTH_VOLUME = .05;                                  // volume del suono sintetico se manca il file
        const EFFORT_FALLBACK_FREQ = {A: 120, B: 165};
        const EFFORT_PAN = {A: -.6, B: .6};                               // la squadra A si sente a sinistra, la B a destra
        const EFFORT_HOLD = 300;                                          // ms: il suono resta acceso dopo l'ultima pressione

        let matches = [], mi = 0, phase = "intro";         // intro | announce | ready | fight | between | over
        let A = [], B = [], winsA = 0, winsB = 0, needWins = 1, round = 1;
        let pressA = 0, pressB = 0, left = 0, lastTick = 0, lastShow = 0, interval = null;
        let points = {}, totalPresses = {};
        let effort = {A: null, B: null}, effortToken = 0, lastPress = {A: 0, B: 0}, halfDone = false;
        let ducked = false;                 // true mentre parla la voce: gli altri suoni si abbassano
        const DUCK_FACTOR = .15;            // quota di volume che resta agli altri suoni mentre parla la voce
        const dbg = (lvl, msg) => window.BPDebug?.log("fune", lvl, msg);

        // --- Suoni di sforzo: uno a testa per squadra, in loop finché i suoi tasti vengono premuti ---
        async function startEffort() {
            stopEffort();
            const token = ++effortToken;
            const ctx = ensureAudio();
            for (const t of ["A", "B"]) {
                const buffer = await loadSample(EFFORT_FILES[t]);
                if (token !== effortToken || game !== g) return;
                const gain = ctx.createGain();
                gain.gain.value = 0;
                let src;
                if (buffer) {
                    src = ctx.createBufferSource();
                    src.buffer = buffer;
                    src.loop = true;
                } else {
                    src = ctx.createOscillator();      // fallback sintetico
                    src.type = "sawtooth";
                    src.frequency.value = EFFORT_FALLBACK_FREQ[t];
                }
                src.connect(gain);
                let out = gain;
                if (ctx.createStereoPanner) {
                    const panner = ctx.createStereoPanner();
                    panner.pan.value = EFFORT_PAN[t];
                    gain.connect(panner);
                    out = panner;
                }
                out.connect(ctx.destination);
                src.start();
                effort[t] = {src, gain, out, vol: buffer ? EFFORT_VOLUME : EFFORT_SYNTH_VOLUME};
            }
        }

        function stopEffort() {
            effortToken++;
            for (const t of ["A", "B"]) {
                const e = effort[t];
                if (!e) continue;
                try {
                    e.src.stop();
                } catch (err) {
                }
                e.src.disconnect();
                e.gain.disconnect();
                if (e.out !== e.gain) e.out.disconnect();
                effort[t] = null;
            }
        }

        function teamActive(t) {
            const members = t === "A" ? A : B;
            return performance.now() - lastPress[t] < EFFORT_HOLD || members.some(id => held.has(id));
        }

        // Il suono di una squadra è acceso solo mentre i suoi giocatori premono
        function updateEffort() {
            const ctx = audio;
            if (!ctx) return;
            for (const t of ["A", "B"]) {
                const e = effort[t];
                if (!e) continue;
                const on = phase === "fight" && !paused && !g.finished && soundEnabled && teamActive(t);
                e.gain.gain.setTargetAtTime(on ? e.vol * (ducked ? DUCK_FACTOR : 1) : 0, ctx.currentTime, .03);
            }
        }

        // Abbassa (o ripristina) il tifo e i suoni di sforzo
        function duck(on) {
            ducked = on;
            if (natureGain && audio) {
                natureGain.gain.setTargetAtTime(soundEnabled && !paused ? natureVolume * (on ? DUCK_FACTOR : 1) : 0, audio.currentTime, .05);
            }
            updateEffort();
        }

        // A metà round la voce dice chi sta vincendo
        function announceHalf() {
            let text;
            if (pressA === pressB) text = "Siamo ancora in parità!";
            else {
                const lead = pressA > pressB ? A : B;
                text = names(lead) + (lead.length === 2 ? " stanno vincendo!" : " sta vincendo!");
            }
            dbg("info", "📢 metà round: " + text + " (" + pressA + "–" + pressB + ")");
            duck(true);
            sayAsync(text, 6000).then(() => { if (game === g) duck(false); });
        }
        const names = ids => ids.map(p => COLORS[p]).join(" e ");
        const rand = ([min, max]) => min + Math.random() * (max - min);

        function stopInterval() {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        }

        function refreshScores() {
            const n = playerIds().length;
            const extra = {};
            for (const p of playerIds()) {
                if (n === 3) extra[p] = (points[p] || 0) + "★";
                else extra[p] = A.includes(p) ? winsA : B.includes(p) ? winsB : 0;
            }
            renderScores(extra);
        }

        // La corda: il segno ● si sposta verso chi tira di più
        function rope() {
            lastShow = performance.now();
            const diff = pressA - pressB;
            const pos = Math.max(-1, Math.min(1, diff / LIMIT));
            const at = Math.round((1 - pos) / 2 * (BAR - 1));
            const bar = Array.from({length: BAR}, (_, i) => i === at ? "●" : "─").join("");
            setArena("🤼 TIRA!", names(A) + " " + bar + " " + names(B) + " · " + pressA + "–" + pressB + " · " + Math.max(0, Math.ceil(left / 1000)) + "s", "signal");
        }

        g.start = async () => {
            const ids = [...playerIds()];
            const n = ids.length;
            points = Object.fromEntries(ids.map(p => [p, 0]));
            totalPresses = Object.fromEntries(ids.map(p => [p, 0]));
            scores = Object.fromEntries(ids.map(p => [p, 0]));
            mi = 0;
            phase = "intro";
            if (n === 4) {
                const sh = [...ids].sort(() => Math.random() - .5);        // squadre sorteggiate
                matches = [{a: [sh[0], sh[1]], b: [sh[2], sh[3]], need: 2}];
            } else if (n === 3) {
                matches = [{a: [ids[0]], b: [ids[1]], need: 1}, {a: [ids[1]], b: [ids[2]], need: 1}, {
                    a: [ids[2]],
                    b: [ids[0]],
                    need: 1
                }];
            } else {
                matches = [{a: [ids[0]], b: [ids[1]], need: 2}];
            }
            A = matches[0].a;
            B = matches[0].b;
            winsA = winsB = 0;
            $("#game-status").textContent = "TIRO ALLA FUNE";
            setArena("🤼 Tiro alla fune", "Ascolta le istruzioni");
            refreshScores();

            window.BPDebug?.watch(() => ({
                fase: phase,
                sfida: (mi + 1) + "/" + matches.length + " · " + names(A) + " contro " + names(B),
                round: round,
                vittorie: winsA + "–" + winsB,
                pressioni: pressA + "–" + pressB,
                tempoRimasto_s: +(left / 1000).toFixed(1),
                punti: {...points}
            }));

            const modeText = n === 4
                ? "In quattro si gioca a squadre da due: le pressioni dei compagni si sommano. Le squadre sono " + names(matches[0].a) + " contro " + names(matches[0].b) + ". Si gioca al meglio di tre round. "
                : n === 3
                    ? "In tre si fanno tre sfide uno contro uno, un round ciascuna: " + matches.map(m => names(m.a) + " contro " + names(m.b)).join(", ") + ". Chi vince una sfida prende due punti. "
                    : "Si gioca al meglio di tre round. ";
            if (!await narrate(g, "Tiro alla fune. Premi il tuo tasto più veloce che puoi per tirare la corda dalla tua parte. " +
                "Vince il round chi ha più pressioni allo scadere, o chi arriva per primo a venti di vantaggio. " + modeText +
                "Aspetta il via: le pressioni prima del via non contano.")) return;
            loadSample(START_SOUND);                                     // precarica il suono di partenza
            startEffort();       // il tifo parte al via di ogni round
            startMatch();
        };

        function startMatch() {
            if (g.finished) return;
            const m = matches[mi];
            A = m.a;
            B = m.b;
            needWins = m.need;
            winsA = winsB = 0;
            round = 1;
            phase = "announce";
            refreshScores();
            const n = playerIds().length;
            const text = A.length === 2
                ? "Squadra " + names(A) + " contro squadra " + names(B)
                : names(A) + " contro " + names(B);
            setArena("🤼 " + text, "Preparati…");
            $("#game-status").textContent = n === 3 ? "SFIDA " + (mi + 1) + " DI 3" : "ROUND " + round;
            dbg("info", "▶ " + text + (needWins > 1 ? " (al meglio di " + (needWins * 2 - 1) + ")" : ""));
            if (matches.length > 1 || A.length === 2) {
                sayAsync(text).then(() => {
                    if (game === g && !g.finished && phase === "announce") later(ready, 600);
                });
            } else later(ready, 800);
        }

        function ready() {
            if (g.finished) return;
            phase = "ready";
            pressA = pressB = 0;
            $("#game-status").textContent = playerIds().length === 3 ? "SFIDA " + (mi + 1) + " DI 3" : "ROUND " + round;
            setArena("✋ Pronti…", names(A) + " contro " + names(B) + " · aspetta il via");
            tone(440, .12, "triangle", .1);
            later(go, rand(PRE_GO));
        }

        function go() {
            if (g.finished) return;
            phase = "fight";
            halfDone = false;
            if (!natureSource) startNatureAmbience(CHEER, CHEER_VOLUME, makeCrowdBuffer);   // il pubblico torna al via
            playSample(START_SOUND, () => tone(988, .22, "square", .14));   // suono di partenza
            left = ROUND_SECONDS * 1000;
            lastTick = performance.now();
            stopInterval();
            interval = setInterval(tick, 40);
            rope();
        }

        function tick() {
            const now = performance.now();
            const dt = Math.min(200, now - lastTick);
            lastTick = now;
            updateEffort();
            if (paused || g.finished || phase !== "fight") return;
            left -= dt;
            if (!halfDone && left <= ROUND_SECONDS * 500) {   // circa metà round
                halfDone = true;
                announceHalf();
            }
            if (Math.abs(pressA - pressB) >= LIMIT) {
                endRound();
                return;
            }
            if (left <= 0) {
                if (pressA !== pressB) {
                    endRound();
                    return;
                }
                left += EXTRA_SECONDS * 1000;     // pari: supplementare
                toast("Pari! Si continua " + EXTRA_SECONDS + " secondi");
                tone(660, .15, "square", .1);
            }
            if (now - lastShow > 100) rope();
        }

        g.onInput = e => {
            if (e.type !== "down" || g.finished || phase !== "fight") return;
            const id = e.button;
            if (A.includes(id)) {
                pressA++;
                lastPress.A = performance.now();
            } else if (B.includes(id)) {
                pressB++;
                lastPress.B = performance.now();
            } else return;
            updateEffort();
            totalPresses[id]++;
            if (performance.now() - lastShow > 60) rope();
        };

        function endRound() {
            stopInterval();
            phase = "between";
            ducked = false;
            stopNatureAmbience();   // tempo finito: il pubblico smette di tifare
            updateEffort();   // fine round: i suoni di sforzo si spengono
            const aWon = pressA > pressB;
            if (aWon) winsA++;
            else winsB++;
            const winners = aWon ? A : B;
            tone(aWon ? 784 : 659, .12, "triangle", .12);
            tone(aWon ? 1046 : 880, .25, "triangle", .12, .12);
            refreshScores();
            dbg("ok", "🏁 round " + round + ": " + names(winners) + " vince " + Math.max(pressA, pressB) + "–" + Math.min(pressA, pressB) + " (round vinti " + winsA + "–" + winsB + ")");
            const matchOver = winsA >= needWins || winsB >= needWins;
            setArena("🏁 " + names(winners) + (winners.length === 2 ? " vincono" : " vince") + " il round", pressA + "–" + pressB + " · round vinti " + winsA + "–" + winsB);
            const roundText = names(winners) + (winners.length === 2 ? " vincono" : " vince") +
                " il round, " + pressA + " a " + pressB + ". Round vinti: " + winsA + " a " + winsB + ".";
            sayAsync(roundText).then(() => {
                if (game !== g || g.finished || phase !== "between") return;
                if (!matchOver) {
                    round++;
                    later(ready, 500);
                    return;
                }
                const n = playerIds().length;
                if (n === 3) {
                    const w = aWon ? A[0] : B[0];
                    points[w] += 2;
                    refreshScores();
                    mi++;
                    later(mi < matches.length ? startMatch : conclude, 700);
                } else later(conclude, 700);
            });
        }

        function conclude() {
            if (g.finished) return;
            phase = "over";
            stopEffort();
            stopNatureAmbience();
            const ids = playerIds();
            if (ids.length === 3) {
                const ranked = [...ids].sort((a, b) => points[b] - points[a] || totalPresses[b] - totalPresses[a]);
                const [a, b] = ranked;
                const tie = points[a] === points[b] && totalPresses[a] === totalPresses[b];
                finish(tie ? "🤼 Pareggio!" : "🤼 " + COLORS[a] + " vince con " + points[a] + " punti!", tie ? null : ranked);
                return;
            }
            const aWon = winsA > winsB;
            const w = aWon ? A : B, l = aWon ? B : A;
            if (w.length === 2) {
                finish("🤼 Vince la squadra " + names(w) + " " + Math.max(winsA, winsB) + "–" + Math.min(winsA, winsB) + "!", [...w, ...l], false);
                say("Vince la squadra " + names(w));
            } else {
                finish("🤼 " + COLORS[w[0]] + " vince " + Math.max(winsA, winsB) + "–" + Math.min(winsA, winsB) + "!", [w[0], l[0]]);
            }
        }

        g.pause = () => updateEffort();

        g.resume = () => {
            lastTick = performance.now();
            if (phase === "fight") rope();
            else setArena("🤼 Si riparte!", "Tra poco si tira");
        };

        g.dispose = () => {
            stopTimer();
            stopInterval();
            stopEffort();
            stopNatureAmbience();
            speechSynthesis?.cancel();
        };
        return g;
    }

    function makeBounty() {
        const g = baseGame("bounty");
        const SHOT_SOUND = "assets/sounds/taglia/sparo.mp3";
        const TARGET_ESCAPE_SOUND = "assets/sounds/taglia/ricercato-corsa.mp3";
        const PRESS_START_SOUND = "assets/sounds/taglia/inizio-premi.mp3";
        const LATE_SOUND = "assets/sounds/taglia/tardi.mp3";                      // ha premuto, ma non per primo
        const TARGET_LATE_SOUND = "assets/sounds/taglia/ricercato-tardi.mp3";     // il ricercato preme troppo tardi

        // === Parametri ===
        const ROUNDS = 6;
        const AFTER_NAME = [400, 1500];   // attesa casuale tra il nome del ricercato e lo sparo (ms)
        const REACT_LIMIT = 3000;         // dopo lo sparo, tempo massimo per reagire (ms)
        const LATE_WINDOW = 1800;         // dopo il round, entro questo tempo anche chi preme in ritardo sente il suo suono (ms)

        let resolvedBy = null, resolvedAt = 0, latePressed = new Set();
        let round = 0, target = null, phase = "intro", openAt = 0, fouls = new Set(), recent = [];  // intro | gap | name | wait | open | between | over
        const dbg = (lvl, msg) => window.BPDebug?.log("taglia", lvl, msg);
        const rand = ([min, max]) => min + Math.random() * (max - min);
        const pick = list => list[Math.floor(Math.random() * list.length)];

        function pickTarget() {
            const ids = playerIds();
            const max = Math.max(...ids.map(p => scores[p]));
            const leaders = ids.filter(p => scores[p] === max);
            // Dal terzo round in poi, una volta su due il ricercato è chi è in testa
            let t = round > 2 && leaders.length < ids.length && Math.random() < .5 ? pick(leaders) : pick(ids);
            if (recent.length >= 2 && recent[recent.length - 1] === t && recent[recent.length - 2] === t) {
                t = pick(ids.filter(p => p !== t));    // mai lo stesso tre volte di fila
            }
            recent.push(t);
            return t;
        }

        g.start = async () => {
            scores = Object.fromEntries(playerIds().map(p => [p, 0]));
            round = 0;
            recent = [];
            phase = "intro";
            loadSample(SHOT_SOUND);
            loadSample(TARGET_ESCAPE_SOUND);
            loadSample(PRESS_START_SOUND);
            loadSample(LATE_SOUND);
            loadSample(TARGET_LATE_SOUND);
            $("#game-status").textContent = "TAGLIA";
            setArena("🎯 Taglia", "Ascolta le istruzioni");
            renderScores();

            window.BPDebug?.watch(() => ({
                round: round + "/" + ROUNDS,
                fase: phase,
                ricercato: target ? COLORS[target] : "—",
                falsePartenze: [...fouls].map(p => COLORS[p]),
                punti: {...scores}
            }));

            if (!await narrate(g, "Taglia. In ogni round il narratore dice chi è il ricercato, poi spara. Tutti premono il più in fretta possibile. " +
                "Se arrivi prima tu, prendi un punto e il ricercato ne perde uno. Se il più veloce è il ricercato, si salva e prende un punto. " +
                "Se premi prima dello sparo, perdi un punto. Alla fine di ogni round ti dico chi ha vinto. Si giocano sei round.")) return;
            nextRound();
        };

        function nextRound() {
            if (g.finished) return;
            round++;
            if (round > ROUNDS) {
                round = ROUNDS;
                conclude();
                return;
            }
            target = pickTarget();
            fouls = new Set();
            latePressed = new Set();
            resolvedBy = null;
            phase = "gap";
            $("#game-status").textContent = "ROUND " + round + " DI " + ROUNDS;
            setArena("🎯 Round " + round + " di " + ROUNDS, "Ascolta chi è il ricercato… e aspetta lo sparo");
            later(announce, 900);
        }

        function announce() {
            if (g.finished) return;
            phase = "name";
            sayAsync("Ricercato: " + COLORS[target] + "!", 4000).then(() => {
                if (game !== g || g.finished || phase !== "name") return;
                phase = "wait";
                later(fire, rand(AFTER_NAME));
            });
        }

        function fire() {
            if (g.finished) return;
            if (playerIds().every(p => fouls.has(p))) {        // tutti hanno anticipato: nessuno può vincere il round
                resolve(null);
                return;
            }
            phase = "open";
            openAt = performance.now();
            playSample(PRESS_START_SOUND, () => tone(880, .12, "square", .15));
            setArena("💥 PREMI!", "Ricercato: " + COLORS[target]);
            later(() => resolve(null), REACT_LIMIT);
        }

        g.onInput = e => {
            if (e.type !== "down" || g.finished || !playerIds().includes(e.button)) return;
            const id = e.button;
            if (phase === "name" || phase === "wait") {
                if (fouls.has(id)) return;
                fouls.add(id);
                scores[id]--;
                renderScores();
                tone(100, .3, "square", .12);
                toast("Falsa partenza! " + COLORS[id] + " −1");
                dbg("info", "❌ falsa partenza di " + COLORS[id]);
            } else if (phase === "open" && !fouls.has(id)) {
                resolve(id);
            } else if (phase === "between" && resolvedBy && id !== resolvedBy && !fouls.has(id)
                && !latePressed.has(id) && performance.now() - resolvedAt < LATE_WINDOW) {
                // Ha premuto, ma qualcun altro era già stato più veloce
                latePressed.add(id);
                if (id === target) {
                    playSample(TARGET_LATE_SOUND, () => {
                        tone(200, .18, "sawtooth", .1);
                        tone(130, .25, "sawtooth", .1, .12);
                    });
                    dbg("info", "🐢 il ricercato " + COLORS[id] + " ha premuto troppo tardi");
                } else {
                    playSample(LATE_SOUND, () => tone(280, .12, "square", .08));
                    dbg("info", "⏱ " + COLORS[id] + " ha premuto, ma non per primo");
                }
            }
        };

        function resolve(id) {
            if (phase === "between") return;
            stopTimer();
            const wasOpen = phase === "open";
            phase = "between";
            resolvedBy = id;
            resolvedAt = performance.now();
            let msg;
            if (id === null) {
                msg = wasOpen ? "Nessuno ha reagito" : "Tutti hanno anticipato";
                dbg("info", "⚪ " + msg);
            } else {
                const ms = Math.round(performance.now() - openAt);
                if (id === target) {
                    scores[id]++;
                    msg = COLORS[id] + " si è salvato! +1";
                    playSample(TARGET_ESCAPE_SOUND, () => {
                        tone(220, .12, "sawtooth", .12);
                        tone(330, .16, "sawtooth", .12, .1);
                    });
                    tone(880, .12, "triangle", .12);
                    tone(1320, .2, "triangle", .12, .1);
                } else {
                    scores[id]++;
                    scores[target]--;
                    msg = COLORS[id] + " prende la taglia su " + COLORS[target] + "! (+1 / −1)";
                    playSample(SHOT_SOUND, () => {
                        tone(330, .1, "square", .12);
                        tone(660, .2, "triangle", .12, .1);
                    });
                }
                dbg("ok", "🎯 " + msg + " · reazione " + ms + " ms");
            }
            renderScores();
            setArena("🎯 " + msg, "Round " + round + " di " + ROUNDS);
            // Il narratore dice chi ha vinto il round (dopo il suono dello sparo)
            const spoken = id === null ? "Nessuno vince il round."
                : id === target ? COLORS[id] + " si salva e prende un punto."
                    : COLORS[id] + " vince il round: prende la taglia su " + COLORS[target] + ".";
            setTimeout(() => {
                if (game === g && !g.finished) say(spoken);
            }, 700);
            later(nextRound, 3600);
        }

        function conclude() {
            if (g.finished) return;
            phase = "over";
            const ranked = [...playerIds()].sort((a, b) => scores[b] - scores[a]);
            const [a, b] = ranked;
            if (scores[a] === scores[b]) finish("🎯 Pareggio con " + scores[a] + " punti!", null);
            else finish("🎯 " + COLORS[a] + " vince con " + scores[a] + " punti!", ranked);
        }

        g.resume = () => {
            if (phase === "open") setArena("💥 PREMI!", "Ricercato: " + COLORS[target]);
            else setArena("🎯 Si riparte!", "Round " + round + " di " + ROUNDS);
        };

        g.dispose = () => {
            stopTimer();
            speechSynthesis?.cancel();
        };
        return g;
    }


    function makeCopyRhythm() {
        const g = baseGame("copyrhythm");

        const DIR = "assets/sounds/batteria/";
        const KITS = {
            P1: {name: "la cassa", type: "kick", file: DIR + "kick.mp3"},
            P2: {name: "il rullante", type: "snare", file: DIR + "snare.mp3"},
            P3: {name: "il charleston", type: "hat", file: DIR + "hat.mp3"},
            P4: {name: "il battimani", type: "clap", file: DIR + "clap.mp3"}
        };
        const CLICK = DIR + "click.mp3";

        // === PARAMETRI ===
        const BEATS = 8;
        const COUNT_IN = 4;           // battute di preparazione
        const BEAT_MS = 700;
        const MIN_HITS = 2;           // colpi minimi che il creatore deve mettere
        const MASTER = 0.9;

        // Bonus del creatore: premia il ritmo "ben calibrato", né troppo facile né troppo difficile.
        // Si basa sulla precisione media di chi copia (colpi giusti meno colpi in più, diviso i colpi del ritmo).
        //   precisione media tra 30% e 80%   → +2
        //   tra 80% e 95%, oppure tra 10% e 30% → +1
        //   oltre 95% (tutti perfetti) o sotto 10% (nessuno ci riesce) → 0
        const bonusFor = avg =>
            avg >= .30 && avg <= .80 ? 2
                : (avg > .80 && avg <= .95) || (avg >= .10 && avg < .30) ? 1
                    : 0;

        let phase = "intro";          // intro | announce | create | listen | copy | between | over
        let creatorIndex = 0;
        let currentCreator = null;
        let sequence = [];            // boolean[8]
        let beat = 0;                 // -COUNT_IN ... BEATS-1  (negativo = preparazione)
        let hits = {};
        let beatStart = 0;
        let pausedAt = 0;
        let tries = 0;
        let barSerial = 0;
        const buffers = new Map();

        const gone = () => game !== g || g.finished;
        const wait = ms => new Promise(r => setTimeout(r, ms));
        const ids = () => playerIds();
        const dbg = (lvl, msg) => window.BPDebug?.log("ritmo", lvl, msg);
        const legend = () =>
            ids().map(p => COLORS[p] + " " + KITS[p].name.replace(/^(il|la) /, "")).join(" · ");
        const grid = (marks, current) =>
            marks.map((x, i) => (i === current ? "[" : "") + (x ? "●" : "○") + (i === current ? "]" : "")).join(" ");

        // === SUONI ===
        let noiseBuf = null;

        function getNoise(ctx) {
            if (!noiseBuf) {
                noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
                const data = noiseBuf.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
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

        function playDrum(type, file, when = null) {
            const ctx = ensureAudio();
            const out = ctx.createGain();
            out.gain.value = soundEnabled ? MASTER : 0;
            out.connect(ctx.destination);
            const t = when ?? ctx.currentTime;
            const buffer = buffers.get(file);
            if (buffer) {
                const src = ctx.createBufferSource();
                src.buffer = buffer;
                src.connect(out);
                src.start(t);
            } else {
                synth(ctx, type, t, out);
            }
        }

        // Metronomo: preparazione più acuta, poi battute pari più gravi e dispari più acute
        function playMetronome(beatIndex) {
            const ctx = ensureAudio();
            const out = ctx.createGain();
            out.gain.value = soundEnabled ? 0.55 : 0;
            out.connect(ctx.destination);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "square";
            const freq = beatIndex < 0 ? 1800 : beatIndex % 2 === 0 ? 900 : 1400;
            const dur = beatIndex < 0 ? .09 : .05;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(out);
            osc.start();
            osc.stop(ctx.currentTime + dur + .02);
        }

        // === UNA BARRA: preparazione + 8 battute ===
        function showBeat() {
            const countIn = beat < 0;
            const prep = "Preparazione " + (COUNT_IN + beat + 1) + " / " + COUNT_IN;
            if (phase === "create") {
                setArena("🥁 " + COLORS[currentCreator] + " crea il ritmo",
                    countIn ? prep : "Battuta " + (beat + 1) + " di " + BEATS + " · " + grid(sequence, beat), "signal");
            } else if (phase === "listen") {
                setArena("👂 Ascoltate il ritmo di " + COLORS[currentCreator],
                    countIn ? prep : "Battuta " + (beat + 1) + " di " + BEATS + " · non premete");
            } else if (phase === "copy") {
                setArena("🥁 Copiate il ritmo di " + COLORS[currentCreator] + "!",
                    countIn ? prep : "Battuta " + (beat + 1) + " di " + BEATS, "signal");
            }
        }

        function runBar(kind, onEnd) {
            phase = kind;
            beat = -COUNT_IN;
            const serial = ++barSerial;
            $("#game-status").textContent = kind === "create" ? "CREA IL RITMO · " + COLORS[currentCreator].toUpperCase()
                : kind === "listen" ? "ASCOLTA" : "COPIA IL RITMO";
            beatStart = performance.now();
            playMetronome(beat);
            showBeat();

            const step = () => {
                if (g.finished || phase !== kind || serial !== barSerial) return;
                beat++;
                if (beat >= BEATS) {
                    phase = "between";
                    onEnd();
                    return;
                }
                beatStart = performance.now();
                playMetronome(beat);
                // solo nel giro di ascolto suona il ritmo del creatore; durante la copia nessun aiuto
                if (kind === "listen" && beat >= 0 && sequence[beat]) {
                    playDrum(KITS[currentCreator].type, KITS[currentCreator].file);
                    dbg("info", "   🔊 modello: colpo sulla battuta " + (beat + 1));
                }
                showBeat();
                later(step, BEAT_MS);
            };
            later(step, BEAT_MS);
        }

        // Battuta più vicina al momento della pressione (anche se si anticipa quella dopo)
        function nearestBeat() {
            const dt = performance.now() - beatStart;
            return dt > BEAT_MS / 2 ? beat + 1 : beat;
        }

        // === CREAZIONE ===
        function beginCreator() {
            if (g.finished) return;

            if (creatorIndex >= ids().length) {
                const order = ids().sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
                const tie = order.length > 1 && scores[order[0]] === scores[order[1]];
                finish(
                    tie ? "🥁 Pareggio!" : "🥁 " + COLORS[order[0]] + " vince con " + scores[order[0]] + " punti!",
                    tie ? null : order
                );
                return;
            }

            currentCreator = ids()[creatorIndex];
            tries = 0;
            startCreate();
        }

        function startCreate() {
            if (g.finished) return;
            sequence = Array(BEATS).fill(false);
            phase = "announce";
            $("#game-status").textContent = "CREA IL RITMO · " + COLORS[currentCreator].toUpperCase();
            setArena("🥁 " + COLORS[currentCreator] + " crea il ritmo", "Ascolta i colpi di preparazione", "signal");

            sayAsync(COLORS[currentCreator] + " crea il ritmo. Ascolta i quattro colpi di preparazione.").then(() => {
                if (gone() || phase !== "announce") return;
                runBar("create", afterCreate);
            });
        }

        function afterCreate() {
            const n = sequence.filter(Boolean).length;
            dbg("info", "🥁 " + COLORS[currentCreator] + " ha creato: " + grid(sequence, -1) + " (" + n + " colpi)");

            if (n < MIN_HITS) {
                tries++;
                if (tries >= 2) {
                    sayAsync("Troppo pochi colpi. Si passa al prossimo.").then(() => {
                        if (gone()) return;
                        creatorIndex++;
                        later(beginCreator, 500);
                    });
                } else {
                    sayAsync("Troppo pochi colpi, riprova.").then(() => {
                        if (gone()) return;
                        later(startCreate, 500);
                    });
                }
                return;
            }

            setArena("Ritmo registrato!", COLORS[currentCreator] + " ha messo " + n + (n === 1 ? " colpo" : " colpi"), "signal");
            sayAsync("Ritmo registrato. Ora ascoltatelo, senza premere.").then(() => {
                if (gone()) return;
                runBar("listen", () => {
                    sayAsync("Ora copiatelo tutti insieme, senza aiuto!").then(() => {
                        if (gone()) return;
                        startCopy();
                    });
                });
            });
        }

        // === COPIA (tutti insieme, senza modello) ===
        function startCopy() {
            const copyPlayers = ids().filter(p => p !== currentCreator);
            hits = Object.fromEntries(copyPlayers.map(p => [p, Array(BEATS).fill(false)]));
            runBar("copy", judgeCopy);
        }

        // Punti solo per i colpi azzeccati; ogni colpo in più toglie un punto
        function judgeCopy() {
            const copyPlayers = ids().filter(p => p !== currentCreator);
            const total = sequence.filter(Boolean).length;
            const detail = [];
            const accuracy = [];

            for (const p of copyPlayers) {
                let right = 0, extra = 0, missed = 0;
                for (let i = 0; i < BEATS; i++) {
                    if (sequence[i] && hits[p][i]) right++;
                    else if (!sequence[i] && hits[p][i]) extra++;
                    else if (sequence[i]) missed++;
                }
                const pts = right - extra;
                scores[p] = (scores[p] || 0) + pts;
                accuracy.push(Math.max(0, pts) / total);
                detail.push(COLORS[p] + " " + pts + (Math.abs(pts) === 1 ? " punto" : " punti"));
                dbg(pts > 0 ? "ok" : "info", (pts > 0 ? "✅ " : "⚪ ") + COLORS[p] + ": " + right + " giusti, " + extra + " in più, " + missed + " mancati → " + pts);
            }

            // Bonus del creatore in base a quanto bene (ma non troppo bene) è stato copiato il suo ritmo
            const avg = accuracy.reduce((a, b) => a + b, 0) / Math.max(1, accuracy.length);
            const bonus = bonusFor(avg);
            scores[currentCreator] = (scores[currentCreator] || 0) + bonus;
            const verdict = avg > .95 ? "troppo facile" : avg < .10 ? "troppo difficile" : "ben calibrato";
            dbg(bonus ? "ok" : "info", "🎁 " + COLORS[currentCreator] + ": precisione media " + Math.round(avg * 100) + "% (" + verdict + ") → bonus " + bonus);
            const bonusText = bonus
                ? COLORS[currentCreator] + " prende " + bonus + (bonus === 1 ? " punto" : " punti") + " di bonus: ritmo " + verdict
                : "Nessun bonus per " + COLORS[currentCreator] + ": ritmo " + verdict;

            renderScores();
            setArena("Esiti del ritmo", detail.join(" · ") + " · " + bonusText);
            toast(detail.join(" · ") + " · " + bonusText);

            sayAsync("Il ritmo di " + COLORS[currentCreator] + " aveva " + total + " colpi. " + detail.join(". ") + ". " + bonusText + ".").then(() => {
                if (gone()) return;
                creatorIndex++;
                later(beginCreator, 900);
            });
        }

        // === AVVIO ===
        g.start = async () => {
            phase = "intro";
            creatorIndex = 0;
            currentCreator = null;
            sequence = [];
            scores = Object.fromEntries(ids().map(p => [p, 0]));
            renderScores();

            window.BPDebug?.watch(() => ({
                fase: phase,
                creatore: currentCreator ? COLORS[currentCreator] : "—",
                battuta: beat,
                ritmo: sequence.length ? grid(sequence, -1) : "—",
                punti: {...scores}
            }));

            $("#game-status").textContent = "PREPARATI";
            setArena("🥁 Copia il ritmo", legend());

            const files = [CLICK, ...Object.values(KITS).map(k => k.file)];
            const preload = Promise.all(files.map(async f => buffers.set(f, await loadSample(f))));

            if (!await narrate(g,
                "Copia il ritmo. A turno un giocatore crea un ritmo di otto battute. " +
                "Prima di ogni ritmo ci sono quattro colpi di preparazione. " +
                "Poi tutti lo ascoltano una volta, e infine gli altri lo copiano insieme, senza aiuto. " +
                "Ogni colpo giusto vale un punto, ogni colpo in più ne toglie uno. " +
                "Chi crea il ritmo prende un bonus se gli altri lo copiano bene, ma non troppo bene: né troppo facile, né impossibile. " +
                "Ogni giocatore ha il suo suono. Si fa un giro completo.")) return;
            await preload;
            if (gone()) return;

            for (const p of ids()) {
                await sayAsync(COLORS[p] + ", " + KITS[p].name + ".");
                if (gone()) return;
                playDrum(KITS[p].type, KITS[p].file);
                await wait(700);
                if (gone()) return;
            }

            beginCreator();
        };

        // === INPUT ===
        g.onInput = e => {
            if (e.type !== "down" || !ids().includes(e.button) || g.finished) return;
            const id = e.button;

            if (phase === "create" && id === currentCreator) {
                const b = nearestBeat();
                if (b < 0 || b >= BEATS) return;
                sequence[b] = true;
                playDrum(KITS[id].type, KITS[id].file);
                return;
            }

            if (phase === "copy" && id !== currentCreator) {
                const b = nearestBeat();
                if (b < 0 || b >= BEATS) return;
                hits[id][b] = true;
                playDrum(KITS[id].type, KITS[id].file);
            }
        };

        g.pause = () => {
            pausedAt = performance.now();
        };

        g.resume = () => {
            beatStart += performance.now() - pausedAt;   // il tempo della pausa non conta per le battute
            showBeat();
        };

        g.dispose = () => {
            barSerial++;
            stopTimer();
            speechSynthesis?.cancel();
        };

        return g;
    }

    function makeHorse() {
        const g = baseGame("horse");
        const DIR = "assets/sounds/cavallino/";
        const GALLOP = DIR + "galoppo.mp3",
            JUMP = DIR + "salto.mp3",
            TURN = DIR + "cambio-verso.mp3",
            VIA = DIR + "via.mp3";

        // === Parametri ===
        const START_MS = 3500;        // tempo per agire all'inizio (ms)
        const MIN_MS = 600;           // tempo minimo raggiungibile (ms)
        const SPEEDUP = .94;          // ogni passaggio riduce il tempo del 6%
        const SPEEDUP_ELIM = .91;     // ogni eliminazione lo riduce ancora di più
        const DOUBLE_MS = 280, HOLD_MS = 420;

        let order = [], current = 0, direction = 1, deadlineMs = START_MS,
            lastTap = {}, downAt = {}, round = 0, turnSerial = 0,
            inputReady = false, holdTimer = null, heldAction = {},
            needsFullAnnounce = true, rearmOnResume = false, armedFor = null, clockwiseNote = false;

        // Quando qualcuno perde il giro torna in senso orario, e il narratore lo dice
        function resetDirection() {
            direction = 1;
            clockwiseNote = true;
        }

        const active = () => order.filter(p => playerIds().includes(p));
        const currentPlayer = () => {
            const list = active();
            return list.length ? list[((current % list.length) + list.length) % list.length] : null;
        };

        // Avvia il tempo massimo per agire: se scade, il giocatore è eliminato
        function armDeadline(p, serial) {
            armedFor = {p, serial};
            later(() => {
                if (g.finished || serial !== turnSerial || currentPlayer() !== p) return;
                stopTimer();
                inputReady = false;

                if (holdTimer !== null) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
                delete downAt[p];
                delete heldAction[p];

                toast(COLORS[p] + " perde ed è eliminato!");
                sayAsync(COLORS[p] + " perde ed è eliminato.").then(() => {
                    if (g.finished || serial !== turnSerial) return;
                    order = order.filter(x => x !== p);
                    const stillThere = active().indexOf(p);
                    current = stillThere >= 0 ? stillThere : Math.max(0, Math.min(current, active().length - 1));
                    deadlineMs = Math.max(MIN_MS, deadlineMs * SPEEDUP_ELIM);
                    round++;
                    needsFullAnnounce = true;
                    resetDirection();
                    announceTurn();
                });
            }, deadlineMs);
        }

        function announceTurn() {
            if (g.finished) return;
            const list = active();
            if (list.length <= 1) {
                finish(list[0] ? "🐎 " + COLORS[list[0]] + " vince!" : "🐎 Nessun vincitore", list[0] ? [list[0]] : null);
                return;
            }
            const p = currentPlayer();
            const serial = ++turnSerial;
            stopTimer();
            if (holdTimer !== null) clearTimeout(holdTimer);
            holdTimer = null;
            heldAction = {};
            inputReady = false;
            rearmOnResume = false;
            Object.keys(downAt).forEach(k => delete downAt[k]);
            lastTap = {};

            setArena("🐎 Tocca a " + COLORS[p],
                "Ascolta il segnale: dopo il suono hai " + (deadlineMs / 1000).toFixed(1) +
                " s · singolo: galoppo · doppio: salta · tieni: cambia verso");
            $("#game-status").textContent = "CAVALLINO · GIRO " + (round + 1);

            const enableAndStartTimer = () => {
                if (g.finished || serial !== turnSerial || currentPlayer() !== p) return;
                inputReady = true;
                armDeadline(p, serial);
            };

            if (needsFullAnnounce) {
                needsFullAnnounce = false;
                const clockwise = clockwiseNote;
                clockwiseNote = false;
                // Voce + suono di via solo all'inizio e dopo un'eliminazione
                // (dopo un'eliminazione il giro riparte in senso orario e il narratore lo dice)
                sayAsync((clockwise ? "Il giro riparte in senso orario. " : "") +
                    "Tocca a " + COLORS[p] + ". Attendi il segnale.").then(() => {
                    if (g.finished || serial !== turnSerial || currentPlayer() !== p) return;
                    playSample(VIA, () => tone(1046, .14, "square", .14));   // suono di via (con ripiego)
                    enableAndStartTimer();
                });
            } else {
                // Turno normale: nessun annuncio. Si capisce a chi tocca dal suono del tasto di chi ti precede
                enableAndStartTimer();
            }
        }

        function advance(steps = 1) {
            const len = active().length;
            if (!len) return;
            current = ((current + direction * steps) % len + len) % len;
            deadlineMs = Math.max(MIN_MS, deadlineMs * SPEEDUP);
            round++;
            announceTurn();
        }

        g.start = async () => {
            order = [...playerIds()];
            current = 0;
            direction = 1;
            deadlineMs = START_MS;
            round = 0;
            lastTap = {};
            downAt = {};
            turnSerial = 0;
            inputReady = false;
            heldAction = {};
            holdTimer = null;
            needsFullAnnounce = true;
            rearmOnResume = false;
            clockwiseNote = false;

            scores = Object.fromEntries(order.map(p => [p, 0]));
            renderScores();
            [GALLOP, JUMP, TURN, VIA].forEach(loadSample);

            window.BPDebug?.watch(() => ({
                inGioco: active().map(p => COLORS[p]),
                tocca: currentPlayer() ? COLORS[currentPlayer()] : "—",
                verso: direction > 0 ? "orario" : "antiorario",
                tempoPerAgire_ms: Math.round(deadlineMs),
                pronto: inputReady
            }));

            if (!await narrate(g,
                "Cavallino. Ascolta: la voce dirà a chi tocca e poi dirà «Attendi il segnale». " +
                "Solo dopo l’inizio del suono di via hai pochi secondi. " +
                "Un tocco fa galoppare e passa al successivo; doppio tocco salta il prossimo giocatore senza eliminarlo; " +
                "tieni premuto per cambiare verso. " +
                "Se non fai nessuna mossa in tempo, sei eliminato. " +
                "Se premi quando non è il tuo turno, sei eliminato. Si giocano tre round.")) return;

            announceTurn();
        };

        g.onInput = e => {
            if (g.finished || !playerIds().includes(e.button)) return;
            const id = e.button;

            if (!order.includes(id)) return;   // già eliminato → ignora eventuali up/down in ritardo

            if (e.type === "up" && heldAction[id]) {
                delete heldAction[id];
                return;
            }

            if (!inputReady) return;

            // Fuori turno: elimina SOLO se è un nuovo "down". Gli "up" residui vengono ignorati.
            if (id !== currentPlayer()) {
                if (e.type === "down") {
                    stopTimer();
                    turnSerial++;
                    inputReady = false;
                    if (holdTimer !== null) {
                        clearTimeout(holdTimer);
                        holdTimer = null;
                    }
                    delete downAt[id];

                    toast(COLORS[id] + " preme fuori turno!");
                    sayAsync(COLORS[id] + " preme fuori turno e viene eliminato.").then(() => {
                        if (g.finished) return;
                        const prevCurrent = currentPlayer();
                        order = order.filter(x => x !== id);
                        const idx = active().indexOf(prevCurrent);
                        current = idx >= 0 ? idx : Math.max(0, Math.min(current, active().length - 1));
                        deadlineMs = Math.max(MIN_MS, deadlineMs * SPEEDUP_ELIM);
                        round++;
                        needsFullAnnounce = true;
                        resetDirection();
                        announceTurn();
                    });
                }
                return;
            }

            // Solo il giocatore di turno
            if (e.type === "down") {
                downAt[id] = performance.now();

                stopTimer();

                if (holdTimer !== null) clearTimeout(holdTimer);
                holdTimer = setTimeout(() => {
                    holdTimer = null;
                    if (paused || g.finished || !inputReady || downAt[id] === undefined || id !== currentPlayer()) return;
                    delete downAt[id];
                    heldAction[id] = true;
                    stopTimer();
                    turnSerial++;
                    inputReady = false;
                    lastTap[id] = 0;
                    direction *= -1;
                    playSample(TURN, () => tone(180, .18, "sawtooth", .1));
                    toast("Verso invertito!");
                    advance();
                }, HOLD_MS);
                return;
            }

            if (e.type !== "up" || downAt[id] === undefined) return;
            if (holdTimer !== null) clearTimeout(holdTimer);
            holdTimer = null;
            const heldMs = performance.now() - downAt[id];
            delete downAt[id];

            if (heldMs >= HOLD_MS) {
                stopTimer();
                turnSerial++;
                inputReady = false;
                lastTap[id] = 0;
                direction *= -1;
                playSample(TURN, () => tone(180, .18, "sawtooth", .1));
                toast("Verso invertito!");
                advance();
                return;
            }

            // doppio tocco
            if (lastTap[id] && performance.now() - lastTap[id] <= DOUBLE_MS) {
                stopTimer();
                turnSerial++;
                inputReady = false;
                lastTap[id] = 0;
                playSample(JUMP, () => tone(700, .15, "triangle", .1));
                advance(2);
                return;
            }

            // singolo tocco
            lastTap[id] = performance.now();
            later(() => {
                if (g.finished || id !== currentPlayer()) return;
                lastTap[id] = 0;
                turnSerial++;
                inputReady = false;
                playSample(GALLOP, () => tone(220, .09, "triangle", .1));
                advance();
            }, DOUBLE_MS);
        };

        // Pausa: la pressione in corso viene annullata. Il timer del turno era già stato fermato
        // alla pressione, quindi va riarmato alla ripresa (altrimenti il giocatore resterebbe bloccato).
        g.pause = () => {
            if (holdTimer !== null) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
            const p = currentPlayer();
            rearmOnResume = inputReady && p !== null && downAt[p] !== undefined;
            downAt = {};
            heldAction = {};
        };

        g.resume = () => {
            if (rearmOnResume && inputReady && armedFor && armedFor.serial === turnSerial) {
                armDeadline(armedFor.p, armedFor.serial);
            }
            rearmOnResume = false;
            const p = currentPlayer();
            setArena("🐎 Si riparte!", p ? "Tocca a " + COLORS[p] : "");
        };

        g.dispose = () => {
            turnSerial++;
            inputReady = false;
            if (holdTimer !== null) clearTimeout(holdTimer);
            holdTimer = null;
            stopTimer();
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
                kick: () => [0, 4],
                snare: () => [2, 6],
                hat: () => pickSteps([0, 2, 4, 6], HITS),
                clap: () => pickSteps([1, 3, 5, 7], HITS)
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

            await sayIntro(
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

            await sayIntro(
                "Quattro tempi, poi un giro di prova senza punti. " +
                "Ascolta il ritmo e prepàrati!"
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
    window.BPArcade = {
        // `who` può essere un numero di giocatori (2–4) o l'elenco dei tasti usati, es. ["P2","P3"].
        start: (id, who) => {
            if (!GAME_NAMES[id]) throw new Error("Minigioco sconosciuto: " + id);
            activeButtons = Array.isArray(who)
                ? PLAYER_BUTTONS.filter(b => who.includes(b))
                : null;
            const count = activeButtons ? activeButtons.length : Number(who);
            $("#player-count").value = String(count);
            $("#game-select").value = id;
            updateSetup();
            startGame();
        },
        end: endGame,
        games: () => ({...GAME_NAMES}),
        colors: () => ({...COLORS}),
        speak: (text, maxMs) => sayAsync(text, maxMs),
        // Suono di una posizione della classifica finale (1 = applausi, altre = buu). Si può aspettare con await.
        positionSound: (position, total) => positionSound(position, total),
        // Dice il testo (es. «Secondo posto: Blu») e poi fa partire il suono della posizione
        announcePosition: async (text, position, total, maxMs) => {
            await sayAsync(text, maxMs);
            await positionSound(position, total);
        },
        unlockAudio: () => ensureAudio(),
        setMenuStart: enabled => {
            menuStartEnabled = !!enabled;
        },
        ble: bleController
    };

    updateSetup();
})
();