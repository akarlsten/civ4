import { useProgress } from '@react-three/drei'
import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { tw } from 'twind'
import YouTube from '@u-wave/react-youtube'

import Loader from './Loader'

const Overlay = () => {
  const [shown, setShown] = useState(true)
  const [opaque, setOpaque] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const { active, progress } = useProgress()

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => setHasLoaded(true), 200)
    }
  }, [progress])


  return shown ? (
    <div>
      <div>
        <div>
          {!hasLoaded ? (
            <div className={tw`w-screen h-screen`} style={{ backgroundColor: '#141622' }}>
              <div className='flex justify-center pt-8'>
                <Image priority alt='logo' src={'/img/civ4up.jpg'} width={1600} height={400} />
              </div>
              <div className={tw`flex flex-grow flex-col align-middle justify-center h-full`}>
                <Loader active={active} progress={progress} />
              </div>
            </div>
          ) : (
            <div className={tw`w-screen h-screen`} style={{ backgroundColor: hasStarted ? 'transparent' : '#141622' }}>
              <div className='flex justify-center pt-8'>
                <Image priority alt='logo' src={'/img/civ4up.jpg'} width={1600} height={400} />
              </div>
              {!hasStarted && (
                <div className={tw`flex h-full items-center justify-center`}>
                  <button
                    className={tw`py-4 px-8 text-5xl font-mono rounded-md bg-amber-400 hover:bg-amber-500`}
                    style={{ color: 'white', marginBottom: '30rem' }}
                    onClick={() => setHasStarted(true)}>Start</button>
                </div>
              )}
            </div>
          )}
          {hasStarted && (
            <YouTube
              video='9KCjS66pvrQ'
              className={tw`hidden`}
              autoplay
              playsInline
              onEnd={(event) => event.target.playVideo()}
            />
          )}
        </div>
      </div>
    </div >
  ) : null
}

export default Overlay
