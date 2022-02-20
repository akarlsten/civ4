import useStore from '@/helpers/store'
import { useTexture, Stars, Plane, shaderMaterial, Preload } from '@react-three/drei'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef, useState, useCallback, Suspense } from 'react'
import { FrontSide, BackSide, MirroredRepeatWrapping, Vector3, Color, MeshStandardMaterial, NormalBlending, AdditiveBlending, Texture, Euler, Quaternion, MathUtils, MeshBasicMaterial, Vector2 } from 'three'
import guid from 'short-uuid'

import atmosFrag from './glsl/atmos.frag'
import atmosVertex from './glsl/atmos.vert'
import sunFrag from './glsl/glow.frag'
import sunVert from './glsl/glow.vert'

import Effects, { Layers } from './Effects'

const AtmosMaterial = shaderMaterial(
  {
    viewVector: new Vector3(0, 0, 0),
    c: 1.1,
    p: 4.5,
    glowColor: new Color(140, 204, 255)
  },
  atmosVertex,
  atmosFrag,
)

// This is the 🔑 that HMR will renew if this file is edited
// It works for THREE.ShaderMaterial as well as for drei/shaderMaterial
// @ts-ignore
AtmosMaterial.key = guid.generate()

extend({ AtmosMaterial })

const SunMaterial = shaderMaterial(
  {
    viewVector: new Vector3(0, 0, 0),
    c: 1.1,
    p: 4.5,
    glowColor: new Color(140, 204, 255)
  },
  sunVert,
  sunFrag,
)

// This is the 🔑 that HMR will renew if this file is edited
// It works for THREE.ShaderMaterial as well as for drei/shaderMaterial
// @ts-ignore
SunMaterial.key = guid.generate()

extend({ SunMaterial })


// atmos values: 0.1 0.2 1.0
const atmosShaderBeforeCompile = shader => {
  shader.fragmentShader = shader.fragmentShader.replace(`#include <output_fragment>`,
    `
          float l = (dot(directLight.direction, vNormal) + 1.0) * 0.8; //0.7
          float p = pow3(1.0 - dot( normalize(vViewPosition), vNormal)) ;
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

const Scene = () => {

  // This reference will give us direct access to the THREE.Mesh object
  const earthMesh = useRef(null)
  const sunMesh = useRef(null)
  const spaceMesh = useRef(null)
  const cloudMesh = useRef(null)
  const atmosphereMesh = useRef(null)
  const sunAtmosMesh = useRef(null)
  const lightMesh = useRef(null)
  const cityMesh = useRef(null)
  const sunLight = useRef(null)
  const ambientRef = useRef(null)

  const cameraSet = useRef(false)

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false)


  // earth textures
  const [
    galaxyTexture,
    earthBase,
    earthDepth,
    earthClouds,
    earthSpecular,
    earthCities] = useTexture([
      '/textures/milkyway.jpg',
      '/textures/diffo.png',
      '/textures/bumpe.png',
      '/textures/Earth_Cloud.jpg',
      '/textures/wat.png',
      '/textures/lights.png'
    ])


  const { gl, clock, camera } = useThree()

  useLayoutEffect(() => {
    galaxyTexture.wrapS = galaxyTexture.wrapT = MirroredRepeatWrapping
    galaxyTexture.repeat.set(1, 1)
    // galaxyTexture.anisotropy = 16
  }, [galaxyTexture])

  const rotation = useRef(-1)
  const isNight = useRef(false)

  const NIGHT_HALO_FACTOR = 5.5 // 6
  const DAY_HALO_FACTOR = 8

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {
    rotation.current = (rotation.current - (delta * 0.33)) % (Math.PI * 2)
    isNight.current = rotation.current < -0.8 && rotation.current > -3.8

    if (sunMesh.current) {
      sunMesh.current.rotation.y = rotation.current
    }

    if (lightMesh.current) {
      lightMesh.current.rotation.y = rotation.current
    }

    if (cloudMesh.current) {
      cloudMesh.current.rotation.y += Math.sin(clock.getElapsedTime() * 0.00000001)
      cloudMesh.current.rotation.x -= (Math.cos(clock.getElapsedTime() * 0.0000315) * 0.0003)
    }

    if (atmosphereMesh.current) {
      atmosphereMesh.current.material.uniforms.viewVector.value = new Vector3().subVectors(camera.position, atmosphereMesh.current.position)

      if (rotation.current < -0.8 && rotation.current > -3.8) { // night
        if (atmosphereMesh.current.material.uniforms.p.value > NIGHT_HALO_FACTOR) {
          if (atmosphereMesh.current.material.uniforms.p.value - 1 * delta * 0.3 < NIGHT_HALO_FACTOR) {
            atmosphereMesh.current.material.uniforms.p.value = NIGHT_HALO_FACTOR
          } else {
            atmosphereMesh.current.material.uniforms.p.value -= 1 * delta * 0.3
          }
        }
      } else { // day
        if (atmosphereMesh.current.material.uniforms.p.value < DAY_HALO_FACTOR) {
          if (atmosphereMesh.current.material.uniforms.p.value - 1 * delta * 5 > DAY_HALO_FACTOR) {
            atmosphereMesh.current.material.uniforms.p.value = DAY_HALO_FACTOR
          } else {
            atmosphereMesh.current.material.uniforms.p.value += 1 * delta * 5
          }
        }
      }
    }

    if (sunLight.current) {
      if (rotation.current < -1.2 && rotation.current > -3.4) {
        if (sunLight.current.intensity - 1 * delta * 3 < 0) {
          sunLight.current.intensity = 0
        } else {
          sunLight.current.intensity -= 1 * delta * 3
        }
      } else {
        if (sunLight.current.intensity + 1 * delta * 3 > 2) {
          sunLight.current.intensity = 2
        } else {
          sunLight.current.intensity += 1 * delta * 5
        }
      }
    }

    if (cityMesh.current) {
      if (rotation.current < -0.8 && rotation.current > -3.8) {
        if (cityMesh.current.material.opacity + 1 * delta > 1) {
          cityMesh.current.material.opacity = 1
        } else {
          cityMesh.current.material.opacity += 1 * delta * 0.6
        }
      } else {
        if (cityMesh.current.material.opacity - 1 * delta * 0.33 < 0) {
          cityMesh.current.material.opacity = 0
        } else {
          cityMesh.current.material.opacity -= 1 * delta * 0.33
        }
      }
    }

    if (ambientRef.current) {
      if (rotation.current < -1.2 && rotation.current > -3.4) {
        if (ambientRef.current.intensity - 1 * delta * 3 > 2.5) {
          ambientRef.current.intensity = 2.5
        } else {
          ambientRef.current.intensity += 1 * delta * 3
        }
      } else {
        if (ambientRef.current.intensity + 1 * delta * 3 < 1.2) {
          ambientRef.current.intensity = 1.2
        } else {
          ambientRef.current.intensity -= 1 * delta * 5
        }
      }
    }

    if (sunAtmosMesh.current) {
      sunAtmosMesh.current.material.uniforms.viewVector.value = new Vector3().subVectors(camera.position, sunAtmosMesh.current.position)
    }

    if (spaceMesh.current) {
      spaceMesh.current.rotation.y -= (delta * 0.05)
    }

    if (!cameraSet.current) {
      camera.position.set(1.0057983361416381, 0.6218586715288813, -0.353500766686643)
      camera.rotation.set(1.0252245463998368, 1.298907329004043, -0.008481961589921, 'XYZ')
      camera.quaternion.set(0.07378843424891089, 0.7196631055251007, -0.07740501171976204, 0.6860384432943429)
      cameraSet.current = true
    }

  })


  const atmosBC = useCallback(atmosShaderBeforeCompile, [])


  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <Suspense fallback={null}>
      <Preload all />
      <ambientLight layers={Layers.FG} color={0x364e70} intensity={1.2} />
      <ambientLight ref={ambientRef} layers={Layers.MD} color={0x364e70} intensity={1.2} />
      <group>
        <mesh
          layers={Layers.MD}
          ref={earthMesh}
          scale={1}
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
          layers={Layers.FFG}
          ref={atmosphereMesh}
          scale={1.07}
        >
          <sphereBufferGeometry args={[1, 300, 300]} />
          {/* @ts-ignore c: 1 p: 6 */}
          <atmosMaterial c={1} p={6} side={BackSide} transparent blending={AdditiveBlending} key={AtmosMaterial.key} />
        </mesh>
        <mesh
          layers={Layers.FG}
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
          />
        </mesh>
        <mesh
          layers={Layers.MD}
          ref={cloudMesh}
          scale={1.001}
        >
          <sphereBufferGeometry args={[1, 300, 300]} />
          <meshStandardMaterial
            transparent
            map={earthClouds}
            alphaMap={earthClouds}
          />
        </mesh>
        <mesh
          layers={Layers.MD}
          scale={1.0055}
        >
          <sphereBufferGeometry args={[1, 300, 300]} />
          <meshPhongMaterial transparent depthWrite={false} onBeforeCompile={atmosBC} color='red' />
        </mesh>
      </group>
      {/* <ambientLight intensity={1} /> */}
      <group ref={lightMesh} position={[0, 0, 0]} rotation={[0, -1, 0]}>
        <pointLight layers={Layers.MD} ref={sunLight} color={0xfff7e0} position={[20, 0, 0]} intensity={2} />
      </group>
      <group
        layers={Layers.BG}
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
      <group layers={Layers.BG} ref={sunMesh} position={[0, 0, 0]} rotation={[0, -1, 0]}>
        <mesh
          position={[20, 0, 0]}
          scale={4}
        >
          <sphereBufferGeometry args={[1, 100, 100]} />
          <meshPhysicalMaterial emissive={0xfcba03} emissiveIntensity={10} color={0xfcba03} />
        </mesh>
        <pointLight layers={Layers.BG} color={0xfff7e0} position={[20, 0, 0]} intensity={2} />
      </group>
      <Effects />
    </Suspense>
  )
}

export default Scene
