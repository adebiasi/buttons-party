# Buttons-party

Prototipo web di party game audio per 2–4 giocatori. I minigiochi si basano
soprattutto su ascolto e tempi di reazione; si può giocare con i pulsanti
virtuali, la tastiera o un controller Bluetooth basato su ESP32.

## Avvio

Il progetto è composto da file statici: non richiede installazione di
dipendenze né una fase di compilazione. Dalla cartella principale avvia un
server locale:

```powershell
py -m http.server 8000
```

In alternativa, su macOS o Linux:

```bash
python3 -m http.server 8000
```

Apri quindi [http://localhost:8000](http://localhost:8000). È preferibile
usare un browser basato su Chromium aggiornato. Il Bluetooth Web richiede un
contesto sicuro: `localhost` per lo sviluppo oppure HTTPS per un sito
pubblicato; l'accesso da un altro dispositivo richiede quindi un server HTTPS.

## Pagine

- **`index.html`** — schermata principale: scegli da 2 a 4 giocatori e un
  minigioco, oppure lascia che venga scelto casualmente. Include comandi audio,
  controller virtuale e strumenti di debug.
- **`narratore.html`** — partita guidata dalla sintesi vocale del browser,
  progettata per giocare senza dover guardare lo schermo. Il narratore prepara
  una partita con cinque minigiochi estratti casualmente e guida i giocatori
  tra le fasi.
- **`testController.html`** — pagina tecnica per verificare la connessione
  Bluetooth e visualizzare gli eventi dei pulsanti.
- **`voci.html`** — pagina di prova delle voci TTS disponibili nel browser.

## Minigiochi

La schermata principale permette di selezionare:

1. Cattura il maiale
2. Duello
3. Paracadutisti
4. Disturbatore
5. Piglia tutto
6. Simon
7. Prendi la zanzara
8. In miniera
9. Uno, due, tre, stai là!
10. A lezione
11. Chi bussa alla porta
12. Ristorante
13. Mola a disco
14. Palla esplosiva
15. Saltare la corda
16. Tennis
17. Consegna tapas
18. Rally
19. Il bippatore
20. Tieni il tempo
21. Assetato
22. Tiro alla fune
23. Taglia
24. Copia il ritmo
25. Cavallino

Regole e interazioni variano da un gioco all'altro. Il progetto è un prototipo:
bilanciamento e comportamento sono ancora soggetti a modifiche.

## Comandi

Il controller virtuale è disponibile sullo schermo; in alternativa, usa:

| Tasto | Giocatore |
| --- | --- |
| `1` | P1, rosso |
| `2` | P2, blu |
| `3` | P3, giallo |
| `4` | P4, verde |
| `Spazio` o `Invio` | Tasto centrale |

Il tasto centrale conferma le scelte nelle schermate guidate e può avere una
funzione specifica durante un minigioco. Il primo tocco o tasto può essere
necessario per abilitare la riproduzione audio, secondo le restrizioni del
browser.

## Controller Bluetooth ESP32

Il firmware di riferimento si trova in `firmware/esp32/controller.ino`.
Caricalo su una scheda ESP32 con supporto BLE e collega i pulsanti ai pin
indicati nel file:

| Pulsante | GPIO |
| --- | --- |
| P1 | 18 |
| P2 | 19 |
| P3 | 21 |
| P4 | 22 |
| Centro | 23 |

Nella schermata principale abilita **Usa il controller Bluetooth a 5 tasti**
e seleziona **Collega controller**. Il firmware espone il dispositivo
`ESP32-Controller`; concedi al browser l'autorizzazione alla connessione.
Il firmware e l'app gestiscono quattro pulsanti giocatore e un tasto centrale.

## Audio e modalità offline

Gli effetti sonori sono in `assets/sounds/`; il narratore usa le voci fornite
dal browser e dal sistema operativo. La disponibilità e la qualità delle voci
TTS dipendono dal dispositivo.

Il progetto include un manifest PWA e un service worker. La cache viene
popolata durante l'installazione per i file elencati in `sw.js` e, durante
l'uso online, per le risorse richieste con successo. Non tutti i file audio
vengono precaricati all'installazione: per l'uso offline, visita prima le
pagine e riproduci gli effetti necessari mentre sei connesso.

## Struttura del progetto

```text
.
├── assets/
│   ├── icon.svg
│   └── sounds/
├── firmware/
│   └── esp32/
│       └── controller.ino
├── src/
│   ├── app.js
│   ├── controller-ble.js
│   ├── debug.js
│   ├── narratore.js
│   └── *.css
├── index.html
├── narratore.html
├── testController.html
├── voci.html
├── manifest.webmanifest
└── sw.js
```

Non è presente un file di licenza: prima di redistribuire il progetto o i suoi
asset, verifica i relativi diritti e aggiungi una licenza esplicita, se
appropriato.
