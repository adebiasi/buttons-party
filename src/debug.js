/*
 * Buttons-party · debug.js
 *
 * Pannello di debug per i minigiochi. Va caricato PRIMA di app.js.
 * Se il file manca o va in errore, il gioco funziona comunque: app.js usa
 * sempre `window.BPDebug?.…`.
 *
 * Cosa fa:
 *  - intercetta (senza cambiare il comportamento) setTimeout/setInterval,
 *    fetch, decodeAudioData, sorgenti Web Audio, speechSynthesis, console
 *    e gli errori globali;
 *  - osserva l'arena, lo stato, i punteggi e i toast tramite MutationObserver;
 *  - riceve pochi eventi espliciti da app.js (avvio, fine, uscita, pausa, input);
 *  - controlla in automatico: errori, file audio mancanti, blocchi, risorse
 *    rimaste attive dopo l'uscita, attività durante la pausa, punteggi non
 *    validi, rallentamenti dell'event loop;
 *  - offre un bot che preme tasti a caso e un collaudo automatico di tutti i giochi.
 */
(() => {
    "use strict";
    if (window.BPDebug) return;

    /* ======================================================================
     * Utilità
     * ==================================================================== */
    const T0 = performance.now();
    const now = () => performance.now();
    const _st = window.setTimeout.bind(window);
    const _ct = window.clearTimeout.bind(window);
    const _si = window.setInterval.bind(window);
    const _ci = window.clearInterval.bind(window);
    const _fetchRaw = window.fetch ? window.fetch.bind(window) : null;
    const _con = {
        warn: console.warn.bind(console),
        error: console.error.bind(console),
    };
    const $ = (s, r = document) => r.querySelector(s);
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
    const H = (html) => ({html});
    const sleep = (ms) => new Promise((r) => _st(r, ms));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rnd = (a, b) => a + Math.random() * (b - a);
    const mmss = (ms) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    };
    const shortUrl = (u) => String(u || "").replace(/^.*?assets\/(sounds\/)?/, "");
    const fnSrc = (fn) => {
        try {
            return Function.prototype.toString.call(fn).replace(/\s+/g, " ").slice(0, 110);
        } catch (e) {
            return "?";
        }
    };
    const safeJson = (v, max = 400) => {
        try {
            const s = JSON.stringify(v);
            return s && s.length > max ? s.slice(0, max) + "…" : s;
        } catch (e) {
            return String(v);
        }
    };
    const fmtArgs = (args) => args.map((a) => {
        if (a instanceof Error) return a.message;
        if (typeof a === "string") return a;
        return safeJson(a, 160);
    }).join(" ").slice(0, 400);

    const LS_RESULTS = "bp-debug-results-v1";
    const LS_UI = "bp-debug-ui-v1";
    const MIN_OK_SEC = 8;       // sotto questa durata una prova senza fine naturale non vale come "ok"
    const LEAK_CHECK_MS = 2000; // quanto aspettare dopo l'uscita prima di cercare risorse residue
    const STALL_MS = 20000;     // nessuna attività né timer pendenti per questo tempo = possibile blocco
    const KEYS = {P1: "1", P2: "2", P3: "3", P4: "4", C: " "};

    /* ======================================================================
     * Stato
     * ==================================================================== */
    const S = {
        log: [], logMax: 1800, seq: 0, logVer: 0,
        counts: {error: 0, warn: 0},
        run: null, lastRun: null, runSeq: 0,
        attached: null, watchFn: null,
        results: {}, hist: {},
        samples: {}, urlKey: new Map(),
        timeouts: new Map(), intervals: new Map(),
        audio: new Set(), audioStats: {bufferSources: 0, oscillators: 0, started: 0},
        speech: {count: 0, last: "", errors: 0},
        perf: {lag: 0, lagMax: 0, lagWindow: [], longTasks: 0, longTaskMax: 0, heap: null},
        input: {total: 0, ignored: 0, last: null, handlerSum: 0, handlerN: 0, handlerMax: 0, bySource: {}},
        heldAt: {},
        bot: {manual: false, timer: null, presses: 0},
        botDispatch: false,
        suite: null,
        assetCheck: null,
        env: {},
        lastAudioState: null,
        lastArena: {msg: "", info: "", cls: ""},
        lastStatus: "",
        lastScores: "",
        ui: {
            tab: "live", collapsed: false, hud: true, autoscroll: true, frozen: false,
            onlyRun: false, search: "", levels: {error: true, warn: true, ok: true, info: true}, hiddenCats: [],
        },
        dirty: true, renderedLogVer: -1,
    };
    let root = null;

    const gameList = () => [...document.querySelectorAll("#game-select option")].map((o) => [o.value, o.textContent.trim()]);
    const gameName = (id) => (gameList().find((g) => g[0] === id) || [id, id])[1];
    const getState = () => {
        try {
            return S.attached ? S.attached.getState() : null;
        } catch (e) {
            return null;
        }
    };

    /* ======================================================================
     * Log
     * ==================================================================== */
    const attributedRun = () => {
        if (S.run) return S.run;
        if (S.lastRun && S.lastRun.t1 && now() - S.lastRun.t1 < 3000) return S.lastRun;
        return null;
    };
    const res = (id) => S.results[id] || (S.results[id] = {
        runs: 0, natural: 0, err: 0, warn: 0, inputs: 0, maxSec: 0, samples: new Set(), last: null,
    });

    function log(cat, lvl, msg, data, opt) {
        const t = now();
        const run = (opt && opt.run) || attributedRun();
        const key = cat + "|" + lvl + "|" + msg;
        if (lvl === "error" || lvl === "warn") {
            for (let i = S.log.length - 1, k = 0; i >= 0 && k < 60; i--, k++) {
                const e = S.log[i];
                if (e.key === key && e.run === (run ? run.n : 0)) {
                    e.count++;
                    e.t = t;
                    S.logVer++;
                    S.dirty = true;
                    return e;
                }
            }
        }
        const e = {
            id: ++S.seq, t, cat, lvl, msg: String(msg), data: data === undefined ? null : data,
            run: run ? run.n : 0, game: run ? run.id : "", rt: run ? t - run.t0 : null, key, count: 1,
        };
        S.log.push(e);
        if (S.log.length > S.logMax) {
            let idx = S.log.findIndex((x) => x.cat === "input");
            if (idx < 0) idx = 0;
            S.log.splice(idx, 1);
        }
        if (lvl === "error" || lvl === "warn") {
            S.counts[lvl]++;
            if (run) {
                run[lvl === "error" ? "errors" : "warns"]++;
                res(run.id)[lvl === "error" ? "err" : "warn"]++;
                saveHistSoon();
            }
        }
        S.logVer++;
        S.dirty = true;
        return e;
    }

    /* ======================================================================
     * Persistenza (solo riepiloghi, mai il log)
     * ==================================================================== */
    let saveTimer = null;

    function saveHistSoon() {
        if (saveTimer) return;
        saveTimer = _st(() => {
            saveTimer = null;
            try {
                const out = {};
                for (const [id, r] of Object.entries(S.results)) {
                    if (!r.runs) continue;
                    out[id] = {runs: r.runs, natural: r.natural, err: r.err, warn: r.warn, maxSec: r.maxSec, when: Date.now()};
                }
                localStorage.setItem(LS_RESULTS, JSON.stringify(Object.assign({}, S.hist, out)));
            } catch (e) { /* storage non disponibile */ }
        }, 1200);
    }

    function loadPersisted() {
        try {
            S.hist = JSON.parse(localStorage.getItem(LS_RESULTS) || "{}") || {};
        } catch (e) {
            S.hist = {};
        }
        try {
            const u = JSON.parse(localStorage.getItem(LS_UI) || "null");
            if (u) {
                for (const k of ["tab", "collapsed", "hud", "autoscroll", "onlyRun", "hiddenCats"]) if (k in u) S.ui[k] = u[k];
                if (u.levels) Object.assign(S.ui.levels, u.levels);
            }
        } catch (e) { /* ignora */ }
    }

    function saveUi() {
        try {
            const {tab, collapsed, hud, autoscroll, onlyRun, hiddenCats, levels} = S.ui;
            localStorage.setItem(LS_UI, JSON.stringify({tab, collapsed, hud, autoscroll, onlyRun, hiddenCats, levels}));
        } catch (e) { /* ignora */ }
    }

    /* ======================================================================
     * Intercettazione: timer
     * ==================================================================== */
    const curRun = () => (S.run ? S.run.n : 0);
    const isInfraTimer = (rec) => /classList\.remove\("show"\)|done = true/.test(rec.src);

    window.setTimeout = function (fn, ms, ...args) {
        if (typeof fn !== "function") return _st(fn, ms, ...args);
        const rec = {kind: "timeout", ms: +ms || 0, at: now(), run: curRun(), src: fnSrc(fn)};
        const id = _st(function () {
            S.timeouts.delete(id);
            const r = S.run;
            if (r && r.n === rec.run && r.paused && !isInfraTimer(rec)) {
                log("timer", "warn", `timer di gioco scattato durante la pausa (${rec.ms} ms): ${rec.src}`);
            }
            return fn.apply(this, arguments);
        }, ms, ...args);
        S.timeouts.set(id, rec);
        return id;
    };
    window.clearTimeout = function (id) {
        S.timeouts.delete(id);
        S.intervals.delete(id);
        return _ct(id);
    };
    window.setInterval = function (fn, ms, ...args) {
        if (typeof fn !== "function") return _si(fn, ms, ...args);
        const rec = {kind: "interval", ms: +ms || 0, at: now(), run: curRun(), src: fnSrc(fn), fires: 0};
        const id = _si(function () {
            rec.fires++;
            return fn.apply(this, arguments);
        }, ms, ...args);
        S.intervals.set(id, rec);
        return id;
    };
    window.clearInterval = function (id) {
        S.intervals.delete(id);
        S.timeouts.delete(id);
        return _ci(id);
    };

    /* ======================================================================
     * Intercettazione: fetch + decodifica audio + sorgenti audio
     * ==================================================================== */
    const AUDIO_RE = /\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|#|$)/i;
    const isTracked = (u) => AUDIO_RE.test(u) || /\/sounds\//.test(u);
    const absUrl = (u) => {
        try {
            return new URL(u, location.href).href;
        } catch (e) {
            return u;
        }
    };
    const sampleRec = (url) => S.samples[url] || (S.samples[url] = {
        url, state: "—", http: null, ms: null, bytes: null, dur: null, ch: null, plays: 0, fallback: 0, fetches: 0,
    });
    const abUrl = new WeakMap();   // ArrayBuffer -> chiave del sample
    const bufMeta = new WeakMap(); // AudioBuffer -> {url}

    if (_fetchRaw) {
        window.fetch = function (input, init) {
            let url = "";
            try {
                url = typeof input === "string" ? input : (input && input.url) || String(input);
            } catch (e) { /* ignora */ }
            const p = _fetchRaw(input, init);
            if (!url || !isTracked(url)) return p;
            const t = now();
            S.urlKey.set(absUrl(url), url);
            const rec = sampleRec(url);
            rec.fetches++;
            rec.state = "in caricamento";
            p.then((r) => {
                rec.http = r.status;
                rec.ms = Math.round(now() - t);
                const len = +r.headers.get("content-length");
                if (len) rec.bytes = len;
                if (!r.ok) {
                    rec.state = "mancante";
                    log("audio", "warn", `file audio non trovato (HTTP ${r.status}): ${url}`);
                } else {
                    rec.state = "scaricato";
                }
            }, (err) => {
                rec.state = "errore rete";
                log("audio", "error", `fetch fallita: ${url} · ${err && err.message}`);
            });
            return p;
        };
        if (window.Response && Response.prototype.arrayBuffer) {
            const _ab = Response.prototype.arrayBuffer;
            Response.prototype.arrayBuffer = function () {
                const u = this.url;
                return _ab.call(this).then((buf) => {
                    const key = u && S.urlKey.get(u);
                    if (key) {
                        try {
                            abUrl.set(buf, key);
                        } catch (e) { /* ignora */ }
                        const rec = S.samples[key];
                        if (rec) rec.bytes = buf.byteLength;
                    }
                    return buf;
                });
            };
        }
    }

    const ACProto = (window.BaseAudioContext && BaseAudioContext.prototype)
        || (window.AudioContext && AudioContext.prototype)
        || (window.webkitAudioContext && webkitAudioContext.prototype);

    function onSourceStart(rec) {
        const run = S.run;
        const isBuf = rec.kind === "buffer";
        const name = shortUrl(rec.url);
        if (run) {
            run.audioStarts++;
            run.lastActivity = now();
            if (isBuf) {
                run.samples.add(name);
                res(run.id).samples.add(name);
                if (run.paused) log("audio", "warn", `suono avviato durante la pausa: ${name}`);
            } else {
                run.tones++;
            }
        } else if (isBuf && S.lastRun && S.lastRun.t1 && now() - S.lastRun.t1 < 10000) {
            log("audio", "warn", `campione audio avviato dopo l'uscita (partita #${S.lastRun.n}): ${name}`, null, {run: S.lastRun});
        }
        const sm = S.samples[rec.url];
        if (sm) sm.plays++;
        if (isBuf) log("audio", "info", `▶ ${name} (${rec.dur.toFixed(2)}s${rec.node.loop ? ", loop" : ""})`);
    }

    function wrapSource(method, kind) {
        const orig = ACProto && ACProto[method];
        if (typeof orig !== "function") return;
        ACProto[method] = function () {
            const node = orig.apply(this, arguments);
            try {
                const rec = {kind, node, run: curRun(), created: now(), started: null, url: "", dur: 0};
                S.audioStats[kind === "buffer" ? "bufferSources" : "oscillators"]++;
                const _start = node.start.bind(node);
                node.start = function () {
                    rec.started = now();
                    if (kind === "buffer" && node.buffer) {
                        const m = bufMeta.get(node.buffer);
                        rec.url = m ? m.url : "(buffer sintetico)";
                        rec.dur = node.buffer.duration;
                    }
                    S.audio.add(rec);
                    S.audioStats.started++;
                    node.addEventListener("ended", () => S.audio.delete(rec));
                    try {
                        onSourceStart(rec);
                    } catch (e) { /* il debug non deve mai rompere l'audio */ }
                    return _start.apply(null, arguments);
                };
            } catch (e) { /* ignora */ }
            return node;
        };
    }

    if (ACProto) {
        wrapSource("createBufferSource", "buffer");
        wrapSource("createOscillator", "osc");
        const dec = ACProto.decodeAudioData;
        if (typeof dec === "function") {
            ACProto.decodeAudioData = function (data, ok, fail) {
                const url = abUrl.get(data) || "";
                const t = now();
                const p = dec.call(this, data, ok, fail);
                if (p && typeof p.then === "function") {
                    p.then((buf) => {
                        if (!url) return;
                        bufMeta.set(buf, {url});
                        const rec = S.samples[url];
                        if (rec) {
                            rec.dur = buf.duration;
                            rec.ch = buf.numberOfChannels;
                            rec.state = "pronto";
                            rec.decodeMs = Math.round(now() - t);
                        }
                    }, (e) => {
                        const rec = S.samples[url];
                        if (rec) rec.state = "decodifica fallita";
                        log("audio", "warn", `decodifica audio fallita${url ? ": " + url : ""} · ${(e && e.message) || e}`);
                    });
                }
                return p;
            };
        }
    }

    /* ======================================================================
     * Intercettazione: voce (speechSynthesis)
     * ==================================================================== */
    if ("speechSynthesis" in window) {
        try {
            const ss = window.speechSynthesis;
            const _speak = ss.speak.bind(ss);
            ss.speak = function (u) {
                try {
                    S.speech.count++;
                    S.speech.last = u.text;
                    const run = S.run;
                    if (run) {
                        run.speech++;
                        run.lastActivity = now();
                    } else if (S.lastRun && S.lastRun.t1 && now() - S.lastRun.t1 < 10000) {
                        log("voce", "warn", `voce avviata dopo l'uscita (partita #${S.lastRun.n}): «${u.text}»`, null, {run: S.lastRun});
                    }
                    if (run && run.paused) log("voce", "warn", `voce avviata durante la pausa: «${u.text}»`);
                    log("voce", "info", `🗣 «${u.text}»`, {lang: u.lang, rate: u.rate, vol: u.volume});
                    u.addEventListener("error", (ev) => {
                        if (ev.error === "canceled" || ev.error === "interrupted") return;
                        S.speech.errors++;
                        log("voce", "warn", `errore sintesi vocale (${ev.error}): «${u.text}»`);
                    });
                } catch (e) { /* ignora */ }
                return _speak(u);
            };
        } catch (e) { /* alcuni browser non permettono di sovrascrivere */ }
    }

    /* ======================================================================
     * Intercettazione: console ed errori globali
     * ==================================================================== */
    console.warn = function (...args) {
        _con.warn(...args);
        try {
            const text = fmtArgs(args);
            if (/sintetico/i.test(text)) {
                const path = typeof args[1] === "string" ? args[1] : "";
                if (path) sampleRec(path).fallback++;
                const known = path && /mancante|errore|fallita/.test(sampleRec(path).state);
                log("audio", known ? "info" : "warn", `fallback al suono sintetico: ${path || text}`);
            } else {
                log("console", "warn", text);
            }
        } catch (e) { /* ignora */ }
    };
    console.error = function (...args) {
        _con.error(...args);
        try {
            log("console", "error", fmtArgs(args));
        } catch (e) { /* ignora */ }
    };
    window.addEventListener("error", (ev) => {
        try {
            if (ev.target && ev.target !== window && (ev.target.src || ev.target.href)) {
                log("sistema", "error", `risorsa non caricata: ${ev.target.src || ev.target.href}`);
                return;
            }
            const where = ev.filename ? ` (${ev.filename.split("/").pop()}:${ev.lineno}:${ev.colno})` : "";
            const stack = ev.error && ev.error.stack ? ev.error.stack.split("\n").slice(0, 4).join(" ⏎ ") : null;
            log("errore", "error", `${ev.message || "errore"}${where}`, stack);
        } catch (e) { /* ignora */ }
    }, true);
    window.addEventListener("unhandledrejection", (ev) => {
        try {
            const r = ev.reason;
            log("errore", "error", `promise rifiutata: ${(r && r.message) || r}`, r && r.stack ? r.stack.split("\n").slice(0, 4).join(" ⏎ ") : null);
        } catch (e) { /* ignora */ }
    });
    document.addEventListener("visibilitychange", () => {
        log("sistema", document.hidden ? "warn" : "info", document.hidden
            ? "scheda in background: timer e audio possono essere rallentati" : "scheda di nuovo in primo piano");
    });
    try {
        new PerformanceObserver((list) => {
            for (const en of list.getEntries()) {
                S.perf.longTasks++;
                S.perf.longTaskMax = Math.max(S.perf.longTaskMax, en.duration);
            }
        }).observe({entryTypes: ["longtask"]});
    } catch (e) { /* non supportato */ }

    /* ======================================================================
     * Ciclo di vita delle partite (chiamato da app.js)
     * ==================================================================== */
    const heapMb = () => (performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null);

    function gameStart(game, name) {
        if (S.run) {
            log("partita", "warn", `nuova partita avviata senza uscire dalla #${S.run.n} (${S.run.id})`);
            closeRun("sostituita");
        }
        const st = getState() || {};
        const run = {
            n: ++S.runSeq, id: game.id, name: name || gameName(game.id), mode: game.mode,
            players: st.players || 0, t0: now(), t1: null, how: null,
            paused: false, pauses: 0, finished: false, finishedAt: null,
            inputs: 0, ignored: 0, errors: 0, warns: 0, arenaChanges: 0, audioStarts: 0, tones: 0, speech: 0,
            samples: new Set(), lastActivity: now(), stallWarned: false, heap0: heapMb(), leaks: 0,
        };
        S.run = run;
        const r = res(run.id);
        r.runs++;
        S.lastArena = {msg: "", info: "", cls: ""};
        log("partita", "ok", `▶ AVVIO «${run.name}» (${run.id}) · ${run.players} giocatori · modalità ${run.mode}`);

        // controlli immediati sulla coerenza dell'avvio
        for (const m of ["setup", "start", "onInput", "dispose"]) {
            if (typeof game[m] !== "function") log("partita", "error", `l'oggetto gioco non ha il metodo ${m}()`);
        }
        const pb = $("#pause-button");
        if (pb && pb.disabled) log("partita", "warn", "il pulsante Pausa è ancora disabilitato all'avvio (rimasto da una partita precedente)");
        if (st.scores && Object.keys(st.scores).length !== run.players) {
            log("partita", "warn", `punteggi inizializzati per ${Object.keys(st.scores).length} giocatori invece di ${run.players}`);
        }
        const sel = $("#game-select");
        if (sel && sel.value !== game.id) log("partita", "warn", `il menu mostra «${sel.value}» ma parte «${game.id}»`);

        const n = run.n;
        _st(() => {
            const cur = S.run;
            if (!cur || cur.n !== n || cur.finished) return;
            const s2 = getState();
            if (s2 && s2.soundEnabled === false) return;
            if (cur.audioStarts + cur.speech === 0) {
                log("audio", "warn", "nessun suono né voce nei primi 4 secondi: audio bloccato o gioco fermo?");
            }
        }, 4000);
        S.dirty = true;
    }

    function pause(on) {
        const run = S.run;
        if (!run) return;
        run.paused = on;
        run.lastActivity = now();
        if (on) run.pauses++;
        log("partita", "info", on ? "⏸ pausa" : "▶ ripresa");
    }

    function gameFinish(message, ranking, announce) {
        const run = S.run;
        if (!run) return;
        run.finished = true;
        run.finishedAt = now();
        run.lastActivity = now();
        res(run.id).natural++;
        const st = getState() || {};
        log("partita", "ok", `🏁 FINE: ${message}`, {ranking, punteggi: st.scores});
        if (ranking == null) {
            log("partita", "info", "fine partita senza classifica (ranking nullo)");
        } else if (!Array.isArray(ranking)) {
            log("partita", "error", "ranking non è un array: " + safeJson(ranking));
        } else {
            const valid = ["P1", "P2", "P3", "P4"].slice(0, run.players);
            const bad = ranking.filter((x) => !valid.includes(x));
            if (bad.length) log("partita", "error", `ranking contiene giocatori non validi: ${safeJson(bad)}`);
            if (new Set(ranking).size !== ranking.length) log("partita", "warn", "ranking con giocatori duplicati: " + safeJson(ranking));
            if (!ranking.length) log("partita", "warn", "ranking vuoto: nessun vincitore dichiarato");
        }
        saveHistSoon();
    }

    function finishIgnored(message, noGame) {
        log("partita", "info", `finish() ignorata (${noGame ? "nessuna partita attiva" : "già terminata"}): ${message}`);
    }

    function closeRun(how) {
        const run = S.run;
        if (!run) return;
        run.t1 = now();
        run.how = how;
        const sec = (run.t1 - run.t0) / 1000;
        const r = res(run.id);
        r.maxSec = Math.max(r.maxSec, sec);
        r.inputs += run.inputs;
        r.last = run;
        const h1 = heapMb();
        if (h1 != null && run.heap0 != null && h1 - run.heap0 > 40) {
            log("sistema", "warn", `memoria cresciuta di ${(h1 - run.heap0).toFixed(0)} MB durante la partita (possibile perdita)`, null, {run});
        }
        if (!run.arenaChanges && sec > 2) log("partita", "warn", "l'arena non è mai cambiata durante la partita", null, {run});
        log("partita", run.errors ? "error" : "ok",
            `■ ${how.toUpperCase()} dopo ${sec.toFixed(1)}s · input ${run.inputs} · suoni ${run.samples.size} · ❌${run.errors} ⚠️${run.warns}`, null, {run});
        S.lastRun = run;
        S.run = null;
        S.watchFn = null;
        saveHistSoon();
        const snap = run;
        _st(() => postExitCheck(snap), LEAK_CHECK_MS);
    }

    function gameEnd(how) {
        if (!S.run) return;
        closeRun(how || "uscita");
        // ripristino UI
        const sp = $("#setup-panel"), gp = $("#game-panel");
        if (sp && sp.hidden) log("partita", "error", "uscita: il menu iniziale non è tornato visibile");
        if (gp && !gp.hidden) log("partita", "error", "uscita: il pannello di gioco è ancora visibile");
    }

    function postExitCheck(run) {
        const st = getState() || {};
        const suspended = st.audioState && st.audioState !== "running";
        let problems = 0;
        const warn = (cat, msg) => {
            problems++;
            run.leaks++;
            log(cat, "warn", msg, null, {run});
        };
        for (const rec of S.intervals.values()) {
            if (rec.run === run.n) warn("timer", `setInterval ancora attivo dopo l'uscita (ogni ${rec.ms} ms, ${rec.fires} esecuzioni): ${rec.src}`);
        }
        if (!suspended) {
            for (const rec of S.audio) {
                if (rec.run !== run.n) continue;
                const name = rec.kind === "buffer" ? shortUrl(rec.url) : "oscillatore";
                const loop = rec.kind === "buffer" && rec.node.loop;
                const left = rec.dur ? rec.dur * 1000 - (now() - rec.started) : null;
                if (loop) warn("audio", `suono in loop ancora attivo dopo l'uscita: ${name}`);
                else if (rec.kind === "osc") warn("audio", "oscillatore ancora attivo dopo l'uscita");
                else if (left != null && left > 0) log("audio", "info", `campione ancora in riproduzione dopo l'uscita: ${name} (${(left / 1000).toFixed(1)}s rimanenti)`, null, {run});
                else warn("audio", `sorgente audio mai terminata dopo l'uscita: ${name}`);
            }
        }
        // Questi stati sono globali: se nel frattempo è partita un'altra partita non si possono attribuire a questa.
        if (S.run) {
            log("partita", "info", `controllo parziale per la #${run.n}: nel frattempo è partita la #${S.run.n}`, null, {run});
        } else {
            if (st.natureActive) warn("audio", "il sottofondo «natura» è ancora attivo dopo l'uscita");
            if (st.fallActive) warn("audio", "il suono di caduta è ancora attivo dopo l'uscita");
            if (st.timerActive) warn("timer", "il timer principale (later) è ancora attivo dopo l'uscita");
            if ("speechSynthesis" in window && (speechSynthesis.speaking || speechSynthesis.pending)) {
                warn("voce", "la sintesi vocale sta ancora parlando dopo l'uscita");
            }
        }
        let pend = 0, longest = 0;
        for (const rec of S.timeouts.values()) {
            if (rec.run !== run.n) continue;
            pend++;
            longest = Math.max(longest, rec.ms - (now() - rec.at));
        }
        if (pend) log("timer", "info", `${pend} timeout della partita ancora in sospeso (il più lungo scade tra ${(Math.max(0, longest) / 1000).toFixed(1)}s)`, null, {run});
        if (!problems) log("partita", "ok", `uscita pulita dalla #${run.n}: nessuna risorsa residua`, null, {run});
    }

    function onInput(ev, route, ms) {
        const run = S.run;
        const bot = S.botDispatch;
        const src = ev.source + (bot ? " (bot)" : "");
        S.input.last = {button: ev.button, type: ev.type, src, at: now(), route};
        if (ev.type === "down") {
            S.heldAt[ev.button] = now();
            S.input.total++;
            S.input.bySource[src] = (S.input.bySource[src] || 0) + 1;
            if (route.startsWith("ignorato")) {
                S.input.ignored++;
                if (run) run.ignored++;
            } else if (run && route === "→ gioco") {
                run.inputs++;
            }
            if (run) run.lastActivity = now();
        }
        if (typeof ms === "number") {
            S.input.handlerSum += ms;
            S.input.handlerN++;
            S.input.handlerMax = Math.max(S.input.handlerMax, ms);
            if (ms > 25) log("input", "warn", `onInput lento: ${ms.toFixed(1)} ms (${ev.button} ${ev.type})`);
        }
        if (bot) return;
        let extra = "";
        if (ev.type === "up" && S.heldAt[ev.button]) {
            extra = ` dopo ${Math.round(now() - S.heldAt[ev.button])} ms`;
            delete S.heldAt[ev.button];
        }
        log("input", "info", `${ev.type === "down" ? "▼" : "▲"} ${ev.button} [${src}] ${route}${extra}`);
    }

    /* ======================================================================
     * Osservatori DOM (arena, stato, punteggi, toast)
     * ==================================================================== */
    function watchDom() {
        const arena = $("#arena");
        const touch = () => {
            if (S.run) S.run.lastActivity = now();
        };
        if (arena) {
            new MutationObserver(() => {
                const msg = ($("#arena-message") || {}).textContent || "";
                const info = ($("#live-info") || {}).textContent || "";
                const cls = arena.className.replace(/^arena\s*/, "");
                const last = S.lastArena;
                touch();
                if (msg === last.msg && cls === last.cls) {
                    last.info = info;
                    return;
                }
                const run = S.run;
                if (run) {
                    run.arenaChanges++;
                    if (run.paused && !msg.startsWith("⏸")) log("arena", "warn", `l'arena è cambiata durante la pausa: «${msg}»`);
                } else if (msg !== "Premi Inizia" && msg !== "Premi Inizia ") {
                    log("arena", "warn", `l'arena è cambiata a partita chiusa: «${msg}»`);
                }
                S.lastArena = {msg, info, cls};
                log("arena", "info", `«${msg}»${info ? " · " + info : ""}${cls ? " [" + cls + "]" : ""}`);
            }).observe(arena, {childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"]});
        }
        const status = $("#game-status");
        if (status) {
            new MutationObserver(() => {
                const t = status.textContent;
                touch();
                if (t === S.lastStatus) return;
                S.lastStatus = t;
                log("arena", "info", `stato: ${t}`);
            }).observe(status, {childList: true, characterData: true, subtree: true});
        }
        const scoresEl = $("#scores");
        if (scoresEl) {
            new MutationObserver(() => {
                const vals = [...scoresEl.querySelectorAll(".score-card")].map((c) => [
                    (c.querySelector(".score-name") || {}).textContent, (c.querySelector(".score-value") || {}).textContent]);
                const text = vals.map((v) => v.join("=")).join(" ");
                touch();
                if (text === S.lastScores) return;
                S.lastScores = text;
                for (const [name, v] of vals) {
                    // alcuni giochi mostrano testo al posto del numero (PRESTO, OUT, ♥♥♥, 0.0s): è normale
                    if (v === "NaN" || v === "undefined" || v === "null" || v === "" || v === "Infinity" || v === "-Infinity") {
                        log("punteggio", "error", `punteggio non valido per ${name}: «${v}»`);
                    }
                }
                log("punteggio", "info", text);
            }).observe(scoresEl, {childList: true, characterData: true, subtree: true});
        }
        const toastEl = $("#toast");
        if (toastEl) {
            new MutationObserver(() => {
                if (toastEl.textContent) log("arena", "info", `toast: ${toastEl.textContent}`);
            }).observe(toastEl, {childList: true, characterData: true, subtree: true});
        }
        const simon = $("#simon-feedback");
        if (simon) {
            new MutationObserver(() => {
                if (simon.textContent) log("arena", "info", `feedback: ${simon.textContent}`);
            }).observe(simon, {childList: true, characterData: true, subtree: true});
        }
    }

    /* ======================================================================
     * Watchdog periodico
     * ==================================================================== */
    function watchdog() {
        const st = getState();
        const run = S.run;
        // stato AudioContext
        const as = st ? st.audioState : null;
        if (as && as !== S.lastAudioState) {
            const bad = as !== "running" && as !== "non creato";
            log("audio", bad && run ? "warn" : "info", `AudioContext: ${as}${bad && run ? " (serve un tocco per sbloccare l'audio?)" : ""}`);
            S.lastAudioState = as;
        }
        if (!run || !st) return;
        // coerenza UI
        const sp = $("#setup-panel"), gp = $("#game-panel");
        if (sp && !sp.hidden && gp && gp.hidden) log("partita", "error", "UI incoerente: partita attiva ma il menu iniziale è visibile");
        if (st.game && st.game.id !== run.id) log("partita", "error", `il debug segue «${run.id}» ma l'app esegue «${st.game.id}»`);
        // punteggi
        if (st.scores) {
            for (const [k, v] of Object.entries(st.scores)) {
                if (typeof v !== "number" || !Number.isFinite(v)) log("punteggio", "error", `punteggio interno non valido: ${k} = ${String(v)}`);
            }
        }
        // possibile blocco
        if (!run.finished && !run.paused) {
            const idle = now() - run.lastActivity;
            let pending = st.timerActive ? 1 : 0;
            for (const r of S.timeouts.values()) if (r.run === run.n) pending++;
            for (const r of S.intervals.values()) if (r.run === run.n) pending++;
            const audioOn = [...S.audio].some((r) => r.run === run.n);
            const talking = "speechSynthesis" in window && (speechSynthesis.speaking || speechSynthesis.pending);
            if (idle > STALL_MS && !pending && !audioOn && !talking) {
                if (!run.stallWarned) {
                    run.stallWarned = true;
                    log("partita", "warn", `possibile blocco: nessuna attività, timer o suono da ${Math.round(idle / 1000)}s (se il gioco aspetta un input è normale)`);
                }
            } else if (idle < 2000) {
                run.stallWarned = false;
            }
        }
    }

    let lagLast = now();

    function lagTick() {
        const t = now();
        const lag = Math.max(0, t - lagLast - 200);
        lagLast = t;
        if (document.hidden) return;
        S.perf.lag = lag;
        S.perf.lagWindow.push([t, lag]);
        while (S.perf.lagWindow.length && t - S.perf.lagWindow[0][0] > 10000) S.perf.lagWindow.shift();
        S.perf.lagMax = Math.max(S.perf.lagMax, lag);
        if (lag > 150 && S.run) log("sistema", "warn", `event loop bloccato per circa ${Math.round(lag)} ms: i tempi di reazione possono falsarsi`);
        const h = heapMb();
        if (h != null) S.perf.heap = h;
    }

    /* ======================================================================
     * Bot e collaudo automatico
     * ==================================================================== */
    const botOn = () => S.bot.manual || (S.suite && S.suite.running);

    function press(id, hold) {
        const key = KEYS[id];
        S.botDispatch = true;
        try {
            document.dispatchEvent(new KeyboardEvent("keydown", {key, bubbles: true, cancelable: true}));
        } finally {
            S.botDispatch = false;
        }
        S.bot.presses++;
        _st(() => {
            S.botDispatch = true;
            try {
                document.dispatchEvent(new KeyboardEvent("keyup", {key, bubbles: true}));
            } finally {
                S.botDispatch = false;
            }
        }, hold);
    }

    function botStep() {
        S.bot.timer = null;
        if (!botOn()) return;
        const st = getState();
        const speed = ($("#dbg-bot-speed") || {}).value || "medium";
        const [lo, hi] = {slow: [600, 1500], medium: [250, 800], fast: [60, 300]}[speed] || [250, 800];
        const useC = !$("#dbg-suite-c") || $("#dbg-suite-c").checked;
        if (st && st.game) {
            if (st.paused) {
                if (Math.random() < 0.5) press("C", 60);
            } else if (!st.game.finished) {
                const ids = ["P1", "P2", "P3", "P4"].slice(0, st.players || 4);
                const id = useC && Math.random() < 0.04 ? "C" : ids[Math.floor(Math.random() * ids.length)];
                const hold = Math.random() < 0.25 ? rnd(500, 2500) : rnd(40, 250);
                press(id, hold);
            }
        }
        S.bot.timer = _st(botStep, rnd(lo, hi));
    }

    function botSync() {
        if (botOn() && !S.bot.timer) S.bot.timer = _st(botStep, 300);
        if (!botOn() && S.bot.timer) {
            _ct(S.bot.timer);
            S.bot.timer = null;
        }
        S.dirty = true;
    }

    async function waitFor(cond, maxMs, step = 150) {
        const t = now();
        while (now() - t < maxMs) {
            if (cond()) return true;
            await sleep(step);
        }
        return false;
    }

    function setSelect(sel, value) {
        sel.value = value;
        sel.dispatchEvent(new Event("change", {bubbles: true}));
    }

    async function runSuite() {
        if (S.suite && S.suite.running) return;
        const ids = [...root.querySelectorAll("#dbg-suite-games input:checked")].map((i) => i.value);
        if (!ids.length) return;
        const pv = $("#dbg-suite-players").value;
        const plist = pv === "all" ? [2, 3, 4] : [Number(pv)];
        const dur = clamp(Number($("#dbg-suite-dur").value) || 20, 5, 300) * 1000;
        const tasks = [];
        for (const gid of ids) for (const p of plist) tasks.push({gid, p});
        const suite = S.suite = {running: true, abort: false, tasks, i: 0, rows: [], t0: now(), dur, current: null, startedAt: Date.now()};
        log("sistema", "ok", `🤖 COLLAUDO avviato: ${tasks.length} prove da ${dur / 1000}s`);
        botSync();
        const sel = $("#game-select"), pc = $("#player-count");
        try {
            for (; suite.i < tasks.length && !suite.abort; suite.i++) {
                const {gid, p} = tasks[suite.i];
                if (S.run) {
                    $("#exit-button").click();
                    await sleep(LEAK_CHECK_MS + 500);
                }
                setSelect(pc, String(p));
                setSelect(sel, gid);
                $("#start-button").click();
                await sleep(200);
                const run = S.run;
                if (!run) {
                    log("sistema", "error", `collaudo: «${gid}» non è partito`);
                    suite.rows.push({gid, p, status: "non avviato", sec: 0, inputs: 0, err: 1, warn: 0, natural: false});
                    continue;
                }
                suite.current = run;
                await waitFor(() => suite.abort || !S.run || S.run.n !== run.n || now() - run.t0 >= dur || (run.finished && now() - run.finishedAt > 2500), dur + 5000, 200);
                const natural = run.finished;
                if (S.run && S.run.n === run.n) $("#exit-button").click();
                await sleep(LEAK_CHECK_MS + 500);
                suite.current = null;
                const sec = ((run.t1 || now()) - run.t0) / 1000;
                suite.rows.push({
                    gid, p, sec, inputs: run.inputs, err: run.errors, warn: run.warns, natural, leaks: run.leaks,
                    samples: run.samples.size, status: run.errors ? "errori" : run.warns ? "avvisi" : "ok",
                });
            }
        } catch (e) {
            log("errore", "error", `collaudo interrotto da un'eccezione: ${e && e.message}`);
        }
        suite.running = false;
        if (S.run) $("#exit-button").click();
        botSync();
        const bad = suite.rows.filter((r) => r.status !== "ok").length;
        log("sistema", bad ? "warn" : "ok", `🤖 COLLAUDO ${suite.abort ? "interrotto" : "terminato"}: ${suite.rows.length} prove, ${bad} con problemi`);
        S.dirty = true;
    }

    /* ======================================================================
     * Verifica asset
     * ==================================================================== */
    async function checkAssets() {
        if (!_fetchRaw) return;
        const chk = S.assetCheck = {running: true, rows: [], dirs: [], note: ""};
        S.dirty = true;
        let text = "";
        try {
            const r = await _fetchRaw("./src/app.js", {cache: "no-store"});
            text = await r.text();
        } catch (e) {
            chk.note = "Impossibile leggere app.js per estrarre l'elenco dei file (apertura da file://?).";
        }
        const files = new Set(["manifest.webmanifest", "assets/icon.svg", "src/style.css", "src/controller-ble.js", "src/app.js", "src/debug.js", "sw.js"]);
        const dirs = new Set();
        for (const m of text.matchAll(/["'`](assets\/[^"'`$\s]+?\.(?:mp3|wav|ogg|m4a|svg|png|jpg|webp|json))["'`]/g)) files.add(m[1]);
        for (const m of text.matchAll(/["'](assets\/[^"'`$\s]+\/)["']/g)) dirs.add(m[1]);
        chk.dirs = [...dirs];
        const list = [...files];
        let idx = 0;
        const worker = async () => {
            while (idx < list.length) {
                const path = list[idx++];
                const row = {path, http: null, type: "", size: null, ok: false, note: ""};
                try {
                    let r = await _fetchRaw(path, {method: "HEAD", cache: "no-store"});
                    if (r.status === 405 || r.status === 501) r = await _fetchRaw(path, {cache: "no-store"});
                    row.http = r.status;
                    row.ok = r.ok;
                    row.type = r.headers.get("content-type") || "";
                    row.size = +r.headers.get("content-length") || null;
                    if (r.ok && /\.(mp3|wav|ogg|m4a)$/i.test(path) && /text\/html/i.test(row.type)) {
                        row.ok = false;
                        row.note = "risponde HTML (fallback del server?)";
                    }
                } catch (e) {
                    row.note = e.message;
                }
                chk.rows.push(row);
                S.dirty = true;
            }
        };
        await Promise.all([worker(), worker(), worker(), worker()]);
        chk.rows.sort((a, b) => (a.ok - b.ok) || a.path.localeCompare(b.path));
        chk.running = false;
        const miss = chk.rows.filter((r) => !r.ok).length;
        log("sistema", miss ? "warn" : "ok", `verifica asset: ${chk.rows.length} file controllati, ${miss} mancanti o non validi`);
        S.dirty = true;
    }

    /* ======================================================================
     * Ambiente
     * ==================================================================== */
    function collectEnv() {
        const n = navigator;
        S.env = {
            "User agent": n.userAgent,
            "Lingua": n.language,
            "Finestra": `${innerWidth}×${innerHeight} @${devicePixelRatio}x`,
            "Contesto sicuro (https)": String(window.isSecureContext),
            "Protocollo": location.protocol,
            "Online": String(n.onLine),
            "CPU logiche": n.hardwareConcurrency || "n/d",
            "Memoria dispositivo": n.deviceMemory ? n.deviceMemory + " GB" : "n/d",
            "Web Audio": String(!!(window.AudioContext || window.webkitAudioContext)),
            "Sintesi vocale": String("speechSynthesis" in window),
            "Web Bluetooth": String(!!n.bluetooth),
            "Vibrazione": String(!!n.vibrate),
            "Service worker": "serviceWorker" in n ? "supportato" : "no",
        };
        if (n.serviceWorker && n.serviceWorker.getRegistrations) {
            n.serviceWorker.getRegistrations().then((regs) => {
                S.env["Service worker"] = regs.length
                    ? `registrato (${regs.map((r) => (r.active ? "attivo" : r.installing ? "in installazione" : r.waiting ? "in attesa" : "?")).join(", ")})${n.serviceWorker.controller ? ", controlla la pagina" : ", NON controlla la pagina"}`
                    : "non registrato";
                S.dirty = true;
            }).catch(() => {});
        }
        if (window.caches && caches.keys) {
            caches.keys().then((k) => {
                S.env["Cache offline"] = k.length ? k.join(", ") : "vuota";
                S.dirty = true;
            }).catch(() => {});
        }
        if (n.storage && n.storage.estimate) {
            n.storage.estimate().then((e) => {
                S.env["Archiviazione"] = `${((e.usage || 0) / 1048576).toFixed(1)} MB usati`;
                S.dirty = true;
            }).catch(() => {});
        }
    }

    /* ======================================================================
     * Stato dei giochi
     * ==================================================================== */
    function gameStatus(id) {
        const r = S.results[id];
        const run = S.run && S.run.id === id ? S.run : null;
        const h = S.hist[id];
        const src = r && r.runs ? r : null;
        if (!src && !h) return {icon: "⬜", cls: "dbg-muted", txt: "non provato", level: 0};
        const s = src || h;
        const prev = src ? "" : " (sessione prec.)";
        const liveSec = run ? (now() - run.t0) / 1000 : 0;
        const maxSec = Math.max(s.maxSec || 0, liveSec);
        if (s.err > 0) return {icon: "❌", cls: "dbg-err", txt: "errori" + prev, level: 3};
        if (s.warn > 0) return {icon: "⚠️", cls: "dbg-warn", txt: "avvisi" + prev, level: 2};
        if (run && !run.finished) return {icon: "▶", cls: "dbg-info", txt: "in corso", level: 1};
        if (s.natural > 0 || maxSec >= MIN_OK_SEC) return {icon: "✅", cls: "dbg-ok", txt: "ok" + prev, level: 1};
        return {icon: "⏱", cls: "dbg-muted", txt: "prova troppo breve" + prev, level: 0};
    }

    /* ======================================================================
     * Rendering
     * ==================================================================== */
    const kv = (rows) => "<dl class=\"dbg-kv\">" + rows.map(([k, v, cls]) =>
        `<dt>${esc(k)}</dt><dd${cls ? ` class="${cls}"` : ""}>${v && v.html !== undefined ? v.html : esc(v == null ? "—" : v)}</dd>`).join("") + "</dl>";
    const card = (title, body) => `<section class="dbg-card"><h4>${esc(title)}</h4>${body}</section>`;

    function logLine(e) {
        const t = e.run ? `#${e.run} +${(e.rt / 1000).toFixed(2)}s` : `${((e.t - T0) / 1000).toFixed(2)}s`;
        const icon = e.lvl === "error" ? "❌ " : e.lvl === "warn" ? "⚠️ " : "";
        const cnt = e.count > 1 ? ` <span class="n">×${e.count}</span>` : "";
        const d = e.data ? ` <span class="d">${esc(typeof e.data === "string" ? e.data : safeJson(e.data, 220))}</span>` : "";
        return `<div class="dbg-line ${e.lvl}"><span class="t">${esc(t)}</span><span class="c">${esc(e.cat)}</span><span class="m">${icon}${esc(e.msg)}${cnt}${d}</span></div>`;
    }

    function renderLive() {
        const st = getState();
        const run = S.run;
        const live = run || S.lastRun;
        const elapsed = live ? ((run ? now() : live.t1) - live.t0) : 0;
        let phase = "⚪ nessuna partita";
        let phaseCls = "dbg-muted";
        if (run) {
            if (run.finished) [phase, phaseCls] = ["🏁 terminata (premi Esci)", "dbg-ok"];
            else if (run.paused) [phase, phaseCls] = ["⏸ in pausa", "dbg-warn"];
            else [phase, phaseCls] = ["🟢 in corso", "dbg-ok"];
        }
        const arenaMsg = ($("#arena-message") || {}).textContent || "";
        const arenaInfo = ($("#live-info") || {}).textContent || "";
        const gstatus = ($("#game-status") || {}).textContent || "";
        const idle = run ? (now() - run.lastActivity) / 1000 : 0;
        let watch = "";
        if (run && S.watchFn) {
            try {
                watch = JSON.stringify(S.watchFn(), null, 1);
            } catch (e) {
                watch = "errore: " + e.message;
            }
        }
        const myTimeouts = [...S.timeouts.values()].filter((r) => run && r.run === run.n);
        const myIntervals = [...S.intervals.values()].filter((r) => run && r.run === run.n);
        const loops = [...S.audio].filter((r) => r.kind === "buffer" && r.node.loop).length;
        const speechOn = "speechSynthesis" in window && (speechSynthesis.speaking || speechSynthesis.pending);
        const ac = st || {};
        const lag10 = S.perf.lagWindow.reduce((m, x) => Math.max(m, x[1]), 0);
        const ib = S.input;
        const recent = S.log.filter((e) => e.lvl === "error" || e.lvl === "warn").slice(-5).reverse();

        const partita = card("Partita", kv([
            ["Gioco", live ? `${live.name} (${live.id})` : "—"],
            ["Stato", phase, phaseCls],
            ["Prova n°", live ? `#${live.n} · ${live.players} giocatori · ${live.mode}` : "—"],
            ["Tempo", live ? mmss(elapsed) + ` (${(elapsed / 1000).toFixed(1)}s)` : "—"],
            ["Inattività", run ? idle.toFixed(1) + "s" : "—", idle > 15 ? "dbg-warn" : ""],
            ["Etichetta stato", gstatus || "—"],
            ["Arena", arenaMsg || "—"],
            ["Info live", arenaInfo || "—"],
            ["Punteggi", ac.scores ? safeJson(ac.scores) : "—"],
            ["Cambi arena", live ? live.arenaChanges : "—"],
            ["Pause fatte", live ? live.pauses : "—"],
            ["Errori / avvisi", live ? H(`<span class="dbg-err">${live.errors}</span> / <span class="dbg-warn">${live.warns}</span>`) : "—"],
        ]) + (watch ? `<pre class="dbg-pre">${esc(watch)}</pre>` : "")
            + (run && !S.watchFn ? "<p class=\"dbg-muted\">Stato interno del gioco non esposto. Vedi BPDebug.watch() nel README del pannello.</p>" : ""));

        const input = card("Input", kv([
            ["Premuti ora", ac.held && ac.held.length ? ac.held.join(", ") : "nessuno"],
            ["Ultimo input", ib.last ? `${ib.last.button} ${ib.last.type} [${ib.last.src}] ${ib.last.route} (${((now() - ib.last.at) / 1000).toFixed(1)}s fa)` : "—"],
            ["Input totali / ignorati", `${ib.total} / ${ib.ignored}`],
            ["onInput medio / max", ib.handlerN ? `${(ib.handlerSum / ib.handlerN).toFixed(2)} / ${ib.handlerMax.toFixed(1)} ms` : "—", ib.handlerMax > 25 ? "dbg-warn" : ""],
            ["Per sorgente", Object.keys(ib.bySource).length ? safeJson(ib.bySource) : "—"],
            ["Bot", botOn() ? `attivo · ${S.bot.presses} pressioni` : "spento"],
            ["Controller BLE", ($("#ble-status") || {}).textContent || "—"],
        ]));

        const resCard = card("Timer e risorse", kv([
            ["Timer principale (later)", ac.timerActive ? "attivo" : "fermo"],
            ["Timeout della partita", run ? myTimeouts.length : "—"],
            ["Intervalli della partita", run ? (myIntervals.length ? myIntervals.map((r) => r.ms + "ms").join(", ") : "0") : "—"],
            ["Timeout / intervalli totali", `${S.timeouts.size} / ${S.intervals.size}`],
            ["AudioContext", ac.audioState || "—", ac.audioState && ac.audioState !== "running" && ac.audioState !== "non creato" ? "dbg-warn" : ""],
            ["Latenza audio", ac.baseLatency != null ? `base ${(ac.baseLatency * 1000).toFixed(0)} ms · out ${((ac.outputLatency || 0) * 1000).toFixed(0)} ms` : "—"],
            ["Sorgenti audio attive", `${S.audio.size} (loop ${loops})`],
            ["Sottofondo natura / caduta", `${ac.natureActive ? "attivo" : "no"} / ${ac.fallActive ? "attivo" : "no"}`],
            ["Audio abilitato", ac.soundEnabled === false ? "NO (disattivato)" : "sì", ac.soundEnabled === false ? "dbg-warn" : ""],
            ["Sorgenti create", `${S.audioStats.bufferSources} sample · ${S.audioStats.oscillators} toni`],
            ["Voce", speechOn ? "sta parlando" : "ferma"],
            ["Ultima frase", S.speech.last ? `«${S.speech.last}»` : "—"],
        ]));

        const perf = card("Prestazioni", kv([
            ["Ritardo event loop", `${S.perf.lag.toFixed(0)} ms (max 10s: ${lag10.toFixed(0)} · sessione: ${S.perf.lagMax.toFixed(0)})`, lag10 > 150 ? "dbg-warn" : ""],
            ["Long task", `${S.perf.longTasks} (max ${S.perf.longTaskMax.toFixed(0)} ms)`],
            ["Memoria JS", S.perf.heap != null ? S.perf.heap.toFixed(1) + " MB" : "n/d (solo Chrome)"],
            ["Scheda", document.hidden ? "in background" : "visibile", document.hidden ? "dbg-warn" : ""],
        ]));

        const anomalies = card("Ultime anomalie", recent.length
            ? recent.map((e) => `<p class="${e.lvl === "error" ? "dbg-err" : "dbg-warn"}">${e.lvl === "error" ? "❌" : "⚠️"} ${esc(e.msg)}${e.count > 1 ? ` ×${e.count}` : ""}</p>`).join("")
            : "<p class=\"dbg-ok\">Nessuna anomalia registrata.</p>");

        return `<div class="dbg-grid">${partita}${input}${resCard}${perf}${anomalies}</div>`;
    }

    function renderGames() {
        const list = gameList();
        const rows = list.map(([id, label]) => {
            const stt = gameStatus(id);
            const r = S.results[id];
            const h = S.hist[id];
            const s = r && r.runs ? r : (h || {});
            const cls = stt.level === 3 ? "bad" : stt.level === 2 ? "meh" : "";
            return `<tr class="${cls}"><td class="${stt.cls}">${stt.icon} ${esc(stt.txt)}</td><td>${esc(label)}</td>`
                + `<td class="num">${s.runs || 0}</td><td class="num">${s.natural || 0}</td>`
                + `<td class="num dbg-err">${s.err || 0}</td><td class="num dbg-warn">${s.warn || 0}</td>`
                + `<td class="num">${r ? r.inputs : "—"}</td><td class="num">${r ? r.samples.size : "—"}</td>`
                + `<td class="num">${s.maxSec ? s.maxSec.toFixed(0) + "s" : "—"}</td>`
                + `<td><button class="dbg-btn" data-act="play" data-game="${esc(id)}">▶ Prova</button></td></tr>`;
        }).join("");
        const sts = list.map(([id]) => gameStatus(id));
        const n = (lvlIcon) => sts.filter((x) => x.icon === lvlIcon).length;
        const summary = `<p>✅ ${n("✅")} ok · ⚠️ ${n("⚠️")} con avvisi · ❌ ${n("❌")} con errori · ⏱ ${n("⏱")} troppo brevi · ⬜ ${n("⬜")} non provati (su ${list.length})</p>`
            + "<p class=\"dbg-muted\">Un gioco è «ok» se è stato provato almeno " + MIN_OK_SEC + " secondi (o è finito da solo) senza errori né avvisi. Usa il Collaudo per provarli tutti.</p>";
        return card("Stato dei minigiochi", summary + `<div class="dbg-scroll"><table class="dbg-table"><thead><tr><th>Esito</th><th>Gioco</th>`
            + `<th class="num">Avvii</th><th class="num">Finiti</th><th class="num">Err</th><th class="num">Avv</th><th class="num">Input</th><th class="num">Suoni</th><th class="num">Max</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
            + `<div class="dbg-row"><button class="dbg-btn" data-act="reset-results">Azzera risultati</button></div>`);
    }

    function renderAudio() {
        const recs = Object.values(S.samples).sort((a, b) => {
            const bad = (x) => (/mancante|errore|fallita/.test(x.state) ? 0 : x.fallback ? 1 : 2);
            return bad(a) - bad(b) || a.url.localeCompare(b.url);
        });
        const rows = recs.map((r) => {
            const bad = /mancante|errore|fallita/.test(r.state) || r.fallback;
            return `<tr class="${bad ? "bad" : ""}"><td>${esc(shortUrl(r.url))}</td><td class="${bad ? "dbg-err" : "dbg-ok"}">${esc(r.state)}</td>`
                + `<td class="num">${r.http ?? "—"}</td><td class="num">${r.bytes ? (r.bytes / 1024).toFixed(0) + " KB" : "—"}</td>`
                + `<td class="num">${r.dur != null ? r.dur.toFixed(2) + "s" : "—"}</td><td class="num">${r.plays}</td><td class="num">${r.fallback || 0}</td></tr>`;
        }).join("");
        const samples = card("Campioni audio caricati in questa sessione", recs.length
            ? `<div class="dbg-scroll"><table class="dbg-table"><thead><tr><th>File</th><th>Stato</th><th class="num">HTTP</th><th class="num">Peso</th><th class="num">Durata</th><th class="num">Riprodotto</th><th class="num">Fallback</th></tr></thead><tbody>${rows}</tbody></table></div>`
            + "<p class=\"dbg-muted\">«Fallback» = il gioco ha usato un suono sintetico perché il file non c'è o non si decodifica. Si riempie mentre giochi: un sample compare solo quando un gioco lo richiede.</p>"
            : "<p class=\"dbg-muted\">Nessun campione ancora richiesto. Avvia un gioco o il collaudo.</p>");

        const chk = S.assetCheck;
        let assets = "<div class=\"dbg-row\"><button class=\"dbg-btn primary\" data-act=\"assets-check\">🔎 Verifica file e asset</button></div>"
            + "<p class=\"dbg-muted\">Legge app.js, estrae tutti i percorsi nominati e controlla che il server li serva.</p>";
        if (chk) {
            const miss = chk.rows.filter((r) => !r.ok);
            assets += `<p>${chk.running ? "⏳ controllo in corso… " : ""}${chk.rows.length} file controllati · <span class="${miss.length ? "dbg-err" : "dbg-ok"}">${miss.length} mancanti o non validi</span></p>`;
            if (chk.note) assets += `<p class="dbg-warn">${esc(chk.note)}</p>`;
            if (chk.rows.length) {
                assets += `<div class="dbg-scroll"><table class="dbg-table"><thead><tr><th>Percorso</th><th class="num">HTTP</th><th>Tipo</th><th class="num">Peso</th><th>Nota</th></tr></thead><tbody>`
                    + chk.rows.map((r) => `<tr class="${r.ok ? "" : "bad"}"><td>${esc(r.path)}</td><td class="num ${r.ok ? "dbg-ok" : "dbg-err"}">${r.http ?? "ERR"}</td><td>${esc(r.type)}</td><td class="num">${r.size ? (r.size / 1024).toFixed(0) + " KB" : "—"}</td><td>${esc(r.note)}</td></tr>`).join("")
                    + "</tbody></table></div>";
            }
            if (chk.dirs.length) assets += `<p class="dbg-muted">Cartelle con nomi file costruiti a runtime (non verificabili in anticipo, li controlla il log «audio» durante le partite): ${esc(chk.dirs.join(", "))}</p>`;
        }
        let voices = "<p class=\"dbg-muted\">speechSynthesis non disponibile.</p>";
        if ("speechSynthesis" in window) {
            const v = speechSynthesis.getVoices();
            const it = v.filter((x) => /^it/i.test(x.lang));
            voices = kv([
                ["Voci totali", v.length],
                ["Voci italiane", it.length ? it.map((x) => x.name).slice(0, 4).join(", ") : "NESSUNA: i giochi a voce useranno un'altra lingua", it.length ? "" : "dbg-warn"],
                ["Frasi pronunciate", S.speech.count],
                ["Errori voce", S.speech.errors, S.speech.errors ? "dbg-warn" : ""],
            ]);
        }
        return `<div class="dbg-grid">${samples}${card("Verifica asset", assets)}${card("Voce", voices)}</div>`;
    }

    function renderSystem() {
        return `<div class="dbg-grid">${card("Ambiente", kv(Object.entries(S.env)))}`
            + card("Strumenti", "<div class=\"dbg-row\"><button class=\"dbg-btn\" data-act=\"env-refresh\">↻ Aggiorna</button></div>"
                + "<p class=\"dbg-muted\">Il service worker può servire una vecchia versione dei file: se le modifiche non compaiono, svuota la cache offline o incrementa la versione in sw.js.</p>")
            + "</div>";
    }

    function renderSuite() {
        const su = S.suite;
        const prog = $("#dbg-suite-progress");
        const out = $("#dbg-suite-results");
        if (!prog || !out) return;
        if (su) {
            const total = su.tasks.length;
            const done = su.rows.length;
            const cur = su.current;
            const t = su.tasks[Math.min(su.i, total - 1)];
            prog.innerHTML = `<div class="dbg-bar"><span style="width:${(done / total) * 100}%"></span></div>`
                + `<p>${su.running ? `Prova ${Math.min(su.i + 1, total)}/${total}: <b>${esc(gameName(t.gid))}</b> con ${t.p} giocatori${cur ? ` · ${((now() - cur.t0) / 1000).toFixed(0)}s / ${su.dur / 1000}s` : ""}` : `Collaudo ${su.abort ? "interrotto" : "terminato"}: ${done}/${total} prove.`}</p>`;
            const rows = su.rows.map((r) => `<tr class="${r.status === "ok" ? "" : r.status === "avvisi" ? "meh" : "bad"}"><td class="${r.status === "ok" ? "dbg-ok" : r.status === "avvisi" ? "dbg-warn" : "dbg-err"}">${r.status === "ok" ? "✅" : r.status === "avvisi" ? "⚠️" : "❌"} ${esc(r.status)}</td>`
                + `<td>${esc(gameName(r.gid))}</td><td class="num">${r.p}</td><td class="num">${r.sec.toFixed(0)}s</td><td>${r.natural ? "🏁 sì" : "no"}</td>`
                + `<td class="num">${r.inputs}</td><td class="num">${r.samples ?? "—"}</td><td class="num dbg-err">${r.err}</td><td class="num dbg-warn">${r.warn}</td><td class="num">${r.leaks || 0}</td></tr>`).join("");
            out.innerHTML = rows ? `<div class="dbg-scroll"><table class="dbg-table"><thead><tr><th>Esito</th><th>Gioco</th><th class="num">Giocatori</th><th class="num">Durata</th><th>Finito</th><th class="num">Input</th><th class="num">Suoni</th><th class="num">Err</th><th class="num">Avv</th><th class="num">Residui</th></tr></thead><tbody>${rows}</tbody></table></div>`
                + "<p class=\"dbg-muted\">Dettagli di ogni anomalia nel tab Log (filtra per partita con «solo partita corrente» o cerca il nome del gioco).</p>" : "<p class=\"dbg-muted\">Nessun risultato ancora.</p>";
        } else {
            prog.innerHTML = "";
            out.innerHTML = "<p class=\"dbg-muted\">Nessun collaudo eseguito.</p>";
        }
        const startBtn = root.querySelector("[data-act=suite-start]");
        const stopBtn = root.querySelector("[data-act=suite-stop]");
        if (startBtn) startBtn.disabled = !!(su && su.running);
        if (stopBtn) stopBtn.disabled = !(su && su.running);
    }

    function renderLog() {
        const el = $("#dbg-log");
        if (!el) return;
        if (S.ui.frozen) return;
        const q = S.ui.search.trim().toLowerCase();
        const hidden = new Set(S.ui.hiddenCats);
        const cur = S.run ? S.run.n : (S.lastRun ? S.lastRun.n : -1);
        const items = S.log.filter((e) => S.ui.levels[e.lvl] !== false && !hidden.has(e.cat)
            && (!S.ui.onlyRun || e.run === cur)
            && (!q || (e.msg + " " + e.cat + " " + e.game).toLowerCase().includes(q))).slice(-500);
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        el.innerHTML = items.length ? items.map(logLine).join("") : "<p class=\"dbg-muted\">Nessun evento con questi filtri.</p>";
        if (S.ui.autoscroll && (atBottom || S.renderedLogVer < 0)) el.scrollTop = el.scrollHeight;
        const c = $("#dbg-log-count");
        if (c) c.textContent = `${items.length} / ${S.log.length} eventi`;
    }

    function renderHealth() {
        const pill = $("#debug-health");
        const {error, warn} = S.counts;
        if (pill) {
            pill.className = "pill dbg-health " + (error ? "err" : warn ? "warn" : "ok");
            pill.textContent = error ? `❌ ${error} errori · ⚠️ ${warn}` : warn ? `⚠️ ${warn} avvisi` : "✅ nessuna anomalia";
        }
        const hud = $("#debug-hud");
        if (hud) {
            hud.hidden = !S.ui.hud;
            const run = S.run;
            hud.className = error ? "err" : warn ? "warn" : "";
            hud.textContent = `🐞 ${run ? `${run.name} ${mmss(now() - run.t0)}${run.paused ? " ⏸" : run.finished ? " 🏁" : ""}` : "nessuna partita"} · ❌${error} ⚠️${warn}${botOn() ? " · 🤖" : ""}`;
        }
    }

    const VIEWS = {live: renderLive, games: renderGames, audio: renderAudio, system: renderSystem};

    function renderTick() {
        try {
            renderHealth();
            if (S.ui.collapsed || document.hidden) return;
            const tab = S.ui.tab;
            if (tab === "log") {
                if (S.renderedLogVer !== S.logVer) {
                    renderLog();
                    S.renderedLogVer = S.logVer;
                }
            } else if (tab === "collaudo") {
                renderSuite();
            } else if (VIEWS[tab]) {
                const view = $(`#debug-view-${tab}`);
                if (view && (tab === "live" || S.dirty)) view.innerHTML = VIEWS[tab]();
            }
            S.dirty = false;
        } catch (e) {
            _con.error("[BPDebug] errore di rendering:", e);
        }
    }

    /* ======================================================================
     * Report ed esportazione
     * ==================================================================== */
    function buildReport() {
        const L = [];
        const list = gameList();
        L.push("# Buttons-party · report debug");
        L.push(`Generato: ${new Date().toLocaleString("it-IT")} · ${location.href}`);
        L.push(`Browser: ${navigator.userAgent}`);
        L.push(`Anomalie sessione: ${S.counts.error} errori, ${S.counts.warn} avvisi`);
        L.push("", "## Minigiochi");
        for (const [id, label] of list) {
            const s = gameStatus(id);
            const r = S.results[id];
            L.push(`- ${s.icon} ${label} (${id}): ${s.txt}${r ? ` · avvii ${r.runs}, finiti ${r.natural}, err ${r.err}, avv ${r.warn}, max ${r.maxSec.toFixed(0)}s, suoni ${r.samples.size}` : ""}`);
        }
        if (S.suite && S.suite.rows.length) {
            L.push("", "## Collaudo automatico");
            for (const r of S.suite.rows) L.push(`- ${r.status.toUpperCase()} · ${gameName(r.gid)} · ${r.p} giocatori · ${r.sec.toFixed(0)}s · finito:${r.natural ? "sì" : "no"} · input ${r.inputs} · err ${r.err} · avv ${r.warn} · residui ${r.leaks || 0}`);
        }
        const bad = S.log.filter((e) => e.lvl === "error" || e.lvl === "warn");
        L.push("", `## Errori e avvisi (${bad.length})`);
        for (const e of bad) L.push(`- ${e.lvl === "error" ? "ERRORE" : "AVVISO"}${e.game ? " [" + e.game + " #" + e.run + "]" : ""} (${e.cat}) ${e.msg}${e.count > 1 ? " ×" + e.count : ""}${e.data && typeof e.data === "string" ? " | " + e.data : ""}`);
        const miss = Object.values(S.samples).filter((s) => /mancante|errore|fallita/.test(s.state) || s.fallback);
        if (miss.length) {
            L.push("", "## Audio con problemi");
            for (const s of miss) L.push(`- ${s.url}: ${s.state}${s.http ? " (HTTP " + s.http + ")" : ""}, fallback ${s.fallback}`);
        }
        L.push("", "## Ultimi 80 eventi");
        for (const e of S.log.slice(-80)) L.push(`${e.run ? "#" + e.run + " +" + (e.rt / 1000).toFixed(2) + "s" : ((e.t - T0) / 1000).toFixed(2) + "s"} [${e.cat}] ${e.lvl === "error" ? "ERR " : e.lvl === "warn" ? "WARN " : ""}${e.msg}`);
        return L.join("\n");
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.cssText = "position:fixed;opacity:0;top:0";
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try {
                ok = document.execCommand("copy");
            } catch (e2) { /* ignora */ }
            ta.remove();
            return ok;
        }
    }

    function downloadJson() {
        const data = {
            generated: new Date().toISOString(), url: location.href, env: S.env, counts: S.counts,
            results: Object.fromEntries(Object.entries(S.results).map(([k, r]) => [k, {...r, samples: [...r.samples], last: undefined}])),
            samples: S.samples, suite: S.suite ? {rows: S.suite.rows} : null,
            log: S.log.map(({key, ...rest}) => rest),
        };
        const blob = new Blob([JSON.stringify(data, null, 1)], {type: "application/json"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `buttons-party-debug-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        _st(() => URL.revokeObjectURL(a.href), 4000);
    }

    function flash(btn, text) {
        if (!btn) return;
        const old = btn.textContent;
        btn.textContent = text;
        _st(() => {
            btn.textContent = old;
        }, 1400);
    }

    /* ======================================================================
     * UI: costruzione e eventi
     * ==================================================================== */
    const LOG_CATS = ["partita", "input", "arena", "punteggio", "audio", "voce", "timer", "sistema", "console", "errore"];

    function buildLogView() {
        const log = $("#debug-view-log");
        if (log) {
            log.innerHTML = `<div class="dbg-log-toolbar">`
                + ["error:❌", "warn:⚠️", "ok:✅", "info:ℹ️"].map((x) => {
                    const [k, i] = x.split(":");
                    return `<button class="dbg-chip" data-act="lvl" data-lvl="${k}" aria-pressed="${S.ui.levels[k] !== false}">${i}</button>`;
                }).join("")
                + `<input type="search" id="dbg-search" placeholder="Cerca nel log…" value="${esc(S.ui.search)}">`
                + `<label><input type="checkbox" id="dbg-onlyrun" ${S.ui.onlyRun ? "checked" : ""}> solo ultima partita</label>`
                + `<label><input type="checkbox" id="dbg-autoscroll" ${S.ui.autoscroll ? "checked" : ""}> scorri</label>`
                + `<button class="dbg-chip" data-act="freeze" aria-pressed="false">⏸ Blocca</button>`
                + `<span id="dbg-log-count" class="dbg-muted"></span></div>`
                + `<div class="dbg-log-toolbar">${LOG_CATS.map((c) => `<button class="dbg-chip" data-act="cat" data-cat="${c}" aria-pressed="${!S.ui.hiddenCats.includes(c)}">${c}</button>`).join("")}</div>`
                + `<div id="dbg-log" class="dbg-log" role="log" aria-live="off"></div>`;
        }
    }

    function buildCollaudoView() {
        const games = gameList();
        const col = $("#debug-view-collaudo");
        if (col) {
            col.innerHTML = `<section class="dbg-card"><h4>Collaudo automatico</h4>`
                + `<p>Avvia ogni gioco selezionato con un bot che preme tasti a caso, poi esce e controlla errori, timer e suoni rimasti attivi, file audio mancanti e comportamento in pausa. `
                + `<b>Non</b> verifica le regole di vittoria: trova crash, blocchi e risorse non rilasciate.</p>`
                + `<div class="dbg-form">`
                + `<label>Giocatori<select id="dbg-suite-players"><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="all">2, 3 e 4 (3 prove per gioco)</option></select></label>`
                + `<label>Durata per prova (secondi)<input type="number" id="dbg-suite-dur" min="5" max="300" value="20"></label>`
                + `<label>Velocità del bot<select id="dbg-bot-speed"><option value="slow">lenta</option><option value="medium" selected>media</option><option value="fast">veloce</option></select></label>`
                + `<label class="inline"><input type="checkbox" id="dbg-suite-c" checked> usa anche il tasto centrale (pausa/riprendi)</label></div>`
                + `<details><summary>Giochi da provare</summary><div id="dbg-suite-games" class="dbg-checks">`
                + games.map(([id, label]) => `<label><input type="checkbox" value="${esc(id)}" checked> ${esc(label)}</label>`).join("")
                + `</div><div class="dbg-row"><button class="dbg-btn" data-act="suite-all">Tutti</button><button class="dbg-btn" data-act="suite-none">Nessuno</button></div></details>`
                + `<div class="dbg-row"><button class="dbg-btn primary" data-act="suite-start">▶ Avvia collaudo</button><button class="dbg-btn" data-act="suite-stop" disabled>■ Interrompi</button></div>`
                + `<div id="dbg-suite-progress"></div></section>`
                + `<section class="dbg-card" style="margin-top:.8rem"><h4>Risultati</h4><div id="dbg-suite-results"></div></section>`;
        }
    }

    function buildStaticViews() {
        buildLogView();
        buildCollaudoView();
    }

    function selectTab(tab) {
        S.ui.tab = tab;
        root.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
        root.querySelectorAll("[data-view]").forEach((v) => {
            v.hidden = v.dataset.view !== tab;
        });
        S.dirty = true;
        S.renderedLogVer = -1;
        saveUi();
        renderTick();
    }

    function setCollapsed(c) {
        S.ui.collapsed = c;
        const body = $("#debug-body"), btn = $("#debug-toggle");
        if (body) body.hidden = c;
        if (btn) {
            btn.textContent = c ? "Espandi" : "Comprimi";
            btn.setAttribute("aria-expanded", String(!c));
        }
        saveUi();
        S.dirty = true;
        renderTick();
    }

    function onClick(ev) {
        const b = ev.target.closest("[data-act],[data-tab]");
        if (!b || !root.contains(b)) return;
        if (b.dataset.tab) return selectTab(b.dataset.tab);
        const act = b.dataset.act;
        switch (act) {
            case "toggle":
                return setCollapsed(!S.ui.collapsed);
            case "bot":
                S.bot.manual = !S.bot.manual;
                b.setAttribute("aria-pressed", String(S.bot.manual));
                return botSync();
            case "hud":
                S.ui.hud = !S.ui.hud;
                b.setAttribute("aria-pressed", String(S.ui.hud));
                saveUi();
                return renderHealth();
            case "copy":
                return copyText(buildReport()).then((ok) => flash(b, ok ? "✓ Copiato" : "✗ Non riuscito"));
            case "json":
                return downloadJson();
            case "clear":
                S.log.length = 0;
                S.counts = {error: 0, warn: 0};
                S.logVer++;
                S.dirty = true;
                return renderTick();
            case "health":
                S.ui.levels = {error: true, warn: true, ok: false, info: false};
                buildLogView();
                return selectTab("log");
            case "lvl": {
                const k = b.dataset.lvl;
                S.ui.levels[k] = S.ui.levels[k] === false;
                b.setAttribute("aria-pressed", String(S.ui.levels[k] !== false));
                break;
            }
            case "cat": {
                const c = b.dataset.cat;
                const i = S.ui.hiddenCats.indexOf(c);
                if (i >= 0) S.ui.hiddenCats.splice(i, 1);
                else S.ui.hiddenCats.push(c);
                b.setAttribute("aria-pressed", String(!S.ui.hiddenCats.includes(c)));
                break;
            }
            case "freeze":
                S.ui.frozen = !S.ui.frozen;
                b.setAttribute("aria-pressed", String(S.ui.frozen));
                b.textContent = S.ui.frozen ? "▶ Riprendi" : "⏸ Blocca";
                break;
            case "play": {
                setSelect($("#game-select"), b.dataset.game);
                $("#start-button").click();
                window.scrollTo({top: 0, behavior: "smooth"});
                return;
            }
            case "reset-results":
                S.results = {};
                S.hist = {};
                try {
                    localStorage.removeItem(LS_RESULTS);
                } catch (e) { /* ignora */ }
                S.dirty = true;
                return renderTick();
            case "assets-check":
                return checkAssets();
            case "env-refresh":
                collectEnv();
                S.dirty = true;
                return;
            case "suite-start":
                return runSuite();
            case "suite-stop":
                if (S.suite) S.suite.abort = true;
                return;
            case "suite-all":
            case "suite-none":
                root.querySelectorAll("#dbg-suite-games input").forEach((i) => {
                    i.checked = act === "suite-all";
                });
                return;
            default:
        }
        saveUi();
        S.renderedLogVer = -1;
        renderTick();
    }

    function onInputChange(ev) {
        const t = ev.target;
        if (t.id === "dbg-search") S.ui.search = t.value;
        else if (t.id === "dbg-onlyrun") S.ui.onlyRun = t.checked;
        else if (t.id === "dbg-autoscroll") S.ui.autoscroll = t.checked;
        else return;
        saveUi();
        S.renderedLogVer = -1;
        renderTick();
    }

    function initUi() {
        root = $("#debug-panel");
        if (!root) return;
        const fb = $("#debug-fallback");
        if (fb) fb.remove();
        // HUD flottante
        if (!$("#debug-hud")) {
            const hud = document.createElement("div");
            hud.id = "debug-hud";
            hud.setAttribute("aria-hidden", "true");
            document.body.appendChild(hud);
        }
        buildStaticViews();
        root.addEventListener("click", onClick);
        root.addEventListener("input", onInputChange);
        root.addEventListener("change", onInputChange);
        const hudBtn = root.querySelector("[data-act=hud]");
        if (hudBtn) hudBtn.setAttribute("aria-pressed", String(S.ui.hud));
        setCollapsed(S.ui.collapsed);
        selectTab(S.ui.tab);
    }

    /* ======================================================================
     * API pubblica
     * ==================================================================== */
    window.BPDebug = {
        /** app.js passa un getter dello stato interno (variabili in closure). */
        attach(api) {
            S.attached = api;
        },
        input: onInput,
        gameStart,
        gameFinish,
        finishIgnored,
        gameEnd,
        pause,
        /** Registra una funzione che restituisce lo stato interno del gioco in corso (mostrato nel tab Live). */
        watch(fn) {
            S.watchFn = fn;
        },
        log: (cat, lvl, msg, data) => log(cat, lvl, msg, data),
        report: buildReport,
        state: () => S,
    };

    function boot() {
        loadPersisted();
        collectEnv();
        watchDom();
        initUi();
        _si(renderTick, 250);
        _si(watchdog, 1000);
        _si(lagTick, 200);
        log("sistema", "ok", "debug attivo");
        if ("speechSynthesis" in window) {
            const nIt = () => speechSynthesis.getVoices().filter((v) => /^it/i.test(v.lang)).length;
            const check = () => {
                if (speechSynthesis.getVoices().length && !nIt()) log("voce", "warn", "nessuna voce italiana installata: la sintesi vocale userà un'altra lingua o resterà muta");
            };
            speechSynthesis.addEventListener("voiceschanged", check, {once: true});
            _st(check, 1500);
        }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
