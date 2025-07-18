import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Room from "./Room";

function Landing() {
  const [name, setName] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<null | MediaStreamTrack>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<null | MediaStreamTrack>(null);

  const [joined, setJoined] = useState(false);
  async function getCam() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    const videoTrack = await stream.getVideoTracks()[0];
    setLocalVideoTrack(videoTrack);
    const audioTrack = await stream.getAudioTracks()[0];
    setLocalAudioTrack(audioTrack);
    if (!videoRef.current) {
      return;
    }
    videoRef.current.srcObject = new MediaStream([videoTrack]);
    videoRef.current.play();
  }
  useEffect(() => {
    if (videoRef && videoRef.current) {
      getCam();
    }
  }, [videoRef]);
  if (!joined) {
    return (
      <>
        <video height={400} width={400} ref={videoRef}></video>
        <input
          onChange={(e) => {
            setName(e.target.value);
          }}
          value={name}
          type="text"
          placeholder="enter your name"
        />
        <button
          onClick={() => {
            setJoined(true);
          }}
        >
          Enter
        </button>
      </>
    );
  }

  return (
    <Room
      name={name}
      localAudioTrack={localAudioTrack!}
      localVideoTrack={localVideoTrack!}
    />
  );
}

export default Landing;
