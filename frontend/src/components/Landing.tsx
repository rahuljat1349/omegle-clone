import { useEffect, useRef, useState } from "react";
import Room from "./Room";
import Dialogue from "./Dialogue";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import ListMenu from "./Menu";

function Landing() {
  const [name, setName] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<null | MediaStreamTrack>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<null | MediaStreamTrack>(null);
  const [muteAudio, setMuteAudio] = useState(false);
  const [muteVideo, setMuteVideo] = useState(false);

  const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);

  const [joined, setJoined] = useState(false);

  async function getCam() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const videoTrack = await stream.getVideoTracks()[0];
    setLocalVideoTrack(videoTrack);
    const audioTrack = await stream.getAudioTracks()[0];
    setLocalAudioTrack(audioTrack);

    if (!videoRef.current) {
      return;
    }
    videoRef.current.srcObject = new MediaStream([videoTrack!]);
    videoRef.current.play();

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      devices.forEach((device) => {
        setMediaDevices((prev) => [...prev, device]);
      });
    });
  }

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

  const selectDevice = (
    deviceId: string,
    kind: "audioinput" | "videoinput"
  ) => {

  };

  useEffect(() => {
    if (videoRef && videoRef.current) {
      getCam();
    }
  }, []);

  if (!joined) {
    return (
      <>
        <Dialogue />
        <div className="container flex   gap-4">
          <div className="min-w-[600px] min-h-[450px] bg-black rounded overflow-hidden">
            <video className="" height={600} width={600} ref={videoRef}></video>
          </div>
          <div className=" bg-black/20 rounded p-1 gap-2 flex flex-col justify-between ">
            <div className="bg-black/10 h-full flex flex-col items-center justify-evenly">
              <div
                className={`flex rounded-4xl   ${
                  muteAudio ? "bg-red-800/30 " : "bg-green-400/50 "
                } `}
              >
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
                <div className=" flex justify-center items-center">
                  <ListMenu kind="audioinput" mediaDevices={mediaDevices} />
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
                  <ListMenu kind="videoinput" mediaDevices={mediaDevices} />
                </div>
              </div>
            </div>
            <div className="flex flex-col bg-black/10 p-2 gap-4 w-full">
              <input
                className="w-full min-w-56 border-gray-700 border outline-none rounded px-2 py-3"
                onChange={(e) => {
                  setName(e.target.value);
                }}
                maxLength={12}
                value={name}
                type="text"
                placeholder="Enter your Name (Optional)"
              />
              <button
                className="bg-blue-700 px-6 cursor-pointer text-white hover:bg-blue-800 duration-150 font-semibold rounded py-2 "
                onClick={() => {
                  setJoined(true);
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <Room
      name={name}
      toggleAudio={toggleAudio}
      toggleVideo={toggleVideo}
      muteAudio={muteAudio}
      muteVideo={muteVideo}
      localAudioTrack={localAudioTrack!}
      localVideoTrack={localVideoTrack!}
    />
  );
}

export default Landing;
