import { useRef, useEffect, useMemo } from 'react'
import { extend, useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { WebGLRenderTarget, LinearFilter, RGBAFormat } from 'three'
import LayeringShader from './glsl/LayeringShader'
import CopyShader from './glsl/CopyShader'

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, SSAOPass, AfterimagePass })

export enum Layers {
  SPACE,
  EARTH,
  CITIES,
  HALO
}

const renderTargetOptions = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat }

export default function Effects() {
  const spaceComposer = useRef<EffectComposer>()
  const haloComposer = useRef<EffectComposer>()
  const earthComposer = useRef<EffectComposer>()
  const citiesComposer = useRef<EffectComposer>()

  const { scene, gl, size, camera } = useThree()

  const spaceRenderTarget = useMemo(() => new WebGLRenderTarget(size.width, size.height, renderTargetOptions), [size])
  const haloRenderTarget = useMemo(() => new WebGLRenderTarget(size.width, size.height, renderTargetOptions), [size])
  const earthRenderTarget = useMemo(() => new WebGLRenderTarget(size.width, size.height, renderTargetOptions), [size])
  const citiesRenderTarget = useMemo(() => new WebGLRenderTarget(size.width, size.height, renderTargetOptions), [size])

  useEffect(() => {
    spaceComposer.current?.setSize(size.width, size.height)
    haloComposer.current?.setSize(size.width, size.height)
    earthComposer.current?.setSize(size.width, size.height)
    citiesComposer.current?.setSize(size.width, size.height)
  }, [size])

  useFrame(() => {
    camera.layers.set(Layers.SPACE)
    spaceComposer.current.render()

    camera.layers.set(Layers.HALO)
    haloComposer.current.render()

    camera.layers.set(Layers.EARTH)
    earthComposer.current.render()

    camera.layers.set(Layers.CITIES)
    citiesComposer.current.render()
  }, 1)

  return (
    <>
      <effectComposer ref={spaceComposer} args={[gl, spaceRenderTarget]} renderToScreen={false}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        {/* @ts-ignore */}
        <unrealBloomPass attachArray="passes" args={[undefined, 2.5, 1, 0.9]} />
        <shaderPass attachArray="passes" args={[CopyShader]} />
      </effectComposer>
      <effectComposer ref={haloComposer} args={[gl, haloRenderTarget]} renderToScreen={false}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        <shaderPass attachArray="passes" args={[CopyShader]} />
      </effectComposer>
      <effectComposer ref={earthComposer} args={[gl, earthRenderTarget]} renderToScreen={false}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        <shaderPass attachArray="passes" args={[CopyShader]} />
      </effectComposer>
      <effectComposer ref={citiesComposer} args={[gl, citiesRenderTarget]}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        {/* @ts-ignore */}
        <unrealBloomPass attachArray="passes" args={[undefined, 1.2, 0, 0]} />
        <shaderPass
          attachArray="passes"
          args={[LayeringShader]}
          uniforms-tOne-value={earthRenderTarget.texture}
          uniforms-tTwo-value={spaceRenderTarget.texture}
          uniforms-tThree-value={haloRenderTarget.texture}
        />
        <shaderPass attachArray="passes" args={[FXAAShader]} uniforms-resolution-value={[1 / size.width, 1 / size.height]} />
      </effectComposer>
    </>
  )
}
