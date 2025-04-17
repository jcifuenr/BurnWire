import React, { useState } from "react";

export default function App() {
  
  const [bleUnsupported, setBleUnsupported] = useState(false);
const [device, setDevice] = useState(null);
  const [rxChar, setRxChar] = useState(null);
  const [txChar, setTxChar] = useState(null);
  const [log, setLog] = useState([]);
  const [minutos, setMinutos] = useState(5);

  const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  const CHARACTERISTIC_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
  const CHARACTERISTIC_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

  const appendLog = (msg) => setLog((prev) => [...prev, msg]);

  const connect = async () => {
    if (!navigator.bluetooth) {
      appendLog("❌ Este navegador no soporta Web Bluetooth.");
      setBleUnsupported(true);
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'ESP32' }],
        optionalServices: [SERVICE_UUID],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      const rx = await service.getCharacteristic(CHARACTERISTIC_RX);
      const tx = await service.getCharacteristic(CHARACTERISTIC_TX);

      await tx.startNotifications();
      tx.addEventListener("characteristicvaluechanged", (event) => {
        const value = new TextDecoder().decode(event.target.value);
        appendLog("ESP32: " + value);
      });

      setDevice(device);
      setRxChar(rx);
      setTxChar(tx);
      appendLog("✅ Conectado a " + device.name);
    } catch (error) {
      appendLog("❌ Error al conectar: " + error.message);
    }
  };

  const sendCommand = async (cmd) => {
    if (!rxChar) return;
    const data = new TextEncoder().encode(cmd + "\n");
    await rxChar.writeValue(data);
    appendLog("📤 Enviado: " + cmd);
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: 600, margin: "auto" }}>
      <h2>BurnWire_control 🔗</h2>
      <button onClick={connect}>🔌 Conectar BLE</button>
      {bleUnsupported && (
        <div style={{ padding: '10px', background: '#ffdddd', color: '#a00', marginTop: '15px' }}>
          🚫 Web Bluetooth no está disponible. Usa Safari (iOS 16.4+) o Chrome (Android/PC).
        </div>
      )}


      <div style={{ marginTop: 20 }}>
        <input
          type="number"
          min="1"
          max="1440"
          value={minutos}
          onChange={(e) => setMinutos(e.target.value)}
        />
        <button onClick={() => sendCommand(`minutos ${minutos}`)}>Establecer minutos</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={() => sendCommand("activar")}>✅ Activar</button>
        <button onClick={() => sendCommand("pause")}>⏸️ Pausar</button>
        <button onClick={() => sendCommand("reset")}>🔁 Reset</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>📋 Log:</h4>
        <div style={{ border: "1px solid #ccc", padding: 10, height: 200, overflowY: "auto" }}>
          {log.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
