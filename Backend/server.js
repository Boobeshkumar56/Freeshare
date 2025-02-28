require("dotenv").config();
const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

// Create WebSocket Server
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocket signaling server running on ws://localhost:${PORT}`);
});

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    // Broadcast messages to all clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => console.log("Client disconnected"));
});

