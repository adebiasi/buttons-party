(() => {
  "use strict";

  const SERVICE_UUID =
      "7b100001-7b10-4b10-8b10-7b1000000001";
  const CHARACTERISTIC_UUID =
      "7b100002-7b10-4b10-8b10-7b1000000001";

  const EVENTS = {
    P1_DOWN: ["P1", "down"],
    P1_UP:   ["P1", "up"],
    P2_DOWN: ["P2", "down"],
    P2_UP:   ["P2", "up"],
    P3_DOWN: ["P3", "down"],
    P3_UP:   ["P3", "up"],
    P4_DOWN: ["P4", "down"],
    P4_UP:   ["P4", "up"],
    C:       ["C",  "down"]   // evento singolo "C"
  };

  class ArcadeBLEController {
    constructor({ onInput, onStatus }) {
      this.onInput = onInput;
      this.onStatus = onStatus;
      this.device = null;
      this.characteristic = null;
      this.enabled = false;
      this.held = new Set();

      this.handleNotification = this.handleNotification.bind(this);
      this.handleDisconnect = this.handleDisconnect.bind(this);
    }

    setEnabled(enabled) {
      this.enabled = enabled;

      if (!enabled) {
        this.releaseAll();
      }

      this.updateStatus();
    }

    async connect() {
      if (!navigator.bluetooth) {
        throw new Error(
            "Web Bluetooth non disponibile. Usa Chrome su localhost."
        );
      }

      this.onStatus("Ricerca controller…");

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: "ESP32-Pulsantiera" }],
        optionalServices: [SERVICE_UUID]
      });

      this.device = device;
      device.addEventListener(
          "gattserverdisconnected",
          this.handleDisconnect
      );

      try {
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);

        this.characteristic = await service.getCharacteristic(
            CHARACTERISTIC_UUID
        );

        await this.characteristic.startNotifications();
        this.characteristic.addEventListener(
            "characteristicvaluechanged",
            this.handleNotification
        );

        this.updateStatus();
      } catch (error) {
        this.device.removeEventListener(
            "gattserverdisconnected",
            this.handleDisconnect
        );
        this.device = null;
        this.characteristic = null;
        this.updateStatus();
        throw error;
      }
    }

    handleNotification(event) {
      const message = new TextDecoder()
          .decode(event.target.value)
          .trim();

      const input = EVENTS[message];
      if (!input || !this.enabled) return;

      const [button, type] = input;

      // Ignora notifiche duplicate dello stesso stato.
      if (type === "down") {
        if (this.held.has(button)) return;
        this.held.add(button);
      } else {
        if (!this.held.has(button)) return;
        this.held.delete(button);
      }

      this.onInput(button, type);
    }

    releaseAll() {
      for (const button of this.held) {
        this.onInput(button, "up");
      }
      this.held.clear();
    }

    handleDisconnect() {
      this.releaseAll();
      this.characteristic = null;
      this.device = null;
      this.updateStatus();
    }

    disconnect() {
      if (this.device?.gatt?.connected) {
        this.device.gatt.disconnect();
      } else {
        this.handleDisconnect();
      }
    }

    updateStatus() {
      const connected = Boolean(
          this.device?.gatt?.connected && this.characteristic
      );

      this.onStatus(
          !this.enabled
              ? "Controller disabilitato"
              : connected
                  ? "Controller connesso"
                  : "Controller non connesso"
      );
    }
  }

  window.ArcadeBLEController = ArcadeBLEController;
})();