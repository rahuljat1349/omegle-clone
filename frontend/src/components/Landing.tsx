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
  const [warning, setWarning] = useState(true);

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
  const closeWarning = ()=>{
    setWarning(false)
  }
  useEffect(() => {
    if (videoRef && videoRef.current) {
      getCam();
    }
  }, [videoRef]);
  if (!joined) {
    return (
      <>
        {warning && <Warning closeWarning={closeWarning} />}
        <div className="container flex flex-col items-center gap-4">
          <div className="min-w-[400px] min-h-[300px] bg-black rounded overflow-hidden">
            <video className="" height={400} width={400} ref={videoRef}></video>
          </div>
          <div className="flex gap-2 w-full">
            <input
              className="w-full bg-black/30 outline-none rounded px-2 py-3"
              onChange={(e) => {
                setName(e.target.value);
              }}
              value={name}
              type="text"
              placeholder="Enter your Name (Optional)"
            />
            <button
              className="bg-white px-6 cursor-pointer hover:bg-white/80 duration-150 font-semibold rounded py-2 text-black"
              onClick={() => {
                setJoined(true);
              }}
            >
              Join
            </button>
          </div>
        </div>
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

function Warning({ closeWarning }: { closeWarning: () => void }) {
  return (
    <>
      <div className="bg-gray-200 absolute w-1/2 top-[25%] z-50 h-[50%] justify-center gap-4 items-center left-[25%] p-4 rounded-2xl flex flex-col">
        <p className="text-black">This is not safe!</p>
        <button
          onClick={() => {
            closeWarning();
          }}
          className="bg-gray-700 float-end px-6 cursor-pointer hover:bg-gray-700/90  duration-150 font-semibold rounded py-2 text-gray-200"
        >
          I Understand.
        </button>
      </div>
    </>
  );
}

export default Landing;
