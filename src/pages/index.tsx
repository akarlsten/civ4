import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// import Overlay from '@/components/dom/Overlay'

// Dynamic import is used to prevent a payload when the website start that will include threejs r3f etc..
// WARNING ! errors might get obfuscated by using dynamic import.
// If something goes wrong go back to a static import to show the error.
// https://github.com/pmndrs/react-three-next/issues/49

const Scene = dynamic(() => import('@/components/canvas/Scene'), {
  ssr: false,
})

const Overlay = dynamic(() => import('@/components/dom/Overlay'), {
  ssr: false
})

// import Scene from '@/components/canvas/Scene'

// dom components goes here
const DOM = () => {


  return (
    <>
      <Overlay />
      <div className='hidden'>
      </div>
    </>
  )
}

// canvas components goes here
const R3F = () => {
  return (
    <>
      <Scene />
    </>
  )
}

const Page = () => {
  return (
    <>
      <DOM />
      {/* @ts-ignore */}
      <R3F r3f />
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {
      title: 'Index',
    },
  }
}


export default Page
