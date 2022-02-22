import { Preload } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, Suspense } from 'react'

import Effects from './Effects'
import { mutation } from '@/helpers/store'

import Space from './Space'
import Halo from './Halo'
import Earth from './Earth'
import Cities from './Cities'

const Scene = () => {
  const cameraHasBeenSet = useRef(false)

  const { camera } = useThree()

  useFrame((_, delta) => {
    mutation.rotation = (mutation.rotation - (delta * 0.25)) % (Math.PI * 2)

    if (!cameraHasBeenSet.current) {
      camera.position.set(1.0057983361416381, 0.6218586715288813, -0.353500766686643)
      camera.rotation.set(1.0252245463998368, 1.298907329004043, -0.008481961589921, 'XYZ')
      camera.quaternion.set(0.07378843424891089, 0.7196631055251007, -0.07740501171976204, 0.6860384432943429)
      cameraHasBeenSet.current = true
    }
  })

  return (
    <Suspense fallback={null}>
      <Preload all />
      <Space />
      <Halo />
      <Earth />
      <Cities />
      <Effects />
    </Suspense>
  )
}

export default Scene
