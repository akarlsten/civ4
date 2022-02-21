import { Canvas } from '@react-three/fiber'

const LCanvas = ({ children }) => {

  return (
    <Canvas
      mode='concurrent'
      style={{
        position: 'absolute',
        top: 0,
      }}
    >
      {children}
    </Canvas>
  )
}

export default LCanvas
