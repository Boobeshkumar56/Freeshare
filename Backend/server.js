// backend/server.js

const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let peers = {}; // Store connected peers

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'join':
                peers[data.id] = ws;
                break;
            case 'signal':
                if (peers[data.target]) {
                    peers[data.target].send(JSON.stringify({
                        type: 'signal',
                        sender: data.sender,
                        signal: data.signal
                    }));
                }
                break;
            case 'disconnect':
                delete peers[data.id];
                break;
        }
    });

    ws.on('close', () => {
        for (let id in peers) {
            if (peers[id] === ws) {
                delete peers[id];
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

