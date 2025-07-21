import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const Room = ({
  name,
  localAudioTrack,
  localVideoTrack,
}: {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
}) => {
  const URL = "http://localhost:8000";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [peerName, setPeerName] = useState<string>("");
  const [socket, setsocket] = useState<null | Socket>(null);
  const [lobby, setLobby] = useState(true);
  const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
  const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(
    null
  );

  useEffect(() => {
    const socket = io(URL);

    socket.on("send-offer", async ({ roomId }) => {
      const pc = new RTCPeerConnection();

      console.log("Sending offer..");
      setLobby(false);

      setSendingPc(pc);

      if (localVideoTrack) {
        pc.addTrack(localVideoTrack);
      }
      if (localAudioTrack) {
        pc.addTrack(localAudioTrack);
      }

      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer();
        pc.setLocalDescription(offer);

        socket.emit("offer", {
          sdp: offer.sdp,
          roomId,
          name,
        });
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          socket.emit("add-ice-candidate", {
            roomId,
            candidate: event.candidate,
            type: "sender",
          });
        }
      };
    });
    socket.on("offer", async ({ roomId, sdp, name }) => {
      const pc = new RTCPeerConnection();
      setPeerName(name);

      console.log("Send answer please..");
      setLobby(false);
      setReceivingPc(pc);

      const remoteStream = new MediaStream();
      remoteVideoRef.current &&
        (remoteVideoRef.current.srcObject = remoteStream);

      pc.ontrack = (e) => {
        console.log("Ontrack called!");

        console.log(e.track);
        remoteStream.addTrack(e.track);

        // if (e.track.kind == "video") {
        //   remoteVideoRef.current &&
        //     (remoteVideoRef.current.srcObject = new MediaStream([e.track]));
        // //   remoteStream.addTrack(e.track);
        // }
        // if (e.track.kind == "audio") {
        //   remoteVideoRef.current &&
        //     (remoteVideoRef.current.srcObject = new MediaStream([e.track]));
        // //   remoteStream.addTrack(e.track);
        // }
      };

      pc.setRemoteDescription({ sdp, type: "offer" });

      const answer = await pc.createAnswer();

      pc.setLocalDescription(answer);

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          socket.emit("add-ice-candidate", {
            roomId,
            candidate: event.candidate,
            type: "receiver",
          });
        }
      };

      socket.emit("answer", {
        sdp: answer.sdp,
        roomId,
      });
    });
    socket.on("answer", ({ roomId, sdp }) => {
      setLobby(false);
      setSendingPc((pc) => {
        pc?.setRemoteDescription({ sdp, type: "answer" });
        return pc;
      });

      console.log("Connected!");
    });
    

    socket.on("add-ice-candidate", ({ candidate, type }) => {

      console.log("on add-ace-candidate");

      if (type == "sender") {
        setReceivingPc((pc) => {
          pc?.addIceCandidate(candidate);
          return pc;
        });
      } else {
        setSendingPc((pc) => {
          pc?.addIceCandidate(candidate);
          return pc;
        });
      }
    });

    socket.on("lobby", () => {
      setLobby(true);
    });

    setsocket(socket);
  }, [name]);

  useEffect(() => {
    if (videoRef.current && localVideoTrack) {
      videoRef.current.srcObject = new MediaStream([localVideoTrack]);
      videoRef.current.play();
    }
  }, [videoRef, localVideoTrack]);

  return (
    <div>
      {lobby ? <div>Waiting to connect to someone..</div> : null}
      <video
        className=""
        id="remote"
        autoPlay
        height={400}
        width={400}
        ref={remoteVideoRef}
      ></video>

      <div>
        <video
        
          id="local"
          autoPlay
          height={400}
          ref={videoRef}
          width={400}
        ></video>
      </div>
    </div>
  );
};

export default Room;
