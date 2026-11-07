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

// La modalità segue l'iscrizione della pagina Arcade alle notifiche:
// iscritta = Arcade, non iscritta = Spotify. Su Android pagina web e
// host HID condividono la stessa connessione BLE, quindi la pagina
// annulla esplicitamente l'iscrizione quando si chiude. Se si chiude
// senza farlo serve un riavvio dell'ESP32.
bool arcadeMode = false;

void setArcadeMode(const bool enabled) {

    if (arcadeMode == enabled) {
        return;
    }

    arcadeMode = enabled;

    if (arcadeMode) {
        Serial.println("Modalita ARCADE attiva");
    } else {
        Serial.println("Modalita SPOTIFY attiva");
    }
}

// Tenere premuto il pulsante centrale all'avvio cancella tutti i bond.
// Serve quando telefono ed ESP32 hanno chiavi non allineate.
static constexpr int BOND_RESET_BUTTON_INDEX = 4;

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
const unsigned long DEBOUNCE_MS = 25;

bool lastReading[BUTTON_COUNT];
bool stableState[BUTTON_COUNT];

unsigned long lastDebounceTime[BUTTON_COUNT];

// --------------------------------------------------
// INVIO EVENTI ALLA PAGINA ARCADE
// --------------------------------------------------

void sendArcadeEvent(const char* button, bool pressed) {

    // In modalità Spotify non inviare eventi Arcade
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
// RESET BOND
// --------------------------------------------------

// Va chiamata dopo ble.begin() e prima dell'advertising:
// deleteAllBonds() richiede nessuna connessione attiva.
void resetBondsIfRequested() {

    const bool resetRequested =
        digitalRead(buttonPins[BOND_RESET_BUTTON_INDEX]) == LOW;

    if (!resetRequested) {
        return;
    }

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
    Serial.println("Avvio ESP32 Arcade + Spotify Controller");

    // Configura i pulsanti
    for (int i = 0; i < BUTTON_COUNT; i++) {

        pinMode(buttonPins[i], INPUT_PULLUP);

        lastReading[i] = digitalRead(buttonPins[i]);
        stableState[i] = lastReading[i];

        lastDebounceTime[i] = millis();
    }

    // Configura HID Consumer Control prima di ble.begin()
    ble.hidConsumerControl().configure();

    // Prepara il servizio GATT personalizzato
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

    // Inizializza BLE
    EspBleConfig config;
    config.deviceName = DEVICE_NAME;

    // Come nella v1: il pairing parte alla connessione, così il popup di
    // Android accoppia anche il controller multimediale
    config.security.enabled = true;
    config.security.bonding = true;

    if (!ble.begin(config)) {

        Serial.print("Errore inizializzazione BLE: ");
        Serial.println(ble.lastErrorDetail().c_str());

        return;
    }

    ble.onSecurityChanged(
        [](const EspBleSecurityChanged& event) {

            if (event.success) {
                Serial.println("Accoppiamento riuscito");
                return;
            }

            Serial.print("Accoppiamento fallito: ");
            Serial.println(event.detail);
            Serial.println(
                "Dimentica il dispositivo sul telefono e riavvia "
                "l'ESP32 tenendo premuto il pulsante centrale"
            );
        }
    );

    ble.onConnected(
        [](const EspBleConnection& connection) {
            Serial.print("Dispositivo connesso: ");
            Serial.print(connection.peerAddress);
            Serial.print(connection.bonded ? " (accoppiato)" : " (non accoppiato)");
            Serial.println(connection.encrypted ? " cifrato" : " non cifrato");
        }
    );

    gatt.onSubscriptionChanged(
        [](const EspBleGattSubscription& subscription) {
            Serial.print("Iscrizione ");
            Serial.print(subscription.characteristicUuid);
            Serial.println(subscription.notifications ? ": attiva" : ": disattivata");

            if (subscription.characteristic == eventCharacteristic) {
                setArcadeMode(subscription.notifications);
            }
        }
    );

    // Riavvia advertising quando un dispositivo si disconnette
    ble.onDisconnected(
        [](const EspBleConnection& connection) {
            setArcadeMode(false);
            Serial.print("Dispositivo disconnesso, motivo: 0x");
            Serial.println(connection.disconnectReason, HEX);
            ble.advertising().start();
        }
    );

    resetBondsIfRequested();
    Serial.print("Bond salvati: ");
    Serial.println(ble.bondCount());

    // Pubblicizza servizio Arcade + HID: senza 0x1812 Android
    // non riconosce il dispositivo come controller da accoppiare
    auto& advertising = ble.advertising();
    advertising.setName(DEVICE_NAME);
    advertising.addServiceUuid(SERVICE_UUID);
    advertising.addServiceUuid(HID_SERVICE_UUID);

    if (!advertising.start()) {
        Serial.print("Errore advertising: ");
        Serial.println(ble.lastErrorDetail());
        return;
    }

    Serial.println("BLE pronto");
    Serial.println("Nome dispositivo: ESP32-Controller");
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
