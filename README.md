# Buttons-party

Prototipo web provvisorio di minigiochi per 2–4 giocatori, basato sulla specifica `Buttons-party` v0.1.

## Avvio locale

Non serve un build step né un backend. Avvia un server statico nella cartella del progetto:

```bash
python3 -m http.server 8000
```

Apri `http://localhost:8000` nel browser. Su smartphone, per testare il multitouch, telefono e computer devono essere sulla stessa rete e bisogna aprire l'indirizzo LAN del computer. Per Web Bluetooth/GitHub Pages è necessario HTTPS.

## Controlli

- Pulsanti virtuali disposti a croce.
- Tastiera: `1` = P1/rosso, `2` = P2/blu, `3` = P3/giallo, `4` = P4/verde, `Spazio` o `Invio` = centro.
- Il primo tocco abilita Web Audio; volume e sintesi vocale dipendono dal browser.
- Il pulsante centrale conferma nel menu; nei giochi in tempo reale il pulsante Pausa gestisce la pausa. In Simon il centro è il quinto input.

## Minigiochi inclusi

- **Cattura il maiale** — versi sintetici, finestra di cattura, penalità per pressioni errate.
- **Duello** — preparazione, attesa casuale, falsa partenza e round.
- **Paracadutisti** — soglia di sicurezza e impatto nascosti; risultato mostrato alla fine.
- **Disturbatore** — bersaglio vocale simulato con toni sintetici (asset audio originali da sostituire).
- **Piglia tutto** — piatto crescente e limite segreto.
- **Simon a 5 tasti** — sequenza sonora progressiva a turni.

## Stato e limiti della fase provvisoria

- Gli effetti audio sono sintetizzati via Web Audio API: non sono ancora presenti campioni vocali o versi realistici.
- Il livello d'input normalizza pressione/rilascio in eventi `{ button, type, timestamp, source }`.
- Il controller BLE non è ancora implementato; l'architettura è predisposta per aggiungerlo come sorgente d'input separata.
- Il prototipo è una base giocabile da provare, non una build certificata: alcune regole e bilanciamenti richiedono playtest.
- La PWA usa service worker e cache per l'accesso offline dopo il primo caricamento via HTTP(S).

## Pubblicare su GitHub Pages

1. Crea un repository GitHub vuoto chiamato `buttons-party`.
2. Carica tutti i file di questa cartella nella root del repository.
3. Vai in **Settings → Pages**.
4. In **Build and deployment**, scegli **Deploy from a branch**, branch `main`, cartella `/(root)`, quindi **Save**.
5. Attendi il completamento del deployment nella scheda **Actions**. Il sito sarà pubblicato all'URL mostrato in Settings → Pages.

### Con Git da terminale

Dopo aver creato il repository vuoto su GitHub, esegui nella cartella del progetto:

```bash
git init
git add .
git commit -m "feat: prototipo Buttons-party con sei minigiochi"
git branch -M main
git remote add origin https://github.com/TUO-UTENTE/buttons-party.git
git push -u origin main
```

Sostituisci `TUO-UTENTE` con il tuo username GitHub. Il repository remoto non viene creato automaticamente da questi comandi.

## Struttura

```text
buttons-party/
├── index.html
├── manifest.webmanifest
├── sw.js
├── README.md
├── assets/
│   └── icon.svg
└── src/
    ├── app.js
    └── style.css
```

## Licenza

Prototipo fornito senza garanzie. Prima di distribuire pubblicamente, scegliere e aggiungere una licenza esplicita (ad esempio MIT) dopo aver confermato i diritti sul progetto.
