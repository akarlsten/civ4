
import { useRef, Suspense, useEffect, useState } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { Color, Vector3, BackSide, AdditiveBlending } from 'three'
import { shaderMaterial } from '@react-three/drei'
import guid from 'short-uuid'

import { Layers } from './Effects'
import { mutation } from '@/helpers/store'

import atmosFrag from './glsl/atmos.frag'
import atmosVertex from './glsl/atmos.vert'

const AtmosMaterial = shaderMaterial(
  {
    viewVector: new Vector3(0, 0, 0),
    c: 1,
    p: 5.5,
    glowColor: new Color(140, 204, 255)
  },
  atmosVertex,
  atmosFrag,
)

// @ts-ignore
AtmosMaterial.key = guid.generate()

extend({ AtmosMaterial })

const NIGHT_HALO_FACTOR = 5.5 // 6
const DAY_HALO_FACTOR = 8

const Halo = () => {
  const atmosphereMesh = useRef(null)

  const { camera } = useThree()

  useFrame((_, delta) => {
    if (atmosphereMesh.current) {
      atmosphereMesh.current.material.uniforms.viewVector.value = new Vector3().subVectors(
        camera.position,
        atmosphereMesh.current.position
      )

      if (atmosphereMesh.current.material.uniforms.p.value > 8) {
        atmosphereMesh.current.material.uniforms.p.value = 8
      }

      if (mutation.rotation < -2.0 && mutation.rotation > -3.6) { // night // -0.8 // -3.8
        if (atmosphereMesh.current.material.uniforms.p.value > NIGHT_HALO_FACTOR) {
          if (atmosphereMesh.current.material.uniforms.p.value - (1 * delta * 0.5) < NIGHT_HALO_FACTOR) {
            atmosphereMesh.current.material.uniforms.p.value = NIGHT_HALO_FACTOR
          } else {
            atmosphereMesh.current.material.uniforms.p.value -= 1 * delta * 0.5
          }
        }
      } else { // day
        if (atmosphereMesh.current.material.uniforms.p.value < DAY_HALO_FACTOR) {
          if (atmosphereMesh.current.material.uniforms.p.value - (1 * delta * 3) > DAY_HALO_FACTOR) {
            atmosphereMesh.current.material.uniforms.p.value = DAY_HALO_FACTOR
          } else {
            atmosphereMesh.current.material.uniforms.p.value += 1 * delta * 3
          }
        }
      }
    }
  })

  return (
    <Suspense fallback={null}>
      <mesh
        layers={Layers.HALO}
        ref={atmosphereMesh}
        scale={1.07}
        position={[0, 0, 0]}
      >
        <sphereBufferGeometry args={[1, 300, 300]} />
        {/* @ts-ignore c: 1 p: 6 */}
        <atmosMaterial c={1} p={6} side={BackSide} transparent blending={AdditiveBlending} key={AtmosMaterial.key} />
      </mesh>
    </Suspense>
  )
}

export default Halo
