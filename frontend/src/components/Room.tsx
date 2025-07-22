import { Mic, MicOff, Phone, Repeat2, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import ListMenu from "./Menu";

const Room = ({
  mediaDevices,
  name,
  localAudioTrack,
  localVideoTrack,
  toggleAudio,
  toggleVideo,
  muteAudio,
  muteVideo,
  selectDevice,
  activeVideoDeviceId,
  activeAudioDeviceId,
}: {
  name: string;
  mediaDevices: MediaDeviceInfo[];
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
  toggleAudio: () => void;
  toggleVideo: () => void;
  selectDevice: (deviceId: string, kind: "audioinput" | "videoinput") => void;
  muteAudio: boolean;
  muteVideo: boolean;
  activeVideoDeviceId: string;
  activeAudioDeviceId: string;
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
  const [peerVideoPaused, setPeerVideoPaused] = useState(false);
  const [peerAudioPaused, setPeerAudioPaused] = useState(false);

  const [currentRoomId, setCurrentRoomId] = useState("");

  useEffect(() => {
    const socket = io(URL);

    socket.on("send-offer", async ({ roomId }) => {
      const pc = new RTCPeerConnection();
      setCurrentRoomId(roomId);
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
      socket.emit("mediaStatus", {
        status: muteAudio,
        type: "audio",
        roomId: roomId,
      });
      socket.emit("mediaStatus", {
        status: muteVideo,
        type: "video",
        roomId: roomId,
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

    socket.on("mediaStatus", ({ status, type }) => {
      if (type == "audio") {
        setPeerAudioPaused(status);
        console.log(peerAudioPaused);
      }
      if (type == "video") {
        setPeerVideoPaused(status);
        console.log(peerVideoPaused);
      }

      console.log(status, type);
      
    });

    socket.on("lobby", () => {
      setLobby(true);
    });

    setsocket(socket);

    return () => {
      socket.close();
    };
  }, [name]);

  useEffect(() => {
    if (videoRef.current && localVideoTrack) {
      videoRef.current.srcObject = new MediaStream([localVideoTrack]);
      videoRef.current.play();
    }
  }, [videoRef, localVideoTrack]);

  return (
    <div className="container ">
      <div className="flex justify-center w-full h-full  ">
        <div className="min-h-[600px] relative bg-black min-w-[800px] rounded overflow-hidden flex justify-center items-center">
          {lobby ? (
            "waiting to connect.."
          ) : (
            <div>
              {peerVideoPaused && (
                <div className="w-full h-full bg-black/40 flex justify-center items-center flex-col">
                  <VideoOff size={56} />
                  <span>Camera is off</span>
                </div>
              )}
              <video
                className={`${peerVideoPaused && "hidden"}`}
                id="remote"
                autoPlay
                height={800}
                width={800}
                ref={remoteVideoRef}
              ></video>
              <span className="absolute flex justify-center items-center shadow-2xl shadow-white text-lg px-2 font-bold text-border right-2 bottom-1">
                {peerName || "Unknown"}
                {peerAudioPaused && (
                  <MicOff
                    color="white"
                    className="  text-border  size-6  bottom-1"
                  />
                )}
              </span>
            </div>
          )}
        </div>

        <div className="  flex justify-between flex-col gap-2 px-2">
          <div className="flex flex-col bg-black/20 rounded items-center justify-around  h-full px-2">
            <div
              className={`flex rounded-4xl   ${
                muteAudio ? "bg-red-800/30 " : "bg-green-400/50 "
              } `}
            >
              <button
                onClick={() => {
                  toggleAudio();
                  socket?.emit("mediaStatus", {
                    status: !muteAudio,
                    type: "audio",
                    roomId: currentRoomId,
                  });
                }}
                className={`rounded-full ${
                  muteAudio
                    ? "bg-red-800/20 hover:bg-red-800/30"
                    : "bg-green-400/70 hover:bg-green-400/60"
                }  flex justify-center p-4 cursor-pointer`}
              >
                {muteAudio ? <MicOff /> : <Mic className=" " />}
              </button>
              <div className=" flex justify-center items-center">
                <ListMenu
                  activeDeviceId={activeAudioDeviceId}
                  selectDevice={selectDevice}
                  kind="audioinput"
                  mediaDevices={mediaDevices}
                />
              </div>
            </div>
            <div
              className={`flex rounded-4xl   ${
                muteVideo ? "bg-red-800/30 " : "bg-green-400/50 "
              } `}
            >
              <button
                onClick={() => {
                  toggleVideo();
                  socket?.emit("mediaStatus", {
                    status: !muteVideo,
                    type: "video",
                    roomId: currentRoomId,
                  });
                }}
                className={`rounded-full  ${
                  muteVideo
                    ? "bg-red-800/20 hover:bg-red-800/30"
                    : "bg-green-400/70 hover:bg-green-400/60"
                }  flex justify-center p-4 cursor-pointer`}
              >
                {muteVideo ? <VideoOff /> : <Video className="" />}
              </button>
              <div className=" flex justify-center items-center">
                <ListMenu
                  activeDeviceId={activeVideoDeviceId}
                  selectDevice={selectDevice}
                  kind="videoinput"
                  mediaDevices={mediaDevices}
                />
              </div>
            </div>
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
          <div className="w-full relative min-h-[150px] bg-black rounded overflow-hidden">
            {muteVideo && (
              <div className="w-full h-full bg-black/40 flex justify-center items-center flex-col">
                <VideoOff size={24} />
              </div>
            )}
            <video
              className=""
              id="local"
              autoPlay
              height={200}
              ref={videoRef}
              width={200}
            ></video>
            {!muteVideo && (
              <span className="absolute shadow-2xl shadow-white  px-2 font-semibold text-border right-4 bottom-0">
                You
              </span>
            )}
            {muteAudio && (
              <MicOff
                color="white"
                className="absolute right-1 text-border  size-4  bottom-1"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
