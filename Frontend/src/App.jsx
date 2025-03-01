import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ws = new WebSocket("wss://92a5-14-97-230-178.ngrok-free.app");

const App = () => {
  const [mode, setMode] = useState(null); // 'sender' or 'receiver'
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [receivedFile, setReceivedFile] = useState(null);
  const pc = useRef(new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:global.relay.metered.ca:80", // Replace with your TURN server
        username: "your-username",
        credential: "your-password",
      },
    ],
  }));
  const dataChannel = useRef(null);
  const receivedChunks = useRef([]);
  const receivedFileName = useRef("");

  useEffect(() => {
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "offer" && mode === "receiver") {
        await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
      } else if (data.type === "answer" && mode === "sender") {
        await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === "ice-candidate") {
        await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };
  }, [mode]);

  const startConnection = async () => {
    if (mode === "sender") {
      dataChannel.current = pc.current.createDataChannel("file-transfer");
      setupDataChannel();
    }

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
      }
    };

    if (mode === "sender") {
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: "offer", offer }));
      toast.success("Connection started!");
    }

    pc.current.ondatachannel = (event) => {
      dataChannel.current = event.channel;
      setupDataChannel();
    };
  };

  const setupDataChannel = () => {
    dataChannel.current.binaryType = "arraybuffer";
    dataChannel.current.onopen = () => toast.success("✅ Data Channel Open!");
    dataChannel.current.onclose = () => toast.error("❌ Data Channel Closed!");
    dataChannel.current.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        receivedChunks.current.push(event.data);
      } else if (event.data.startsWith("filename:")) {
        receivedFileName.current = event.data.split(":")[1];
      } else if (event.data === "EOF") {
        assembleFile();
      }
    };
  };

  const sendFile = async () => {
    if (!file || !dataChannel.current) {
      toast.error("No file selected or connection not open!");
      return;
    }
    if (dataChannel.current.readyState !== "open") {
      toast.error("Data channel is not open!");
      return;
    }
    
    let chunkSize = 256 * 1024;
    let offset = 0;
    dataChannel.current.send(`filename:${file.name}`);

    const readChunk = () => {
      if (offset >= file.size) {
        dataChannel.current.send("EOF");
        toast.success("File sent successfully!");
        return;
      }

      const chunk = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();
      reader.onload = async (event) => {
        while (dataChannel.current.bufferedAmount > 4 * chunkSize) {
          await new Promise((resolve) => (dataChannel.current.onbufferedamountlow = resolve));
        }

        if (dataChannel.current.readyState === "open") {
          dataChannel.current.send(event.target.result);
          offset += chunkSize;
          setProgress(Math.round((offset / file.size) * 100));
          readChunk();
        } else {
          toast.error("Data channel closed unexpectedly!");
        }
      };
      reader.readAsArrayBuffer(chunk);
    };
    readChunk();
  };

  const assembleFile = () => {
    const blob = new Blob(receivedChunks.current);
    setReceivedFile(URL.createObjectURL(blob));
    receivedChunks.current = [];
    toast.success("File received successfully!");
  };

  return (
    <div className="flex flex-col items-center p-5">
      <h2 className="text-2xl font-bold">WebRTC File Transfer</h2>
      {!mode ? (
        <div className="mt-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded mr-2" onClick={() => setMode("sender")}>
            I'm a Sender
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => setMode("receiver")}>
            I'm a Receiver
          </button>
        </div>
      ) : (
        <>
          <button className="bg-blue-500 text-white px-4 py-2 rounded mt-4" onClick={startConnection}>
            Start Connection
          </button>
          {mode === "sender" && (
            <div className="mt-4">
              <input type="file" onChange={(e) => setFile(e.target.files[0])} className="border p-2" />
              <button className="bg-green-500 text-white px-4 py-2 rounded ml-2" onClick={sendFile}>
                Send File
              </button>
              {progress > 0 && <p className="mt-2">Transfer Progress: {progress}%</p>}
            </div>
          )}
          {mode === "receiver" && receivedFile && (
            <div className="mt-4">
              <p>File Received: {receivedFileName.current}</p>
              <a href={receivedFile} download={receivedFileName.current} className="text-blue-500 underline">
                Download
              </a>
            </div>
          )}
        </>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default App;
