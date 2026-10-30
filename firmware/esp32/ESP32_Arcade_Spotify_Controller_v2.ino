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

// Generic HID appearance: Android lo mostra come dispositivo di input
static constexpr uint16_t HID_APPEARANCE = 0x03C0;

EspBle ble;
EspBleGattCharacteristic eventCharacteristic;

// true quando la pagina Arcade è iscritta alle notifiche
volatile bool arcadeMode = false;

// Bond obsoleto da rimuovere dopo un pairing fallito.
// NimBLE rifiuta un nuovo pairing se l'ESP conserva ancora le chiavi
// di un telefono che le ha invece dimenticate.
bool staleBondPending = false;
EspBleBond staleBond;

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

    // Rileva quando la pagina Arcade si iscrive alle notifiche
    gatt.onSubscriptionChanged(
        [](const EspBleGattSubscription& subscription) {

            if (subscription.characteristic != eventCharacteristic) {
                return;
            }

            arcadeMode = subscription.notifications;

            if (arcadeMode) {
                Serial.println("Modalita ARCADE attiva");
            } else {
                Serial.println("Modalita SPOTIFY attiva");
            }
        }
    );

    // Inizializza BLE
    EspBleConfig config;
    config.deviceName = DEVICE_NAME;

    config.security.enabled = true;
    config.security.bonding = true;

    // Il pairing lo avvia l'host HID (Android) quando legge le
    // caratteristiche cifrate. Forzarlo alla connessione faceva
    // accoppiare anche la pagina Web Bluetooth, creando un bond che
    // poi entrava in conflitto con l'accoppiamento dalle impostazioni.
    config.security.pairOnConnect = false;

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

            staleBond.peerAddress = event.connection.peerAddress;
            staleBond.peerAddressType = event.connection.peerAddressType;
            staleBondPending = true;
        }
    );

    // Riavvia advertising quando un dispositivo si disconnette
    ble.onDisconnected(
        [](const EspBleConnection&) {
            arcadeMode = false;
            Serial.println("Dispositivo disconnesso");
            ble.advertising().start();
        }
    );

    // Pubblicizza il dispositivo come HID + servizio Arcade.
    // Il nome finisce automaticamente nella scan response.
    auto& advertising = ble.advertising();
    advertising.setName(DEVICE_NAME);
    advertising.setAppearance(HID_APPEARANCE);
    advertising.addServiceUuid(HID_SERVICE_UUID);
    advertising.addServiceUuid(SERVICE_UUID);

    if (!advertising.start()) {
        Serial.print("Errore advertising: ");
        Serial.println(ble.lastErrorDetail());
        return;
    }

    Serial.println("BLE pronto");
    Serial.println("Nome dispositivo: ESP32-Controller");
}

// --------------------------------------------------
// PULIZIA BOND OBSOLETI
// --------------------------------------------------

// deleteBond() richiede che non ci siano connessioni attive
void removeStaleBondIfIdle() {

    if (!staleBondPending || ble.connectionCount() != 0) {
        return;
    }

    staleBondPending = false;

    if (ble.deleteBond(staleBond)) {
        Serial.println("Bond obsoleto rimosso: riprova l'accoppiamento");
    }
}

// --------------------------------------------------
// LOOP PRINCIPALE
// --------------------------------------------------

void loop() {

    // Gestisce gli eventi BLE
    ble.update();

    removeStaleBondIfIdle();

    // Legge i pulsanti
    updateButtons();

    delay(1);
}
