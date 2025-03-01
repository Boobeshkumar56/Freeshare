import React, { useState } from "react";
import { createPeerConnection, createOffer, sendFile } from "./WebRTCHandler";

const FileTransfer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [receivedFile, setReceivedFile] = useState(null);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSend = () => {
    if (selectedFile) {
      sendFile(selectedFile);
    }
  };

  createPeerConnection((data) => {
    setReceivedFile(data);
  });

  return (
    <div>
      <h2>WebRTC File Transfer</h2>
      <input type="file" onChange={handleFileSelect} />
      <button onClick={handleSend}>Send</button>
      {receivedFile && <a href={URL.createObjectURL(receivedFile)} download="received_file">Download Received File</a>}
    </div>
  );
};

export default FileTransfer;
