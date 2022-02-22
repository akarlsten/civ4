import { Suspense, useCallback, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

import { Layers } from './Effects'
import { mutation } from '@/helpers/store'

// atmos values: 0.1 0.2 1.0
const atmosShaderBeforeCompile = shader => {
  shader.fragmentShader = shader.fragmentShader.replace(`#include <output_fragment>`,
    `
      float l = (dot(directLight.direction, vNormal) + 1.0) * 0.8; //0.7
      float p = pow3(1.0 - dot( normalize(vViewPosition), vNormal));

      if (p>0.5) {
        // Fade out the outer edge of the geometry
        gl_FragColor = vec4( vec3(0.25, 0.45, 1.0), 1.0 - p) * l;
      } else {
        // Fade in from center to outer edge
        gl_FragColor = vec4( vec3(0.25, 0.45, 1.0), p) * l;
      }
    `
  )
}

const Earth = () => {
  const earthMesh = useRef(null)
  const cloudMesh = useRef(null)
  const lightMesh = useRef(null)
  const sunLight = useRef(null)
  const ambientRef = useRef(null)

  const [
    earthBase,
    earthDepth,
    earthClouds,
    earthSpecular,
  ] = useTexture([
    '/textures/diffo.png',
    '/textures/bumpe.png',
    '/textures/Earth_Cloud.jpg',
    '/textures/wat.png'
  ])

  const { clock } = useThree()

  useFrame((_, delta) => {
    if (lightMesh.current) {
      lightMesh.current.rotation.y = mutation.rotation
    }

    if (cloudMesh.current) {
      cloudMesh.current.rotation.y += Math.sin(clock.getElapsedTime() * 0.00000001)
      cloudMesh.current.rotation.x -= (Math.cos(clock.getElapsedTime() * 0.0000315) * 0.0003)
    }
    if (sunLight.current) {
      if (mutation.rotation < -2.0 && mutation.rotation > -3.6) { // night but with some
        if (sunLight.current.intensity - 1 * delta * 3 < 0) {
          sunLight.current.intensity = 0
        } else {
          sunLight.current.intensity -= 1 * delta * 6
        }
      } else {
        if (sunLight.current.intensity + 1 * delta * 3 > 3) {
          sunLight.current.intensity = 3
        } else {
          sunLight.current.intensity += 1 * delta * 10
        }
      }
    }

    if (ambientRef.current) {
      if (mutation.rotation < -1.2 && mutation.rotation > -3.4) {
        if (ambientRef.current.intensity - 1 * delta * 3 > 2.3) {
          ambientRef.current.intensity = 2.3
        } else {
          ambientRef.current.intensity += 1 * delta * 3
        }
      } else {
        if (ambientRef.current.intensity + 1 * delta * 3 < 1.0) {
          ambientRef.current.intensity = 1.0
        } else {
          ambientRef.current.intensity -= 1 * delta * 5
        }
      }
    }
  })

  const atmosBC = useCallback(atmosShaderBeforeCompile, [])

  return (
    <Suspense fallback={null}>
      <ambientLight ref={ambientRef} layers={Layers.EARTH} color={0x364e70} intensity={1.2} />
      <group>
        <mesh
          layers={Layers.EARTH}
          ref={earthMesh}
          scale={1}
          castShadow
          receiveShadow
        >
          <sphereBufferGeometry args={[1, 300, 300]} />
          <meshStandardMaterial
            map={earthBase}
            bumpScale={0.03}
            bumpMap={earthDepth}
            roughnessMap={earthSpecular}
          />
        </mesh>
        <mesh
          layers={Layers.EARTH}
          ref={cloudMesh}
          scale={1.001}
          castShadow
        >
          <sphereBufferGeometry args={[1, 300, 300]} />
          <meshStandardMaterial
            transparent
            map={earthClouds}
            alphaMap={earthClouds}
          />
        </mesh>
        <mesh
          layers={Layers.EARTH}
          scale={1.0055}
        >
          <sphereBufferGeometry args={[1, 300, 300]} />
          <meshPhongMaterial transparent depthWrite={false} onBeforeCompile={atmosBC} color='red' />
        </mesh>
      </group>
      <group ref={lightMesh} position={[0, 0, 0]} rotation={[0, -1, 0]}>
        <directionalLight castShadow layers={Layers.EARTH} ref={sunLight} color={0xfff7e0} position={[20, 0, 0]} intensity={2} />
      </group>
    </Suspense>
  )
}

export default Earth
