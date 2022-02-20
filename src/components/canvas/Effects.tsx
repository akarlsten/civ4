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
import AdditiveBlendingShader from './glsl/AdditiveBlending'
import CopyShader from './glsl/CopyShader'

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, SSAOPass, AfterimagePass })

export enum Layers {
  BG,
  MD,
  FG,
  FFG
}

export default function Effects() {
  const bgComposer = useRef<EffectComposer>()
  const mdComposer = useRef<EffectComposer>()
  const fgComposer = useRef<EffectComposer>()
  const ffgComposer = useRef<EffectComposer>()

  const { scene, gl, size, camera } = useThree()

  const bgRenderTarget = useMemo(() => new WebGLRenderTarget(size.width, size.height, { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat }), [size])
  const mdRenderTarget = useMemo(() => new WebGLRenderTarget(size.width, size.height, { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat }), [size])
  const fgRenderTarget = useMemo(() => new WebGLRenderTarget(size.width, size.height, { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat }), [size])
  const ffgRenderTarget = useMemo(() => new WebGLRenderTarget(size.width, size.height, { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat }), [size])

  useEffect(() => {
    bgComposer.current?.setSize(size.width, size.height)
    mdComposer.current?.setSize(size.width, size.height)
    fgComposer.current?.setSize(size.width, size.height)
    ffgComposer.current?.setSize(size.width, size.height)
  }, [size])

  useFrame((state, delta) => {
    gl.autoClear = false

    camera.layers.set(Layers.BG)
    bgComposer.current.render()

    camera.layers.set(Layers.FFG)
    ffgComposer.current.render()

    camera.layers.set(Layers.MD)
    mdComposer.current.render()

    camera.layers.set(Layers.FG)
    fgComposer.current.render()

  }, 1)


  return (
    <>
      <effectComposer ref={bgComposer} args={[gl, bgRenderTarget]} renderToScreen={false}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        {/* @ts-ignore */}
        <unrealBloomPass attachArray="passes" args={[undefined, 2, 1, 0.9]} />
        <shaderPass attachArray="passes" args={[CopyShader]} />
      </effectComposer>
      <effectComposer ref={ffgComposer} args={[gl, ffgRenderTarget]} renderToScreen={false}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        <shaderPass attachArray="passes" args={[CopyShader]} />
      </effectComposer>
      <effectComposer ref={mdComposer} args={[gl, mdRenderTarget]} renderToScreen={false}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        <shaderPass attachArray="passes" args={[CopyShader]} />
      </effectComposer>
      <effectComposer ref={fgComposer} args={[gl, fgRenderTarget]}>
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        {/* @ts-ignore */}
        <unrealBloomPass attachArray="passes" args={[undefined, 1.2, 0, 0]} />
        <shaderPass attachArray="passes" args={[AdditiveBlendingShader]} uniforms-tThree-value={ffgRenderTarget.texture} uniforms-tTwo-value={bgRenderTarget.texture} uniforms-tAdd-value={mdRenderTarget.texture} />
        <shaderPass attachArray="passes" args={[FXAAShader]} uniforms-resolution-value={[1 / size.width, 1 / size.height]} />
      </effectComposer>
    </>
  )
}
