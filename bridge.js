// bridge.js using plain WebSocket JSON from browser → OSC UDP
const osc = require("osc");
const WebSocket = require("ws");

console.log("[BRIDGE] Starting OSC WebSocket ↔ UDP bridge…");

// WebSocket server for browser
const wss = new WebSocket.Server({ port: 8081 }, () => {
  console.log("[BRIDGE] WebSocket server listening on ws://localhost:8081");
});

// UDP port to OSC target
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 57121,
  remoteAddress: "127.0.0.1",
  remotePort: 57120
});

udpPort.on("ready", () => {
  console.log("[BRIDGE] UDP OSC port ready");
  console.log(`[BRIDGE]  -> Sending to ${udpPort.options.remoteAddress}:${udpPort.options.remotePort}`);
});

udpPort.on("error", (err) => {
  console.error("[BRIDGE] UDP error:", err);
});

udpPort.open();

wss.on("connection", (socket) => {
  console.log("[BRIDGE] New WebSocket connection");

  socket.on("message", (data) => {
    try {
      const text = data.toString();
      console.log("[BRIDGE] Raw message from browser:", text);
      const msg = JSON.parse(text);
      console.log("[BRIDGE] Parsed OSC-ish JSON:", msg);

      // Basic validation
      if (typeof msg.address !== "string" || !Array.isArray(msg.args)) {
        console.warn("[BRIDGE] Ignoring invalid message shape");
        return;
      }

      udpPort.send(msg);
      console.log("[BRIDGE] Forwarded OSC to UDP");
    } catch (e) {
      console.error("[BRIDGE] Error handling message from browser:", e);
    }
  });

  socket.on("close", () => {
    console.log("[BRIDGE] WebSocket connection closed");
  });

  socket.on("error", (err) => {
    console.error("[BRIDGE] WebSocket error:", err);
  });
});

wss.on("error", (err) => {
  console.error("[BRIDGE] WebSocket server error:", err);
});
