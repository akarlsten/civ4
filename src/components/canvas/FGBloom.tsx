import { useRef, useEffect, useState } from 'react'
import { extend, useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { CopyShader } from 'three-stdlib'

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, SSAOPass, AfterimagePass, CopyShader })

function FGBloom({ children }) {
  const { gl, camera, size } = useThree()
  const [scene, setScene] = useState<any>()
  const composer = useRef<EffectComposer>()
  useEffect(() => void scene && composer.current.setSize(size.width, size.height), [size, scene])
  useFrame(() => {

    scene && composer.current.render()
  }, 3)
  return (
    <>
      {/* @ts-ignore */}
      <scene ref={setScene}>{children}</scene>
      <effectComposer ref={composer} args={[gl]}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        {/* @ts-ignore */}
        {/* <unrealBloomPass attachArray="passes" args={[undefined, 1, -0.2, 0.2]} /> */}
        <shaderPass attachArray="passes" args={[CopyShader]} />
      </effectComposer>
    </>
  )
}

export default FGBloom
