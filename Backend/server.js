const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
const rooms = {}; // Store connections by room names

wss.on("connection", (ws) => {
  console.log("A user connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received:", data);

      if (data.type === "join") {
        const roomName = data.roomName;
        if (!roomName) {
          throw new Error("Room name is required");
        }

        ws.roomName = roomName; // Store room in connection context

        if (!rooms[roomName]) {
          rooms[roomName] = [];
        }
        rooms[roomName].push(ws); // Add user to room
        console.log(`User joined room: ${roomName}`);
      }

      // Broadcast only within the specific room
      if (ws.roomName && rooms[ws.roomName]) {
        rooms[ws.roomName].forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } else {
        console.warn("User is not in a room or room does not exist");
      }
    } catch (error) {
      console.error("Error processing message:", error.message);
      ws.send(JSON.stringify({ type: "error", message: error.message }));
    }
  });

  ws.on("close", () => {
    console.log("A user disconnected");

    // Remove disconnected user from their room
    if (ws.roomName && rooms[ws.roomName]) {
      rooms[ws.roomName] = rooms[ws.roomName].filter((client) => client !== ws);

      if (rooms[ws.roomName].length === 0) {
        delete rooms[ws.roomName]; // Clean up empty rooms
        console.log(`Room ${ws.roomName} deleted`);
      }
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
});

console.log("WebSocket server running on ws://localhost:3000");