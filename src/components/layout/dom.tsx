const Dom = ({ children }) => {

  return (
    <div
      className='absolute top-0 left-0 z-10 w-screen h-screen overflow-hidden dom'
    >
      {children}
    </div>
  )
}

export default Dom
