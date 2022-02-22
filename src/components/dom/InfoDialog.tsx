import React, { useRef, useState, useCallback } from 'react'
import { tw } from 'twind'

import useClickOutside from '@/helpers/useClickOutside'

const InfoDialog = () => {
  const [showInfo, setShowInfo] = useState(false)

  const toggleInfo = useCallback(() => setShowInfo(prev => !prev), [])
  const hideInfo = useCallback(() => setShowInfo(false), [])

  const elementRef = useRef(null)
  useClickOutside(elementRef, hideInfo)

  return (
    <div ref={elementRef}>
      <button onClick={toggleInfo} className={tw`bg-transparent text-amber-400 rounded-t-lg pb-2 px-2 py-0.5`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={tw`h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {showInfo ? (
        <div className={tw`max-w-sm fixed right-0 bottom-0 bg-amber-400 mb-12 mr-2 rounded-lg p-4`}>
          <h1 className={tw`text-5xl font-bold mb-6 flex justify-between`}><span>Hi!</span><span>🌍</span></h1>
          <p className={tw`mb-2`}>As a teenager I used to spend what felt like hours staring at the Civilization 4 intro screen. Both because of the great <span className={tw`italic`}>Baba Yetu</span> by Christopher Tin (first video game music to ever win a Grammy, btw), but also the mesmerizing animation of the revolving Earth with the rising sun and the city lights coming on at night.</p>
          <p className={tw`mb-2`}>I decided to recreate the experience as best I could in the browser using <span className={tw`italic`}>three.js</span> and <span className={tw`italic`}>react-three-fiber</span>. It was an interesting challenge getting different layers of a scene affected (or not) by separate EffectComposers to produce the right glow in the right places.</p>
          <p className={tw`mb-2`}>If you&apos;re interested in checking out the code it&apos;s available on my <a className={tw`text-orange-700 hover:text-orange-600`} href="https://github.com/akarlsten">Github</a>, also feel free to check out my <a className={tw`text-orange-700 hover:text-orange-600`} href="https://adamkarlsten.com">website</a> where there will be a more detailed post about the making-of this thing.</p>
        </div>
      ) : null}
    </div>
  )
}

export default InfoDialog
