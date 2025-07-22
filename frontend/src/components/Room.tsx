import { Mic, MicOff, Phone, Repeat2, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { redirect } from "react-router-dom";
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

  const [muteAudio, setMuteAudio] = useState(false);
  const [muteVideo, setMuteVideo] = useState(false);

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

        if (e.track.kind == "video") {
          remoteStream.addTrack(e.track);
        }
        if (e.track.kind == "audio") {
          remoteStream.addTrack(e.track);
        }
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
    socket.on("answer", ({ sdp }) => {
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
  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.enabled = !localVideoTrack.enabled;
      setMuteVideo(!localVideoTrack.enabled);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = !localVideoTrack?.enabled
        ? null
        : new MediaStream([localVideoTrack]);
      localVideoTrack?.enabled
        ? videoRef.current.play()
        : videoRef.current.pause();
    }
  };
  const toggleAudio = () => {
    if (localAudioTrack) {
      localAudioTrack.enabled = !localAudioTrack.enabled;
      setMuteAudio(!localAudioTrack.enabled);
    }
  };
  useEffect(() => {
    if (videoRef.current && localVideoTrack) {
      videoRef.current.srcObject = new MediaStream([localVideoTrack]);
      videoRef.current.play();
    }
  }, [videoRef, localVideoTrack]);

  return (
    <div className="container ">
      <div className="flex justify-center w-full h-full  ">
        <div className="min-h-[600px] bg-black min-w-[800px] rounded overflow-hidden flex justify-center items-center">
          {lobby ? (
            "Connecting you to someone.."
          ) : (
            <video
              className=""
              id="remote"
              autoPlay
              height={800}
              width={800}
              ref={remoteVideoRef}
            ></video>
          )}
        </div>

        <div className="  flex justify-between flex-col gap-2 px-2">
          <div className="flex flex-col bg-black/20 rounded items-center justify-around  h-full px-2">
            <button
              onClick={() => {
                toggleAudio();
              }}
              className={`rounded-full ${
                muteAudio
                  ? "bg-red-800/20 hover:bg-red-800/30"
                  : "bg-green-400/70 hover:bg-green-400/60"
              }  flex justify-center p-4 cursor-pointer`}
            >
              {muteAudio ? <MicOff /> : <Mic className=" " />}
            </button>
            <button
              onClick={() => {
                toggleVideo();
              }}
              className={`rounded-full  ${
                muteVideo
                  ? "bg-red-800/20 hover:bg-red-800/30"
                  : "bg-green-400/70 hover:bg-green-400/60"
              }  flex justify-center p-4 cursor-pointer`}
            >
              {muteVideo ? <VideoOff /> : <Video className="" />}
            </button>
            <button
              disabled={lobby}
              className="rounded-full disabled:bg-white/10 disabled:cursor-not-allowed hover:bg-white/10 disabled:text-white/20 flex justify-center p-4 cursor-pointer"
            >
              <Repeat2 />
            </button>
            <button
              onClick={() => {}}
              disabled={lobby}
              className="rounded-full bg-red-800 disabled:cursor-not-allowed disabled:bg-red-800/20 hover:bg-red-800/80 flex justify-center p-4 cursor-pointer"
            >
              <Phone className="rotate-[135deg] " />
            </button>
          </div>
          <div className="w-full min-h-[150px] bg-black rounded overflow-hidden">
            <video
              className=""
              id="local"
              autoPlay
              height={200}
              ref={videoRef}
              width={200}
            ></video>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
