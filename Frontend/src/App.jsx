// frontend/src/App.js

import React, { useState, useEffect, useRef } from 'react';

const SIGNALING_SERVER_URL = 'ws://localhost:5000';

function App() {
  const [peerId, setPeerId] = useState('');
  const [connected, setConnected] = useState(false);
  const [remotePeerId, setRemotePeerId] = useState('');
  const [message, setMessage] = useState('');
  const ws = useRef(null);
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(SIGNALING_SERVER_URL);

    ws.current.onopen = () => {
      console.log('Connected to signaling server');
    };

    ws.current.onmessage = async (message) => {
      const data = JSON.parse(message.data);
      console.log('Received message:', data);
      
      if (data.type === 'signal' && data.signal) {
        if (data.signal.type === 'offer') {
          setupWebRTC();
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          ws.current.send(JSON.stringify({ type: 'signal', target: data.sender, signal: answer }));
        } else if (data.signal.type === 'answer') {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
        } else if (data.signal.candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.signal));
        }
      }
    };

    return () => ws.current.close();
  }, []);

  const handleJoin = () => {
    const id = Math.random().toString(36).substr(2, 6);
    setPeerId(id);
    ws.current.send(JSON.stringify({ type: 'join', id }));
    setConnected(true);
    setupWebRTC();
  };

  const setupWebRTC = () => {
    peerConnection.current = new RTCPeerConnection();
    
    // Create data channel for sending files/messages
    dataChannel.current = peerConnection.current.createDataChannel('fileChannel');
    dataChannel.current.onmessage = (event) => {
      console.log('Received:', event.data);
    };
    dataChannel.current.onopen = () => console.log('Data channel open');
    dataChannel.current.onclose = () => console.log('Data channel closed');

    peerConnection.current.ondatachannel = (event) => {
      dataChannel.current = event.channel;
      dataChannel.current.onmessage = (event) => {
        console.log('Received:', event.data);
      };
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current.send(JSON.stringify({ type: 'signal', target: remotePeerId, signal: event.candidate }));
      }
    };
  };

  const handleConnectToPeer = async () => {
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    ws.current.send(JSON.stringify({ type: 'signal', target: remotePeerId, sender: peerId, signal: offer }));
  };

  const sendMessage = () => {
    if (dataChannel.current && dataChannel.current.readyState === 'open') {
      dataChannel.current.send(message);
      console.log('Sent:', message);
    }
  };

  return (
    <div>
      <h1>FreeShare - P2P File Sharing</h1>
      {!connected ? (
        <button onClick={handleJoin}>Join Session</button>
      ) : (
        <div>
          <p>Your Peer ID: {peerId}</p>
          <input
            type="text"
            placeholder="Enter Remote Peer ID"
            value={remotePeerId}
            onChange={(e) => setRemotePeerId(e.target.value)}
          />
          <button onClick={handleConnectToPeer}>Connect to Peer</button>
          <div>
            <input
              type="text"
              placeholder="Enter message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send Message</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
