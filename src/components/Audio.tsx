import { useEffect, useRef } from "react";

export function useSound(url: string) {
    const audio = useRef<HTMLAudioElement>();
    const canPlay = useRef<Promise<unknown>>();
    const playStart = useRef<() => any>();
    const playEnd = useRef<() => any>();


    useEffect(() => {
        const newAudio = new Audio(url);
        audio.current = newAudio;
        newAudio.onended = () => playEnd.current?.();
        newAudio.onplay = () => playStart.current?.();
        canPlay.current = new Promise(resolve => newAudio.oncanplay = resolve);

    }, [url]);

    return {
        play: async () => {
            await canPlay.current;
            console.log('You can play me now!');
            audio.current?.play();
        },
        onPlay: (callBackFn: () => any) => {
            playStart.current = callBackFn;
        },
        onPlayEnd: (callBackfn: () => any) => {
            playEnd.current = callBackfn;
        }
    };
}