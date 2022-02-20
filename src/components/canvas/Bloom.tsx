import { useRef, useEffect, useState } from 'react'
import { extend, useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, SSAOPass, AfterimagePass })

function Bloom({ children }) {
  const { gl, camera, size } = useThree()
  const [scene, setScene] = useState()
  const composer = useRef<EffectComposer>()
  useEffect(() => void scene && composer.current.setSize(size.width, size.height), [size, scene])
  useFrame(() => {
    camera.layers.set(0)
    scene && composer.current.render()
  }, 1)
  return (
    <>
      {/* @ts-ignore */}
      <scene ref={setScene}>{children}</scene>
      <effectComposer ref={composer} args={[gl]}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        {/* @ts-ignore */}
        <unrealBloomPass attachArray="passes" args={[undefined, 2, 1, 0.9]} />
      </effectComposer>
    </>
  )
}

export default Bloom
