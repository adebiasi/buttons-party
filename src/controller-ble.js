(() => {
  "use strict";

  const SERVICE_UUID =
      "7b7a1000-1234-4567-890a-bcdef0123456";
  const CHARACTERISTIC_UUID =
      "7b7a1001-1234-4567-890a-bcdef0123456";

  const EVENTS = {
    P1_DOWN: ["P1", "down"],
    P1_UP:   ["P1", "up"],
    P2_DOWN: ["P2", "down"],
    P2_UP:   ["P2", "up"],
    P3_DOWN: ["P3", "down"],
    P3_UP:   ["P3", "up"],
    P4_DOWN: ["P4", "down"],
    P4_UP:   ["P4", "up"],
    C_DOWN: ["C", "down"],
     _UP:   ["C", "up"]
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
        filters: [{ name: "ESP32-Controller" }],
        optionalServices: [SERVICE_UUID]
      });

      await this.attach(device);
    }

    // Ricollega senza finestra di scelta un controller già autorizzato in passato
    // (richiede navigator.bluetooth.getDevices). Restituisce true se collegato.
    async reconnectKnown(timeoutMs = 5000) {
      if (!navigator.bluetooth?.getDevices) return false;
      const devices = await navigator.bluetooth.getDevices();
      const device = devices.find(d => d.name === "ESP32-Controller");
      if (!device) return false;
      let timer;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Timeout")), timeoutMs);
      });
      try {
        await Promise.race([this.attach(device), timeout]);
        return this.isConnected();
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    }

    isConnected() {
      return Boolean(this.device?.gatt?.connected && this.characteristic);
    }

    async attach(device) {
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

      console.log("handleNotification", message);

      const input = EVENTS[message];

      console.log("handleNotification", input);

      if (!input || !this.enabled) return;

      const [button, type] = input;
      console.log("handleNotification", button, type);
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