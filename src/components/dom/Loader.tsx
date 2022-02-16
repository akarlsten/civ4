import * as React from 'react'
import { tw } from 'twind'

const defaultDataInterpolation = (p) => `Loading: ${isNaN(p) ? 0 : p.toFixed(0)}%`

export default function CustomLoader({ active, progress, dataInterpolation = defaultDataInterpolation }) {
  const progressRef = React.useRef(0)
  const rafRef = React.useRef(0)
  const progressSpanRef = React.useRef(null)


  const updateProgress = React.useCallback(() => {
    if (!progressSpanRef.current) return
    progressRef.current += (progress - progressRef.current) / 2
    if (progressRef.current > 0.95 * progress || progress === 100) progressRef.current = progress
    progressSpanRef.current.innerText = dataInterpolation(progressRef.current)
    if (progressRef.current < progress) rafRef.current = requestAnimationFrame(updateProgress)
  }, [dataInterpolation, progress])

  React.useEffect(() => {
    updateProgress()
    return () => cancelAnimationFrame(rafRef.current)
  }, [updateProgress])


  return (
    <div className={tw`z-50`} style={{ ...styles.container, opacity: 1 }}>
      <div>
        <div style={{ ...styles.inner }}>
          <div style={{ ...styles.bar, transform: `scaleX(${isNaN(progress) ? 0 : progress / 100})` }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span ref={progressSpanRef} style={{ ...styles.data }} />
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 300ms ease',
    zIndex: 1000,
    marginBottom: '30rem'
  },
  inner: {
    width: 300,
    height: 26,
    borderRadius: '5px',
    border: '4px solid rgb(251 191 36)'
  },
  bar: {
    height: 22,
    width: '100%',
    background: 'rgb(251 191 36)',
    transition: 'transform 200ms',
    transformOrigin: 'left center',
  },
  data: {
    fontVariantNumeric: 'tabular-nums',
    marginTop: '0.5rem',
    color: '#f0f0f0',
    fontSize: '2em',
    fontFamily: `monospace`,
  },
}
