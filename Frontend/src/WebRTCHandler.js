import { useEffect, useState } from "react";
import SimplePeer from "simple-peer";

const SIGNALING_SERVER = "ws://localhost:3001";  // Change to Ngrok/Vercel URL

export const useWebRTC = () => {
  const [peer, setPeer] = useState(null);
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(SIGNALING_SERVER);
    setConnection(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.signal) {
        peer.signal(data.signal);
      }
    };

    return () => ws.close();
  }, []);

  const createPeer = (initiator) => {
    const newPeer = new SimplePeer({ initiator, trickle: false });
    
    newPeer.on("signal", (signal) => {
      connection.send(JSON.stringify({ signal }));
    });

    setPeer(newPeer);
  };

  return { createPeer, peer };
};
