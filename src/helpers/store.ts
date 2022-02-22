import create from 'zustand'

const useStore = create(() => {
  return {
    router: null,
    dom: null,
  }
})

export const mutation = {
  rotation: -1
}

export default useStore
