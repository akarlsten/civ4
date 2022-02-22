import { useProgress } from '@react-three/drei'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { tw } from 'twind'
import YouTube from '@u-wave/react-youtube'

import Loader from './Loader'
import InfoDialog from './InfoDialog'

const Overlay = () => {
  const [muted, setMuted] = useState(false)

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


  const handleToggleMuted = useCallback(() => setMuted(prev => !prev), [])


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
                    className={tw`py-4 px-8 text-5xl font-bold rounded-md bg-amber-400 hover:bg-amber-500`}
                    style={{ color: 'black', marginBottom: '30rem' }}
                    onClick={() => setHasStarted(true)}>START</button>
                </div>
              )}
            </div>
          )}
          {hasStarted && (
            <>
              <div className={tw`absolute bottom-0 right-0 flex gap-2 mr-2`}>
                <button onClick={handleToggleMuted} className={tw`bg-transparent text-amber-400 rounded-t-lg pb-2 px-2 py-0.5`}>
                  {muted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className={tw`h-5 w-5`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className={tw`h-5 w-5`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <InfoDialog />
              </div>
              <YouTube
                video='9KCjS66pvrQ'
                className={tw`hidden`}
                autoplay
                playsInline
                muted={muted}
                volume={100}
                onEnd={(event) => event.target.playVideo()}
              />
            </>
          )}
        </div>
      </div>
    </div >
  ) : null
}

export default Overlay
