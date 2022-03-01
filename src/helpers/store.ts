import create from 'zustand'

const useStore = create(set => ({
  router: null,
  dom: null,
  night: false,
  setNight: () => set({ night: true }),
  setDay: () => set({ night: false })
}
))

export const mutation = {
  rotation: -1
}

export default useStore
