
#include <Arduino.h>
#include <EspBle.h>

// =====================================================
// Identita BLE: compatibile con la pagina HTML esistente
// =====================================================

#define SERVICE_UUID \
  "7b7a1000-1234-4567-890a-bcdef0123456"

#define CHARACTERISTIC_UUID \
  "7b7a1001-1234-4567-890a-bcdef0123456"

static const char* DEVICE_NAME = "ESP32-Controller";

const int BUTTON_COUNT = 5;

const int buttonPins[BUTTON_COUNT] = {
  18, 19, 21, 22, 23
};

const char* buttonNames[BUTTON_COUNT] = {
  "P1", "P2", "P3", "P4", "C"
};

const unsigned long DEBOUNCE_MS = 25;

// =====================================================
// Stato pulsanti
// INPUT_PULLUP: LOW = premuto
// =====================================================

bool stableState[BUTTON_COUNT];
bool lastReading[BUTTON_COUNT];
unsigned long lastChange[BUTTON_COUNT];

// =====================================================
// Bluetooth: GATT + HID sulla stessa istanza
// =====================================================

EspBle ble;

EspBleGattCharacteristic eventCharacteristic;
bool bleStarted = false;

// =====================================================
// Invia gli eventi alla pagina HTML
// =====================================================

void sendBleEvent(const char* name, bool pressed) {
  if (!bleStarted || !eventCharacteristic.valid()) {
    return;
  }

  String event = String(name);
  event += pressed ? "_DOWN" : "_UP";

  ble.gattServer().notify(eventCharacteristic, event);

  Serial.print("BLE GATT: ");
  Serial.println(event);
}

// =====================================================
// Invia i comandi multimediali ad Android
// =====================================================

void sendMediaCommand(int index) {
  auto& media = ble.hidConsumerControl();

  if (!media.ready()) {
    Serial.println("HID non pronto: nessun host multimediale collegato");
    return;
  }

  switch (index) {
    case 0:
      Serial.println("HID: traccia precedente");
      media.click(ESP_BLE_HID_CONSUMER_CONTROL_PREVIOUS_TRACK);
      break;

    case 1:
      Serial.println("HID: play / pausa");
      media.click(ESP_BLE_HID_CONSUMER_CONTROL_PLAY_PAUSE);
      break;

    case 2:
      Serial.println("HID: traccia successiva");
      media.click(ESP_BLE_HID_CONSUMER_CONTROL_NEXT_TRACK);
      break;

    case 3:
      Serial.println("HID: volume giu");
      media.click(ESP_BLE_HID_CONSUMER_CONTROL_VOLUME_DOWN);
      break;

    case 4:
      Serial.println("HID: volume su");
      media.click(ESP_BLE_HID_CONSUMER_CONTROL_VOLUME_UP);
      break;
  }
}

// =====================================================
// Inizializzazione
// =====================================================

void setup() {
  Serial.begin(115200);

  // Pulsanti
  for (int i = 0; i < BUTTON_COUNT; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);

    stableState[i] = digitalRead(buttonPins[i]);
    lastReading[i] = stableState[i];
    lastChange[i] = millis();
  }

  // Configura il servizio HID per i tasti multimediali.
  // Deve avvenire prima di ble.begin().
  ble.hidConsumerControl().configure();

  // Configura il servizio GATT personalizzato.
  auto& gatt = ble.gattServer();

  EspBleGattCharacteristicConfig charConfig;
  charConfig.readable = true;
  charConfig.notifiable = true;

  EspBleGattService service =
      gatt.addService(SERVICE_UUID);

  eventCharacteristic = gatt.addCharacteristic(
      service,
      CHARACTERISTIC_UUID,
      charConfig
  );

  if (!service.valid() || !eventCharacteristic.valid()) {
    Serial.println("ERRORE: configurazione GATT fallita");
    return;
  }

  if (!gatt.setValue(eventCharacteristic, String("READY"))) {
    Serial.println("ERRORE: valore iniziale GATT");
    return;
  }

  // Configurazione generale BLE e associazione HID.
  EspBleConfig config;
  config.deviceName = DEVICE_NAME;
  config.security.enabled = true;
  config.security.bonding = true;

  if (!ble.begin(config)) {
    Serial.print("ERRORE inizializzazione BLE: ");
    Serial.println(ble.lastErrorDetail());
    return;
  }

  bleStarted = true;

  // Riavvia l'advertising dopo una disconnessione.
  ble.onDisconnected([](const EspBleConnection&) {
    ble.advertising().start();
  });

  // Nome invariato per la ricerca della pagina HTML.
  auto& advertising = ble.advertising();
  advertising.setName(DEVICE_NAME);

  // Servizio della pagina HTML.
  advertising.addServiceUuid(SERVICE_UUID);

  // Servizio standard HID (Human Interface Device).
  advertising.addServiceUuid("1812");

  if (!advertising.start()) {
    Serial.print("ERRORE advertising: ");
    Serial.println(ble.lastErrorDetail());
    bleStarted = false;
    return;
  }

  Serial.println();
  Serial.println("ESP32-Controller pronto");
  Serial.println("GATT: eventi per la pagina HTML");
  Serial.println("HID: comandi multimediali Android");
}

// =====================================================
// Loop principale: debounce condiviso
// =====================================================

void loop() {
  if (!bleStarted) {
    delay(100);
    return;
  }

  // Necessario per elaborare gli eventi asincroni EspBle.
  ble.update();

  unsigned long now = millis();

  for (int i = 0; i < BUTTON_COUNT; i++) {
    bool reading = digitalRead(buttonPins[i]);

    if (reading != lastReading[i]) {
      lastReading[i] = reading;
      lastChange[i] = now;
    }

    if (now - lastChange[i] >= DEBOUNCE_MS &&
        reading != stableState[i]) {

      stableState[i] = reading;

      bool pressed = (stableState[i] == LOW);

      // 1. Mantiene la funzionalita della pagina HTML.
      sendBleEvent(buttonNames[i], pressed);

      // 2. Invia il comando multimediale soltanto alla pressione.
      if (pressed) {
        sendMediaCommand(i);
      }
    }
  }

  delay(1);
}
