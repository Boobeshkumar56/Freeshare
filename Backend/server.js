const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
const rooms = {}; // Store connections by room names

wss.on("connection", (ws) => {
  console.log("A user connected");

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Received:", data);

    if (data.type === "join") {
      const roomName = data.roomName;
      ws.roomName = roomName; // Store room in connection context

      if (!rooms[roomName]) {
        rooms[roomName] = [];
      }
      rooms[roomName].push(ws); // Add user to room
    }

    // Broadcast only within the specific room
    if (ws.roomName) {
      rooms[ws.roomName].forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("A user disconnected");

    // Remove disconnected user from their room
    if (ws.roomName && rooms[ws.roomName]) {
      rooms[ws.roomName] = rooms[ws.roomName].filter((client) => client !== ws);

      if (rooms[ws.roomName].length === 0) {
        delete rooms[ws.roomName]; // Clean up empty rooms
      }
    }
  });
});

console.log("WebSocket server running on ws://localhost:3000");
