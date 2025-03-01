import { io } from "socket.io-client";

const socket = io("wss://freeshare-f2ak.onrender.com");

let peerConnection;
let dataChannel;

export function createPeerConnection(onFileReceive) {
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  dataChannel = peerConnection.createDataChannel("fileTransfer");

  peerConnection.ondatachannel = (event) => {
    event.channel.onmessage = (e) => {
      const receivedData = e.data;
      onFileReceive(receivedData); // Handle received file
    };
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };
}

export async function createOffer() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
}

export async function handleOffer(offer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
}

export function sendFile(file) {
  dataChannel.send(file);
}

// Handle signaling messages from server
socket.on("offer", handleOffer);
socket.on("answer", (answer) => peerConnection.setRemoteDescription(answer));
socket.on("ice-candidate", (candidate) => peerConnection.addIceCandidate(candidate));
