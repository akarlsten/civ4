import { Suspense, useCallback, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

import { Layers } from './Effects'
import { mutation } from '@/helpers/store'

const citiesShaderBeforeCompile = shader => {
  shader.fragmentShader = shader.fragmentShader.replace(`#include <output_fragment>`,
    `
    float inverseLightPercentage = dot(directLight.direction, vNormal);
    float lightPercentage = max(0.0, inverseLightPercentage);

    float litArea = diffuseColor.a - lightPercentage - 0.0;

    gl_FragColor = vec4( outgoingLight, litArea );
  `)
}

const Cities = () => {
  const cityMesh = useRef(null)
  const cityLight = useRef(null)
  const cityLightRotator = useRef(null)

  const [earthCities] = useTexture(['/textures/lights.png'])

  const citiesBC = useCallback(citiesShaderBeforeCompile, [])

  useFrame((_, delta) => {
    if (cityLightRotator.current) {
      cityLightRotator.current.rotation.y = mutation.rotation
    }
  })

  return (
    <Suspense fallback={null}>
      <mesh
        layers={Layers.CITIES}
        ref={cityMesh}
        scale={1.0001}
        rotation={[0, 0, 0]}
      >
        <sphereBufferGeometry args={[1, 300, 300]} />
        <meshPhongMaterial
          transparent
          map={earthCities}
          alphaMap={earthCities}
          emissive={0xff7b24}
          emissiveIntensity={5}
          onBeforeCompile={citiesBC}
        />
      </mesh>
      <group ref={cityLightRotator} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <directionalLight layers={Layers.CITIES} ref={cityLight} color={0xfff7e0} position={[20, 0, 0]} intensity={1} />
      </group>
    </Suspense>
  )
}

export default Cities
