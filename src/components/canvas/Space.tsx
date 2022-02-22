import React, { Suspense, useLayoutEffect, useRef } from 'react'
import { BackSide, MirroredRepeatWrapping } from 'three'
import { Stars, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

import { Layers } from './Effects'
import { mutation } from '@/helpers/store'

const Space = () => {
  const sunMesh = useRef(null)
  const spaceMesh = useRef(null)

  const [galaxyTexture] = useTexture(['/textures/milkyway.jpg'])

  useLayoutEffect(() => {
    galaxyTexture.wrapS = galaxyTexture.wrapT = MirroredRepeatWrapping
    galaxyTexture.repeat.set(1, 1)
    // galaxyTexture.anisotropy = 16
  }, [galaxyTexture])

  useFrame((_, delta) => {
    if (sunMesh.current) {
      sunMesh.current.rotation.y = mutation.rotation
    }

    if (spaceMesh.current) {
      spaceMesh.current.rotation.y -= (delta * 0.05)
    }
  })

  return (
    <Suspense fallback={null}>
      <group
        layers={Layers.SPACE}
        ref={spaceMesh}
      >
        <Stars
          radius={200}
        />
        <mesh
          scale={1}
        >
          <sphereBufferGeometry args={[500, 100, 100]} />
          <meshBasicMaterial lightMapIntensity={0.1} map={galaxyTexture} side={BackSide} />
        </mesh>
      </group>
      <group layers={Layers.SPACE} ref={sunMesh} position={[0, 0, 0]} rotation={[0, -1, 0]}>
        <mesh
          position={[20, 0, 0]}
          scale={4}
        >
          <sphereBufferGeometry args={[1, 100, 100]} />
          <meshPhysicalMaterial emissive={0xfcba03} emissiveIntensity={10} color={0xfcba03} />
        </mesh>
        <pointLight layers={Layers.SPACE} color={0xfff7e0} position={[20, 0, 0]} intensity={2} />
      </group>
    </Suspense>
  )
}

export default Space
