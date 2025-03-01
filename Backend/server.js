const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });

wss.on("connection", (ws) => {
  console.log("A user connected");

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Received:", data);

    // Broadcast the message to all other clients except sender
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => console.log("A user disconnected"));
});

console.log("WebSocket server running on ws://localhost:3000");
