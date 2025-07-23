import {
  ArrowLeft,
  Loader,
  Mic,
  MicOff,
  Phone,
  Repeat2,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import ListMenu from "./Menu";
import { Ripple } from "./magicui/ripple";
import { ComicText } from "./magicui/comic-text";
import { GridPattern } from "./magicui/grid-pattern";

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
  loadingCamera,
  loadingMic,
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
  loadingCamera: boolean;
  loadingMic: boolean;
  activeVideoDeviceId: string;
  activeAudioDeviceId: string;
}) => {
  const URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [peerName, setPeerName] = useState<string>("");
  const [socket, setsocket] = useState<null | Socket>(null);
  const [lobby, setLobby] = useState(true);
  const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
  const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(
    null
  );
  const [peerVideoPaused, setPeerVideoPaused] = useState<boolean>();
  const [peerAudioPaused, setPeerAudioPaused] = useState<boolean>();
  const [connectTrigger, setConnectTrigger] = useState(false);

  const [currentRoomId, setCurrentRoomId] = useState("");
  const [hangup, setHangup] = useState(false);

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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      pc.ontrack = (e) => {
        console.log("ontrack..");

        if (e.track.kind == "video") {
          remoteStream.addTrack(e.track);
          console.log(e.track);
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
        roomId,
      });
      socket.emit("mediaStatus", {
        status: muteVideo,
        type: "video",
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
      if (type === "audio") {
        setPeerAudioPaused((prev) => {
          console.log(prev);

          return status;
        });
      }
      if (type === "video") {
        setPeerVideoPaused((prev) => {
          console.log(prev);

          return status;
        });
      }
    });

    socket.on("lobby", () => {
      setLobby(true);
    });

    socket.on("hangup", () => {
      handleHangup();
      setHangup(true);
      console.log("hung up!");
    });

    setsocket(socket);

    return () => {
      handleHangup();
    };
  }, [connectTrigger]);

  useEffect(() => {
    if (videoRef.current && localVideoTrack) {
      videoRef.current.srcObject = new MediaStream([localVideoTrack]);
      // videoRef.current.play();
    }
  }, [videoRef, localVideoTrack]);

  useEffect(() => {
    // necessary for initial mute (localTrack(null))
    const updatePcTrack = async () => {
      if (!sendingPc) {
        return;
      }
      const audioSender = sendingPc
        .getSenders()
        .find((s) => s.track?.kind == "audio");
      const videoSender = sendingPc
        .getSenders()
        .find((s) => s.track?.kind == "video");

      if (audioSender && localAudioTrack) {
        audioSender.replaceTrack(localAudioTrack);
      } else {
        if (localAudioTrack) {
          sendingPc.addTrack(localAudioTrack);
        }
      }
      if (videoSender && localVideoTrack) {
        videoSender.replaceTrack(localVideoTrack);
      } else {
        if (localVideoTrack) {
          sendingPc.addTrack(localVideoTrack);
        }
      }
    };
    updatePcTrack();
  }, [localAudioTrack, localVideoTrack, sendingPc]);

  const handleHangup = async () => {
    // Stop peer connection and clear handlers
    if (sendingPc) {
      sendingPc.onicecandidate = null;
      sendingPc.ontrack = null;
      sendingPc.onnegotiationneeded = null;
      sendingPc.close();
      setSendingPc(null);
    }

    if (receivingPc) {
      receivingPc.onicecandidate = null;
      receivingPc.ontrack = null;
      receivingPc.close();
      setReceivingPc(null);
    }

    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    
    socket?.off(); 
    socket?.disconnect();
    setsocket(null);
  };
  

  return (
    <div className="container ">
      <GridPattern strokeWidth={0.3} />
      <div className="absolute top-2 left-2  ">
        <ComicText fontSize={3} className="shadow-2xl">
          vibes
        </ComicText>
      </div>
      <div className="flex justify-center w-full z-20 h-full  ">
        <div className="min-h-[600px] relative bg-black text-white min-w-[800px] rounded overflow-hidden flex justify-center items-center">
          {hangup ? (
            "call ended."
          ) : lobby ? (
            <Ripple />
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
              <span className="absolute flex gap-2  justify-center items-center shadow-2xl shadow-white text-lg px-2 font-bold text-border right-2 bottom-1">
                {peerName || "Unknown"}
                {peerAudioPaused && (
                  <MicOff
                    color="red"
                    className="  text-border  size-6  bottom-1"
                  />
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between flex-col z-20 gap-2 px-2">
          <div className="flex flex-col bg-gray-800 text-white rounded items-center justify-around  h-full px-2">
            <div
              className={`flex rounded-4xl   ${
                muteAudio ? "bg-red-800/30 " : "bg-green-400/50 "
              } `}
            >
              <button
                onClick={async () => {
                  toggleAudio();

                  const newStatus = !muteAudio;
                  toggleAudio(); // this will update state
                  socket?.emit("mediaStatus", {
                    status: newStatus, // send what you're setting it to, not what it was
                    type: "audio",
                    roomId: currentRoomId,
                  });
                }}
                className={`rounded-full duration-100 ${
                  muteAudio
                    ? "bg-red-800/20 hover:bg-red-800/30"
                    : "bg-green-400/70 hover:bg-green-400/60"
                }  flex justify-center p-4 cursor-pointer`}
              >
                {loadingMic ? (
                  <Loader className="animate-spin" />
                ) : muteAudio ? (
                  <MicOff />
                ) : (
                  <Mic className=" " />
                )}{" "}
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
                onClick={async () => {
                  toggleVideo();

                  const newStatus = !muteVideo;
                  toggleVideo();
                  socket?.emit("mediaStatus", {
                    status: newStatus,
                    type: "video",
                    roomId: currentRoomId,
                  });
                }}
                className={`rounded-full duration-100 ${
                  muteVideo
                    ? "bg-red-800/20 hover:bg-red-800/30"
                    : "bg-green-400/70 hover:bg-green-400/60"
                }  flex justify-center p-4 cursor-pointer`}
              >
                {loadingCamera ? (
                  <Loader className="animate-spin" />
                ) : muteVideo ? (
                  <VideoOff />
                ) : (
                  <Video />
                )}
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
              onClick={async () => {
                setLobby(true);

                setHangup(false);
                socket?.emit("hangup", { roomId: currentRoomId });

                handleHangup();
                setConnectTrigger(!connectTrigger);
              }}
              disabled={lobby && !hangup}
              className="rounded-full disabled:bg-white/10 disabled:cursor-not-allowed bg-white/20 duration-100 hover:bg-white/10 disabled:text-white/20 flex justify-center p-4 cursor-pointer"
            >
              <Repeat2 />
            </button>
            <button
              onClick={() => {
                if (!hangup) {
                  setHangup(true);
                  socket?.emit("hangup", { roomId: currentRoomId });
                  handleHangup();
                } else {
                  window.location.reload();
                }
              }}
              className={`rounded-full  ${
                !hangup
                  ? "bg-red-800 disabled:cursor-not-allowed  hover:bg-red-800/80"
                  : "hover:bg-white/10 bg-white/20"
              } flex justify-center p-4  duration-100 cursor-pointer`}
            >
              {hangup ? <ArrowLeft /> : <Phone className="rotate-[135deg] " />}
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

            <span className="absolute flex justify-center items-center gap-1 shadow-2xl shadow-white  px-2 font-semibold text-border right-1 bottom-0">
              You
              {muteAudio && (
                <MicOff color="red" className="  text-border  size-4  " />
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
