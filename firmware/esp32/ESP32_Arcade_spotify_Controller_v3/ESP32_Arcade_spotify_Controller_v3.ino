
#include <EspBle.h>

// --------------------------------------------------
// CONFIGURAZIONE BLE
// --------------------------------------------------

static constexpr const char* DEVICE_NAME =
    "ESP32-Controller";

static constexpr const char* SERVICE_UUID =
    "7b7a1000-1234-4567-890a-bcdef0123456";

static constexpr const char* CHARACTERISTIC_UUID =
    "7b7a1001-1234-4567-890a-bcdef0123456";

static constexpr const char* HID_SERVICE_UUID = "1812";

EspBle ble;
EspBleGattCharacteristic eventCharacteristic;

// --------------------------------------------------
// MODALITÀ
// --------------------------------------------------

// true  = ARCADE
// false = SPOTIFY

bool arcadeMode = true;

// Tempi di pressione all'avvio
static constexpr unsigned long SPOTIFY_HOLD_MS = 3000;
static constexpr unsigned long BOND_RESET_HOLD_MS = 8000;

// --------------------------------------------------
// PULSANTI
// --------------------------------------------------

const int buttonPins[] = {
    18,  // P1
    19,  // P2
    21,  // P3
    22,  // P4
    23   // Centrale C
};

const char* buttonNames[] = {
    "P1",
    "P2",
    "P3",
    "P4",
    "C"
};

const int BUTTON_COUNT = 5;
const int CENTRAL_BUTTON_INDEX = 4;

const unsigned long DEBOUNCE_MS = 25;

bool lastReading[BUTTON_COUNT];
bool stableState[BUTTON_COUNT];

unsigned long lastDebounceTime[BUTTON_COUNT];

// --------------------------------------------------
// SELEZIONE MODALITÀ ALL'AVVIO
// --------------------------------------------------

// Ritorna true se bisogna cancellare tutti i bond.

bool selectStartupMode() {

    arcadeMode = true;

    // Se il centrale non è premuto, parte Arcade
    if (digitalRead(buttonPins[CENTRAL_BUTTON_INDEX]) != LOW) {

        Serial.println("Avvio in modalita ARCADE");

        return false;
    }

    Serial.println();
    Serial.println("Pulsante centrale rilevato!");
    Serial.println("Attendi per selezionare la modalita...");
    Serial.println("3 secondi: SPOTIFY");
    Serial.println("8 secondi: RESET BOND + SPOTIFY");

    unsigned long startTime = millis();

    bool spotifySelected = false;
    bool resetRequested = false;

    while (digitalRead(buttonPins[CENTRAL_BUTTON_INDEX]) == LOW) {

        unsigned long elapsed = millis() - startTime;

        // Dopo 3 secondi seleziona Spotify
        if (elapsed >= SPOTIFY_HOLD_MS && !spotifySelected) {

            arcadeMode = false;
            spotifySelected = true;

            Serial.println("Modalita SPOTIFY selezionata");
        }

        // Dopo 8 secondi richiede il reset dei bond
        if (elapsed >= BOND_RESET_HOLD_MS && !resetRequested) {

            arcadeMode = false;
            resetRequested = true;

            Serial.println("RESET BOND richiesto!");
        }

        delay(10);
    }

    // Se il pulsante viene rilasciato prima di 3 secondi
    if (!spotifySelected) {

        arcadeMode = true;

        Serial.println("Avvio in modalita ARCADE");
    }

    // Se è stato tenuto premuto almeno 8 secondi
    if (resetRequested) {

        Serial.println("Avvio SPOTIFY con cancellazione bond");

    } else if (spotifySelected) {

        Serial.println("Avvio SPOTIFY");

    }

    return resetRequested;
}

// --------------------------------------------------
// INVIO EVENTI ALLA PAGINA ARCADE
// --------------------------------------------------

void sendArcadeEvent(const char* button, bool pressed) {

    // Non inviare eventi in modalità Spotify
    if (!arcadeMode) {
        return;
    }

    String message = String(button);

    if (pressed) {
        message += "_DOWN";
    } else {
        message += "_UP";
    }

    ble.gattServer().notify(
        eventCharacteristic,
        message
    );

    Serial.print("Arcade: ");
    Serial.println(message);
}

// --------------------------------------------------
// COMANDI SPOTIFY / ANDROID
// --------------------------------------------------

void sendMediaCommand(int buttonIndex) {

    // Non inviare comandi Spotify durante Arcade
    if (arcadeMode) {
        return;
    }

    if (!ble.hidConsumerControl().ready()) {

        Serial.println("HID non pronto: nessun host accoppiato");

        return;
    }

    switch (buttonIndex) {

        case 0:  // P1: traccia avanti

            ble.hidConsumerControl().click(
                ESP_BLE_HID_CONSUMER_CONTROL_NEXT_TRACK
            );

            Serial.println("Spotify: Traccia avanti");

            break;

        case 1:  // P2: volume giù

            ble.hidConsumerControl().click(
                ESP_BLE_HID_CONSUMER_CONTROL_VOLUME_DOWN
            );

            Serial.println("Spotify: Volume giu");

            break;

        case 2:  // P3: traccia indietro

            ble.hidConsumerControl().click(
                ESP_BLE_HID_CONSUMER_CONTROL_PREVIOUS_TRACK
            );

            Serial.println("Spotify: Traccia indietro");

            break;

        case 3:  // P4: volume su

            ble.hidConsumerControl().click(
                ESP_BLE_HID_CONSUMER_CONTROL_VOLUME_UP
            );

            Serial.println("Spotify: Volume su");

            break;

        case 4:  // Centrale: play/pausa

            ble.hidConsumerControl().click(
                ESP_BLE_HID_CONSUMER_CONTROL_PLAY_PAUSE
            );

            Serial.println("Spotify: Play/Pausa");

            break;
    }
}

// --------------------------------------------------
// GESTIONE PULSANTI E DEBOUNCE
// --------------------------------------------------

void updateButtons() {

    unsigned long now = millis();

    for (int i = 0; i < BUTTON_COUNT; i++) {

        bool reading = digitalRead(buttonPins[i]);

        // Rileva un cambiamento elettrico
        if (reading != lastReading[i]) {

            lastDebounceTime[i] = now;

            lastReading[i] = reading;
        }

        // Attendi il tempo di debounce
        if ((now - lastDebounceTime[i]) >= DEBOUNCE_MS) {

            if (reading != stableState[i]) {

                stableState[i] = reading;

                // INPUT_PULLUP: LOW significa premuto
                bool pressed = (stableState[i] == LOW);

                // Invia evento alla pagina Arcade
                sendArcadeEvent(buttonNames[i], pressed);

                // Invia comando multimediale solo alla pressione
                if (pressed) {

                    sendMediaCommand(i);
                }
            }
        }
    }
}

// --------------------------------------------------
// RESET BOND BLUETOOTH
// --------------------------------------------------

// Da chiamare dopo ble.begin() e prima dell'advertising.
// Non devono esserci connessioni BLE attive.

void resetAllBonds() {

    if (ble.deleteAllBonds()) {

        Serial.println("Tutti i bond sono stati cancellati");

    } else {

        Serial.print("Errore cancellazione bond: ");

        Serial.println(ble.lastErrorDetail());
    }
}

// --------------------------------------------------
// SETUP
// --------------------------------------------------

void setup() {

    Serial.begin(115200);

    Serial.println();
    Serial.println("--------------------------------");
    Serial.println("ESP32 ARCADE + SPOTIFY CONTROLLER");
    Serial.println("--------------------------------");

    // Configura i pulsanti
    for (int i = 0; i < BUTTON_COUNT; i++) {

        pinMode(buttonPins[i], INPUT_PULLUP);
    }

    // Seleziona la modalità in base alla pressione iniziale
    // La funzione attende il rilascio del pulsante centrale.
    bool resetBondsRequested = selectStartupMode();

    // Inizializza lo stato dei pulsanti
    for (int i = 0; i < BUTTON_COUNT; i++) {

        lastReading[i] = digitalRead(buttonPins[i]);

        stableState[i] = lastReading[i];

        lastDebounceTime[i] = millis();
    }

    // Mostra modalità selezionata
    if (arcadeMode) {

        Serial.println("MODALITA: ARCADE");

    } else {

        Serial.println("MODALITA: SPOTIFY");
    }

    // Configura HID Consumer Control prima di ble.begin()
    ble.hidConsumerControl().configure();

    // --------------------------------------------------
    // SERVIZIO GATT PERSONALIZZATO
    // --------------------------------------------------

    auto& gatt = ble.gattServer();

    EspBleGattCharacteristicConfig characteristicConfig;

    characteristicConfig.readable = true;
    characteristicConfig.notifiable = true;

    const EspBleGattService service =
        gatt.addService(SERVICE_UUID);

    eventCharacteristic = gatt.addCharacteristic(
        service,
        CHARACTERISTIC_UUID,
        characteristicConfig
    );

    if (!service.valid() || !eventCharacteristic.valid()) {

        Serial.println("Errore configurazione GATT");

        return;
    }

    if (!gatt.setValue(eventCharacteristic, String("READY"))) {

        Serial.println("Errore valore iniziale GATT");

        return;
    }

    // --------------------------------------------------
    // INIZIALIZZAZIONE BLE
    // --------------------------------------------------

    EspBleConfig config;

    config.deviceName = DEVICE_NAME;

    config.security.enabled = true;
    config.security.bonding = true;

    // Il pairing viene avviato dalle impostazioni Android
    config.security.pairOnConnect = false;

    if (!ble.begin(config)) {

        Serial.print("Errore inizializzazione BLE: ");

        Serial.println(ble.lastErrorDetail().c_str());

        return;
    }

    // --------------------------------------------------
    // EVENTI SICUREZZA
    // --------------------------------------------------

    ble.onSecurityChanged(
        [](const EspBleSecurityChanged& event) {

            if (event.success) {

                Serial.println("Accoppiamento riuscito");

                return;
            }

            Serial.print("Accoppiamento fallito: ");

            Serial.println(event.detail);
        }
    );

    // --------------------------------------------------
    // EVENTI CONNESSIONE
    // --------------------------------------------------

    ble.onConnected(
        [](const EspBleConnection& connection) {

            Serial.print("Dispositivo connesso: ");

            Serial.print(connection.peerAddress);

            Serial.print(
                connection.bonded
                    ? " (accoppiato)"
                    : " (non accoppiato)"
            );

            Serial.println(
                connection.encrypted
                    ? " cifrato"
                    : " non cifrato"
            );
        }
    );

    // --------------------------------------------------
    // NOTIFICHE GATT
    // --------------------------------------------------

    gatt.onSubscriptionChanged(
        [](const EspBleGattSubscription& subscription) {

            Serial.print("Iscrizione ");

            Serial.print(subscription.characteristicUuid);

            Serial.println(
                subscription.notifications
                    ? ": attiva"
                    : ": disattivata"
            );
        }
    );

    // --------------------------------------------------
    // DISCONNESSIONE
    // --------------------------------------------------

    ble.onDisconnected(
        [](const EspBleConnection& connection) {

            Serial.print("Dispositivo disconnesso, motivo: 0x");

            Serial.println(connection.disconnectReason, HEX);

            // La modalità non cambia alla disconnessione.
            // Rimane quella selezionata all'avvio.

            ble.advertising().start();
        }
    );

    // --------------------------------------------------
    // RESET BOND SE RICHIESTO
    // --------------------------------------------------

    // Eseguito dopo ble.begin() e prima dell'advertising.
    if (resetBondsRequested) {

        resetAllBonds();
    }

    Serial.print("Bond salvati: ");

    Serial.println(ble.bondCount());

    // --------------------------------------------------
    // ADVERTISING
    // --------------------------------------------------

    auto& advertising = ble.advertising();

    advertising.setName(DEVICE_NAME);

    advertising.addServiceUuid(SERVICE_UUID);

    advertising.addServiceUuid(HID_SERVICE_UUID);

    if (!advertising.start()) {

        Serial.print("Errore advertising: ");

        Serial.println(ble.lastErrorDetail());

        return;
    }

    Serial.println("--------------------------------");
    Serial.println("BLE PRONTO");
    Serial.println("Nome: ESP32-Controller");

    if (arcadeMode) {

        Serial.println("Modalita attiva: ARCADE");

    } else {

        Serial.println("Modalita attiva: SPOTIFY");
    }

    Serial.println("--------------------------------");
}

// --------------------------------------------------
// LOOP PRINCIPALE
// --------------------------------------------------

void loop() {

    // Gestisce gli eventi BLE
    ble.update();

    // Legge i pulsanti
    updateButtons();

    delay(1);
}
