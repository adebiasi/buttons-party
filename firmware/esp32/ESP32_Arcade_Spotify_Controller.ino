
#include <EspBle.h>

// ---------------- CONFIGURAZIONE ----------------

#define DEVICE_NAME "ESP32-Controller"

#define SERVICE_UUID \
  "7b7a1000-1234-4567-890a-bcdef0123456"

#define CHARACTERISTIC_UUID \
  "7b7a1001-1234-4567-890a-bcdef0123456"

const int buttonPins[] = {18, 19, 21, 22, 23};

const char* buttonNames[] = {
  "P1", "P2", "P3", "P4", "C"
};

const int BUTTON_COUNT = 5;
const unsigned long DEBOUNCE_MS = 25;

// ---------------- BLE ----------------

EspBle ble;

EspBleGattCharacteristic eventCharacteristic;

bool controllerMode = false;
bool arcadeSubscribed = false;

// ---------------- PULSANTI ----------------

bool lastReading[BUTTON_COUNT];
bool stableState[BUTTON_COUNT];

unsigned long lastDebounceTime[BUTTON_COUNT];

// ---------------- INIZIALIZZAZIONE ----------------

void initButtons() {
  for (int i = 0; i < BUTTON_COUNT; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);

    lastReading[i] = digitalRead(buttonPins[i]);
    stableState[i] = lastReading[i];

    lastDebounceTime[i] = 0;
  }
}

// ---------------- MODALITÀ ARCADE ----------------

void startArcadeMode() {

  Serial.println("Avvio modalità ARCADE");

  auto& gattServer = ble.gattServer();

  // Configurazione caratteristica notificabile
  EspBleGattCharacteristicConfig characteristicConfig;
  characteristicConfig.notifiable = true;

  // Registrazione servizio e caratteristica PRIMA di begin()
  const EspBleGattService service =
    gattServer.addService(SERVICE_UUID);

  eventCharacteristic =
    gattServer.addCharacteristic(
      service,
      CHARACTERISTIC_UUID,
      characteristicConfig
    );

  // Rileva la sottoscrizione alle notifiche
  gattServer.onSubscriptionChanged(
    [](const EspBleGattSubscription& subscription) {

      if (subscription.characteristic != eventCharacteristic) {
        return;
      }

      arcadeSubscribed = subscription.notifications;

      Serial.println(
        arcadeSubscribed
          ? "Arcade: notifiche attive"
          : "Arcade: notifiche disattivate"
      );
    }
  );

  EspBleConfig config;
  config.deviceName = DEVICE_NAME;

  if (!ble.begin(config)) {
    Serial.print("Errore BLE: ");
    Serial.println(ble.lastErrorDetail().c_str());
    return;
  }

  ble.onDisconnected(
    [](const EspBleConnection&) {
      arcadeSubscribed = false;
      ble.advertising().start();
      Serial.println("Arcade: dispositivo disconnesso");
    }
  );

  ble.advertising().setName(DEVICE_NAME);
  ble.advertising().addServiceUuid(SERVICE_UUID);
  ble.advertising().start();

  Serial.println("Arcade BLE pronto");
}

// ---------------- MODALITÀ SPOTIFY ----------------

void startControllerMode() {

  Serial.println("Avvio modalità SPOTIFY HID");

  // Configurazione HID PRIMA di begin()
  ble.hidConsumerControl().configure();

  EspBleConfig config;
  config.deviceName = DEVICE_NAME;

  config.security.enabled = true;
  config.security.bonding = true;

  if (!ble.begin(config)) {
    Serial.print("Errore BLE: ");
    Serial.println(ble.lastErrorDetail().c_str());
    return;
  }

  ble.onDisconnected(
    [](const EspBleConnection&) {
      ble.advertising().start();
      Serial.println("HID: dispositivo disconnesso");
    }
  );

  ble.advertising().setName(DEVICE_NAME);
  ble.advertising().start();

  Serial.println("Controller HID pronto");
}

// ---------------- COMANDI SPOTIFY ----------------

void sendMediaCommand(int button) {

  if (!ble.hidConsumerControl().ready()) {
    Serial.println("HID non ancora pronto");
    return;
  }

  switch (button) {

    case 0:
      Serial.println("NEXT TRACK");
      ble.hidConsumerControl().click(
        ESP_BLE_HID_CONSUMER_CONTROL_NEXT_TRACK
      );
      break;

    case 1:
      Serial.println("VOLUME DOWN");
      ble.hidConsumerControl().click(
        ESP_BLE_HID_CONSUMER_CONTROL_VOLUME_DOWN
      );
      break;

    case 2:
      Serial.println("PREVIOUS TRACK");
      ble.hidConsumerControl().click(
        ESP_BLE_HID_CONSUMER_CONTROL_PREVIOUS_TRACK
      );
      break;

    case 3:
      Serial.println("VOLUME UP");
      ble.hidConsumerControl().click(
        ESP_BLE_HID_CONSUMER_CONTROL_VOLUME_UP
      );
      break;

    case 4:
      Serial.println("PLAY / PAUSE");
      ble.hidConsumerControl().click(
        ESP_BLE_HID_CONSUMER_CONTROL_PLAY_PAUSE
      );
      break;
  }
}

// ---------------- EVENTI ARCADE ----------------

void sendArcadeEvent(int button, bool pressed) {

  if (!arcadeSubscribed) {
    return;
  }

  String message = String(buttonNames[button]);

  message += pressed ? "_DOWN" : "_UP";

  ble.gattServer().notify(eventCharacteristic, message);

  Serial.println(message);
}

// ---------------- LETTURA PULSANTI ----------------

void updateButtons() {

  unsigned long now = millis();

  for (int i = 0; i < BUTTON_COUNT; i++) {

    bool reading = digitalRead(buttonPins[i]);

    if (reading != lastReading[i]) {
      lastDebounceTime[i] = now;
      lastReading[i] = reading;
    }

    if (now - lastDebounceTime[i] > DEBOUNCE_MS) {

      if (reading != stableState[i]) {

        stableState[i] = reading;

        bool pressed = (stableState[i] == LOW);

        if (controllerMode) {

          // Spotify: invia il comando solo alla pressione
          if (pressed) {
            sendMediaCommand(i);
          }

        } else {

          // Arcade: invia pressione e rilascio
          sendArcadeEvent(i, pressed);

        }
      }
    }
  }
}

// ---------------- SETUP ----------------

void setup() {

  Serial.begin(115200);

  initButtons();

  delay(100);

  // C premuto all'accensione = Spotify
  controllerMode = (digitalRead(23) == LOW);

  Serial.println();
  Serial.println("========================");

  if (controllerMode) {
    Serial.println("MODALITA SPOTIFY");
    startControllerMode();
  } else {
    Serial.println("MODALITA ARCADE");
    startArcadeMode();
  }

  Serial.println("========================");
}

// ---------------- LOOP ----------------

void loop() {

  ble.update();

  updateButtons();

  delay(1);
}
