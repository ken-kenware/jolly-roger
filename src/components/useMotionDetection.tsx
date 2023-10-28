import { useEffect, useRef } from "react";

type Callback = () => any;

interface IMotionDetectionProps {
    stream: MediaStream | undefined;
    onMotion: Callback;
};

export function useMotionDetection({stream, onMotion}: IMotionDetectionProps) {
    const backgroundFrameRef = useRef<Uint8ClampedArray>();
    const eventTarget = useRef<Callback>(onMotion);

    useEffect(() => {
        eventTarget.current = onMotion;
    });

    useEffect(() => {
        if (!stream) {
            // Nothing to cleanup, just exit.
            return;
        }

        const canvas = new OffscreenCanvas(0, 0);
        const ctx = canvas.getContext('2d')!;

        const trackProcessor = new MediaStreamTrackProcessor({ track: stream.getTracks()[0] });
        const readable = trackProcessor.readable.getReader();

        let isCancelled = false;

        async function readChunk() {
            const { value, done } = await readable.read();
            if (!value) {
                return;
            }
            if (isCancelled) {
                value.close();
                // Nothing to do here, exit
                return;
            }

            if( canvas.width !== value.displayWidth || canvas.height !== value.displayHeight ) {
                canvas.width = value.displayWidth;
                canvas.height = value.displayHeight;
              }

              ctx?.clearRect(0, 0, canvas.width, canvas.height);
         ctx?.drawImage(value, 0, 0);

        const frameData = ctx.getImageData(0,0, canvas.width, canvas.height);
        const realFrameData = frameData.data
        if (!backgroundFrameRef.current) {
          backgroundFrameRef.current = new Uint8ClampedArray(realFrameData);
        }

        let didTrip = false;
        for (let i = 0; i < frameData.data.length; i += 4) {
          const diff = Math.abs(realFrameData[i] - backgroundFrameRef.current[i]) 
            + Math.abs(realFrameData[i + 1] - backgroundFrameRef.current[i + 1]) 
            + Math.abs(realFrameData[i + 2] - backgroundFrameRef.current[i + 2]);
    
          if (diff > 150) {
            eventTarget.current();
            break;
          }
        }
    
        backgroundFrameRef.current.set(realFrameData);

         value.close();
         if (!done && !isCancelled) {
          requestAnimationFrame(readChunk);
         }

        }
        readChunk();
        // TODO: Cancel the stream.

        return () => {
            isCancelled = true;
        }
    }, [stream]);

    
}