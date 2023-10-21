'use client';
// import Image from 'next/image'
import { useSound } from '@/components/Audio';
import { useState } from 'react';

export default function Home() {
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const getSomeCandy = useSound('/ComeAndTakeSome.mp3');

  
  getSomeCandy.onPlay(() => setIsAnimating(true));
  getSomeCandy.onPlayEnd(() => setIsAnimating(false));

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <img src="/jolly-roger-no-mouth.png" className="absolute top-0 left-0 right-0 bottom-0" alt="the jolly roger" /> 
        <img src="/jolly-roger-mouth-only.png" className={`absolute top-0 left-0 ${isAnimating ? 'animate-mouth' : ''} will-change-transform`} alt="the jolly rogers mouth" />
      </div>
      <button onClick={() => getSomeCandy.play()}>Click</button>
    </main>
  )
}
