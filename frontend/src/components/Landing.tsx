import { useEffect, useRef, useState } from "react";
import Room from "./Room";
import Dialogue from "./Dialogue";
import { Loader, Mic, MicOff, Video, VideoOff } from "lucide-react";
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
  const [activeAudioDeviceId, setActiveAudioDeviceId] = useState<string>("");
  const [activeVideoDeviceId, setActiveVideoDeviceId] = useState<string>("");

  const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);

  const [joined, setJoined] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [loadingMic, setLoadingMic] = useState(false);

  async function getCam() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const videoTrack = await stream.getVideoTracks()[0];
    setLocalVideoTrack(videoTrack);
    const videoDeviceId = await videoTrack.getSettings().deviceId;
    videoDeviceId && setActiveVideoDeviceId(videoDeviceId);
    //
    const audioTrack = await stream.getAudioTracks()[0];
    setLocalAudioTrack(audioTrack);
    const audioDeviceId = await audioTrack.getSettings().deviceId;
    audioDeviceId && setActiveAudioDeviceId(audioDeviceId);

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

  const toggleVideo = async () => {
    if (localVideoTrack) {
      setMuteVideo(true);
      setLocalVideoTrack(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      localVideoTrack.stop();
    } else {
      try {
        setLoadingCamera(true);
        const videoTrack = (
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
        ).getVideoTracks()[0];
        setLocalVideoTrack(videoTrack);
        setMuteVideo(false);

        if (videoRef.current) {
          videoRef.current.srcObject = new MediaStream([videoTrack]);
          videoRef.current.play();
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingCamera(false);
      }
    }
  };
  const toggleAudio = async () => {
    if (localAudioTrack) {
      localAudioTrack.stop();
      setLocalAudioTrack(null);
      setMuteAudio(true);
    } else {
      try {
        setLoadingMic(true);
        const audioTrack = (
          await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          })
        ).getAudioTracks()[0];
        setLocalAudioTrack(audioTrack);
        setMuteAudio(false);
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingMic(false);
      }
    }
  };

  const selectDevice = async (
    deviceId: string,
    kind: "audioinput" | "videoinput"
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: kind === "videoinput" ? { deviceId } : false,
        audio: kind === "audioinput" ? { deviceId } : false,
      });

      const track =
        kind == "audioinput"
          ? stream.getAudioTracks()[0]
          : stream.getVideoTracks()[0];
      const activeDeviceId = await track.getSettings().deviceId;

      if (kind == "audioinput") {
        activeDeviceId && setActiveAudioDeviceId(activeDeviceId);
        setLocalAudioTrack(track);
        setMuteAudio(false)
      } else if (kind == "videoinput") {
        activeDeviceId && setActiveVideoDeviceId(activeDeviceId);
        setLocalVideoTrack(track);
        setMuteVideo(false)
      }

      if (kind == "videoinput" && videoRef.current) {
        videoRef.current.srcObject = new MediaStream([track]);
        videoRef.current.play();
      }
    } catch (error) {
      console.log("error selecting device ", error);
    }
  };

  

  useEffect(() => {
    if (videoRef && videoRef.current) {
      getCam();
    }
  }, []);
  useEffect(() => {
    const name = localStorage.getItem("name");
    setName(name || "");
  }, []);
  useEffect(() => {
    const updateDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMediaDevices(devices);
    };
    navigator.mediaDevices.addEventListener("devicechange", updateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", updateDevices);
    };
  }, []);

  if (!joined) {
    return (
      <>
        {/* <Dialogue /> */}
        <div className="container flex   gap-4">
          <div className="min-w-[600px] relative min-h-[450px]  rounded overflow-hidden">
            {muteVideo && (
              <div className="w-full h-full bg-black/40 flex justify-center items-center flex-col">
                <VideoOff size={56} />
                <span>Camera is off</span>
              </div>
            )}
            <video
              className={`${muteVideo && "hidden"}`}
              height={600}
              width={600}
              ref={videoRef}
            ></video>

            <span className="absolute flex gap-2 justify-center items-center shadow-2xl shadow-white text-lg px-2 font-bold text-border right-2 bottom-1">
              You
              {muteAudio && (
                <MicOff
                  color="white"
                  className=" right-1 text-border  size-6  bottom-1"
                />
              )}
            </span>
          </div>
          <div className=" bg-black/20 rounded p-1 gap-2 flex flex-col justify-between ">
            <div className="bg-black/10 h-full flex flex-col items-center justify-evenly">
              <div
                className={`flex rounded-4xl   ${
                  muteAudio ? "bg-red-800/30 " : "bg-green-400/50 "
                } `}
              >
                <button
                  disabled={loadingMic}
                  onClick={() => {
                    toggleAudio();
                  }}
                  className={`rounded-full ${
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
                  )}
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
                  disabled={loadingCamera}
                  onClick={() => {
                    toggleVideo();
                  }}
                  className={`rounded-full  ${
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
            </div>
            <div className="flex flex-col bg-black/10 p-2 gap-4 w-full">
              <input
                className="w-full min-w-56 border-gray-700 border outline-none rounded px-2 py-3"
                onChange={(e) => {
                  setName(e.target.value);
                  localStorage.setItem("name", e.target.value);
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
    loadingCamera={loadingCamera}
    loadingMic={loadingMic}
      activeAudioDeviceId={activeAudioDeviceId}
      activeVideoDeviceId={activeVideoDeviceId}
      name={name}
      mediaDevices={mediaDevices}
      toggleAudio={toggleAudio}
      toggleVideo={toggleVideo}
      muteAudio={muteAudio}
      muteVideo={muteVideo}
      localAudioTrack={localAudioTrack!}
      localVideoTrack={localVideoTrack!}
      selectDevice={selectDevice}
    />
  );
}

export default Landing;
