let socket;
export const connectSignalingServer = (peerId, peerConnection) => {
    socket = new WebSocket('ws://4772-106-51-44-202.ngrok-free.app ');

    socket.onopen = () => {
        socket.send(JSON.stringify({ type: "register", id: peerId }));
    };

    socket.onmessage = async (message) => {
        let data = JSON.parse(message.data);
        switch (data.type) {
            case "offer":
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                sendSignalingMessage(data.from, { type: "answer", answer });
                break;
            case "answer":
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                break;
            case "candidate":
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                break;
        }
    };

    return socket;
};

export const sendSignalingMessage = (to, message) => {
    if (socket) {
        socket.send(JSON.stringify({ to, ...message }));
    }
};
