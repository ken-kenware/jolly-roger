'use client';
// import Image from 'next/image'
import { useSound } from '@/components/Audio';
import { useMotionDetection } from '@/components/useMotionDetection';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface MediaStreamTrackProcessorProps {
    track: MediaStreamTrack;
  }
  class MediaStreamTrackProcessor {
    constructor(props: MediaStreamTrackProcessorProps);
    public readable: ReadableStream<VideoFrame>
  }

  class OffscreenCanvas extends HTMLCanvasElement {
    constructor(width: number, height: number);
  }

  interface Window {
    MediaStreamTrackProcessor: MediaStreamTrackProcessor;
    OffscreenCanvas: OffscreenCanvas;
  }
  
}

// export default function Home() {
//   const [isAnimating, setIsAnimating] = useState<boolean>(false);
//   const getSomeCandy = useSound('/ComeAndTakeSome.mp3');

  
//   getSomeCandy.onPlay(() => setIsAnimating(true));
//   getSomeCandy.onPlayEnd(() => setIsAnimating(false));

//   /** Video Detection Stuff */


//   return (
//     <main className="flex min-h-screen flex-col items-center justify-between p-24">
//       <div>
//         <img src="/jolly-roger-no-mouth.png" className="absolute top-0 left-0 right-0 bottom-0" alt="the jolly roger" /> 
//         <img src="/jolly-roger-mouth-only.png" className={`absolute top-0 left-0 ${isAnimating ? 'animate-mouth' : ''} will-change-transform`} alt="the jolly rogers mouth" />
//       </div>
//       <button onClick={() => getSomeCandy.play()}>Click</button>
//     </main>
//   )
// }

function throttle(callback: (...args: any[]) => any, delay = 250) {
  let lastCall: number;

  return (...args: any[]) => {
    if (!lastCall || Date.now() - lastCall >= delay) {
      callback(...args);
      lastCall = Date.now();
    }
  }
}

const PLAY_DELAY = 1000 * 5;

export default function Home() {
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back camera
  const [stream, setStream] = useState<MediaStream>();
  const lastPlay = useRef<number>(0);
  const currentSound = useRef<number>(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [sensorStatus, setSensorStatus] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showCameras, setShowCameras] = useState<boolean>(false);
  const getSomeCandy = useSound('/ComeAndTakeSome.mp3');
  const comeFightMe = useSound('/ComeFightMe.mp3');
  const candyBeard = useSound('/CandyBeardsTreasure.mp3');
  const runAway = useSound('/RunAway.mp3');
  const fromTheStore = useSound('/FromTheStore.mp3');
  const travelledFar = useSound('/TravelledFar.mp3');
  const sounds = [travelledFar, fromTheStore, getSomeCandy, comeFightMe, candyBeard, runAway];

  const playStart = () => setIsAnimating(true);
  const playEnd = () => {
    setIsAnimating(false);
    lastPlay.current = Date.now();
  }

  sounds.forEach(sound => {
    sound.onPlay(playStart);
    sound.onPlayEnd(playEnd);
  });


  const onMotionHandler = useCallback(() => {
    if (sensorStatus && lastPlay.current + PLAY_DELAY <= Date.now()) {
      const currentSoundIdx = currentSound.current;
      sounds[currentSoundIdx].play();
      lastPlay.current = Infinity;

      if (currentSoundIdx + 1 >= sounds.length) {
        currentSound.current = 0;
      } else {
        currentSound.current += 1;
      }

    }
  }, [sensorStatus]);

  const motionDetector = useMotionDetection({ stream, onMotion: onMotionHandler });

  useEffect(() => {
    if (!/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
      getCameras()
    }

    initCamera();
  }, []);


  const initCamera = async () => {
    try {
      const constraints = { video: { facingMode: facingMode }}
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(stream);
    } catch (err) {
      console.error(err);
    }
  }

  const getCameras = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    setDevices(videoDevices);
  }

  const switchCamera = async (deviceId: string | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = deviceId ? { video: { deviceId: { exact: deviceId } } } : { video: true };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
    } catch (error: any) {
      if (error.name === 'OverconstrainedError') {
        // If OverconstrainedError occurs, try with no constraints
        console.warn('OverconstrainedError: Trying with default constraints.');
        switchCamera(null);
      } else {
        console.error('Error accessing media devices:', error);
      }
    }
  }


  // Function to toggle between front and back cameras for iOS devices
  const toggleCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
  };

  // Function to handle the option selection
  const handleOptionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    switchCamera(event.currentTarget.value);
  };

  // Function to deactivate motion detection
  const deActivateSensor = () => {
    setSensorStatus(false);
    // Force set to white background
  };

  // Function to activate motion detection
  const activateSensor = () => {
    setSensorStatus(true);
  };


  return (
    //     <main className="flex min-h-screen flex-col items-center justify-between p-24">

//       <button onClick={() => getSomeCandy.play()}>Click</button>
//     </main>
    <main className="flex min-h-screen w-screen flex-col items-center justify-center text-center">
        <div className="relative w-screen h-screen"  >
          <img src="/jolly-roger-no-mouth.png" className="absolute top-0 left-1/2 -translate-x-1/2 bottom-0" alt="the jolly roger" /> 
          <img src="/jolly-roger-mouth-only.png" className={`absolute top-0 left-1/2 -translate-x-1/2 ${isAnimating ? 'animate-mouth' : ''} will-change-transform`} alt="the jolly rogers mouth" />
          {!sensorStatus ? <Overlay activateSensor={activateSensor} /> : null}
       </div>
      {showCameras ? <h1>Hi!</h1> : null}
    </main>
  )
}

interface IOverlayProps {
  activateSensor: () => void;
}

const Overlay = ({activateSensor}: IOverlayProps) => {
 return ( <div className="absolute top-0 left-0 right-0 bottom-0 z-99" onClick={activateSensor}>
    Click to activate
  </div>);
}