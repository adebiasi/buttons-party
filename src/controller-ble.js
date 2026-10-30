/*
 * Buttons-party: minigiochi audio per 2-4 giocatori, giocabili senza guardare lo schermo con un controller a cinque pulsanti.
 * Copyright (C) 2026  Alberto Debiasi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

(() => {
  "use strict";

  const SERVICE_UUID =
      "7b7a1000-1234-4567-890a-bcdef0123456";
  const CHARACTERISTIC_UUID =
      "7b7a1001-1234-4567-890a-bcdef0123456";

  // Il firmware passa in modalità Arcade alla connessione della pagina e
  // torna in modalità Spotify quando la pagina si disconnette o si chiude.
  const ARCADE_REQUEST = "ARCADE";
  const SPOTIFY_REQUEST = "SPOTIFY";
  const textEncoder = new TextEncoder();

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
    C_UP:   ["C", "up"]
  };

  class ArcadeBLEController {
    constructor({ onInput, onStatus }) {
      this.onInput = onInput;
      this.onStatus = onStatus;
      this.device = null;
      this.characteristic = null;
      this.enabled = false;
      this.held = new Set();
      this.writeQueue = Promise.resolve();

      this.handleNotification = this.handleNotification.bind(this);
      this.handleDisconnect = this.handleDisconnect.bind(this);

      // Tentativo di riportare il firmware in Spotify alla chiusura della scheda
      window.addEventListener("pagehide", () => {
        this.writeMode(SPOTIFY_REQUEST);
      });
    }

    setEnabled(enabled) {
      this.enabled = enabled;

      if (!enabled) {
        this.releaseAll();
        this.writeMode(SPOTIFY_REQUEST);
      } else {
        this.writeMode(ARCADE_REQUEST);
      }

      this.updateStatus();
    }

    // Web Bluetooth rifiuta operazioni GATT concorrenti: le scritture vanno in coda
    writeMode(mode) {
      const characteristic = this.characteristic;
      if (!characteristic) return Promise.resolve();

      const data = textEncoder.encode(mode);
      this.writeQueue = this.writeQueue
          .then(() => characteristic.writeValueWithoutResponse
              ? characteristic.writeValueWithoutResponse(data)
              : characteristic.writeValue(data))
          .then(() => console.log("Modalità controller inviata:", mode))
          .catch(error => {
            console.warn("Scrittura modalità controller fallita", error);
          });
      return this.writeQueue;
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

        if (this.enabled) await this.writeMode(ARCADE_REQUEST);
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

    async disconnect() {
      if (this.device?.gatt?.connected) {
        await this.writeMode(SPOTIFY_REQUEST);
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
