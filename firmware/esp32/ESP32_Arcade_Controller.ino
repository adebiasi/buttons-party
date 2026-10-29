
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Identificativi BLE: devono corrispondere alla pagina HTML
#define SERVICE_UUID        "7b7a1000-1234-4567-890a-bcdef0123456"
#define CHARACTERISTIC_UUID "7b7a1001-1234-4567-890a-bcdef0123456"

const int BUTTON_COUNT = 5;

const int buttonPins[BUTTON_COUNT] = {
  18, 19, 21, 22, 23
};

const char* buttonNames[BUTTON_COUNT] = {
  "P1", "P2", "P3", "P4", "C"
};

bool stableState[BUTTON_COUNT];
bool lastReading[BUTTON_COUNT];
unsigned long lastChange[BUTTON_COUNT];

const unsigned long DEBOUNCE_MS = 25;

BLECharacteristic* eventCharacteristic = nullptr;
bool deviceConnected = false;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* server) override {
    deviceConnected = true;
  }

  void onDisconnect(BLEServer* server) override {
    deviceConnected = false;
    BLEDevice::startAdvertising();
  }
};

void sendEvent(const char* name, bool pressed) {
  if (!deviceConnected || eventCharacteristic == nullptr) {
    return;
  }

  String event = String(name) + (pressed ? "_DOWN" : "_UP");

  eventCharacteristic->setValue(event.c_str());
  eventCharacteristic->notify();
}

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < BUTTON_COUNT; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
    stableState[i] = digitalRead(buttonPins[i]);
    lastReading[i] = stableState[i];
    lastChange[i] = millis();
  }

  BLEDevice::init("ESP32-Controller");

  BLEServer* server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService* service = server->createService(SERVICE_UUID);

  eventCharacteristic = service->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );

  eventCharacteristic->addDescriptor(new BLE2902());
  eventCharacteristic->setValue("READY");

  service->start();

  BLEAdvertising* advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.println("BLE pronto: ESP32-Controller");
}

void loop() {
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
      sendEvent(buttonNames[i], stableState[i] == LOW);
    }
  }

  delay(1);
}
